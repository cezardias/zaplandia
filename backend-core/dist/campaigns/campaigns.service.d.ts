import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { CampaignLead } from './entities/campaign-lead.entity';
import { CrmService } from '../crm/crm.service';
export declare class CampaignsService {
    private campaignRepository;
    private leadRepository;
    private crmService;
    private readonly logger;
    constructor(campaignRepository: Repository<Campaign>, leadRepository: Repository<CampaignLead>, crmService: CrmService);
    findAllByTenant(tenantId: string): Promise<any>;
    create(tenantId: string, data: any): Promise<{
        id: string;
        name: string;
        status: CampaignStatus;
        channels: string[];
        messageTemplate: string;
        createdAt: Date;
    }>;
    findOne(id: string, tenantId: string): Promise<any>;
    updateStatus(id: string, tenantId: string, status: CampaignStatus): Promise<Campaign | null>;
    remove(id: string, tenantId: string): Promise<any>;
}
