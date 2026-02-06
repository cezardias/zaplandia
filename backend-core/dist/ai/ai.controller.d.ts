import { Repository } from 'typeorm';
import { Integration } from '../integrations/entities/integration.entity';
import { Contact } from '../crm/entities/crm.entity';
import { AiService } from './ai.service';
export declare class AiController {
    private integrationRepository;
    private contactRepository;
    private aiService;
    constructor(integrationRepository: Repository<Integration>, contactRepository: Repository<Contact>, aiService: AiService);
    toggleIntegrationAI(integrationId: string, body: {
        enabled: boolean;
        promptId?: string;
        aiModel?: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        integration?: undefined;
    } | {
        success: boolean;
        integration: {
            id: any;
            aiEnabled: any;
            aiPromptId: any;
            aiModel: any;
        };
        message?: undefined;
    }>;
    toggleContactAI(contactId: string, body: {
        enabled: boolean | null;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        contact?: undefined;
    } | {
        success: boolean;
        contact: {
            id: any;
            aiEnabled: any;
        };
        message?: undefined;
    }>;
    generateVariations(body: {
        baseMessage: string;
        prompt?: string;
        count?: number;
    }, req: any): Promise<{
        success: boolean;
        variations: string[];
    }>;
    generatePrompts(body: {
        topic: string;
        count?: number;
    }, req: any): Promise<{
        success: boolean;
        prompts: string[];
    }>;
}
