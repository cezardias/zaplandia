import { Repository } from 'typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { EvolutionApiService } from '../integrations/evolution-api.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { AiPrompt as AiPromptEntity } from '../integrations/entities/ai-prompt.entity';
export interface AIPrompt {
    id: string;
    name: string;
    content: string;
    tenantId: string;
}
export declare class AiService {
    private contactRepository;
    private messageRepository;
    private integrationRepository;
    private aiPromptRepository;
    private evolutionApiService;
    private integrationsService;
    private readonly logger;
    constructor(contactRepository: Repository<Contact>, messageRepository: Repository<Message>, integrationRepository: Repository<Integration>, aiPromptRepository: Repository<AiPromptEntity>, evolutionApiService: EvolutionApiService, integrationsService: IntegrationsService);
    findAll(tenantId: string): Promise<AiPromptEntity[]>;
    private getGeminiApiKey;
    shouldRespond(contact: Contact, instanceName: string, tenantId: string): Promise<boolean>;
    generateResponse(contact: Contact, userMessage: string, tenantId: string, instanceName?: string): Promise<string | null>;
    sendAIResponse(contact: Contact, aiResponse: string, tenantId: string, instanceNameOverride?: string): Promise<void>;
    getAiResponse(tenantId: string, prompt: string, provider: string, context?: string, modelName?: string): Promise<string | null>;
    generateVariations(tenantId: string, baseMessage: string, prompt?: string, count?: number): Promise<string[]>;
    generatePrompts(tenantId: string, topic: string, count?: number): Promise<string[]>;
    private getPromptContent;
    createPrompt(tenantId: string, name: string, content: string): Promise<AiPromptEntity>;
    updatePrompt(tenantId: string, id: string, data: {
        name?: string;
        content?: string;
    }): Promise<AiPromptEntity>;
    deletePrompt(tenantId: string, id: string): Promise<void>;
}
