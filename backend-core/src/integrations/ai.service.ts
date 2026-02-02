import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationsService } from './integrations.service';
import { AiPrompt } from './entities/ai-prompt.entity';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly aiUrl = process.env.AI_SERVICE_URL || 'http://backend-ai:8000';

    constructor(
        @Inject(forwardRef(() => IntegrationsService))
        private integrationsService: IntegrationsService,
        @InjectRepository(AiPrompt)
        private promptRepository: Repository<AiPrompt>,
    ) { }

    async createPrompt(tenantId: string, name: string, content: string) {
        const prompt = this.promptRepository.create({
            tenantId,
            name,
            content
        });
        return this.promptRepository.save(prompt);
    }

    async findAllPrompts(tenantId: string) {
        return this.promptRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' }
        });
    }

    async getAiResponse(tenantId: string, prompt: string, provider: string, context?: string) {
        try {
            // Fetch the Gemini API Key for this specific tenant (or global fallback)
            const apiKey = await this.integrationsService.getCredential(tenantId, 'GEMINI_API_KEY');

            this.logger.log(`[AI_REQUEST] Tenant: ${tenantId}, Provider: ${provider}, HasKey: ${!!apiKey}`);
            if (!apiKey) {
                this.logger.warn(`[AI_REQUEST] No API Key found for Tenant ${tenantId}. AI will likely return Demo Mode message.`);
            }

            // Fetch custom prompt for this provider if it exists
            const integrations = await this.integrationsService.findAllByTenant(tenantId, 'admin');
            const integration = integrations.find(i => i.provider === provider);

            let systemInstruction = context || "Você é o assistente da Zaplandia.";

            if (integration?.settings?.aiEnabled && integration?.settings?.aiPrompt) {
                systemInstruction = integration.settings.aiPrompt;
            }

            const response = await axios.post(`${this.aiUrl}/v1/chat`, {
                prompt,
                system_instruction: systemInstruction,
                api_key: apiKey
            });

            const aiResponse = response.data.response;
            this.logger.log(`[AI_RESPONSE] Received ${aiResponse?.length || 0} chars from AI Service`);

            return aiResponse;
        } catch (error: any) {
            const errorDetail = error.response?.data?.detail || error.message || 'Erro desconhecido';
            this.logger.error(`[AI_REQUEST_FAILED] ${errorDetail}`);
            return `[ERRO CONEXÃO IA] ${errorDetail}`;
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

            // 1. If it's a known error/warning prefix, return it as the only variation
            if (responseStr.startsWith('[MODO DEMO') || responseStr.startsWith('[ERRO')) {
                return [responseStr];
            }

            // 2. Try to extract JSON from the response (in case AI included markdown or conversational filler)
            let cleaned = responseStr.trim();
            const jsonMatch = cleaned.match(/\[.*\]/s); // Look for anything starting with [ and ending with ]
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

            // 3. Last fallback: if it's not JSON but seems like a single message, return it
            if (responseStr.length > 5 && !responseStr.includes('{')) {
                return [responseStr];
            }

            return [baseMessage]; // Generic fallback only for empty/invalid responses
        } catch (error) {
            this.logger.error(`[GEN_VAR_CRITICAL] ${error.message}`);
            return [`[ERRO SISTEMA] Falha ao processar variações: ${error.message}`];
        }
    }
}
