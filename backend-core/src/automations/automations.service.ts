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

    async architectChat(tenantId: string, userId: string, message: string, history: any[], userName?: string) {
        this.logger.log(`[ARCHITECT] Chat for tenant ${tenantId}, user ${userId} (${userName || 'Unknown User'})`);
        
        const systemPrompt = `Você é o Arquiteto de Automação da Zaplandia.
        Sua missão é gerar fluxos n8n perfeitos.

        🚀 REGRAS TÉCNICAS INVIOLÁVEIS:
        - FORMATO: Use APENAS "nodes" e "connections". PROIBIDO usar "steps" ou "tasks".
        - PROIBIDO: Nunca use 'zapier', 'make.com' ou URLs externas. Use APENAS Zaplandia.
        - URL Oficial: https://www.zaplandia.com.br/api/crm/send
        - Headers: { "Authorization": "Bearer {{ $env.ZAPLANDIA_API_KEY }}", "Content-Type": "application/json" }
        - Body: { "contactId": "={{ $json.contact_id }}", "content": "mensagem", "tenantId": "={{ $env.TENANT_ID }}" }
        - Webhook: O path deve ser algo curto como 'insta-zap' ou 'webhook-crm'.

        EXEMPLO ESTRUTURA (INSTAGRAM):
        Webhook -> IF (Filtro palavra-chave) -> HTTP Request (Zaplandia API)

        IMPORTANTE: Responda SEMPRE com o JSON completo dentro de um bloco de código (use 3 crases).
        Não use IDs fixos como '123'. Use expressions n8n.`;

        const historyContext = history.length > 0 ? `Histórico da conversa:\n${history.map(h => `${h.role === 'assistant' ? 'LISA' : 'Usuário'}: ${h.content}`).join('\n')}` : '';
        
        // Using the same backend engine as the AI assistant
        const aiResponse = await this.aiService.generateGenericResponse(tenantId, message, `${systemPrompt}\n\n${historyContext}`, userId, { id: userId, name: userName });
        
        if (!aiResponse) {
            this.logger.error(`[ARCHITECT] AI returned null for tenant ${tenantId}. Possible Lisa (Ollama) offline or model missing.`);
            return {
                role: 'assistant',
                content: '⚠️ Não consegui processar sua solicitação agora. O motor interno da Lisa pode estar offline ou o modelo `zaplandia-lisa` não foi carregado corretamente no servidor. Por favor, contate o administrador do sistema.'
            };
        }
        
        return {
            role: 'assistant',
            content: aiResponse
        };
    }

    async deployWorkflow(tenantId: string, workflowData: any) {
        this.logger.log(`[DEPLOY] Request for tenant ${tenantId}`);
        
        try {
            const result = await this.n8nService.createWorkflow(tenantId, workflowData);
            
            // Save to internal database too
            await this.create(tenantId, {
                name: workflowData.name || result.name,
                description: `Criado via Lisa em ${new Date().toLocaleDateString()}`,
                status: 'paused', // Start as draft/paused
                nodesCount: workflowData.nodes?.length || 0,
                n8nWorkflowId: result.id,
                workflowData: workflowData,
                updatedAt: new Date()
            });

            return { 
                success: true, 
                message: 'Fluxo implantado com sucesso no n8n!',
                workflowId: result.id 
            };
        } catch (error) {
            this.logger.error(`[DEPLOY_ERROR] ${error.message}`);
            return { 
                success: false, 
                message: error.message 
            };
        }
    }
}
