import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly aiUrl = process.env.AI_SERVICE_URL || 'http://backend-ai:8000';

    async getAiResponse(prompt: string, context?: string) {
        try {
            const response = await axios.post(`${this.aiUrl}/v1/chat`, {
                prompt,
                system_instruction: context || "Você é o assistente da Zaplandia."
            });
            return response.data.response;
        } catch (error) {
            this.logger.error('Failed to get AI response', error.message);
            return "Desculpe, meu cérebro de silício está processando algo. Tente novamente em um minuto! 🤖";
        }
    }
}
