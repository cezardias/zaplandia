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

    private getOllamaBaseUrl(): string | null {
        return process.env.OLLAMA_BASE_URL || null;
    }

    private async callOllama(model: string, prompt: string, maxTokens: number, systemInstruction?: string): Promise<string | null> {
        const baseUrl = this.getOllamaBaseUrl();
        if (!baseUrl) return null;

        try {
            const messages: any[] = [];
            if (systemInstruction) {
                messages.push({ role: 'system', content: systemInstruction });
            }
            messages.push({ role: 'user', content: prompt });

            const response = await axios.post(
                `${baseUrl}/api/chat`,
                {
                    model,
                    messages,
                    stream: false,
                    keep_alive: "1h",
                    options: { num_predict: maxTokens, temperature: 0.7 }
                },
                { timeout: 300000 } // 5 minutes - local inference is slower
            );

            const content = response.data?.message?.content;
            if (content) {
                this.logger.log(`[OLLAMA] Response received from ${model} (${content.length} chars)`);
                return content;
            }
            return null;
        } catch (error) {
            const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            this.logger.warn(`[OLLAMA] Failed calling ${model}: ${detail}`);
            throw error;
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

    async generateGenericResponse(tenantId: string, prompt: string, context?: string): Promise<string | null> {
        try {
            // For internal architecture/generic help, always try Lisa (Ollama) first
            const isInternal = context?.includes('ZAPLANDIA') || context?.includes('Arquiteto');
            const provider = isInternal ? 'ollama' : 'gemini';
            const model = isInternal ? 'zaplandia-lisa' : undefined;

            this.logger.debug(`[GENERIC_AI] Internal: ${isInternal}, Provider: ${provider}`);
            
            const response = await this.getAiResponse(tenantId, prompt, provider, context, model);
            if (response && response.startsWith('[ERRO]')) return null;
            return response;
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

    private async executeAIGeneration(contact: Contact, userMessage: string, tenantId: string, instanceName?: string, authenticatedUser?: any): Promise<string | null> {
        try {
            // 1. Resolve Identity and Context
            const targetInstance = instanceName || contact.instance;
            const promptEntity = await this.getLisaPrompt(tenantId);
            const integration = await this.resolveIntegration(tenantId, targetInstance);
            
            const activePromptId = promptEntity?.id || integration?.aiPromptId;
            const configuredModel = integration?.aiModel || promptEntity?.model || 'gemini-2.0-flash';

            if (!activePromptId) return null;

            let promptContent = await this.getPromptContent(activePromptId, tenantId);
            if (!promptContent) return null;

            // 2. Personalize and Contextualize
            const pushName = contact.name || 'Cliente';
            promptContent = promptContent.replace(/\{\{\s*nome\s*\}\}/g, pushName).replace(/\{\{\s*pushName\s*\}\}/g, pushName);
            
            const conversationContext = await this.getConversationContext(contact.id);
            const isFreshStart = conversationContext.length < 20;
            
            // 2.5 Fallback Prompt if DB is empty
            if (!promptContent || promptContent.length < 10) {
                promptContent = "Você é a Lisa, assistente virtual da Zaplandia. Seja prestativa, use a base de conhecimento para tirar dúvidas e abra chamados se necessário.";
            }

            const fullPrompt = `${promptContent}\n\n${isFreshStart ? '[NOVA CONVERSA]' : 'Histórico:'}\n${conversationContext}\n\nCliente: ${userMessage}\nVocê:`;

            // 3. Resolve Tools and API Keys
            const { geminiKey, openRouterKey, erpKey, rifaKey } = await this.resolveAIKeys(tenantId, promptEntity);
            const declarations = this.getToolDeclarations(erpKey || undefined, rifaKey || undefined);
            const tools = declarations.length > 0 ? [{ function_declarations: declarations }] : undefined;

            // 4. Unified System Instruction
            const systemInstruction = `${promptContent}

[DIRETRIZES HELPER MASTER SUPREMA - ZAPLANDIA]:
- PERSONA: Você é a LISA, a Autoridade Máxima, Atendente Sênior e Mentora Técnica da Zaplandia. Você é humana, detalhista, experiente e RESOLUTIVA.
- PROTOCOLO DE RESPOSTA: Sempre responda com um passo a passo numerado (1, 2, 3...) e indique o caminho exato do menu (ex: Menu > Submenu).
- ÍNDICE DE CONHECIMENTO OBRIGATÓRIO (SEMPRE PESQUISE EM 'search_knowledge_base'):
  1. WHATSAPP OFICIAL (META): Configuração de App, Phone ID, WABA ID e Token Permanente.
  2. WHATSAPP NÃO OFICIAL: Criação de Instância no WhatsApp Manager e leitura de QR Code.
  3. TEMPLATES META (BBM): Criação em Integrações > Meta API > Templates (BBM).
  4. CRM & CAMPANHAS: Menu CRM > Campanhas > Nova Campanha. Seleção de Instância e Disparo.
  5. QUALIFICAÇÃO AUTOMÁTICA: Uso de palavras-chave ('contatado', 'respondeu') para mover leads no Funil.
  6. INSTAGRAM: Automação de comentários, posts e direct via n8n.
  7. RIFAS: Consulta de números, reservas e integração com API de Rifas.
  8. OMNI INBOX: Pausar/Retomar automação individual no cabeçalho da conversa.
  9. INTEGRAÇÕES n8n: Configuração de Webhooks granulares para Inbox e Comentários.
- REGRAS CRÍTICAS:
  1. NUNCA diga que é IA ou robô.
  2. PROIBIDO transferir para humano ou abrir chamado em dúvidas de "Como fazer" ou "Onde fica". Você DEVE resolver.
  3. ESCALAÇÃO: Apenas Comercial (Vendas/Upgrade), Financeiro (Boleto) ou Suporte (BUG real de sistema).
  4. CHAMADOS: SEMPRE que abrir um chamado usando 'open_ticket', você DEVE obrigatoriamente informar o NÚMERO DO PROTOCOLO (ex: "#123") ao usuário na resposta final.
- IDENTIDADE: Utilize o EMAIL_USUARIO (${authenticatedUser?.email || 'Visitante'}) para contexto.`;

            // 5. Execution Loop
            const isInternal = instanceName === 'LisaWeb' || promptEntity?.name === 'ZAPLANDIA_HELP_CENTER_LISA';
            
            let modelsToTry = [...new Set([configuredModel, 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-exp', 'gemini-1.5-flash-latest', 'gemini-1.5-pro'])];

            if (isInternal) {
                // INTERNAL ONLY uses Lisa (Ollama)
                this.logger.log(`[AI_INTERNAL] Forcing Lisa (Ollama) for internal task.`);
                modelsToTry = ['zaplandia-lisa', 'qwen2.5:3b'];
            }

            let aiResponse: string | null = null;
            let lastError: any;
            let lastErrorDetail: string = 'Nenhum erro registrado.';

            for (const model of modelsToTry) {
                let currentModel = model;
                // 🛠️ AUTO-CORRECT: Common user typos
                if (currentModel === 'openai/gpt-4.1-mini') currentModel = 'openai/gpt-4o-mini';
                
                this.logger.debug(`[AI_ATTEMPT] Trying model: ${currentModel}`);
                try {
                    const isOpenRouter = currentModel.includes('/') || (openRouterKey && !geminiKey);
                    
                    if (isOpenRouter && !openRouterKey) {
                        this.logger.warn(`[AI_SKIP] Skipping ${currentModel} - OpenRouter key missing.`);
                        continue;
                    }
                    if (!isOpenRouter && !geminiKey) {
                        this.logger.warn(`[AI_SKIP] Skipping ${currentModel} - Gemini key missing.`);
                        continue;
                    }

                    if (isOpenRouter) {
                        aiResponse = await this.callOpenRouter(currentModel, userMessage, openRouterKey!, 2048, tools, tenantId, contact.id, systemInstruction, activePromptId, authenticatedUser);
                    } else if (currentModel === 'zaplandia-lisa' || currentModel === 'qwen2.5:3b' || currentModel.startsWith('ollama:')) {
                        const ollamaModel = currentModel.replace('ollama:', '');
                        aiResponse = await this.callOllama(ollamaModel, userMessage, 4096, systemInstruction);
                    } else {
                        aiResponse = await this.callGemini(currentModel, userMessage, geminiKey!, 2048, tools, tenantId, contact.id, systemInstruction, activePromptId, authenticatedUser);
                    }

                    if (aiResponse) {
                        this.logger.log(`[AI_SUCCESS] Response received from ${currentModel}`);
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    lastErrorDetail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
                    this.logger.warn(`[AI_FAIL] Model ${currentModel} failed: ${lastErrorDetail}`);
                }
            }

            if (!aiResponse) {
                this.logger.error(`[AI_FATAL] All models failed for tenant ${tenantId}. Last error: ${lastErrorDetail}`);
                return `[SISTEMA]: Desculpe, não consegui processar sua mensagem devido a um erro técnico: ${lastErrorDetail.substring(0, 100)}. Por favor, verifique suas chaves de API.`;
            }

            return aiResponse;
        } catch (error) {
            this.logger.error(`[AI_CRITICAL] ${error.message}`);
            return null;
        }
    }

    private async getLisaPrompt(tenantId: string) {
        return await this.aiPromptRepository.findOne({ where: { name: 'ZAPLANDIA_HELP_CENTER_LISA', tenantId } }) 
            || await this.aiPromptRepository.findOne({ where: { name: 'ZAPLANDIA_HELP_CENTER_LISA' } });
    }

    private async resolveIntegration(tenantId: string, targetInstance?: string) {
        const integrations = await this.integrationRepository.find({
            where: { tenantId, provider: In(['evolution', 'whatsapp', 'instagram']) },
            order: { updatedAt: 'DESC' }
        });
        if (!targetInstance) return integrations[0];
        return integrations.find(i => {
            const match = (name: string) => name === targetInstance || targetInstance.includes(name) || name.includes(targetInstance);
            return match(i.credentials?.instanceName || '') || match(i.settings?.instanceName || '');
        }) || integrations[0];
    }

    private async getConversationContext(contactId: string) {
        const history = await this.messageRepository.find({ where: { contactId }, order: { createdAt: 'DESC' }, take: 10 });
        return history.reverse().map(m => `${m.direction === 'inbound' ? 'Cliente' : 'Você'}: ${m.content}`).join('\n');
    }

    private async resolveAIKeys(tenantId: string, promptEntity?: any) {
        let keys = {
            erpKey: await this.integrationsService.getCredential(tenantId, 'ERP_ZAPLANDIA_KEY', true) as string | null,
            rifaKey: await this.integrationsService.getCredential(tenantId, 'RIFA_API_KEY', true) as string | null,
            geminiKey: await this.integrationsService.getCredential(tenantId, 'GEMINI_API_KEY', true) as string | null,
            openRouterKey: await this.integrationsService.getCredential(tenantId, 'OPENROUTER_API_KEY', true) as string | null
        };

        if (promptEntity?.apiKey) {
            if (promptEntity.provider === 'openrouter') keys.openRouterKey = promptEntity.apiKey;
            else keys.geminiKey = promptEntity.apiKey;
        }
        return keys;
    }

    private getToolDeclarations(erpKey?: string, rifaKey?: string) {
        const tools: any[] = [
            {
                name: "search_knowledge_base",
                description: "Busca na base de conhecimento, FAQs e tutoriais da Zaplandia. Use sempre que o cliente tiver uma dúvida técnica ou de uso.",
                parameters: { type: "object", properties: { query: { type: "string", description: "Termo de busca ou pergunta do cliente" } }, required: ["query"] }
            },
            {
                name: "transfer_to_team",
                description: "Transfere para equipe humana. Use APENAS se não houver resposta na base de conhecimento ou se o cliente solicitar explicitamente falar com um humano após sua tentativa de ajuda.",
                parameters: { type: "object", properties: { teamId: { type: "string" }, reason: { type: "string" } }, required: ["teamId"] }
            },
            {
                name: "open_ticket",
                description: "Abre chamado de suporte técnico.",
                parameters: {
                    type: "object",
                    properties: { 
                        subject: { type: "string" }, 
                        description: { type: "string" }, 
                        category: { type: "string" },
                        requesterEmail: { type: "string" }
                    },
                    required: ["subject", "description"]
                }
            }
        ];
        if (erpKey) tools.push({ name: "get_products", description: "Busca ERP.", parameters: { type: "object", properties: { search: { type: "string" } }, required: ["search"] } });
        return tools;
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
            const systemInstruction = context || 'Você é a Lisa, assistente da Zaplandia.';
            const finalPrompt = prompt;

            // --- 1. LISA ZAPLANDIA (Ollama self-hosted - GRÁTIS, sem token!) ---
            const ollamaUrl = this.getOllamaBaseUrl();
            if (ollamaUrl) {
                // Usa zaplandia-lisa como padrão. Se o modelo configurado for Ollama-local, usa ele.
                const ollamaModel = (modelName && !modelName.includes('/') && !modelName.startsWith('gemini'))
                    ? modelName
                    : 'zaplandia-lisa';

                this.logger.debug(`[LISA] Calling Ollama model: ${ollamaModel}`);
                try {
                    const aiResponse = await this.callOllama(ollamaModel, finalPrompt, 4096, systemInstruction);
                    if (aiResponse) {
                        this.logger.log(`[LISA_SUCCESS] Ollama model ${ollamaModel} responded.`);
                        return aiResponse;
                    }
                } catch (error) {
                    this.logger.warn(`[LISA_FAIL] Ollama failed (${error.message}). Falling back to OpenRouter...`);
                    // If zaplandia-lisa not found yet, try qwen2.5:3b directly
                    if (error.message?.includes('model') || error.message?.includes('404')) {
                        try {
                            this.logger.log(`[LISA] Trying fallback model qwen2.5:3b...`);
                            const fallback = await this.callOllama('qwen2.5:3b', finalPrompt, 4096, systemInstruction);
                            if (fallback) return fallback;
                        } catch (e) {
                            this.logger.warn(`[LISA] qwen2.5:3b also failed: ${e.message}`);
                        }
                    }
                }
            }

            // --- 2. OpenRouter (fallback pago, só se Ollama falhar e NÃO for interno) ---
            const isInternal = modelName?.includes('lisa') || context?.includes('ZAPLANDIA');
            if (isInternal) {
                this.logger.warn(`[AI_SKIP_EXTERNAL] Skipping external fallback for internal Lisa request.`);
                return null;
            }

            const openRouterKey = await this.getOpenRouterApiKey(tenantId);
            if (openRouterKey) {
                const orModel = modelName && modelName.includes('/') ? modelName : 'deepseek/deepseek-r1';
                this.logger.log(`[AI_OPENROUTER_FALLBACK] Trying OpenRouter model: ${orModel}`);
                try {
                    const aiResponse = await this.callOpenRouter(orModel, finalPrompt, openRouterKey, 4096, undefined, tenantId, undefined, systemInstruction);
                    if (aiResponse) {
                        this.logger.log(`[AI_OPENROUTER_SUCCESS] OpenRouter model ${orModel} worked.`);
                        return aiResponse;
                    }
                } catch (error) {
                    this.logger.error(`[AI_OPENROUTER_FAIL] ${error.message}`);
                }
            }

            this.logger.error(`[AI_REQUEST_FAILED] All providers failed for tenant ${tenantId}.`);
            return null;

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
    private async callOpenRouter(model: string, prompt: string, apiKey: string, maxTokens: number, tools?: any[], tenantId?: string, contactId?: string, systemInstruction?: string, promptId?: string, authenticatedUser?: any): Promise<string | null> {
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

                    const toolResult = await this.handleToolCall(
                        funcName, 
                        args, 
                        tenantId || 'default', 
                        contactId || 'unknown', 
                        promptId,
                        authenticatedUser
                    );

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
    private async callGemini(model: string, prompt: string, apiKey: string, maxTokens: number, tools?: any[], tenantId?: string, contactId?: string, systemInstruction?: string, promptId?: string, authenticatedUser?: any): Promise<string | null> {
        // 🔧 FIX: gemini-2.0-flash and most new models ONLY exist on v1beta.
        // Always try v1beta first, then v1 as last-resort fallback for legacy models.
        const versions = ['v1beta', 'v1'];
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

                        const toolResult = await this.handleToolCall(
                            funcName, 
                            args, 
                            tenantId || 'default', 
                            contactId || 'unknown', 
                            promptId,
                            authenticatedUser
                        );

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

    async generateLisaResponse(tenantId: string, userMessage: string, contactId?: string, authenticatedUser?: any): Promise<string | null> {
        const contactKey = contactId || 'anon';
        const key = `lisa_${contactKey}`;
        
        this.logger.log(`[LISA_CHAT_WAIT] Message from ${contactKey}. Buffering for 10s...`);

        // 1. Manage the Buffer
        let data = this.debounceMap.get(key);
        if (!data) {
            data = { messages: [userMessage], tenantId, instanceName: 'LisaWeb', timeout: null };
            this.debounceMap.set(key, data);
        } else {
            data.messages.push(userMessage);
            // We don't reset the timeout here for Web Chat to keep the first request alive
            return "[WAITING_FOR_DEBOUNCE]"; 
        }

        // 2. Wait for the burst to finish (10s)
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 3. Process the accumulated burst
        const finalData = this.debounceMap.get(key);
        if (!finalData) return null;
        this.debounceMap.delete(key);

        const combinedMessage = finalData.messages.join(' ');
        this.logger.log(`[LISA_DEBOUNCE] Processing aggregated burst: "${combinedMessage}"`);

        let contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId } });
        if (!contact) {
            contact = { id: contactId, name: authenticatedUser?.name || 'Usuário Web', tenantId, provider: 'site' } as any;
        }

        const response = await this.executeAIGeneration(contact!, combinedMessage, tenantId, 'LisaWeb', authenticatedUser);
        
        if (response && contactId) {
            await this.recordLisaInteraction(tenantId, contactId, combinedMessage, response);
        }

        return response;
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
                email: user.email, // Explicitly save email
                externalId: user.email,
                provider: 'site',
                stage: 'NOVO'
            });
            await this.contactRepository.save(contact);
        } else if (!contact.email && user.email) {
            // Update existing contact if email is missing
            await this.contactRepository.update(contact.id, { email: user.email });
        }
        return contact;
    }

    async recordLisaInteraction(tenantId: string, contactId: string, userMsg: string, lisaResponse: string) {
        // Record user message (User is the PLATFORM OWNER, so it's OUTBOUND to the Support Contact)
        const m1 = this.messageRepository.create({
            tenantId,
            contactId,
            content: userMsg,
            direction: 'outbound',
            provider: 'site'
        });
        await this.messageRepository.save(m1);

        // Record Lisa response (Lisa is the CONTACT, so it's INBOUND to the Platform)
        const m2 = this.messageRepository.create({
            tenantId,
            contactId,
            content: lisaResponse,
            direction: 'inbound',
            provider: 'site'
        });
        await this.messageRepository.save(m2);

        // Update contact lastMessage
        await this.contactRepository.update(contactId, {
            lastMessage: lisaResponse,
            updatedAt: new Date()
        });

        // Emit Lisa message event so Omni Inbox refreshes (as an inbound message from contact)
        this.communicationService.emitToTenant(tenantId, 'new_message', {
            ...m2,
            contact: { id: contactId, name: 'Zaplandia Suporte', provider: 'site' }
        });
    }

    private async handleToolCall(funcName: string, args: any, tenantId: string, contactId: string, promptId?: string, authenticatedUser?: any): Promise<any> {
        try {
            const userEmail = authenticatedUser?.email || 'unknown';
            this.logger.log(`[AI_TOOL_EXEC] Executing ${funcName} for contact ${contactId}. Email: ${userEmail}`);

            // RESOLVE TARGET TENANT (Hierarchy/HQ support)
            let targetTenantId: string = tenantId || 'default';
            let teams = await this.contactRepository.manager.query(`SELECT id, name, "tenantId" FROM teams WHERE "tenantId" = $1`, [tenantId]);
            
            if (!teams || teams.length === 0) {
                const integration = promptId ? await this.integrationRepository.findOne({ where: { id: promptId } }) : null;
                targetTenantId = authenticatedUser?.tenantId || integration?.tenantId || tenantId || 'default';
                teams = await this.contactRepository.manager.query(`SELECT id, name, "tenantId" FROM teams WHERE "tenantId" = $1`, [targetTenantId]);
            }

            if (funcName === 'transfer_to_team' && tenantId && contactId) {
                let targetTeamId = args.teamId;
                const teamName = args.teamId?.toLowerCase();
                
                const foundTeam = teams.find(t => 
                    t.id === targetTeamId || 
                    (teamName && (t.name.toLowerCase().includes(teamName) || teamName.includes(t.name.toLowerCase())))
                );

                if (foundTeam) {
                    targetTeamId = foundTeam.id;
                    await this.contactRepository.update(contactId, { 
                        assignedTeamId: targetTeamId,
                        tenantId: targetTenantId, 
                        automationPaused: true
                    });

                    const updatePayload = { contactId, assignedTeamId: targetTeamId, tenantId: targetTenantId, automationPaused: true };
                    this.communicationService.emitToTenant(tenantId, 'contact_updated', updatePayload);
                    this.communicationService.emitToTenant(targetTenantId, 'contact_updated', updatePayload);
                    
                    return { success: true, message: `Transferido para equipe ${foundTeam.name}. Automação pausada.` };
                }
                return { error: `Equipe '${args.teamId}' não encontrada.` };

            } else if (funcName === 'open_ticket' && tenantId && contactId) {
                const contact = await this.contactRepository.findOne({ where: { id: contactId } });
                
                // 🛠️ FORCE IDENTITY: Priority order: 1. Authenticated User (Login) | 2. AI provided | 3. Contact Email
                let requesterEmail = authenticatedUser?.email || args.requesterEmail || contact?.email || contact?.externalId;
                let requesterName = authenticatedUser?.name || contact?.name || 'Cliente Zaplandia';
                
                // 🛑 REJECT GENERIC TICKETS: Force AI to ask questions
                const desc = (args.description || '').toLowerCase();
                const subj = (args.subject || '').toLowerCase();
                
                // Only reject if it's EXTREMELY generic (Lisa's default patterns)
                if (desc.includes('abertura de chamado') || desc.includes('suporte') || desc === subj) {
                    const isTechnical = desc.includes('n8n') || desc.includes('fluxo') || desc.includes('bot') || desc.includes('automação') || desc.includes('api');
                    if (!isTechnical && desc.length < 30) {
                        this.logger.warn(`[AI_TOOL_REJECT] Rejecting generic ticket from AI for contact ${contactId}`);
                        return { 
                            error: "DESCRIÇÃO MUITO CURTA OU GENÉRICA. Por favor, descreva o problema real do usuário com mais detalhes (ex: 'Problema com X', 'Dúvida sobre Y')." 
                        };
                    }
                }

                const finalRequesterName = (requesterEmail || requesterName).toString().replace(/undefined/g, '').trim().toLowerCase();
                
                this.logger.log(`[AI_TOOL_SUCCESS] Opening verified ticket for ${finalRequesterName}`);

                const ticket = await this.supportService.createTicket(targetTenantId, contactId, {
                    subject: args.subject,
                    description: args.description,
                    category: args.category || 'technical',
                    priority: args.priority || 'medium',
                    requesterName: finalRequesterName
                });

                // 🔔 EMIT EVENT: Tell the UI to refresh tickets
                this.communicationService.emitToTenant(tenantId, 'ticket_created', ticket);
                if (targetTenantId !== tenantId) {
                    this.communicationService.emitToTenant(targetTenantId, 'ticket_created', ticket);
                }

                return ticket;
            } else if (funcName === 'search_knowledge_base') {
                const articles = await this.supportService.findAll();
                const query = (args.query || '').toLowerCase();
                
                // Simple search logic: match title or content
                const results = articles.filter(a => 
                    a.title.toLowerCase().includes(query) || 
                    a.content.toLowerCase().includes(query) ||
                    query.includes(a.title.toLowerCase())
                ).slice(0, 3); // Top 3 relevant

                if (results.length > 0) {
                    return results.map(r => `ARTIGO: ${r.title}\nCONTEÚDO: ${r.content}`).join('\n\n---\n\n');
                }
                return { message: "Nenhum artigo específico encontrado. Tente termos mais genéricos ou abra um chamado." };

            } else if (funcName === 'get_products') {
                return this.erpZaplandiaService.getProducts(tenantId, args.search);
            } else if (funcName === 'get_raffles') {
                return this.rifaApiService.getRaffles(tenantId);
            } else if (funcName === 'get_tickets') {
                return this.rifaApiService.getTickets(tenantId, args.raffleId);
            } else if (funcName === 'create_raffle_order') {
                return this.rifaApiService.createOrder(tenantId, args);
            }

            return { error: `Tool ${funcName} not implemented` };
        } catch (error) {
            this.logger.error(`[AI_TOOL_ERROR] Failed to execute ${funcName}: ${error.message}`);
            return { error: `Internal error during tool execution: ${error.message}` };
        }
    }
}
