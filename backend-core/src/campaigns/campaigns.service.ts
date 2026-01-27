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
        const campaign = this.campaignRepository.create({
            ...data,
            tenantId,
        });
        const saved = await this.campaignRepository.save(campaign) as Campaign;

        // If leads are provided (from JSON upload), save them
        if (data.leads && Array.isArray(data.leads)) {
            const leads = data.leads.map(l => this.leadRepository.create({
                ...l,
                campaignId: saved.id,
            }));
            await this.leadRepository.save(leads);
        } else if (data.useExistingContacts) {
            // Logic to pull contacts from CRM and create leads
            const contacts = await this.crmService.findAllByTenant(tenantId);
            const leads = contacts.map(c => this.leadRepository.create({
                name: c.name || 'Contato',
                externalId: c.externalId || c.phoneNumber || '',
                campaignId: saved.id,
            }));
            await this.leadRepository.save(leads);
        }

        return saved;
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
            return this.campaignRepository.save(campaign);
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
