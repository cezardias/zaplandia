import { CrmService } from '../crm/crm.service';
import { AiService } from '../integrations/ai.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { N8nService } from '../integrations/n8n.service';
import { Repository } from 'typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
export declare class WebhooksController {
    private readonly crmService;
    private readonly aiService;
    private readonly integrationsService;
    private readonly n8nService;
    private contactRepository;
    private messageRepository;
    private readonly logger;
    constructor(crmService: CrmService, aiService: AiService, integrationsService: IntegrationsService, n8nService: N8nService, contactRepository: Repository<Contact>, messageRepository: Repository<Message>);
    verifyMeta(mode: string, token: string, challenge: string): Promise<string>;
    handleMeta(payload: any): Promise<{
        status: string;
    }>;
    handleEvolution(payload: any): Promise<{
        status: string;
    }>;
}
