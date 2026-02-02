import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { ContactList } from './entities/contact-list.entity';
import { CampaignLead, LeadStatus } from './entities/campaign-lead.entity';
import { CrmService } from '../crm/crm.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class CampaignsService {
    private readonly logger = new Logger(CampaignsService.name);

    constructor(
        @InjectRepository(Campaign)
        private campaignRepository: Repository<Campaign>,
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
        @InjectRepository(ContactList)
        private contactListRepository: Repository<ContactList>,
        private crmService: CrmService,
        private integrationsService: IntegrationsService,
        @InjectQueue('campaign-queue') private campaignQueue: Queue,
    ) { }

    // Contact List (Funnel) Methods
    async createContactList(tenantId: string, name: string, contacts: any[]) {
        const list = this.contactListRepository.create({
            tenantId,
            name,
            contacts
        });
        return this.contactListRepository.save(list);
    }

    async getContactLists(tenantId: string) {
        return this.contactListRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' }
        });
    }

    async removeContactList(id: string, tenantId: string) {
        const list = await this.contactListRepository.findOne({ where: { id, tenantId } });
        if (list) {
            return this.contactListRepository.remove(list);
        }
    }

    async updateContactList(id: string, tenantId: string, data: any) {
        const list = await this.contactListRepository.findOne({ where: { id, tenantId } });
        if (list) {
            list.name = data.name;
            if (data.contacts) {
                list.contacts = data.contacts;
            }
            return this.contactListRepository.save(list);
        }
        return null;
    }

    async start(id: string, tenantId: string) {
        const campaign = await this.findOne(id, tenantId);
        if (!campaign) throw new Error('Campanha não encontrada.');
        if (campaign.status === CampaignStatus.RUNNING) throw new Error('Campanha já está rodando.');

        // Resolve Integration to get real instance name
        const integration = await this.integrationsService.findOne(campaign.integrationId, tenantId);
        if (!integration) throw new Error('Integração não encontrada. Verifique se a instância ainda existe.');

        // Assuming the 'instanceName' is stored in credentials.instanceName (based on Evolution Service usage)
        const instanceName = integration.credentials?.instanceName || integration.settings?.instanceName;
        if (!instanceName) throw new Error('Nome da instância não encontrado na integração.');

        // Fetch PENDING leads
        const leads = await this.leadRepository.find({
            where: { campaignId: id, status: LeadStatus.PENDING },
            take: 10000 // Limit to avoid memory crash, or handle standard pagination/chunks
        });

        if (leads.length === 0) throw new Error('Não há leads pendentes para iniciar.');

        const DELAY_MS = 20 * 60 * 1000; // 20 mins stagger

        // Add to Queue
        await Promise.all(leads.map(async (lead, index) => {
            // Find contactID if needed - for now simpler logic assuming we just need to send
            // Ideally we kept the mapping, but after a reload we might need to fetch Contacts to update their stage?
            // The CampaignProcessor uses contactId to update CRM. We should join relation or fetch.
            // Let's rely on looking up by externalId if contactId is missing, OR fetch with relations.
            // Actually, lead doesn't store contact UUID directly unless we added a column? 
            // We didn't see a contactId column in CampaignLead entity. 
            // WAIT. CampaignProcessor expects contactId. 
            // In create() we had a map. Now we lost it.
            // We need to fetch Contact by externalId here (expensive) or just pass null and let processor decide?
            // Processor: if (contactId) update stage.
            // We should probably FIND the contact by externalId + tenantId to pass it.
            const contact = await this.crmService.findOneByExternalId(tenantId, lead.externalId);

            const delay = index * DELAY_MS;
            await this.campaignQueue.add('send-message', {
                leadId: lead.id,
                contactId: contact?.id,
                campaignId: id,
                externalId: lead.externalId,
                message: campaign.messageTemplate,
                instanceName: instanceName,
                tenantId: tenantId,
                variations: campaign.variations
            }, {
                removeOnComplete: true,
                attempts: 3,
                backoff: 5000,
                delay: delay
            });
        }));

        campaign.status = CampaignStatus.RUNNING;
        return this.campaignRepository.save(campaign);
    }

    async findAllByTenant(tenantId: string) {
        return this.campaignRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
        });
    }

    async create(tenantId: string, data: any) {
        try {
            // Sanitize data to only include valid entity fields
            const campaignData = {
                name: data.name,
                channels: data.channels,
                messageTemplate: data.messageTemplate,
                integrationId: data.integrationId,
                status: CampaignStatus.PAUSED, // Default to PAUSED
                tenantId,
            };

            const campaign = this.campaignRepository.create(campaignData);
            const saved = await this.campaignRepository.save(campaign) as unknown as Campaign;
            const campaignId = saved.id;

            // Handle Leads (Save to DB but DO NOT Queue yet)
            let leadsToProcess: CampaignLead[] = [];
            const contactIdMap = new Map<string, string>();

            if (data.leads && Array.isArray(data.leads)) {
                // ... (existing logic for JSON leads) ...
                const leadsData = data.leads;
                const chunkSize = 50;

                for (let i = 0; i < leadsData.length; i += chunkSize) {
                    const chunk = leadsData.slice(i, i + chunkSize);

                    // 1. Ensure Contacts exist
                    const contacts = await Promise.all(chunk.map(l => {
                        const name = l.name || l.nome || l.Name || l.Nome || 'Contato';
                        const phone = String(l.phoneNumber || l.telefone || l.phone || l.celular || l.externalId || '').replace(/\D/g, '');
                        return this.crmService.ensureContact(tenantId, {
                            name: name,
                            phoneNumber: phone,
                            externalId: String(l.externalId || phone)
                        }, { forceStage: 'NOVO' });
                    }));

                    // 2. Create Campaign Leads
                    const leadsToCreate = chunk.map(l => {
                        const name = l.name || l.nome || l.Name || l.Nome || 'Contato';
                        const phone = String(l.phoneNumber || l.telefone || l.phone || l.celular || l.externalId || '').replace(/\D/g, '');
                        return this.leadRepository.create({
                            name: name,
                            externalId: String(l.externalId || phone),
                            campaignId: campaignId,
                            status: LeadStatus.PENDING
                        });
                    });

                    const savedLeads = await this.leadRepository.save(leadsToCreate);
                    leadsToProcess.push(...savedLeads);
                }
                this.logger.log(`Created ${leadsToProcess.length} leads for campaign ${campaignId}`);

            } else if (data.useExistingContacts) {
                // ... (existing logic for CRM leads) ...
                const filters = data.filters || {};
                const contacts = await this.crmService.findAllByTenant(tenantId, filters);

                if (contacts.length > 0) {
                    const leadsToCreateEntities = contacts.map(c => this.leadRepository.create({
                        name: c.name || 'Contato',
                        externalId: c.externalId || c.phoneNumber || '',
                        campaignId: campaignId,
                        status: LeadStatus.PENDING
                    }));

                    const chunkSize = 500;
                    for (let i = 0; i < leadsToCreateEntities.length; i += chunkSize) {
                        const chunk = leadsToCreateEntities.slice(i, i + chunkSize);
                        const savedChunk = await this.leadRepository.save(chunk);
                        leadsToProcess.push(...savedChunk);
                    }
                    this.logger.log(`Created ${leadsToProcess.length} leads from contacts for campaign ${campaignId}`);
                }
            }

            // DO NOT QUEUE JOBS HERE. User must click "Start".

            return {
                id: saved.id,
                name: saved.name,
                status: saved.status,
                channels: saved.channels,
                messageTemplate: saved.messageTemplate,
                createdAt: saved.createdAt
            };
        } catch (error) {
            this.logger.error(`Error creating campaign: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findOne(id: string, tenantId: string) {
        return this.campaignRepository.findOne({
            where: { id, tenantId },
            relations: ['leads'],
        });
    }

    async updateStatus(id: string, tenantId: string, status: CampaignStatus) {
        const campaign = await this.findOne(id, tenantId);
        if (campaign) {
            campaign.status = status;
            return this.campaignRepository.save(campaign) as unknown as Campaign;
        }
        return null;
    }

    async update(id: string, tenantId: string, data: any) {
        // Simple update for basic fields
        return this.campaignRepository.update({ id, tenantId }, {
            name: data.name,
            channels: data.channels,
            integrationId: data.integrationId,
            messageTemplate: data.messageTemplate,
            variations: data.variations
        });
    }

    async remove(id: string, tenantId: string) {
        const campaign = await this.findOne(id, tenantId);
        if (campaign) {
            // Manually delete leads first to ensure no foreign key issues
            await this.leadRepository.delete({ campaignId: id });
            return this.campaignRepository.remove(campaign);
        }
    }
}
