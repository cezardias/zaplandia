import { Repository } from 'typeorm';
import { Contact, Message } from './entities/crm.entity';
import { N8nService } from '../integrations/n8n.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { EvolutionApiService } from '../integrations/evolution-api.service';
export declare class CrmService {
    private contactRepository;
    private messageRepository;
    private readonly n8nService;
    private readonly integrationsService;
    private readonly evolutionApiService;
    private readonly logger;
    constructor(contactRepository: Repository<Contact>, messageRepository: Repository<Message>, n8nService: N8nService, integrationsService: IntegrationsService, evolutionApiService: EvolutionApiService);
    getRecentChats(tenantId: string, role?: string): Promise<any>;
    findAllByTenant(tenantId: string): Promise<any>;
    getMessages(contactId: string, tenantId: string): Promise<any>;
    sendMessage(tenantId: string, contactId: string, content: string, provider: string): Promise<any>;
    seedDemoData(tenantId: string): Promise<void>;
}
