import type { Job } from 'bull';
import { EvolutionApiService } from '../../integrations/evolution-api.service';
import { IntegrationsService } from '../../integrations/integrations.service';
import { CrmService } from '../../crm/crm.service';
import { CampaignLead } from '../entities/campaign-lead.entity';
import { Campaign } from '../entities/campaign.entity';
import { Repository } from 'typeorm';
export declare class CampaignProcessor {
    private readonly integrationsService;
    private readonly evolutionApiService;
    private readonly crmService;
    private campaignRepository;
    private leadRepository;
    private readonly logger;
    private dailyCounts;
    private readonly MAX_DAILY_LIMIT;
    constructor(integrationsService: IntegrationsService, evolutionApiService: EvolutionApiService, crmService: CrmService, campaignRepository: Repository<Campaign>, leadRepository: Repository<CampaignLead>);
    handleSendMessage(job: Job): Promise<void>;
    private checkRateLimit;
    private incrementCounter;
}
