import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import axios from 'axios';
import { IntegrationsService } from './integrations.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly aiUrl = process.env.AI_SERVICE_URL || 'http://backend-ai:8000';

    constructor(
        @Inject(forwardRef(() => IntegrationsService))
        private integrationsService: IntegrationsService
    ) { }

    async getAiResponse(tenantId: string, prompt: string, context?: string) {
        try {
            // Fetch the Gemini API Key for this specific tenant (or global fallback)
            const apiKey = await this.integrationsService.getCredential(tenantId, 'GEMINI_API_KEY');

            const response = await axios.post(`${this.aiUrl}/v1/chat`, {
                prompt,
                system_instruction: context || "Você é o assistente da Zaplandia.",
                api_key: apiKey
            });
            return response.data.response;
        } catch (error: any) {
            this.logger.error('Failed to get AI response', error.message);
            return "Desculpe, meu cérebro de silício está processando algo. Tente novamente em um minuto! 🤖";
        }
    }
}
