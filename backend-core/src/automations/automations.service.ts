import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Automation } from './entities/automation.entity';
import { AiService } from '../ai/ai.service';
import { N8nService } from '../integrations/n8n.service';
import { IntegrationsService } from '../integrations/integrations.service';

@Injectable()
export class AutomationsService {
    private readonly logger = new Logger(AutomationsService.name);

    constructor(
        @InjectRepository(Automation)
        private automationRepository: Repository<Automation>,
        private aiService: AiService,
        private n8nService: N8nService,
        private integrationsService: IntegrationsService,
    ) {}

    async getSettings(tenantId: string) {
        const apiUrl = await this.integrationsService.getCredential(tenantId, 'N8N_API_URL', true);
        const apiKey = await this.integrationsService.getCredential(tenantId, 'N8N_API_KEY', true);
        return { apiUrl, apiKey };
    }

    async saveSettings(tenantId: string, apiUrl: string, apiKey: string) {
        await this.integrationsService.saveApiCredential(tenantId, 'N8N_API_URL', apiUrl);
        await this.integrationsService.saveApiCredential(tenantId, 'N8N_API_KEY', apiKey);
        return { success: true };
    }

    async findAll(tenantId: string) {
        return this.automationRepository.find({
            where: { tenantId },
            order: { updatedAt: 'DESC' }
        });
    }

    async create(tenantId: string, data: Partial<Automation>) {
        const automation = this.automationRepository.create({
            ...data,
            tenantId,
        });
        return this.automationRepository.save(automation);
    }

    async update(tenantId: string, id: string, data: Partial<Automation>) {
        await this.automationRepository.update({ id, tenantId }, data);
        return this.automationRepository.findOne({ where: { id, tenantId } });
    }

    async remove(tenantId: string, id: string) {
        return this.automationRepository.delete({ id, tenantId });
    }

    async architectChat(tenantId: string, userId: string, message: string, history: any[]) {
        this.logger.log(`[ARCHITECT] Chat for tenant ${tenantId}, user ${userId}`);
        
        const systemPrompt = `
        Você é o Arquiteto de Automação da Zaplandia. Seu objetivo é ajudar o usuário a criar fluxos de automação no n8n que se integrem perfeitamente ao Zaplandia CRM.
        
        CONTEXTO TÉCNICO:
        - Gatilhos comuns: Recebimento de mensagens (WhatsApp/Instagram), Mudança de Estágio no Funil, Novo Lead.
        - Ações comuns: Enviar mensagem, Atualizar Contato, Adicionar nota, Notificar equipe.
        - Webhooks Zaplandia: Os fluxos n8n geralmente começam com um nó 'Webhook' que recebe dados do Zaplandia.
        - API Zaplandia: Os fluxos n8n usam o nó 'HTTP Request' para enviar mensagens de volta via Zaplandia API.
        
        DIRETRIZES:
        1. Seja interativo. Se o usuário for vago, faça perguntas para entender: Gatilho -> Lógica -> Ação.
        2. Foco total em utilidade. Proponha soluções que economizem tempo.
        3. Quando o usuário estiver satisfeito, você deve dizer claramente que o fluxo está pronto e descrevê-lo.
        4. Sempre responda no idioma do usuário (padrão: Português Brasileiro).
        
        IMPORTANTE: Você deve manter um tom profissional, consultivo e focado em resultados.
        `;

        // We use a simplified AI call for the architect
        // In a real scenario, we would use a more advanced chat history management
        const fullPrompt = `${systemPrompt}\n\nHistórico:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\nUser: ${message}`;
        
        // Using the same backend engine as the AI assistant
        const aiResponse = await this.aiService.generateGenericResponse(tenantId, fullPrompt);
        
        if (!aiResponse) {
            this.logger.error(`[ARCHITECT] AI returned null for tenant ${tenantId}. Possible quota exhaustion or missing key.`);
            return {
                role: 'assistant',
                content: '⚠️ Não consegui processar sua mensagem agora. Isso pode ser um problema de **quota da API do Gemini** (limite de requisições atingido). Verifique em [aistudio.google.com](https://aistudio.google.com) se sua chave ainda tem cota disponível, ou configure uma chave de outro provedor (OpenRouter/OpenAI) em **Configurações > APIs**.'
            };
        }
        
        return {
            role: 'assistant',
            content: aiResponse
        };
    }
}
