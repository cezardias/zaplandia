import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { CampaignLead, LeadStatus } from './entities/campaign-lead.entity';
import { CrmService } from '../crm/crm.service';
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
        private crmService: CrmService,
        @InjectQueue('campaign-queue') private campaignQueue: Queue,
    ) { }

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
                status: CampaignStatus.PENDING,
                tenantId,
            };

            const campaign = this.campaignRepository.create(campaignData);
            const saved = await this.campaignRepository.save(campaign) as unknown as Campaign;
            const campaignId = saved.id;

            // Handle Leads & Queue
            let leadsToProcess: CampaignLead[] = [];
            const contactIdMap = new Map<string, string>(); // Maps Lead ID -> Contact ID

            // If leads are provided (from JSON upload), save them
            if (data.leads && Array.isArray(data.leads)) {

                const leadsData = data.leads;
                const chunkSize = 50;

                for (let i = 0; i < leadsData.length; i += chunkSize) {
                    const chunk = leadsData.slice(i, i + chunkSize);

                    // 1. Ensure Contacts exist (or create as NOVO)
                    const contacts = await Promise.all(chunk.map(l =>
                        this.crmService.ensureContact(tenantId, {
                            name: l.name || 'Contato',
                            phoneNumber: String(l.phoneNumber || l.externalId || ''),
                            externalId: String(l.externalId || l.phoneNumber || '')
                        }, { forceStage: 'NOVO' })
                    ));

                    // 2. Create Campaign Leads
                    const leadsToCreate = chunk.map(l => this.leadRepository.create({
                        name: l.name || 'Contato',
                        externalId: String(l.externalId || l.phoneNumber || ''),
                        campaignId: campaignId,
                        status: LeadStatus.PENDING
                    }));

                    const savedLeads = await this.leadRepository.save(leadsToCreate);
                    leadsToProcess.push(...savedLeads);

                    // 3. Map Lead ID -> Contact ID
                    // Assuming 1:1 consistent order between chunk, contacts, leadsToCreate, and savedLeads
                    savedLeads.forEach((sl, idx) => {
                        contactIdMap.set(sl.id, contacts[idx].id);
                    });
                }
                this.logger.log(`Created ${leadsToProcess.length} leads for campaign ${campaignId}`);

            } else if (data.useExistingContacts) {
                // Logic to pull contacts from CRM and create leads
                const filters = data.filters || {}; // e.g. { stage: 'NOT_INTERESTED' }
                const contacts = await this.crmService.findAllByTenant(tenantId, filters);

                if (contacts.length > 0) {

                    // Map Contacts to Lead Entities
                    const leadsToCreate = contacts.map(c => ({
                        entity: this.leadRepository.create({
                            name: c.name || 'Contato',
                            externalId: c.externalId || c.phoneNumber || '',
                            campaignId: campaignId,
                            status: LeadStatus.PENDING
                        }),
                        contactId: c.id
                    }));

                    const chunkSize = 500;
                    for (let i = 0; i < leadsToCreate.length; i += chunkSize) {
                        const chunk = leadsToCreate.slice(i, i + chunkSize);
                        const savedChunk = await this.leadRepository.save(chunk.map(l => l.entity));

                        leadsToProcess.push(...savedChunk);

                        // Map IDs
                        savedChunk.forEach((sl, idx) => {
                            contactIdMap.set(sl.id, chunk[idx].contactId);
                        });
                    }
                    this.logger.log(`Created ${leadsToProcess.length} leads from contacts for campaign ${campaignId}`);
                }
            }

            // Add to Bull Queue
            // Check if we have variations (passed from frontend as 'variations' or imply from messageTemplate if it's spintax - simplistically assuming variations array for now)
            const variations = data.variations || [];

            // Rate Limiting: 20 minutes between messages to strictly respect ~40-50/day limit per instance
            const DELAY_MS = 20 * 60 * 1000;

            // Queue jobs
            await Promise.all(leadsToProcess.map(async (lead, index) => {
                const contactId = contactIdMap.get(lead.id);
                // Calculate staggered delay
                const delay = index * DELAY_MS;

                await this.campaignQueue.add('send-message', {
                    leadId: lead.id,
                    contactId: contactId,
                    externalId: lead.externalId,
                    message: saved.messageTemplate,
                    instanceName: saved.integrationId,
                    tenantId: tenantId,
                    variations: variations
                }, {
                    removeOnComplete: true,
                    attempts: 3,
                    backoff: 5000,
                    delay: delay // Staggered execution
                });
            }));

            this.logger.log(`Queued ${leadsToProcess.length} jobs for campaign ${campaignId}`);

            // Update status to running
            saved.status = CampaignStatus.RUNNING;
            await this.campaignRepository.save(saved);

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
            return this.campaignRepository.remove(campaign);
        }
    }
}
