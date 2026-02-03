import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
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
        @InjectRepository(AiPromptEntity)
        private aiPromptRepository: Repository<AiPromptEntity>,
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
        // 1. Find the integration for this specific instance
        const integrations = await this.integrationRepository.find({
            where: {
                tenantId,
                provider: 'evolution' as any,
            }
        });

        // Match by instanceName in credentials or settings
        const integration = integrations.find(i =>
            i.credentials?.instanceName === instanceName ||
            i.settings?.instanceName === instanceName
        );

        if (!integration) {
            this.logger.warn(`No integration found for instance ${instanceName} to handle auto-response`);
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
    async generateResponse(contact: Contact, userMessage: string, tenantId: string, instanceName?: string): Promise<string | null> {
        try {
            // 1. Get tenant's Gemini API key
            const apiKey = await this.getGeminiApiKey(tenantId);
            if (!apiKey) {
                this.logger.error(`No Gemini API key configured for tenant ${tenantId}`);
                return null;
            }

            // 3. Get integration to find prompt
            const integrations = await this.integrationRepository.find({
                where: {
                    tenantId,
                    provider: 'evolution' as any,
                }
            });

            // Match by instanceName (contact.instance or provided)
            const targetInstance = instanceName || contact.instance;
            const integration = integrations.find(i =>
                i.credentials?.instanceName === targetInstance ||
                i.settings?.instanceName === targetInstance
            );

            if (!integration?.aiPromptId) {
                this.logger.error(`No AI prompt configured for instance ${targetInstance}`);
                return null;
            }

            // 4. Fetch AI prompt from database
            let promptContent = await this.getPromptContent(integration.aiPromptId, tenantId);

            if (!promptContent) {
                this.logger.error(`Prompt ${integration.aiPromptId} content not found or empty`);
                return null;
            }

            // SMART FIX: Replace common n8n/template variables if present in prompt
            // Use contact details for replacement
            const pushName = contact.name || 'Cliente';
            promptContent = promptContent.replace(/\{\{\s*\$\(?'Webhook'\)?\.item\.json\.body\.data\.pushName\s*\}\}/g, pushName);
            promptContent = promptContent.replace(/\{\{\s*pushName\s*\}\}/g, pushName);
            promptContent = promptContent.replace(/\{\{\s*nome\s*\}\}/g, pushName);

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

            // 6. Call Gemini API manually with Retry Logic for 503/Overload errors
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
            const fullPrompt = `${promptContent}\n\nHistórico da conversa:\n${conversationContext}\n\nCliente: ${userMessage}\n\nVocê:`;

            let retryCount = 0;
            const maxRetries = 3;
            let response: any;

            while (retryCount <= maxRetries) {
                try {
                    response = await axios.post(url, {
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    { text: fullPrompt }
                                ]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        }
                    }, {
                        timeout: 30000 // 30 seconds
                    });

                    // If success, break the loop
                    break;
                } catch (error) {
                    const status = error.response?.status;
                    if ((status === 503 || status === 429) && retryCount < maxRetries) {
                        retryCount++;
                        const delay = retryCount * 2000; // 2s, 4s, 6s...
                        this.logger.warn(`Gemini API returned ${status}. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw error; // Rethrow if not a retryable error or max retries reached
                }
            }

            const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!aiResponse) {
                this.logger.error('Empty response from Gemini API');
                return null;
            }

            this.logger.log(`AI generated response for contact ${contact.id} using prompt ${integration.aiPromptId}`);
            return aiResponse;

        } catch (error) {
            this.logger.error(`Failed to generate AI response: ${error.response?.data?.error?.message || error.message}`);
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
            let targetNumber = contact.externalId || contact.phoneNumber;
            // HARDENING: Standardize number to base JID (remove :suffix and @suffix)
            const baseId = targetNumber.split('@')[0].split(':')[0].replace(/\D/g, '');
            targetNumber = `${baseId}@s.whatsapp.net`;
            // Send via Evolution API
            await this.evolutionApiService.sendText(tenantId, contact.instance, targetNumber, aiResponse);

            this.logger.log(`AI response sent to ${targetNumber} via ${contact.instance}`);

        } catch (error) {
            this.logger.error(`Failed to send AI response: ${error.message}`);
        }
    }

    private async getPromptContent(promptId: string, tenantId: string): Promise<string | null> {
        try {
            const prompt = await this.aiPromptRepository.findOne({
                where: { id: promptId, tenantId }
            });
            return prompt?.content || null;
        } catch (error) {
            this.logger.error(`Error fetching prompt content for ${promptId}: ${error.message}`);
            return null;
        }
    }
}
