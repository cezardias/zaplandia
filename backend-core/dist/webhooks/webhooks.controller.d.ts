import { CrmService } from '../crm/crm.service';
import { AiService } from '../ai/ai.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { N8nService } from '../integrations/n8n.service';
import { Repository } from 'typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
export declare class WebhooksController {
    private readonly crmService;
    private readonly aiService;
    private readonly integrationsService;
    private readonly n8nService;
    private contactRepository;
    private messageRepository;
    private leadRepository;
    private readonly logger;
    constructor(crmService: CrmService, aiService: AiService, integrationsService: IntegrationsService, n8nService: N8nService, contactRepository: Repository<Contact>, messageRepository: Repository<Message>, leadRepository: Repository<CampaignLead>);
    verifyMeta(mode: string, token: string, challenge: string): Promise<string>;
    handleMeta(payload: any): Promise<{
        status: string;
    }>;
    handleEvolution(payload: any): Promise<{
        status: string;
    }>;
}
