import { CrmService } from '../crm/crm.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { Message } from '../crm/entities/crm.entity';
import { Repository } from 'typeorm';
export declare class DashboardController {
    private readonly crmService;
    private readonly integrationsService;
    private messageRepository;
    constructor(crmService: CrmService, integrationsService: IntegrationsService, messageRepository: Repository<Message>);
    getStats(req: any): Promise<{
        messagesToday: number;
        activeChats: number;
        connectedIntegrations: number;
    }>;
}
