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
     * Get all AI prompts for a tenant
     */
    async findAll(tenantId: string): Promise<AiPromptEntity[]> {
        return this.aiPromptRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Get Gemini API key for tenant from integrations
     */
    private async getGeminiApiKey(tenantId: string): Promise<string | null> {
        try {
            const apiKey = await this.integrationsService.getCredential(tenantId, 'GEMINI_API_KEY');
            if (apiKey) {
                // AGGRESSIVE SANITIZATION: Remove quotes, newlines, and surrounding whitespace
                const cleanedKey = apiKey.replace(/["'\n\r]/g, '').trim();

                // DEBUG: Log character codes to find hidden chars (redacted for security)
                if (cleanedKey) {
                    const charCodes = cleanedKey.split('').map(c => c.charCodeAt(0)).join(',');
                    this.logger.debug(`[GEMINI_KEY_DEBUG] Key Len: ${cleanedKey.length}, Chars: [${charCodes.substring(0, 20)}...]`);
                    return cleanedKey;
                }
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

            const fullPrompt = `${promptContent}\n\nHistórico da Conversa:\n${conversationContext}\n\nCliente: ${userMessage}\nVocê:`;

            // 6. Call Gemini API manually with ROBUST Fallback Logic
            const configuredModel = integration.aiModel || 'gemini-1.5-flash';
            // Determine the list of models to try. Start with the configured one.
            // If configured is 'gemini-1.5-flash', we might still want to try others if it fails.
            const modelsToTry = [
                configuredModel,
                'gemini-1.5-flash',
                'gemini-1.5-flash-001',
                'gemini-1.5-flash-002',
                'gemini-1.5-pro',
                'gemini-1.0-pro'
            ];

            // Remove duplicates
            const uniqueModels = [...new Set(modelsToTry)];

            const cleanApiKey = apiKey.trim();
            let aiResponse: string | null = null;
            let lastError: any;

            // Iterate models
            for (const model of uniqueModels) {
                this.logger.debug(`[AI_ATTEMPT] Trying model: ${model}`);
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanApiKey}`;

                    const response = await axios.post(url, {
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

                    aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (aiResponse) {
                        this.logger.log(`[AI_SUCCESS] Generated response with model: ${model}`);
                        break; // Success! exit loop
                    }
                } catch (error) {
                    lastError = error;
                    const status = error.response?.status;
                    const errorMsg = error.response?.data?.error?.message || error.message;

                    this.logger.warn(`[AI_FAIL] Model ${model} failed: ${status} - ${errorMsg}`);

                    // If it's a 404/400 (Model not found/Bad Request), continue to next model immediately
                    if (status === 404 || status === 400) {
                        continue;
                    }

                    // If it's a 429/503 (Overload), we might want to wait a bit before trying the *next* model or retrying the *same* model.
                    // For simplicity in this robust fallback, we just move to the next model which might be on a different cleared quota or shard?
                    // Actually, let's just continue to next model.
                }
            }

            if (!aiResponse) {
                if (lastError) {
                    // If all failed, throw the last error or log it
                    this.logger.error(`[AI_FATAL] All models failed. Last error: ${lastError.message}`);
                }
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

            const systemInstruction = context || "Você é o assistente da Zaplandia.";
            const fullPrompt = `${systemInstruction}\n\n${prompt}`;

            // 6. Call Gemini API manually with ROBUST Fallback Logic
            const startModel = modelName || 'gemini-1.5-flash';
            const modelsToTry = [
                startModel,
                'gemini-1.5-flash',
                'gemini-1.5-flash-001',
                'gemini-1.5-flash-002',
                'gemini-1.5-pro',
                'gemini-1.0-pro'
            ];
            const uniqueModels = [...new Set(modelsToTry)];

            let aiResponse: string | null = null;
            let lastError: any;

            const cleanApiKey = apiKey.trim();

            // Iterate models
            for (const model of uniqueModels) {
                // this.logger.debug(`[AI_WAND_ATTEMPT] Trying model: ${model}`);
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanApiKey}`;

                    const response = await axios.post(url, {
                        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 2048,
                        }
                    }, { timeout: 30000 });

                    aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (aiResponse) {
                        // this.logger.log(`[AI_WAND_SUCCESS] Generated response with model: ${model}`);
                        break; // Success! exit loop
                    }
                } catch (error) {
                    lastError = error;
                    const status = error.response?.status;

                    // If it's a 404/400 (Model not found/Bad Request), continue to next model immediately
                    if (status === 404 || status === 400) {
                        continue;
                    }

                    // Just continue for now on other errors/overloads to try other models or fail
                }
            }

            if (!aiResponse) {
                if (lastError) {
                    const errorDetail = lastError.response?.data ? JSON.stringify(lastError.response.data) : lastError.message;
                    this.logger.error(`[AI_REQUEST_FAILED] All models failed. Last error: ${errorDetail}`);
                }
                return null;
            }

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

    // --- MANUAL PROMPT MANAGEMENT (CRUD) ---

    async createPrompt(tenantId: string, name: string, content: string): Promise<AiPromptEntity> {
        const newPrompt = this.aiPromptRepository.create({
            tenantId,
            name,
            content
        });
        return this.aiPromptRepository.save(newPrompt);
    }

    async updatePrompt(tenantId: string, id: string, data: { name?: string; content?: string }): Promise<AiPromptEntity> {
        const prompt = await this.aiPromptRepository.findOne({ where: { id, tenantId } });
        if (!prompt) {
            throw new Error('Prompt not found');
        }
        if (data.name) prompt.name = data.name;
        if (data.content) prompt.content = data.content;
        return this.aiPromptRepository.save(prompt);
    }

    async deletePrompt(tenantId: string, id: string): Promise<void> {
        const result = await this.aiPromptRepository.delete({ id, tenantId });
        if (result.affected === 0) {
            throw new Error('Prompt not found or access denied');
        }
    }
}
