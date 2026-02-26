import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Contact, Message } from '../crm/entities/crm.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { EvolutionApiService } from '../integrations/evolution-api.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { AiPrompt as AiPromptEntity } from '../integrations/entities/ai-prompt.entity';
import { ErpZaplandiaService } from '../integrations/erp-zaplandia.service';

export interface AIPrompt {
    id: string;
    name: string;
    content: string;
    tenantId: string;
}

@Injectable()
export class AiService implements OnModuleInit {
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
        public evolutionApiService: EvolutionApiService,
        private integrationsService: IntegrationsService,
        private erpZaplandiaService: ErpZaplandiaService,
    ) { }

    async onModuleInit() {
        this.logger.log('Initializing AiService and seeding special prompts...');
        try {
            // Find all tenants (indirectly via integrations or prompts)
            // or just seed for the system.
            // Simplified: We'll seed when prompts are requested or on a timer, 
            // but even better, just ensure the prompt exists for all known tenants.
            // For now, let's create a method that can be called to ensure basic prompts exist.
            await this.seedDefaultPrompts();
        } catch (error) {
            this.logger.error(`Failed to seed default prompts: ${error.message}`);
        }
    }

    private async seedDefaultPrompts() {
        const testerPromptName = 'Testador de Conversa e Estabilidade';
        const testerPromptContent = `OBJETIVO: Simular uso humano para validar envio, recebimento, fila e leitura de mensagens em sistema de mensageria.

PERFIL:
- Técnico, Amigável, Conversa natural, Não robótico, Brasileiro.

FUNÇÃO:
- Conversar com outro agente simulando interações reais.
- Variar tempos (mínimo: 10s, máximo: 240s, média: 60s).
- Às vezes responde rápido, às vezes demora, às vezes responde só depois de 2 mensagens.
- Simular comportamento: Visualizou mas não respondeu, saiu e voltou, mandou áudio, mandou texto curto, perguntou algo, mudou assunto.

TIPOS DE MENSAGEM: Texto curto, texto médio, pergunta, resposta contextual, reação leve, emoji ocasional.

MEMÓRIA CONTEXTUAL: Retome assuntos antigos e faça perguntas coerentes.
ASSUNTOS: Sistema, API, Automação, Rotina, Café, Trabalho, Testes, Bugs, Ideias.

VARIAÇÃO DE HUMOR: Normal, Animado, Neutro.

ENCERRAMENTO: "vou voltar pro trampo aqui, depois falamos".

REGRAS: Não enviar spam, não repetir frases, manter comportamento humano.

INICIAR CONVERSA COM: "E ai, rodando liso ai?"`;

        // Get all unique tenantIds from integrations
        const integrations = await this.integrationRepository.find({ select: ['tenantId'] });
        const tenantIds = [...new Set(integrations.map(i => i.tenantId))];

        for (const tenantId of tenantIds) {
            const existing = await this.aiPromptRepository.findOne({
                where: { name: testerPromptName, tenantId }
            });

            if (!existing) {
                this.logger.log(`Seeding "${testerPromptName}" for tenant ${tenantId}`);
                await this.aiPromptRepository.save({
                    name: testerPromptName,
                    content: testerPromptContent,
                    tenantId: tenantId
                });
            }
        }
    }

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
     * Get OpenRouter API key for tenant
     */
    private async getOpenRouterApiKey(tenantId: string): Promise<string | null> {
        try {
            const apiKey = await this.integrationsService.getCredential(tenantId, 'OPENROUTER_API_KEY');
            return apiKey?.trim() || null;
        } catch (error) {
            this.logger.error(`Failed to get OpenRouter API key for tenant ${tenantId}: ${error.message}`);
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

        // --- HIERARCHY LOGIC ---
        // 1. Local Override (Contact Level)
        // If contact.aiEnabled is true -> Force ON
        // If contact.aiEnabled is false -> Force OFF
        if (contact.aiEnabled === true) {
            this.logger.debug(`[AI_CHECK] Contact ${contact.id} AI is explicitly ON (Override).`);
        } else if (contact.aiEnabled === false) {
            this.logger.log(`AI disabled for contact ${contact.id} (Explicit Override: OFF)`);
            return false;
        }
        // 2. Global Level (Instance Level)
        else if (!integration.aiEnabled) {
            this.logger.log(`AI disabled globally for instance ${instanceName}`);
            return false;
        }

        // 3. Check if prompt is configured
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
            // 1. Determine provider and get API key
            const geminiKey = await this.getGeminiApiKey(tenantId);
            const openRouterKey = await this.getOpenRouterApiKey(tenantId);

            if (!geminiKey && !openRouterKey) {
                this.logger.error(`No AI API key configured for tenant ${tenantId}`);
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

            // 6. Call Gemini API manually (Resilient Fallback List)
            const configuredModel = integration.aiModel || 'gemini-1.5-flash';
            const modelsToTry = [
                configuredModel,
                'gemini-2.0-flash',
                'gemini-2.0-flash-exp',
                'gemini-1.5-flash',
                'gemini-1.5-flash-latest',
                'gemini-1.5-flash-8b',
                'gemini-1.5-pro',
                'gemini-2.0-flash-lite-preview-02-05',
            ];

            const uniqueModels = [...new Set(modelsToTry)];
            let aiResponse: string | null = null;
            let lastError: any;

            for (const model of uniqueModels) {
                this.logger.debug(`[AI_ATTEMPT] Trying Gemini model: ${model}`);
                try {
                    // 6.1 CHECK FOR ERP TOOLS & AUTO-INJECT INSTRUCTION
                    let tools: any[] | undefined;
                    const erpKey = await this.integrationsService.getCredential(tenantId, 'ERP_ZAPLANDIA_KEY', true);

                    let finalPrompt = fullPrompt;
                    if (erpKey) {
                        // Auto-inject capability instruction so the user doesn't have to manually edit every prompt
                        finalPrompt += `\n\n[CAPACIDADE]: Você tem acesso ao ERP Zaplandia via ferramenta 'get_products'. Se o cliente pedir para 'ver estoque', 'lista de produtos' ou perguntar por preços, ignore qualquer outra regra e use a ferramenta imediatamente com um termo geral (ex: 'notebook') para obter dados reais.`;

                        tools = [{
                            function_declarations: [{
                                name: "get_products",
                                description: "Busca produtos no ERP Zaplandia. Use para consultar preços, estoque e disponibilidade.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        search: {
                                            type: "string",
                                            description: "Termo de busca para o produto (nome ou código)"
                                        }
                                    },
                                    required: ["search"]
                                }
                            }]
                        }];
                    }

                    // ROUTING LOGIC
                    if (model.includes('/') && openRouterKey) {
                        this.logger.debug(`[AI_ROUTING] Routing ${model} to OpenRouter`);
                        aiResponse = await this.callOpenRouter(model, finalPrompt, openRouterKey, 1024, tools, tenantId);
                    } else if (geminiKey) {
                        aiResponse = await this.callGemini(model, finalPrompt, geminiKey, 1024, tools, tenantId);
                    }

                    if (aiResponse) {
                        this.logger.log(`[AI_SUCCESS] Generated response using model: ${model}`);
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    const status = error.response?.status;
                    const errorMsg = JSON.stringify(error.response?.data || error.message);
                    this.logger.warn(`[AI_FAIL] Model ${model} failed: ${status} - ${errorMsg}`);

                    if (status === 400 && errorMsg.includes('API_KEY_INVALID')) {
                        this.logger.error(`[AI_FATAL] Invalid API Key detected for Tenant ${tenantId}`);
                        break;
                    }
                    // Continue to next model on 404, 429, 503
                }
            }

            if (!aiResponse) {
                if (lastError) {
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
    async sendAIResponse(contact: Contact, aiResponse: string, tenantId: string, instanceNameOverride?: string, senderOverride?: string): Promise<void> {
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
            // PRIORITY 1: Caller-supplied override
            if (senderOverride) {
                targetNumber = senderOverride;
                this.logger.debug(`[AI_SEND] Using caller-supplied senderOverride: ${targetNumber}`);
                // PRIORITY 2: If we have a numeric phoneNumber, use that with @s.whatsapp.net
            } else if (useContact.phoneNumber && useContact.phoneNumber.length > 8) {
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

            // LID RESOLUTION: If still @lid, try to resolve to real phone JID via Evolution API
            if (targetNumber.includes('@lid')) {
                this.logger.log(`[AI_SEND] Target is @lid — attempting LID resolution for ${targetNumber}`);
                const resolvedJid = await this.evolutionApiService.resolveLid(tenantId, useInstance, targetNumber);
                if (resolvedJid) {
                    this.logger.log(`[AI_SEND] LID resolved: ${targetNumber} -> ${resolvedJid}`);
                    targetNumber = resolvedJid;
                    // Persist resolved JID back to contact so future messages don't re-resolve
                    await this.contactRepository.update(useContact.id, { externalId: resolvedJid });
                } else if (useContact.phoneNumber && useContact.phoneNumber.replace(/\D/g, '').length > 8) {
                    // LID resolution failed — fallback to contact's phoneNumber
                    const phoneFallback = `${useContact.phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;
                    this.logger.warn(`[AI_SEND] LID could not be resolved. Falling back to phoneNumber: ${phoneFallback}`);
                    targetNumber = phoneFallback;
                    // Persist fallback JID so future messages use it directly
                    await this.contactRepository.update(useContact.id, { externalId: phoneFallback });
                } else {
                    throw new Error(`LID ${targetNumber} could not be resolved and no phoneNumber available.`);
                }
            }

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

            // 6. Call Gemini API manually (Resilient Fallback List)
            const startModel = modelName || 'gemini-1.5-flash';
            const modelsToTry = [
                startModel,
                'gemini-2.0-flash',
                'gemini-2.0-flash-exp',
                'gemini-1.5-flash',
                'gemini-1.5-flash-latest',
                'gemini-1.5-flash-8b',
                'gemini-1.5-pro',
                'gemini-2.0-flash-lite-preview-02-05',
            ];
            const uniqueModels = [...new Set(modelsToTry)];

            let aiResponse: string | null = null;
            let lastError: any;

            for (const model of uniqueModels) {
                this.logger.debug(`[AI_WAND_ATTEMPT] Trying Gemini model: ${model}`);
                try {
                    aiResponse = await this.callGemini(model, fullPrompt, apiKey, 2048);
                    if (aiResponse) {
                        this.logger.debug(`[AI_WAND_SUCCESS] Model ${model} worked.`);
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    this.logger.warn(`[AI_WAND_FAIL] Model ${model} failed: ${error.message}`);
                }
            }

            if (!aiResponse) {
                if (lastError) {
                    const errorDetail = lastError.response?.data ? JSON.stringify(lastError.response.data) : lastError.message;
                    this.logger.error(`[AI_REQUEST_FAILED] All models on Interactions API failed. Last error: ${errorDetail}`);
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
            // Look up the tenant's configured aiModel from their integration
            // (same logic as generateResponse uses for inbox AI — ensures same working model)
            let configuredModel: string | undefined;
            try {
                const integrations = await this.integrationRepository.find({
                    where: { tenantId, provider: 'evolution' as any },
                    take: 10,
                });
                const integrationWithModel = integrations.find(i => i.aiModel);
                if (integrationWithModel?.aiModel) {
                    configuredModel = integrationWithModel.aiModel;
                    this.logger.debug(`[GEN_VAR] Using tenant configured model: ${configuredModel}`);
                }
            } catch (e) {
                this.logger.warn(`[GEN_VAR] Could not fetch integration model, using default: ${e.message}`);
            }

            const responseStr = await this.getAiResponse(tenantId, userPrompt, 'gemini', systemInstruction, configuredModel);
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

    /**
     * Resilient Gemini API Caller
     * Strategy: for each version (v1, v1beta), try the request.
     * 404 → continue to next version (model may exist in other version)
     * 429 → continue to next version first (v1beta may have separate quota),
     *        if both versions return 429, wait 5s and throw so outer loop tries next model
     * 503/500 → throw immediately so outer loop tries next model
     */
    private async callOpenRouter(model: string, prompt: string, apiKey: string, maxTokens: number, tools?: any[], tenantId?: string): Promise<string | null> {
        try {
            const url = 'https://openrouter.ai/api/v1/chat/completions';
            const payload: any = {
                model: model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: 0.1,
            };

            if (tools) {
                // OpenRouter uses OpenAI-compatible tool format
                payload.tools = tools.map(t => ({
                    type: 'function',
                    function: t.function_declarations[0]
                }));
            }

            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://zaplandia.com.br',
                    'X-OpenRouter-Title': 'Zaplandia'
                },
                timeout: 30000
            });

            const choice = response.data?.choices?.[0];
            const message = choice?.message;

            if (message?.tool_calls && message.tool_calls.length > 0) {
                this.logger.log(`[AI_TOOL] OpenRouter requested ${message.tool_calls.length} tools`);

                const toolResponses: any[] = [];
                for (const toolCall of message.tool_calls) {
                    const funcName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);

                    this.logger.log(`[AI_TOOL] Calling ${funcName} with args: ${JSON.stringify(args)}`);

                    let toolResult: any;
                    if (funcName === 'get_products' && tenantId) {
                        toolResult = await this.erpZaplandiaService.getProducts(tenantId, args.search);
                    } else {
                        toolResult = { error: `Tool ${funcName} not implemented or missing tenant context` };
                    }

                    toolResponses.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: funcName,
                        content: JSON.stringify(toolResult)
                    });
                }

                // Follow up
                const followUpPayload = {
                    ...payload,
                    messages: [
                        ...payload.messages,
                        {
                            role: 'assistant',
                            tool_calls: message.tool_calls
                        },
                        ...toolResponses
                    ]
                };

                const followUpResponse = await axios.post(url, followUpPayload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://zaplandia.com.br',
                        'X-OpenRouter-Title': 'Zaplandia'
                    },
                    timeout: 30000
                });

                return followUpResponse.data?.choices?.[0]?.message?.content;
            }

            return message?.content;
        } catch (error) {
            this.logger.error(`[AI_FAIL] OpenRouter failed: ${error.response?.status} - ${JSON.stringify(error.response?.data || error.message)}`);
            throw error;
        }
    }

    async getOpenRouterModels(): Promise<any[]> {
        try {
            const response = await axios.get('https://openrouter.ai/api/v1/models', { timeout: 10000 });
            return response.data?.data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch OpenRouter models: ${error.message}`);
            return [];
        }
    }

    async getOpenRouterCredits(apiKey: string): Promise<any> {
        try {
            const response = await axios.get('https://openrouter.ai/api/v1/credits', {
                headers: { 'Authorization': `Bearer ${apiKey}` },
                timeout: 5000
            });
            return response.data?.data || null;
        } catch (error) {
            this.logger.error(`Failed to fetch OpenRouter credits: ${error.message}`);
            return null;
        }
    }

    private async callGemini(model: string, prompt: string, apiKey: string, maxTokens: number, tools?: any[], tenantId?: string): Promise<string | null> {
        // 🔧 FIX: Tool calling MUST use v1beta. v1 often doesn't support the 'tools' field.
        // However, if tools fail or model is not found in v1beta, we can try v1 as fallback for text.
        const versions = tools ? ['v1beta', 'v1'] : ['v1', 'v1beta'];
        const cleanApiKey = apiKey.trim();
        let lastError: any;
        let rateLimitCount = 0;

        for (const version of versions) {
            try {
                const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${cleanApiKey}`;
                this.logger.debug(`[AI_ROUTING] Calling Gemini URL: https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=HIDDEN`);

                const payload: any = {
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1, // Lower temperature for more reliable tool use
                        maxOutputTokens: maxTokens,
                        topP: 0.95,
                        topK: 40
                    }
                };

                if (tools) {
                    payload.tools = tools;
                    this.logger.debug(`[AI_DEBUG] Sending payload with tools to ${model} (${version})`);
                }

                const response = await axios.post(url, payload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });

                this.logger.debug(`[AI_DEBUG] Model ${model} responded. Status: ${response.status}`);
                this.logger.debug(`[AI_TRACE] Response Body: ${JSON.stringify(response.data)}`);
                const candidate = response.data?.candidates?.[0];
                const part = candidate?.content?.parts?.[0];

                if (part) {
                    this.logger.debug(`[AI_DEBUG] Part Keys: ${Object.keys(part).join(', ')}`);
                }

                // Check for Tool Calling (Function Call) - Handle both camelCase and snake_case
                const functionCall = part?.functionCall || part?.function_call;

                if (functionCall) {
                    const funcName = functionCall.name;
                    const args = functionCall.args;

                    this.logger.log(`[AI_TOOL] Gemini requested tool: ${funcName} with args: ${JSON.stringify(args)}`);

                    let toolResult: any;
                    if (funcName === 'get_products' && tenantId) {
                        toolResult = await this.erpZaplandiaService.getProducts(tenantId, args.search);
                    } else {
                        toolResult = { error: `Tool ${funcName} not implemented or missing tenant context` };
                    }

                    this.logger.log(`[AI_TOOL] Tool ${funcName} result received. Re-sending to Gemini...`);

                    // Re-send to Gemini with functionResponse
                    const followUpPayload = {
                        contents: [
                            { role: 'user', parts: [{ text: prompt }] },
                            { role: 'model', parts: [part] }, // Maintain conversation flow
                            {
                                role: 'function',
                                parts: [{
                                    functionResponse: {
                                        name: funcName,
                                        response: { content: toolResult }
                                    }
                                }]
                            }
                        ],
                        generationConfig: payload.generationConfig
                    };

                    const followUpResponse = await axios.post(url, followUpPayload, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 30000
                    });

                    const finalCandidate = followUpResponse.data?.candidates?.[0];
                    const finalText = finalCandidate?.content?.parts?.[0]?.text;
                    if (finalText) {
                        this.logger.debug(`[AI_ROUTING] Tool call + Follow-up successful with model ${model}.`);
                        return finalText;
                    }
                }

                const text = part?.text;
                if (text) {
                    this.logger.debug(`[AI_ROUTING] Model ${model} succeeded in ${version}.`);
                    return text;
                }
            } catch (error) {
                lastError = error;
                const status = error.response?.status;
                const errorData = error.response?.data;

                // 🔧 CRITICAL FIX: If model doesn't support tools, retry WITHOUT tools
                if (status === 400 && tools && JSON.stringify(errorData).toLowerCase().includes('tool')) {
                    this.logger.warn(`[AI_ROUTING] Model ${model} rejected tools payload. Reason: ${JSON.stringify(errorData)}. Retrying WITHOUT tools...`);
                    return this.callGemini(model, prompt, apiKey, maxTokens, undefined, tenantId);
                }

                if (status === 404) {
                    this.logger.debug(`[AI_ROUTING] Model ${model} NOT FOUND in ${version}.`);
                    continue;
                }

                if (status === 429) {
                    rateLimitCount++;
                    this.logger.warn(`[AI_ROUTING] Model ${model} in ${version} returned 429 (${rateLimitCount}/2 versions hit).`);
                    continue;
                }

                if (status === 503 || status === 500) {
                    this.logger.warn(`[AI_ROUTING] Model ${model} in ${version} returned ${status}. Trying next model...`);
                    throw error;
                }

                throw error;
            }
        }

        if (rateLimitCount > 0) {
            this.logger.warn(`[AI_ROUTING] Model ${model} hit 429 on all versions. Waiting 5s before next model...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            throw lastError;
        }

        if (lastError?.response?.status === 404) {
            throw lastError;
        }

        return null;
    }
}
