import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { CampaignLead, LeadStatus } from './entities/campaign-lead.entity';
import { CrmService } from '../crm/crm.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

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

            // If leads are provided (from JSON upload), save them
            if (data.leads && Array.isArray(data.leads)) {
                const leads = data.leads.map(l => this.leadRepository.create({
                    name: l.name || 'Contato',
                    externalId: String(l.externalId || l.phoneNumber || ''),
                    campaignId: campaignId,
                    status: LeadStatus.PENDING
                }));

                // Batch save
                const chunkSize = 500;
                for (let i = 0; i < leads.length; i += chunkSize) {
                    const savedChunk = await this.leadRepository.save(leads.slice(i, i + chunkSize));
                    leadsToProcess.push(...savedChunk);
                }
                this.logger.log(`Created ${leads.length} leads for campaign ${campaignId}`);

            } else if (data.useExistingContacts) {
                // Logic to pull contacts from CRM and create leads
                const contacts = await this.crmService.findAllByTenant(tenantId);
                if (contacts.length > 0) {
                    const leads = contacts.map(c => this.leadRepository.create({
                        name: c.name || 'Contato',
                        externalId: c.externalId || c.phoneNumber || '',
                        campaignId: campaignId,
                        status: LeadStatus.PENDING
                    }));

                    const chunkSize = 500;
                    for (let i = 0; i < leads.length; i += chunkSize) {
                        const savedChunk = await this.leadRepository.save(leads.slice(i, i + chunkSize));
                        leadsToProcess.push(...savedChunk);
                    }
                    this.logger.log(`Created ${leads.length} leads from contacts for campaign ${campaignId}`);
                }
            }

            // Add to Bull Queue
            // Check if we have variations (passed from frontend as 'variations' or imply from messageTemplate if it's spintax - simplistically assuming variations array for now)
            const variations = data.variations || [];

            // Queue jobs
            await Promise.all(leadsToProcess.map(async (lead) => {
                await this.campaignQueue.add('send-message', {
                    leadId: lead.id,
                    contactId: lead.id, // Using lead ID as contact ref for now
                    externalId: lead.externalId,
                    message: saved.messageTemplate,
                    instanceName: saved.integrationId, // Ensure this is the instance name string
                    tenantId: tenantId,
                    variations: variations
                }, {
                    removeOnComplete: true,
                    attempts: 3,
                    backoff: 5000 // Retry delay
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

    async remove(id: string, tenantId: string) {
        const campaign = await this.findOne(id, tenantId);
        if (campaign) {
            return this.campaignRepository.remove(campaign);
        }
    }
}
