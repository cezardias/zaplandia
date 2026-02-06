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
            if (apiKey) {
                const trimmedKey = apiKey.trim();
                // DEBUG: Log character codes to find hidden chars
                const charCodes = trimmedKey.split('').map(c => c.charCodeAt(0)).join(',');
                this.logger.debug(`[GEMINI_KEY_DEBUG] Key: ${trimmedKey.substring(0, 5)}... (Len: ${trimmedKey.length}) Chars: [${charCodes.substring(0, 20)}...]`);

                return trimmedKey;
            }
            return null;
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

        // Match by instanceName in credentials or settings (Flexible match: ends with or starts with)
        const integration = integrations.find(i => {
            const credInst = i.credentials?.instanceName;
            const settInst = i.settings?.instanceName;

            const match = (name: string) =>
                name === instanceName ||
                instanceName.endsWith(`_${name}`) ||
                name.endsWith(`_${instanceName}`);

            return (credInst && match(credInst)) || (settInst && match(settInst));
        });

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
        this.logger.debug(`[AI_CHECK] Contact ${contact.id} aiEnabled status: ${contact.aiEnabled} (Type: ${typeof contact.aiEnabled})`);

        if (contact.aiEnabled === false) {
            this.logger.log(`AI disabled for contact ${contact.id} (Explicit Override: OFF)`);
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
            const integration = integrations.find(i => {
                const credInst = i.credentials?.instanceName;
                const settInst = i.settings?.instanceName;

                if (!targetInstance) return false;

                const match = (name: string) =>
                    name === targetInstance ||
                    targetInstance.endsWith(`_${name}`) ||
                    name.endsWith(`_${targetInstance}`);

                return (credInst && match(credInst)) || (settInst && match(settInst));
            });

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
            // Get model from integration settings, default to gemini-2.5-flash-lite
            const modelName = integration.aiModel || 'gemini-2.5-flash-lite';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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
                    this.logger.error(`[AI_REQUEST_FAILED] Attempt ${retryCount + 1}/${maxRetries + 1}: ${error.message}`);
                    if (error.response) {
                        this.logger.error(`[GEMINI_ERROR] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
                    }
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
    async sendAIResponse(contact: Contact, aiResponse: string, tenantId: string, instanceNameOverride?: string): Promise<void> {
        // Variables needed in catch block for healing
        let targetNumber = '';
        let useContact = contact;
        let useInstance = '';

        try {
            // CRITICAL: Re-fetch contact from DB to ensure we have the LATEST externalId/JID
            const freshContact = await this.contactRepository.findOne({ where: { id: contact.id } });
            useContact = freshContact || contact;
            useInstance = instanceNameOverride || useContact.instance;

            // Get target number
            // PRIORITY: If we have a numeric phoneNumber, use that with @s.whatsapp.net
            if (useContact.phoneNumber && useContact.phoneNumber.length > 8) {
                targetNumber = `${useContact.phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;
                this.logger.debug(`[AI_SEND] Using phone-based JID for stability: ${targetNumber}`);
            } else {
                targetNumber = useContact.externalId || useContact.phoneNumber;
            }

            if (!targetNumber) {
                this.logger.error(`Cannot send AI response: No target number for contact ${useContact.id}`);
                return;
            }

            // HARDENING: Standardize number to base JID (remove :device but keep @suffix)
            const cleanNumber = targetNumber.replace(/:[0-9]+/, '');
            targetNumber = cleanNumber.includes('@') ? cleanNumber : `${cleanNumber.replace(/\D/g, '')}@s.whatsapp.net`;

            this.logger.log(`Sending AI response to ${targetNumber} via ${useInstance}`);

            // Send via Evolution API
            await this.evolutionApiService.sendText(tenantId, useInstance, targetNumber, aiResponse);

            this.logger.log(`AI response sent to ${targetNumber} via ${useInstance}`);
        } catch (error) {
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            this.logger.error(`Failed to send AI response: ${errorMsg}`);

            // AUTOMATIC HEALING: If delivery failed with "exists: false" and we were using a LID
            // Try falling back to the phone number if we have it in the contact.
            const isExistsFalse = errorMsg.includes('exists":false') || errorMsg.includes('not found');
            const wasLid = targetNumber && targetNumber.includes('@lid');

            if (isExistsFalse && wasLid && useContact.phoneNumber && useContact.phoneNumber.length > 8) {
                const fallbackNumber = `${useContact.phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;
                this.logger.warn(`[AI_HEAL] LID delivery failed. Trying stable phone fallback: ${fallbackNumber}`);
                try {
                    await this.evolutionApiService.sendText(tenantId, useInstance, fallbackNumber, aiResponse);
                    this.logger.log(`[AI_HEAL] Success! AI response delivered via phone fallback.`);
                    return; // Successfully healed
                } catch (fallbackError) {
                    this.logger.error(`[AI_HEAL] Phone fallback also failed: ${fallbackError.message}`);
                }
            }

            // EXTRA RESILIENCE: Log the full error to help debug LID issues
            if (error.response?.data) {
                this.logger.error(`Evolution API Error Detail: ${JSON.stringify(error.response.data)}`);
            }
        }
    }

    // --- RESTORED METHODS FOR FRONTEND MAGIC WAND ---

    async getAiResponse(tenantId: string, prompt: string, provider: string, context?: string, modelName?: string) {
        try {
            // Fetch the Gemini API Key for this specific tenant (or global fallback)
            const apiKey = await this.getGeminiApiKey(tenantId);

            if (!apiKey) {
                this.logger.error(`[AI_REQUEST] No API Key found for Tenant ${tenantId}.`);
                return `[ERRO] Chave de API do Gemini não configurada.`;
            }

            const finalModelName = modelName || 'gemini-2.5-flash-lite';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${finalModelName}:generateContent?key=${apiKey}`;
            const systemInstruction = context || "Você é o assistente da Zaplandia.";
            const fullPrompt = `${systemInstruction}\n\n${prompt}`;

            let retryCount = 0;
            const maxRetries = 3;
            let response: any;

            while (retryCount <= maxRetries) {
                try {
                    response = await axios.post(url, {
                        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 2048,
                        }
                    }, { timeout: 30000 });

                    break; // Success
                } catch (error) {
                    const isOverloaded = error.response?.data?.error?.code === 503 || error.response?.status === 503;

                    if (isOverloaded && retryCount < maxRetries) {
                        retryCount++;
                        const delay = Math.pow(2, retryCount) * 1000;
                        this.logger.warn(`[AI_RETRY] Gemini overloaded in getAiResponse. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
                        await new Promise(res => setTimeout(res, delay));
                        continue;
                    }

                    throw error; // Propagate if not 503 or max retries
                }
            }

            const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!aiResponse) return null;

            this.logger.log(`[AI_RESPONSE] Received ${aiResponse.length} chars from AI Service`);
            return aiResponse;

        } catch (error) {
            const errorDetail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            this.logger.error(`[AI_REQUEST_FAILED] ${errorDetail}`);
            return null; // Return null instead of error string so callers can fallback
        }
    }

    async generateVariations(tenantId: string, baseMessage: string, prompt?: string, count: number = 3): Promise<string[]> {
        const systemInstruction = "Você é um especialista em Copywriting para WhatsApp. Sua tarefa é gerar variações de mensagens mantendo o sentido original, mas mudando o tom ou a estrutura para evitar bloqueios de SPAM. Retorne APENAS um array JSON de strings, sem markdown.";

        const userPrompt = `
        Mensagem Original: "${baseMessage}"
        Contexto/Instrução Adicional: "${prompt || 'Crie variações amigáveis e persuasivas.'}"
        Quantidade: ${count}
        
        Gere as variações no formato JSON array de strings: ["variação 1", "variação 2", ...]`;

        try {
            const responseStr = await this.getAiResponse(tenantId, userPrompt, 'gemini', systemInstruction);
            this.logger.log(`[GEN_VAR] Raw response from service: ${responseStr}`);

            if (!responseStr) return [baseMessage];

            // 1. If it's a known error/warning prefix (Deprecated check, keeping just in case)
            if (responseStr.startsWith('[ERRO')) {
                this.logger.warn(`[GEN_VAR] Received error string from AI: ${responseStr}. Falling back to original.`);
                return [baseMessage];
            }

            // 2. Try to extract JSON from the response
            let cleaned = responseStr.trim();
            // Remove markdown code blocks if present
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

            const jsonMatch = cleaned.match(/\[.*\]/s);
            if (jsonMatch) {
                cleaned = jsonMatch[0];
            }

            try {
                const parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed)) {
                    return parsed.map(v => String(v).trim());
                }
            } catch (pErr) {
                this.logger.warn(`[GEN_VAR] Failed to parse as JSON array: ${cleaned}`);
            }

            // 3. Fallback: return it as single item if not JSON
            return [responseStr];
        } catch (error) {
            this.logger.error(`[GEN_VAR_CRITICAL] ${error.message}`);
            return [baseMessage]; // Fallback to original message instead of sending error to user
        }
    }

    // For /api/ai/prompts used in frontend
    async generatePrompts(tenantId: string, topic: string, count: number = 3): Promise<string[]> {
        return this.generateVariations(tenantId, topic, "Gere prompts de sistema para IA agir como um atendente.", count);
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
