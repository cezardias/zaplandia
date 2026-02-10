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
        integration: {
            id: string;
            aiEnabled: boolean;
            aiPromptId: string;
            aiModel: string;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        integration?: undefined;
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
            id: string;
            aiEnabled: boolean | null;
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
    getPrompts(req: any): Promise<import("../integrations/entities/ai-prompt.entity").AiPrompt[]>;
    generatePrompts(body: {
        topic: string;
        count?: number;
    }, req: any): Promise<{
        success: boolean;
        prompts: string[];
    }>;
    savePrompt(body: {
        id?: string;
        name: string;
        content: string;
    }, req: any): Promise<{
        success: boolean;
        prompt: import("../integrations/entities/ai-prompt.entity").AiPrompt;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        prompt?: undefined;
    }>;
    deletePrompt(id: string, req: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
}
