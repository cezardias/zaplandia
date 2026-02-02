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
        let instanceName: string | undefined;

        // Check if integrationId is a UUID (for DB integrations like Meta)
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(campaign.integrationId);

        if (isUuid) {
            const integration = await this.integrationsService.findOne(campaign.integrationId, tenantId);
            if (!integration) throw new Error('Integração não encontrada. Verifique se a instância ainda existe.');
            instanceName = integration.credentials?.instanceName || integration.settings?.instanceName;
        } else {
            // If not UUID, it's likely a direct Evolution instance name
            instanceName = campaign.integrationId;
            this.logger.log(`Using direct instance name for campaign ${id}: ${instanceName}`);
        }

        if (!instanceName) throw new Error('Nome da instância não encontrado na integração.');

        // Fetch PENDING leads
        const leads = await this.leadRepository.find({
            where: { campaignId: id, status: LeadStatus.PENDING },
            take: 10000 // Limit to avoid memory crash, or handle standard pagination/chunks
        });

        if (leads.length === 0) throw new Error('Não há leads pendentes para iniciar.');

        this.logger.log(`[MOTOR] Iniciando campanha ${id} (${campaign.name}). Enfileirando ${leads.length} leads...`);

        const STAGGER_MS = 15 * 1000; // 15 seconds stagger (faster but safe)
        const CHUNK_SIZE = 50; // Process in chunks to avoid blocking everything

        for (let i = 0; i < leads.length; i += CHUNK_SIZE) {
            const chunk = leads.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (lead, chunkIndex) => {
                const globalIndex = i + chunkIndex;
                const delay = globalIndex * STAGGER_MS;

                await this.campaignQueue.add('send-message', {
                    leadId: lead.id,
                    leadName: lead.name,
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
            this.logger.log(`[QUEUE] Lote ${Math.floor(i / CHUNK_SIZE) + 1} de ${Math.ceil(leads.length / CHUNK_SIZE)} enfileirado.`);
        }

        this.logger.log(`[SUCESSO] Campanha ${id} iniciada com sucesso. O processamento começou.`);

        campaign.status = CampaignStatus.RUNNING;
        return this.campaignRepository.save(campaign);
    }

    async findAllByTenant(tenantId: string) {
        return this.campaignRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
        });
    }

    // Helper to extract name robustly
    private extractLeadName(l: any): string {
        const nameKeys = ['title', 'titulo', 'name', 'nome', 'fullname', 'nomecompleto', 'nome_completo', 'full_name', 'contato', 'público', 'publico', 'Name', 'Nome', 'Razão Social', 'razao_social'];

        // 1. Try explicit search with case-insensitivity
        const foundKey = Object.keys(l).find(k => nameKeys.some(nk => nk.toLowerCase() === k.toLowerCase().trim()));
        if (foundKey && l[foundKey] && String(l[foundKey]).trim().toLowerCase() !== 'contato' && String(l[foundKey]).trim() !== '') {
            return String(l[foundKey]).trim();
        }

        // 2. Try common fallbacks if no explicit key found or if it was "contato"
        const fallback = l.name || l.nome || l.Name || l.Nome;
        if (fallback && String(fallback).trim().toLowerCase() !== 'contato' && String(fallback).trim() !== '') {
            return String(fallback).trim();
        }

        // 3. Last resort: any key that contains "nome" or "name"
        const looseKey = Object.keys(l).find(k => k.toLowerCase().includes('nome') || k.toLowerCase().includes('name'));
        if (looseKey && l[looseKey] && String(looseKey).trim() !== '') {
            return String(l[looseKey]).trim();
        }

        return 'Contato';
    }

    // Helper to extract phone robustly
    private extractPhoneNumber(l: any): string {
        const phoneKeys = [
            'phoneNumber', 'telefone', 'phone', 'celular', 'externalId', 'whatsapp', 'wa', 'number', 'numero', 'tel', 'cell',
            'Phone', 'Telefone', 'Celular', 'Número', 'Numero', 'WhatsApp', 'Público', 'Publico'
        ];

        // 1. Try explicit search with case-insensitivity
        const foundKey = Object.keys(l).find(k => phoneKeys.some(pk => pk.toLowerCase() === k.toLowerCase().trim()));
        if (foundKey && l[foundKey]) {
            const raw = String(l[foundKey]).trim();
            const sanitized = raw.replace(/\D/g, '');
            if (sanitized.length >= 8) return sanitized;
        }

        // 2. Fallback to any key that contains "tel" or "phone" or "cel" or "zap"
        const looseKey = Object.keys(l).find(k => {
            const lowKey = k.toLowerCase();
            return lowKey.includes('tel') || lowKey.includes('phone') || lowKey.includes('cel') || lowKey.includes('zap') || lowKey.includes('num');
        });
        if (looseKey && l[looseKey]) {
            const sanitized = String(l[looseKey]).replace(/\D/g, '');
            if (sanitized.length >= 8) return sanitized;
        }

        return '';
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
                variations: data.variations
            };

            const campaign = this.campaignRepository.create(campaignData);
            const saved = await this.campaignRepository.save(campaign) as unknown as Campaign;
            const campaignId = saved.id;

            // Handle Leads (Save to DB but DO NOT Queue yet)
            let leadsToProcess: CampaignLead[] = [];

            if (data.leads && Array.isArray(data.leads)) {
                const leadsData = data.leads;
                const chunkSize = 50;

                for (let i = 0; i < leadsData.length; i += chunkSize) {
                    const chunk = leadsData.slice(i, i + chunkSize);

                    // 1. Ensure Contacts exist
                    await Promise.all(chunk.map(l => {
                        const name = this.extractLeadName(l);
                        const phone = this.extractPhoneNumber(l);
                        if (!phone) return Promise.resolve(); // Skip missing phone

                        return this.crmService.ensureContact(tenantId, {
                            name: name,
                            phoneNumber: phone,
                            externalId: phone
                        }, { forceStage: 'NOVO' });
                    }));

                    // 2. Create Campaign Leads
                    const leadsToCreate = chunk.map(l => {
                        const name = this.extractLeadName(l);
                        const phone = this.extractPhoneNumber(l);

                        if (!phone) {
                            this.logger.warn(`Lead sem telefone ignorado na importação: ${name}`);
                            return null;
                        }

                        return this.leadRepository.create({
                            name: name,
                            externalId: phone,
                            campaignId: campaignId,
                            status: LeadStatus.PENDING
                        });
                    }).filter(l => l !== null);

                    const savedLeads = await this.leadRepository.save(leadsToCreate);
                    leadsToProcess.push(...savedLeads);
                }
                this.logger.log(`Created ${leadsToProcess.length} leads for campaign ${campaignId}`);

            } else if (data.useExistingContacts) {
                const filters = data.filters || {};
                const contacts = await this.crmService.findAllByTenant(tenantId, filters);

                if (contacts.length > 0) {
                    const leadsToCreateEntities = contacts.map(c => {
                        const phone = c.externalId || c.phoneNumber || '';
                        if (!phone) return null;

                        return this.leadRepository.create({
                            name: c.name || 'Contato',
                            externalId: phone,
                            campaignId: campaignId,
                            status: LeadStatus.PENDING
                        });
                    }).filter(l => l !== null);

                    const chunkSize = 500;
                    for (let i = 0; i < leadsToCreateEntities.length; i += chunkSize) {
                        const chunk = leadsToCreateEntities.slice(i, i + chunkSize);
                        const savedChunk = await this.leadRepository.save(chunk);
                        leadsToProcess.push(...savedChunk);
                    }
                    this.logger.log(`Created ${leadsToProcess.length} leads from contacts for campaign ${campaignId}`);
                }
            }

            if (leadsToProcess.length === 0) {
                throw new Error('Nenhum lead encontrado para esta campanha. Verifique o arquivo ou os filtros.');
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
        if (status === CampaignStatus.RUNNING) {
            return this.start(id, tenantId);
        }

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
