import { Repository } from 'typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
import { IntegrationsService } from '../integrations/integrations.service';
import { EvolutionApiService } from '../integrations/evolution-api.service';
import { Integration } from '../integrations/entities/integration.entity';
export declare class DebugController {
    private contactRepository;
    private messageRepository;
    private integrationRepository;
    private integrationsService;
    private evolutionApiService;
    constructor(contactRepository: Repository<Contact>, messageRepository: Repository<Message>, integrationRepository: Repository<Integration>, integrationsService: IntegrationsService, evolutionApiService: EvolutionApiService);
    getInstanceStats(req: any): Promise<{
        summary: any[];
        examples: {
            withInstance: {
                id: string;
                name: string;
                instance: string;
                createdAt: Date;
            }[];
            withoutInstance: {
                id: string;
                name: string;
                instance: string;
                createdAt: Date;
            }[];
        };
    }>;
    forceUpdateInstances(req: any): Promise<{
        message: string;
        updated: number;
    }>;
    syncEvolutionInstances(req: any): Promise<{
        message: string;
        results: any[];
    }>;
    backfillInstances(req: any): Promise<{
        message: string;
        updatedMessages: number;
        contactsProcessed: number;
    }>;
}
