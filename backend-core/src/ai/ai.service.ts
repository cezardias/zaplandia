import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import axios from 'axios';
import { Contact, Message } from '../crm/entities/crm.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { EvolutionApiService } from '../integrations/evolution-api.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { AiPrompt as AiPromptEntity } from '../integrations/entities/ai-prompt.entity';
import { SupportService } from '../support/support.service';
import { CrmService } from '../crm/crm.service';
import { forwardRef, Inject } from '@nestjs/common';
import { ErpZaplandiaService } from '../integrations/erp-zaplandia.service';
import { RifaApiService } from '../integrations/rifa-api.service';
import { MetaApiService } from '../integrations/meta-api.service';
import { CommsService } from '../comms/comms.service';

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
        private rifaApiService: RifaApiService,
        private metaApiService: MetaApiService,
        private communicationService: CommsService,
        private supportService: SupportService,
        @Inject(forwardRef(() => CrmService))
        private crmService: CrmService,
    ) { }

    private debounceMap = new Map<string, { timeout: any, messages: string[], instanceName: string, tenantId: string }>();

    async onModuleInit() {
        this.logger.log('Initializing AiService and seeding special prompts...');
        try {
            await this.fixAiPromptsTable();
            await this.seedDefaultPrompts();
        } catch (error) {
            this.logger.error(`Failed to seed default prompts: ${error.message}`);
        }
    }

    private async fixAiPromptsTable() {
        try {
            const queryRunner = this.integrationRepository.manager.connection.createQueryRunner();
            await queryRunner.connect();
            this.logger.log('[DB_REPAIR] Checking ai_prompts table columns...');
            
            await queryRunner.query(`ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS "provider" VARCHAR;`);
            await queryRunner.query(`ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS "model" VARCHAR;`);
            await queryRunner.query(`ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS "apiKey" VARCHAR;`);
            
            await queryRunner.release();
            this.logger.log('[DB_REPAIR] ai_prompts table columns verified/added.');
        } catch (error) {
            this.logger.error(`[DB_REPAIR] Failed to update ai_prompts table: ${error.message}`);
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

    async findAll(tenantId: string): Promise<AiPromptEntity[]> {
        return this.aiPromptRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' }
        });
    }

    private async getGeminiApiKey(tenantId: string): Promise<string | null> {
        try {
            const apiKey = await this.integrationsService.getCredential(tenantId, 'GEMINI_API_KEY');
            if (apiKey) {
                const cleanedKey = apiKey.replace(/["'\n\r]/g, '').trim();
                if (cleanedKey) return cleanedKey;
            }

            const envKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
            if (envKey) {
                this.logger.log(`[AI] Using global GEMINI_API_KEY fallback from environment`);
                return envKey.trim();
            }

            return null;
        } catch (error) {
            this.logger.error(`Failed to get Gemini API key for tenant ${tenantId}: ${error.message}`);
            return null;
        }
    }

    private async getOpenRouterApiKey(tenantId: string): Promise<string | null> {
        try {
            const apiKey = await this.integrationsService.getCredential(tenantId, 'OPENROUTER_API_KEY');
            if (apiKey?.trim()) return apiKey.trim();

            if (process.env.OPENROUTER_API_KEY) {
                this.logger.log(`[AI] Using global OPENROUTER_API_KEY fallback from environment`);
                return process.env.OPENROUTER_API_KEY.trim();
            }

            return null;
        } catch (error) {
            this.logger.error(`Failed to get OpenRouter API key for tenant ${tenantId}: ${error.message}`);
            return null;
        }
    }

    async shouldRespond(contact: Contact, instanceName: string, tenantId: string): Promise<boolean> {
        const integrations = await this.integrationRepository.find({
            where: {
                tenantId,
            },
            order: { updatedAt: 'DESC' }
        });

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
            const metaPhoneId = await this.integrationsService.getCredential(tenantId, 'META_PHONE_NUMBER_ID', true);
            if (metaPhoneId && (metaPhoneId === instanceName || instanceName === 'MetaOfficial')) {
                this.logger.log(`[META_WA] Manual integration recognized for instance ${instanceName}`);
                const globalAiPromptId = await this.integrationsService.getCredential(tenantId, 'AI_PROMPT_ID', true);
                if (globalAiPromptId && contact.aiEnabled !== false) {
                    return true;
                }
                const prompts = await this.aiPromptRepository.find({ where: { tenantId } });
                if (prompts.length > 0 && contact.aiEnabled !== false) {
                    return true;
                }
            }
            this.logger.warn(`No integration found for instance ${instanceName} to handle auto-response`);
            return false;
        }

        if (contact.aiEnabled === false) {
            this.logger.log(`AI disabled specifically for contact ${contact.id}`);
            return false;
        }

        if (!integration.aiEnabled) {
            this.logger.log(`AI disabled globally for instance ${instanceName}`);
            return false;
        }

        if (!integration.aiPromptId) {
            this.logger.warn(`No AI prompt configured for instance ${instanceName}`);
            return false;
        }

        return true;
    }

    async generateGenericResponse(tenantId: string, prompt: string): Promise<string | null> {
        try {
            const geminiKey = await this.getGeminiApiKey(tenantId);
            if (!geminiKey) {
                this.logger.error(`No Gemini API key for tenant ${tenantId}`);
                return null;
            }
            return this.callGemini('gemini-1.5-flash', prompt, geminiKey, 2048, undefined, tenantId);
        } catch (error) {
            this.logger.error(`Error in generateGenericResponse: ${error.message}`);
            return null;
        }
    }

    async generateResponse(contact: Contact, userMessage: string, tenantId: string, instanceName?: string): Promise<string | null> {
        this.logger.log(`[AI_WAIT] Message from ${contact.name} (${contact.id}). Waiting 10s for more...`);
        
        const existing = this.debounceMap.get(contact.id);
        if (existing) {
            clearTimeout(existing.timeout);
            existing.messages.push(userMessage);
            existing.timeout = setTimeout(() => this.processDebouncedResponse(contact.id), 10000);
            return null;
        }

        const timeout = setTimeout(() => this.processDebouncedResponse(contact.id), 10000);
        this.debounceMap.set(contact.id, {
            timeout,
            messages: [userMessage],
            instanceName: instanceName || contact.instance || 'default',
            tenantId
        });

        return null;
    }

    private async processDebouncedResponse(contactId: string) {
        const data = this.debounceMap.get(contactId);
        if (!data) return;
        this.debounceMap.delete(contactId);

        const contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId: data.tenantId } });
        if (!contact) return;

        const combinedMessage = data.messages.join(' ');
        this.logger.log(`[AI_DEBOUNCE] Processing combined message for ${contact.name}: "${combinedMessage}"`);

        try {
            const response = await this.executeAIGeneration(contact, combinedMessage, data.tenantId, data.instanceName);
            if (response) {
                this.logger.log(`[AI_DEBOUNCE] Generation successful. Sending via CrmService...`);
                await this.crmService.sendMessage(data.tenantId, contact.id, response);
            }
        } catch (error) {
            this.logger.error(`[AI_DEBOUNCE_ERROR] Failed to process debounced response: ${error.message}`);
        }
    }

    private async executeAIGeneration(contact: Contact, userMessage: string, tenantId: string, instanceName?: string): Promise<string | null> {
        try {
            let geminiKey: string | null = null;
            let openRouterKey: string | null = null;

            const targetInstance = instanceName || contact.instance;

            // 1. Find Lisa prompt first (priority)
            const promptEntity = await this.aiPromptRepository.findOne({ 
                where: { name: 'ZAPLANDIA_HELP_CENTER_LISA', tenantId } 
            }) || await this.aiPromptRepository.findOne({ 
                where: { name: 'ZAPLANDIA_HELP_CENTER_LISA' } 
            });

            const integrations = await this.integrationRepository.find({
                where: {
                    tenantId,
                    provider: In(['evolution', 'whatsapp', 'instagram']),
                },
                order: { updatedAt: 'DESC' }
            });

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

            const activePromptId = promptEntity?.id || integration?.aiPromptId;
            const configuredModel = integration?.aiModel || promptEntity?.model || 'gemini-1.5-flash';

            if (!activePromptId) {
                this.logger.error(`No AI prompt configured and no Lisa prompt found.`);
                return null;
            }

            let promptContent = await this.getPromptContent(activePromptId, tenantId);
            if (!promptContent) {
                this.logger.error(`Prompt content not found or empty for ID: ${activePromptId}`);
                return null;
            }

            const pushName = contact.name || 'Cliente';
            promptContent = promptContent.replace(/\{\{\s*\$\(?'Webhook'\)?\.item\.json\.body\.data\.pushName\s*\}\}/g, pushName);
            promptContent = promptContent.replace(/\{\{\s*pushName\s*\}\}/g, pushName);
            promptContent = promptContent.replace(/\{\{\s*nome\s*\}\}/g, pushName);

            const rawHistory = await this.messageRepository.find({
                where: { contactId: contact.id },
                order: { createdAt: 'DESC' },
                take: 15
            });

            const resetMarkerIndex = rawHistory.findIndex(m => m.content.includes('[CONTROLE_SISTEMA]'));
            let history = rawHistory;
            if (resetMarkerIndex !== -1) {
                this.logger.log(`[AI_MEMORY] Reset marker found at index ${resetMarkerIndex}. Clearing previous context.`);
                history = rawHistory.slice(0, resetMarkerIndex);
            } else {
                history = rawHistory.slice(0, 10);
            }

            const conversationContext = history
                .reverse()
                .map(m => `${m.direction === 'inbound' ? 'Cliente' : 'Você'}: ${m.content}`)
                .join('\n');

            const isFreshStart = history.length === 0;
            const finalReminder = `\n\n[SISTEMA - PRIORIDADE ALTA]:
1. Se o cliente informou Nome, Email e Telefone, você DEVE usar a ferramenta 'open_ticket' AGORA.
2. Se o cliente quer falar com humano ou ajuda complexa, você DEVE usar 'transfer_to_team' AGORA.
3. É PROIBIDO dizer que agiu sem disparar a ferramenta técnica correspondente.`;

            const fullPrompt = `${promptContent}\n\n${isFreshStart ? '[NOVA CONVERSA]: Inicie o contato.' : 'Histórico:'}\n${conversationContext}\n\nCliente: ${userMessage}${finalReminder}\nVocê:`;

            // Use the already defined configuredModel
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

            const isLisa = promptEntity?.id === activePromptId || promptEntity?.name === 'ZAPLANDIA_HELP_CENTER_LISA';

            for (const model of uniqueModels) {
                this.logger.debug(`[AI_ATTEMPT] Trying Gemini model: ${model}`);
                try {
                    let tools: any[] | undefined;
                    let erpKey = await this.integrationsService.getCredential(tenantId, 'ERP_ZAPLANDIA_KEY', true);
                    let rifaKey = await this.integrationsService.getCredential(tenantId, 'RIFA_API_KEY', true);
                    let geminiKey = await this.integrationsService.getCredential(tenantId, 'GEMINI_API_KEY', true);
                    let openRouterKey = await this.integrationsService.getCredential(tenantId, 'OPENROUTER_API_KEY', true);

                    // If it's Lisa, override keys if she has specific ones
                    if (isLisa && promptEntity?.apiKey) {
                        if (promptEntity.provider === 'gemini' || !promptEntity.provider) {
                            geminiKey = promptEntity.apiKey;
                            this.logger.log(`[LISA_ROUTING] Using specialized Gemini key from Prompt config.`);
                        } else if (promptEntity.provider === 'openrouter') {
                            openRouterKey = promptEntity.apiKey;
                            this.logger.log(`[LISA_ROUTING] Using specialized OpenRouter key from Prompt config.`);
                        }
                    }

                    if (!geminiKey && !openRouterKey) {
                        this.logger.warn(`[AI_ROUTING] No API keys found. Final check for global keys...`);
                        geminiKey = await this.getGeminiApiKey(tenantId);
                        openRouterKey = await this.getOpenRouterApiKey(tenantId);
                    }

                    if (!geminiKey && !openRouterKey) {
                        this.logger.error(`[AI_FATAL] No AI API key configured for tenant ${tenantId}`);
                        return null;
                    }
                    
                    let finalPrompt = fullPrompt;
                    const declarations: any[] = [
                        {
                            name: "transfer_to_team",
                            description: "Transfere o atendimento para uma equipe humana. Use IMEDIATAMENTE quando identificar o departamento ou o cliente pedir.",
                            parameters: {
                                type: "object",
                                properties: {
                                    teamId: { 
                                        type: "string", 
                                        description: "O ID da equipe (UUID) ou o NOME da equipe (ex: 'Comercial', 'Suporte', 'Financeiro')" 
                                    },
                                    reason: { type: "string", description: "Motivo da transferência" }
                                },
                                required: ["teamId"]
                            }
                        },
                        {
                            name: "open_ticket",
                            description: "GERAR CHAMADO TÉCNICO. Use este comando IMEDIATAMENTE após coletar Nome, Email e Telefone. É proibido dizer que o chamado foi aberto sem usar esta ferramenta.",
                            parameters: {
                                type: "object",
                                properties: {
                                    subject: { type: "string", description: "Assunto curto (ex: Ajuda com Automação)" },
                                    description: { type: "string", description: "Resumo do pedido do cliente" },
                                    category: { type: "string", description: "technical" },
                                    priority: { type: "string", description: "medium" }
                                },
                                required: ["subject", "description"]
                            }
                        }
                    ];

                    if (erpKey) {
                        declarations.push({
                            name: "get_products",
                            description: "Busca produtos no ERP.",
                            parameters: {
                                type: "object",
                                properties: { search: { type: "string" } },
                                required: ["search"]
                            }
                        });
                    }

                    if (rifaKey) {
                        declarations.push(
                            { name: "get_raffles", description: "Lista rifas.", parameters: { type: "object", properties: {} } },
                            {
                                name: "get_tickets",
                                description: "Números de rifa.",
                                parameters: { type: "object", properties: { raffleId: { type: "string" } }, required: ["raffleId"] }
                            },
                            {
                                name: "create_raffle_order",
                                description: "Reserva números.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        raffleId: { type: "string" },
                                        customerName: { type: "string" },
                                        customerPhone: { type: "string" },
                                        numbers: { type: "array", items: { type: "string" } }
                                    },
                                    required: ["raffleId", "customerName", "customerPhone", "numbers"]
                                }
                            }
                        );
                    }

                    tools = [{ function_declarations: declarations }];

                    const systemInstruction = `Você é Lisa, assistente operacional inteligente da Zaplandia.
                    REGRAS CRÍTICAS:
                    1. NUNCA escreva comandos como texto (ex: transfer_to_team).
                    2. SE decidir agir, use a ferramenta técnica (Function Calling) SILENCIOSAMENTE.
                    3. Exemplos no prompt são apenas para lógica; a execução REAL deve ser via API de ferramentas.
                    4. Seja eficiente e evite perguntas repetitivas.
                    5. Se disser que transferiu ou abriu chamado, você DEVE ter usado a ferramenta.`;

                    if (model.includes('/') && openRouterKey) {
                        this.logger.debug(`[AI_ROUTING] Routing ${model} to OpenRouter`);
                        aiResponse = await this.callOpenRouter(model, finalPrompt, openRouterKey, 1024, tools, tenantId, contact.id, systemInstruction, promptEntity?.id);
                    } else if (geminiKey) {
                        aiResponse = await this.callGemini(model, finalPrompt, geminiKey, 1024, tools, tenantId, contact.id, systemInstruction, promptEntity?.id);
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
                }
            }

            if (!aiResponse) {
                if (lastError) {
                    this.logger.error(`[AI_FATAL] All models failed. Last error: ${lastError.message}`);
                }
                return null;
            }

            this.logger.log(`AI generated response for contact ${contact.id} using prompt ${activePromptId}`);
            return aiResponse;

        } catch (error) {
            this.logger.error(`Failed to generate AI response: ${error.response?.data?.error?.message || error.message}`);
            return null;
        }
    }

    async sendAIResponse(contact: Contact, aiResponse: string, tenantId: string, instanceNameOverride?: string, senderOverride?: string): Promise<void> {
        let targetNumber = '';
        let useContact = contact;
        let useInstance = '';

        try {
            const freshContact = await this.contactRepository.findOne({ where: { id: contact.id } });
            useContact = freshContact || contact;
            useInstance = instanceNameOverride || useContact.instance;

            if (senderOverride) {
                targetNumber = senderOverride;
                this.logger.debug(`[AI_SEND] Using caller-supplied senderOverride: ${targetNumber}`);
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

            const cleanNumber = targetNumber.replace(/:[0-9]+/, '');
            targetNumber = cleanNumber.includes('@') ? cleanNumber : `${cleanNumber.replace(/\D/g, '')}@s.whatsapp.net`;

            if (targetNumber.includes('@lid')) {
                this.logger.log(`[AI_SEND] Target is @lid — attempting LID resolution for ${targetNumber}`);
                const resolvedJid = await this.evolutionApiService.resolveLid(tenantId, useInstance, targetNumber);
                if (resolvedJid) {
                    this.logger.log(`[AI_SEND] LID resolved: ${targetNumber} -> ${resolvedJid}`);
                    targetNumber = resolvedJid;
                    await this.contactRepository.update(useContact.id, { externalId: resolvedJid });
                } else if (useContact.phoneNumber && useContact.phoneNumber.replace(/\D/g, '').length > 8) {
                    const phoneFallback = `${useContact.phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;
                    this.logger.warn(`[AI_SEND] LID could not be resolved. Falling back to phoneNumber: ${phoneFallback}`);
                    targetNumber = phoneFallback;
                    await this.contactRepository.update(useContact.id, { externalId: phoneFallback });
                } else {
                    throw new Error(`LID ${targetNumber} could not be resolved and no phoneNumber available.`);
                }
            }

            this.logger.log(`Sending AI response to ${targetNumber} via ${useInstance}`);

            const integration = await this.integrationsService.resolveInstance(tenantId, useInstance);

            if (integration?.provider === 'whatsapp' && integration.credentials?.META_ACCESS_TOKEN) {
                await this.metaApiService.sendTextMessage(tenantId, targetNumber, aiResponse);
            } else if (integration?.provider === 'instagram' || useContact.provider === 'instagram') {
                const psid = targetNumber.split('@')[0];
                await this.metaApiService.sendInstagramMessage(tenantId, psid, aiResponse);
            } else {
                await this.evolutionApiService.sendText(tenantId, useInstance, targetNumber, aiResponse);
            }

            this.logger.log(`AI response sent to ${targetNumber} via ${useInstance}`);

        } catch (error) {
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            this.logger.error(`Failed to send AI response: ${errorMsg}`);

            const isExistsFalse = errorMsg.includes('exists":false') || errorMsg.includes('not found');
            const wasLid = targetNumber && targetNumber.includes('@lid');

            if (isExistsFalse && wasLid && useContact.phoneNumber && useContact.phoneNumber.length > 8) {
                const fallbackNumber = `${useContact.phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;
                this.logger.warn(`[AI_HEAL] LID delivery failed. Trying stable phone fallback: ${fallbackNumber}`);
                try {
                    await this.evolutionApiService.sendText(tenantId, useInstance, fallbackNumber, aiResponse);
                    this.logger.log(`[AI_HEAL] Success! AI response delivered via phone fallback.`);
                    return;
                } catch (fallbackError) {
                    this.logger.error(`[AI_HEAL] Phone fallback also failed: ${fallbackError.message}`);
                }
            }

            if (error.response?.data) {
                this.logger.error(`Evolution API Error Detail: ${JSON.stringify(error.response.data)}`);
            }
        }
    }

    async getAiResponse(tenantId: string, prompt: string, provider: string, context?: string, modelName?: string) {
        try {
            const apiKey = await this.getGeminiApiKey(tenantId);

            if (!apiKey) {
                this.logger.error(`[AI_REQUEST] No API Key found for Tenant ${tenantId}.`);
                return `[ERRO] Chave de API do Gemini não configurada.`;
            }

            const systemInstruction = context || "Você é o assistente da Zaplandia.";
            const fullPrompt = `${systemInstruction}\n\n${prompt}`;

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
            return null;
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

            if (responseStr.startsWith('[ERRO')) {
                this.logger.warn(`[GEN_VAR] Received error string from AI: ${responseStr}. Falling back to original.`);
                return [baseMessage];
            }

            let cleaned = responseStr.trim();
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

            return [baseMessage];
        } catch (error) {
            this.logger.error(`[GEN_VAR_CRITICAL] ${error.message}`);
            return [baseMessage];
        }
    }

    // For /api/ai/prompts used in frontend
    async generatePrompts(tenantId: string, topic: string, count: number = 3): Promise<string[]> {
        return this.generateVariations(tenantId, topic, "Gere prompts de sistema para IA agir como um atendente.", count);
    }

    private async getPromptContent(promptId: string, tenantId: string): Promise<string | null> {
        try {
            // Try tenant-specific first
            let prompt = await this.aiPromptRepository.findOne({
                where: { id: promptId, tenantId }
            });

            // Fallback to global search by ID only
            if (!prompt) {
                prompt = await this.aiPromptRepository.findOne({
                    where: { id: promptId }
                });
            }

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
    private async callOpenRouter(model: string, prompt: string, apiKey: string, maxTokens: number, tools?: any[], tenantId?: string, contactId?: string, systemInstruction?: string, promptId?: string): Promise<string | null> {
        try {
            const url = 'https://openrouter.ai/api/v1/chat/completions';
            const messages: any[] = [];
            
            if (systemInstruction) {
                messages.push({ role: 'system', content: systemInstruction });
            }
            
            messages.push({ role: 'user', content: prompt });

            const payload: any = {
                model: model,
                messages,
                max_tokens: maxTokens,
                temperature: 0, // Force strict tool calling and logic
            };

            if (tools) {
                // OpenRouter/OpenAI tool format: flat list of function objects
                payload.tools = [];
                for (const t of tools) {
                    if (t.function_declarations) {
                        for (const fd of t.function_declarations) {
                            payload.tools.push({
                                type: 'function',
                                function: fd
                            });
                        }
                    }
                }
                this.logger.debug(`[AI_DEBUG] Sending payload with ${payload.tools.length} tools to OpenRouter (${model})`);
            }

            this.logger.debug(`[AI_TRACE] Full payload to OpenRouter: ${JSON.stringify(payload).substring(0, 1000)}...`);

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

                    // RESOLVE TARGET TENANT (Hierarchy/HQ support)
                    // RESOLVE TARGET TENANT (Hierarchy/HQ support)
                    let targetTenantId: string = tenantId || 'default';
                    let teams = await this.contactRepository.manager.query(`SELECT id, name, "tenantId" FROM teams WHERE "tenantId" = $1`, [tenantId]);
                    if (!teams || teams.length === 0) {
                        const integration = await this.integrationRepository.findOne({ where: { id: promptId } });
                        targetTenantId = integration?.tenantId || '3ac9368c-af7c-4183-9816-b90513368f53';
                        teams = await this.contactRepository.manager.query(`SELECT id, name, "tenantId" FROM teams WHERE "tenantId" = $1`, [targetTenantId]);
                    }

                    let toolResult: any;
                    if (funcName === 'transfer_to_team' && tenantId && contactId) {
                        this.logger.log(`[AI_TOOL] Transferring contact ${contactId} to team/name: ${args.teamId} for tenant ${targetTenantId}`);
                        
                        let targetTeamId = args.teamId;
                        const teamName = args.teamId?.toLowerCase();
                        
                        const foundTeam = teams.find(t => 
                            t.id === targetTeamId || 
                            (teamName && (t.name.toLowerCase().includes(teamName) || teamName.includes(t.name.toLowerCase())))
                        );

                        if (foundTeam) {
                            targetTeamId = foundTeam.id;
                            this.logger.log(`[AI_TOOL] Resolved team name '${args.teamId}' to ID ${targetTeamId} (${foundTeam.name})`);
                            
                            // UPDATE CONTACT: Move to HQ tenant AND assign team
                            // UPDATE CONTACT: Move to HQ tenant, assign team, AND PAUSE AI
                            await this.contactRepository.update(contactId, { 
                                assignedTeamId: targetTeamId,
                                tenantId: targetTenantId, // Move to HQ
                                automationPaused: true    // MUTE LISA
                            });
                            
                            this.logger.log(`[AI_TOOL] Automation PAUSED for contact ${contactId} during transfer to HQ.`);

                            // Emit update to BOTH rooms to ensure UI and Widget synchronization
                            const updatePayload = {
                                contactId: contactId,
                                assignedTeamId: targetTeamId,
                                tenantId: targetTenantId,
                                automationPaused: true
                            };

                            this.communicationService.emitToTenant(tenantId, 'contact_updated', updatePayload);
                            this.communicationService.emitToTenant(targetTenantId, 'contact_updated', updatePayload);

                            toolResult = { success: true, message: `O atendimento foi transferido para a equipe ${foundTeam.name} e a automação foi pausada para seu atendimento humano.` };
                        } else {
                            this.logger.warn(`[AI_TOOL_FAILSAFE] Team '${args.teamId}' not found. Keeping current assignment.`);
                            toolResult = { success: false, message: `Equipe '${args.teamId}' não encontrada. O atendimento permanece com o responsável atual.` };
                        }
                    } else if (funcName === 'get_products' && tenantId) {
                        toolResult = await this.erpZaplandiaService.getProducts(tenantId, args.search);
                    } else if (funcName === 'get_raffles' && tenantId) {
                        toolResult = await this.rifaApiService.getRaffles(tenantId);
                    } else if (funcName === 'get_tickets' && tenantId) {
                        toolResult = await this.rifaApiService.getTickets(tenantId, args.raffleId);
                    } else if (funcName === 'create_raffle_order' && tenantId) {
                        toolResult = await this.rifaApiService.createOrder(tenantId, args);
                    } else if (funcName === 'open_ticket' && tenantId && contactId) {
                        this.logger.log(`[AI_TOOL] Opening ticket for contact ${contactId} in tenant ${targetTenantId}`);
                        toolResult = await this.supportService.createTicket(targetTenantId, contactId, {
                            subject: args.subject,
                            description: args.description,
                            category: args.category || 'technical',
                            priority: args.priority || 'medium'
                        });
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

    private async callGemini(model: string, prompt: string, apiKey: string, maxTokens: number, tools?: any[], tenantId?: string, contactId?: string, systemInstruction?: string, promptId?: string): Promise<string | null> {
        // 🔧 FIX: Tool calling MUST use v1beta. v1 often doesn't support the 'tools' field.
        // However, if tools fail or model is not found in v1beta, we can try v1 as fallback for text.
        const versions = tools ? ['v1beta', 'v1'] : ['v1', 'v1beta'];
        const cleanApiKey = apiKey.trim();
        let lastError: any;
        let rateLimitCount = 0;

        for (const version of versions) {
            try {
                const modelPath = model.startsWith('models/') ? model : `models/${model}`;
                const url = `https://generativelanguage.googleapis.com/${version}/${modelPath}:generateContent?key=${cleanApiKey}`;
                this.logger.debug(`[AI_ROUTING] Calling Gemini URL: ${url.replace(cleanApiKey, 'HIDDEN')}`);

                const payload: any = {
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1, // Lower temperature for more reliable tool use
                        maxOutputTokens: maxTokens,
                        topP: 0.95,
                        topK: 40
                    }
                };

                if (systemInstruction) {
                    payload.system_instruction = {
                        parts: [{ text: systemInstruction }]
                    };
                }

                if (tools) {
                    // Gemini format: list of objects containing lists of function_declarations
                    payload.tools = tools;
                    this.logger.debug(`[AI_DEBUG] Sending payload with ${tools.reduce((acc, t) => acc + (t.function_declarations?.length || 0), 0)} functions to ${model}`);
                }

                const response = await axios.post(url, payload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });

                this.logger.debug(`[AI_DEBUG] Model ${model} responded. Status: ${response.status}`);
                this.logger.debug(`[AI_TRACE] Response Body: ${JSON.stringify(response.data)}`);
                const candidate = response.data?.candidates?.[0];
                const parts = candidate?.content?.parts || [];

                let accumulatedText = '';
                let toolResult: any;
                let funcCallFound = false;

                for (const part of parts) {
                    if (part.text) accumulatedText += part.text;

                    // Check for Tool Calling (Function Call) - Handle both camelCase and snake_case
                    const functionCall = part?.functionCall || part?.function_call;

                    if (functionCall) {
                        funcCallFound = true;
                        const funcName = functionCall.name;
                        const args = functionCall.args;

                    this.logger.log(`[AI_TOOL] Gemini requested tool: ${funcName} with args: ${JSON.stringify(args)}`);

                    let toolResult: any;
                    if (funcName === 'transfer_to_team' && tenantId && contactId) {
                        this.logger.log(`[AI_TOOL] Transferring contact ${contactId} to team/name: ${args.teamId}`);
                        
                        let targetTeamId = args.teamId;
                        const teamName = args.teamId?.toLowerCase();
                        const teams = await this.contactRepository.manager.query(`SELECT id, name FROM teams WHERE "tenantId" = $1`, [tenantId]);
                        
                        const foundTeam = teams.find(t => 
                            t.id === targetTeamId || 
                            t.name.toLowerCase().includes(teamName) ||
                            teamName.includes(t.name.toLowerCase())
                        );

                        if (foundTeam) {
                            targetTeamId = foundTeam.id;
                            this.logger.log(`[AI_TOOL] Resolved team name '${args.teamId}' to ID ${targetTeamId} (${foundTeam.name})`);
                        } else {
                            // FAILSAFE: If resolution fails, use the first team available for this tenant
                            if (teams && teams.length > 0) {
                                targetTeamId = teams[0].id;
                                this.logger.warn(`[AI_TOOL_FAILSAFE] Team '${args.teamId}' not found for tenant ${tenantId}. Redirecting to first team: ${teams[0].name} (${targetTeamId})`);
                            } else {
                                this.logger.error(`[AI_TOOL_FATAL] No teams found for tenant ${tenantId}. Transfer failed.`);
                            }
                        }

                        await this.contactRepository.update(contactId, { assignedTeamId: targetTeamId });
                        // Emit update via socket
                        this.communicationService.emitToTenant(tenantId, 'contact_updated', {
                            contactId: contactId,
                            assignedTeamId: targetTeamId
                        });
                        toolResult = { success: true, message: `O atendimento foi transferido para a equipe ${foundTeam?.name || (teams[0]?.name || targetTeamId)}.` };
                    } else if (funcName === 'get_products' && tenantId) {
                        toolResult = await this.erpZaplandiaService.getProducts(tenantId, args.search);
                    } else if (funcName === 'get_raffles' && tenantId) {
                        toolResult = await this.rifaApiService.getRaffles(tenantId);
                    } else if (funcName === 'get_tickets' && tenantId) {
                        toolResult = await this.rifaApiService.getTickets(tenantId, args.raffleId);
                    } else if (funcName === 'create_raffle_order' && tenantId) {
                        toolResult = await this.rifaApiService.createOrder(tenantId, args);
                    } else if (funcName === 'open_ticket' && tenantId && contactId) {
                        this.logger.log(`[AI_TOOL] Opening ticket for contact ${contactId}`);
                        toolResult = await this.supportService.createTicket(tenantId, contactId, {
                            subject: args.subject,
                            description: args.description,
                            category: args.category || 'technical',
                            priority: args.priority || 'medium'
                        });
                    } else {
                        toolResult = { error: `Tool ${funcName} not implemented or missing tenant context` };
                    }

                    this.logger.log(`[AI_TOOL] Tool ${funcName} result received. Re-sending to Gemini...`);

                    // Re-send to Gemini with functionResponse
                    const followUpPayload = {
                        contents: [
                            { role: 'user', parts: [{ text: prompt }] },
                            { role: 'model', parts: parts }, // Maintain conversation flow
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
                        generationConfig: payload.generationConfig,
                        system_instruction: payload.system_instruction
                    };

                    const followUpResponse = await axios.post(url, followUpPayload, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 30000
                    });

                    const finalCandidate = followUpResponse.data?.candidates?.[0];
                    const finalParts = finalCandidate?.content?.parts || [];
                    let finalAccumulatedText = '';
                    for (const fp of finalParts) {
                        if (fp.text) finalAccumulatedText += fp.text;
                    }

                    if (finalAccumulatedText) {
                        this.logger.debug(`[AI_ROUTING] Tool call + Follow-up successful with model ${model}.`);
                        return finalAccumulatedText;
                    }
                }
            } // Close for loop over parts

                if (accumulatedText) {
                    this.logger.debug(`[AI_ROUTING] Model ${model} succeeded with text in ${version}.`);
                    return accumulatedText;
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

    async generateLisaResponse(tenantId: string, fullPrompt: string, contactId?: string): Promise<string | null> {
        this.logger.log(`[LISA_CHAT] Instant response requested for contact ${contactId}`);
        
        let contact: Contact | null = null;
        if (contactId) {
            contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId } });
        }

        if (!contact) {
            // Minimal contact object for logic if none exists
            contact = { id: contactId || 'temp', name: 'Usuário Web', tenantId, provider: 'site' } as any;
        }

        // Call unified generation engine WITHOUT debounce for web chat
        return this.executeAIGeneration(contact!, fullPrompt, tenantId, contact?.instance);
    }

    async getPromptByName(name: string, tenantId?: string) {
        if (tenantId) {
            return this.aiPromptRepository.findOne({ where: { name, tenantId } });
        }
        return this.aiPromptRepository.findOne({ where: { name } });
    }

    async savePromptByName(name: string, content: string, tenantId: string, provider?: string, model?: string, apiKey?: string) {
        let prompt = await this.aiPromptRepository.findOne({ where: { name, tenantId } });
        if (prompt) {
            prompt.content = content;
            if (provider !== undefined) prompt.provider = provider;
            if (model !== undefined) prompt.model = model;
            if (apiKey !== undefined) prompt.apiKey = apiKey; // Allow empty string to clear
        } else {
            prompt = this.aiPromptRepository.create({ name, content, tenantId, provider, model, apiKey });
        }
        return this.aiPromptRepository.save(prompt);
    }

    async getOrCreateContactForLisa(tenantId: string, user: any) {
        let contact = await this.contactRepository.findOne({ 
            where: { tenantId, externalId: user.email } 
        });

        if (!contact) {
            contact = this.contactRepository.create({
                tenantId,
                name: user.name || 'User Lisa Chat',
                externalId: user.email,
                provider: 'site',
                stage: 'NOVO'
            });
            await this.contactRepository.save(contact);
        }
        return contact;
    }

    async recordLisaInteraction(tenantId: string, contactId: string, userMsg: string, lisaResponse: string) {
        // Record user message
        const m1 = this.messageRepository.create({
            tenantId,
            contactId,
            content: userMsg,
            direction: 'inbound',
            provider: 'site'
        });
        await this.messageRepository.save(m1);

        // Record Lisa response
        const m2 = this.messageRepository.create({
            tenantId,
            contactId,
            content: lisaResponse,
            direction: 'outbound',
            provider: 'site'
        });
        await this.messageRepository.save(m2);

        // Update contact lastMessage
        await this.contactRepository.update(contactId, {
            lastMessage: lisaResponse,
            updatedAt: new Date()
        });

        // Emit new message event so Omni Inbox refreshes
        this.communicationService.emitToTenant(tenantId, 'new_message', {
            ...m2,
            contact: { id: contactId, name: 'User Lisa Chat', provider: 'site' }
        });
    }
}
