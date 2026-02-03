import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EvolutionApiService } from '../integrations/evolution-api.service';
import { IntegrationsService } from '../integrations/integrations.service';

export interface AIPrompt {
    id: string;
    name: string;
    content: string;
    tenantId: string;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
        private evolutionApiService: EvolutionApiService,
        private integrationsService: IntegrationsService,
    ) { }

    /**
     * Get Gemini API key for tenant from integrations
     */
    private async getGeminiApiKey(tenantId: string): Promise<string | null> {
        try {
            const apiKey = await this.integrationsService.getCredential(tenantId, 'GEMINI_API_KEY');
            return apiKey;
        } catch (error) {
            this.logger.error(`Failed to get Gemini API key for tenant ${tenantId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Check if AI should respond to this message
     */
    async shouldRespond(contact: Contact, instanceName: string, tenantId: string): Promise<boolean> {
        // 1. Find the integration for this instance
        const integration = await this.integrationRepository.findOne({
            where: {
                tenantId,
                provider: 'evolution' as any,
            }
        });

        if (!integration) {
            this.logger.warn(`No integration found for instance ${instanceName}`);
            return false;
        }

        // 2. Check if AI is enabled for the instance
        if (!integration.aiEnabled) {
            this.logger.log(`AI disabled for instance ${instanceName}`);
            return false;
        }

        // 3. Check conversation-level override
        if (contact.aiEnabled === false) {
            this.logger.log(`AI disabled for contact ${contact.id} (override)`);
            return false;
        }

        // 4. Check if prompt is configured
        if (!integration.aiPromptId) {
            this.logger.warn(`No AI prompt configured for instance ${instanceName}`);
            return false;
        }

        return true;
    }

    /**
     * Generate AI response for a message
     */
    async generateResponse(contact: Contact, userMessage: string, tenantId: string): Promise<string | null> {
        try {
            // 1. Get tenant's Gemini API key
            const apiKey = await this.getGeminiApiKey(tenantId);
            if (!apiKey) {
                this.logger.error(`No Gemini API key configured for tenant ${tenantId}`);
                return null;
            }

            // 2. Initialize Gemini with tenant's key
            const genAI = new GoogleGenerativeAI(apiKey);

            // 3. Get integration to find prompt
            const integration = await this.integrationRepository.findOne({
                where: {
                    tenantId,
                    provider: 'evolution' as any,
                }
            });

            if (!integration?.aiPromptId) {
                this.logger.error('No AI prompt configured');
                return null;
            }

            // 4. Fetch AI prompt from database
            const promptContent = await this.getPromptContent(integration.aiPromptId, tenantId);

            if (!promptContent) {
                this.logger.error(`Prompt ${integration.aiPromptId} not found`);
                return null;
            }

            // 5. Get conversation history (last 10 messages)
            const history = await this.messageRepository.find({
                where: { contactId: contact.id },
                order: { createdAt: 'DESC' },
                take: 10
            });

            // Build context
            const conversationContext = history
                .reverse()
                .map(m => `${m.direction === 'inbound' ? 'Cliente' : 'Você'}: ${m.content}`)
                .join('\n');

            // 6. Call Gemini API
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            const fullPrompt = `${promptContent}\n\nHistórico da conversa:\n${conversationContext}\n\nCliente: ${userMessage}\n\nVocê:`;

            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            const aiResponse = response.text();

            this.logger.log(`AI generated response for contact ${contact.id}`);
            return aiResponse;

        } catch (error) {
            this.logger.error(`Failed to generate AI response: ${error.message}`);
            return null;
        }
    }

    /**
     * Send AI response via Evolution API
     */
    async sendAIResponse(contact: Contact, aiResponse: string, tenantId: string): Promise<void> {
        try {
            if (!contact.instance) {
                this.logger.error(`Contact ${contact.id} has no instance`);
                return;
            }

            // Get target number
            const targetNumber = contact.externalId || contact.phoneNumber;
            if (!targetNumber) {
                this.logger.error(`Contact ${contact.id} has no phone number`);
                return;
            }

            // Send via Evolution API
            await this.evolutionApiService.sendText(tenantId, contact.instance, targetNumber, aiResponse);

            this.logger.log(`AI response sent to ${targetNumber} via ${contact.instance}`);

        } catch (error) {
            this.logger.error(`Failed to send AI response: ${error.message}`);
        }
    }

    /**
     * Get prompt content from database
     * TODO: Implement this based on your AI prompts table structure
     */
    private async getPromptContent(promptId: string, tenantId: string): Promise<string | null> {
        // Placeholder - you need to implement this based on your prompts table
        // For now, returning a default prompt
        return `Você é um assistente virtual prestativo. Responda de forma educada e profissional.`;
    }
}
