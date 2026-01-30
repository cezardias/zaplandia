import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { CampaignLead, LeadStatus } from './entities/campaign-lead.entity';
import { CrmService } from '../crm/crm.service';

@Injectable()
export class CampaignsService {
    private readonly logger = new Logger(CampaignsService.name);

    constructor(
        @InjectRepository(Campaign)
        private campaignRepository: Repository<Campaign>,
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
        private crmService: CrmService,
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

            // If leads are provided (from JSON upload), save them
            if (data.leads && Array.isArray(data.leads)) {
                const leads = data.leads.map(l => this.leadRepository.create({
                    name: l.name || 'Contato',
                    externalId: String(l.externalId || l.phoneNumber || ''),
                    campaignId: campaignId,
                    status: LeadStatus.PENDING
                }));

                const chunkSize = 500;
                for (let i = 0; i < leads.length; i += chunkSize) {
                    await this.leadRepository.save(leads.slice(i, i + chunkSize));
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
                        await this.leadRepository.save(leads.slice(i, i + chunkSize));
                    }
                    this.logger.log(`Created ${leads.length} leads from contacts for campaign ${campaignId}`);
                }
            }

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
