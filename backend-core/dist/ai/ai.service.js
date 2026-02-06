"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = __importDefault(require("axios"));
const crm_entity_1 = require("../crm/entities/crm.entity");
const integration_entity_1 = require("../integrations/entities/integration.entity");
const evolution_api_service_1 = require("../integrations/evolution-api.service");
const integrations_service_1 = require("../integrations/integrations.service");
const ai_prompt_entity_1 = require("../integrations/entities/ai-prompt.entity");
let AiService = AiService_1 = class AiService {
    contactRepository;
    messageRepository;
    integrationRepository;
    aiPromptRepository;
    evolutionApiService;
    integrationsService;
    logger = new common_1.Logger(AiService_1.name);
    constructor(contactRepository, messageRepository, integrationRepository, aiPromptRepository, evolutionApiService, integrationsService) {
        this.contactRepository = contactRepository;
        this.messageRepository = messageRepository;
        this.integrationRepository = integrationRepository;
        this.aiPromptRepository = aiPromptRepository;
        this.evolutionApiService = evolutionApiService;
        this.integrationsService = integrationsService;
    }
    async getGeminiApiKey(tenantId) {
        try {
            const apiKey = await this.integrationsService.getCredential(tenantId, 'GEMINI_API_KEY');
            if (apiKey) {
                const trimmedKey = apiKey.trim();
                const charCodes = trimmedKey.split('').map(c => c.charCodeAt(0)).join(',');
                this.logger.debug(`[GEMINI_KEY_DEBUG] Key: ${trimmedKey.substring(0, 5)}... (Len: ${trimmedKey.length}) Chars: [${charCodes.substring(0, 20)}...]`);
                return trimmedKey;
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to get Gemini API key for tenant ${tenantId}: ${error.message}`);
            return null;
        }
    }
    async shouldRespond(contact, instanceName, tenantId) {
        const integrations = await this.integrationRepository.find({
            where: {
                tenantId,
                provider: 'evolution',
            }
        });
        const integration = integrations.find(i => {
            const credInst = i.credentials?.instanceName;
            const settInst = i.settings?.instanceName;
            const match = (name) => name === instanceName ||
                instanceName.endsWith(`_${name}`) ||
                name.endsWith(`_${instanceName}`);
            return (credInst && match(credInst)) || (settInst && match(settInst));
        });
        if (!integration) {
            this.logger.warn(`No integration found for instance ${instanceName} to handle auto-response`);
            return false;
        }
        if (!integration.aiEnabled) {
            this.logger.log(`AI disabled for instance ${instanceName}`);
            return false;
        }
        this.logger.debug(`[AI_CHECK] Contact ${contact.id} aiEnabled status: ${contact.aiEnabled} (Type: ${typeof contact.aiEnabled})`);
        if (contact.aiEnabled === false) {
            this.logger.log(`AI disabled for contact ${contact.id} (Explicit Override: OFF)`);
            return false;
        }
        if (!integration.aiPromptId) {
            this.logger.warn(`No AI prompt configured for instance ${instanceName}`);
            return false;
        }
        return true;
    }
    async generateResponse(contact, userMessage, tenantId, instanceName) {
        try {
            const apiKey = await this.getGeminiApiKey(tenantId);
            if (!apiKey) {
                this.logger.error(`No Gemini API key configured for tenant ${tenantId}`);
                return null;
            }
            const integrations = await this.integrationRepository.find({
                where: {
                    tenantId,
                    provider: 'evolution',
                }
            });
            const targetInstance = instanceName || contact.instance;
            const integration = integrations.find(i => {
                const credInst = i.credentials?.instanceName;
                const settInst = i.settings?.instanceName;
                if (!targetInstance)
                    return false;
                const match = (name) => name === targetInstance ||
                    targetInstance.endsWith(`_${name}`) ||
                    name.endsWith(`_${targetInstance}`);
                return (credInst && match(credInst)) || (settInst && match(settInst));
            });
            if (!integration?.aiPromptId) {
                this.logger.error(`No AI prompt configured for instance ${targetInstance}`);
                return null;
            }
            let promptContent = await this.getPromptContent(integration.aiPromptId, tenantId);
            if (!promptContent) {
                this.logger.error(`Prompt ${integration.aiPromptId} content not found or empty`);
                return null;
            }
            const pushName = contact.name || 'Cliente';
            promptContent = promptContent.replace(/\{\{\s*\$\(?'Webhook'\)?\.item\.json\.body\.data\.pushName\s*\}\}/g, pushName);
            promptContent = promptContent.replace(/\{\{\s*pushName\s*\}\}/g, pushName);
            promptContent = promptContent.replace(/\{\{\s*nome\s*\}\}/g, pushName);
            const history = await this.messageRepository.find({
                where: { contactId: contact.id },
                order: { createdAt: 'DESC' },
                take: 10
            });
            const conversationContext = history
                .reverse()
                .map(m => `${m.direction === 'inbound' ? 'Cliente' : 'Você'}: ${m.content}`)
                .join('\n');
            const modelName = integration.aiModel || 'gemini-2.5-flash-lite';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            const fullPrompt = `${promptContent}\n\nHistórico da conversa:\n${conversationContext}\n\nCliente: ${userMessage}\n\nVocê:`;
            let retryCount = 0;
            const maxRetries = 3;
            let response;
            while (retryCount <= maxRetries) {
                try {
                    response = await axios_1.default.post(url, {
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
                        timeout: 30000
                    });
                    break;
                }
                catch (error) {
                    this.logger.error(`[AI_REQUEST_FAILED] Attempt ${retryCount + 1}/${maxRetries + 1}: ${error.message}`);
                    if (error.response) {
                        this.logger.error(`[GEMINI_ERROR] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
                    }
                    const status = error.response?.status;
                    if ((status === 503 || status === 429) && retryCount < maxRetries) {
                        retryCount++;
                        const delay = retryCount * 2000;
                        this.logger.warn(`Gemini API returned ${status}. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw error;
                }
            }
            const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!aiResponse) {
                this.logger.error('Empty response from Gemini API');
                return null;
            }
            this.logger.log(`AI generated response for contact ${contact.id} using prompt ${integration.aiPromptId}`);
            return aiResponse;
        }
        catch (error) {
            this.logger.error(`Failed to generate AI response: ${error.response?.data?.error?.message || error.message}`);
            return null;
        }
    }
    async sendAIResponse(contact, aiResponse, tenantId, instanceNameOverride) {
        let targetNumber = '';
        let useContact = contact;
        let useInstance = '';
        try {
            const freshContact = await this.contactRepository.findOne({ where: { id: contact.id } });
            useContact = freshContact || contact;
            useInstance = instanceNameOverride || useContact.instance;
            if (useContact.phoneNumber && useContact.phoneNumber.length > 8) {
                targetNumber = `${useContact.phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;
                this.logger.debug(`[AI_SEND] Using phone-based JID for stability: ${targetNumber}`);
            }
            else {
                targetNumber = useContact.externalId || useContact.phoneNumber;
            }
            if (!targetNumber) {
                this.logger.error(`Cannot send AI response: No target number for contact ${useContact.id}`);
                return;
            }
            const cleanNumber = targetNumber.replace(/:[0-9]+/, '');
            targetNumber = cleanNumber.includes('@') ? cleanNumber : `${cleanNumber.replace(/\D/g, '')}@s.whatsapp.net`;
            this.logger.log(`Sending AI response to ${targetNumber} via ${useInstance}`);
            await this.evolutionApiService.sendText(tenantId, useInstance, targetNumber, aiResponse);
            this.logger.log(`AI response sent to ${targetNumber} via ${useInstance}`);
        }
        catch (error) {
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
                }
                catch (fallbackError) {
                    this.logger.error(`[AI_HEAL] Phone fallback also failed: ${fallbackError.message}`);
                }
            }
            if (error.response?.data) {
                this.logger.error(`Evolution API Error Detail: ${JSON.stringify(error.response.data)}`);
            }
        }
    }
    async getAiResponse(tenantId, prompt, provider, context, modelName) {
        try {
            const apiKey = await this.getGeminiApiKey(tenantId);
            if (!apiKey) {
                this.logger.error(`[AI_REQUEST] No API Key found for Tenant ${tenantId}.`);
                return `[ERRO] Chave de API do Gemini não configurada.`;
            }
            const finalModelName = modelName || 'gemini-2.5-flash-lite';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${finalModelName}:generateContent?key=${apiKey}`;
            const systemInstruction = context || "Você é o assistente da Zaplandia.";
            const fullPrompt = `${systemInstruction}\n\n${prompt}`;
            const response = await axios_1.default.post(url, {
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            }, { timeout: 30000 });
            const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!aiResponse)
                return null;
            this.logger.log(`[AI_RESPONSE] Received ${aiResponse.length} chars from AI Service`);
            return aiResponse;
        }
        catch (error) {
            const errorDetail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            this.logger.error(`[AI_REQUEST_FAILED] ${errorDetail}`);
            return `[ERRO CONEXÃO IA] ${errorDetail}`;
        }
    }
    async generateVariations(tenantId, baseMessage, prompt, count = 3) {
        const systemInstruction = "Você é um especialista em Copywriting para WhatsApp. Sua tarefa é gerar variações de mensagens mantendo o sentido original, mas mudando o tom ou a estrutura para evitar bloqueios de SPAM. Retorne APENAS um array JSON de strings, sem markdown.";
        const userPrompt = `
        Mensagem Original: "${baseMessage}"
        Contexto/Instrução Adicional: "${prompt || 'Crie variações amigáveis e persuasivas.'}"
        Quantidade: ${count}
        
        Gere as variações no formato JSON array de strings: ["variação 1", "variação 2", ...]`;
        try {
            const responseStr = await this.getAiResponse(tenantId, userPrompt, 'gemini', systemInstruction);
            this.logger.log(`[GEN_VAR] Raw response from service: ${responseStr}`);
            if (!responseStr)
                return [baseMessage];
            if (responseStr.startsWith('[ERRO')) {
                return [responseStr];
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
            }
            catch (pErr) {
                this.logger.warn(`[GEN_VAR] Failed to parse as JSON array: ${cleaned}`);
            }
            return [responseStr];
        }
        catch (error) {
            this.logger.error(`[GEN_VAR_CRITICAL] ${error.message}`);
            return [`[ERRO SISTEMA] Falha ao processar variações: ${error.message}`];
        }
    }
    async generatePrompts(tenantId, topic, count = 3) {
        return this.generateVariations(tenantId, topic, "Gere prompts de sistema para IA agir como um atendente.", count);
    }
    async getPromptContent(promptId, tenantId) {
        try {
            const prompt = await this.aiPromptRepository.findOne({
                where: { id: promptId, tenantId }
            });
            return prompt?.content || null;
        }
        catch (error) {
            this.logger.error(`Error fetching prompt content for ${promptId}: ${error.message}`);
            return null;
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(crm_entity_1.Contact)),
    __param(1, (0, typeorm_1.InjectRepository)(crm_entity_1.Message)),
    __param(2, (0, typeorm_1.InjectRepository)(integration_entity_1.Integration)),
    __param(3, (0, typeorm_1.InjectRepository)(ai_prompt_entity_1.AiPrompt)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _d : Object, evolution_api_service_1.EvolutionApiService,
        integrations_service_1.IntegrationsService])
], AiService);
//# sourceMappingURL=ai.service.js.map