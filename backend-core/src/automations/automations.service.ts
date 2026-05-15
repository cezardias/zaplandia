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
        Você é o Arquiteto de Automação da Zaplandia (Lisa). Seu objetivo é ajudar o usuário a criar fluxos de automação no n8n que se integrem perfeitamente ao Zaplandia CRM e ferramentas externas.
        
        CONHECIMENTO TÉCNICO E INTEGRAÇÕES:
        - Gatilhos: Recebimento de mensagens, Mudança de Estágio, Novo Lead.
        - ERPs e E-commerce: Tiny, Olist, Mercado Livre, Shopify. (Exigem chaves de API/Secret).
        - IA e Memória: Agentes de IA do n8n geralmente precisam de um nó 'Window Buffer Memory' ou 'Redis' para persistência.
        - APIs Externas: Google Calendar, Drive, Gmail, Meta (Instagram/WhatsApp/Facebook).
        
        DIRETRIZES DE CREDENCIAIS (CRÍTICO):
        1. IDENTIFICAÇÃO: Se o fluxo proposto exigir acesso externo (Ex: Tiny, Redis, OpenAI), você DEVE avisar o usuário que ele precisará configurar as CREDENCIAIS no painel do n8n.
        2. PROCEDIMENTO: Explique brevemente que o usuário deve ir em 'Credentials' -> 'Add Credential' no n8n e inserir as chaves (API Key, Token, etc).
        3. PERGUNTA PROATIVA: Antes de gerar o JSON final, pergunte se o usuário já possui essas chaves ou se precisa de ajuda para saber onde encontrá-las.
        4. CONFIGURAÇÃO DE NÓS: Ao sugerir um nó de Agente, lembre o usuário de configurar o 'Cérebro' (Modelo de IA) e a 'Memória' (Redis ou Buffer).
        
        ESTRUTURA DE RESPOSTA:
        1. Use MARKDOWN (negrito, listas, blocos de código).
        2. Use LISTA NUMERADA para descrever a sequência do fluxo (Ex: 1. **Gatilho Webhook**...).
        3. Foco em utilidade. Se o usuário for vago, faça perguntas sobre Gatilho -> Lógica -> Ação.
        4. Retorne o JSON final do n8n em blocos de código: ```json { ... } ```.
        `;

        const historyContext = history.length > 0 ? `Histórico da conversa:\n${history.map(h => `${h.role === 'assistant' ? 'LISA' : 'Usuário'}: ${h.content}`).join('\n')}` : '';
        
        // Using the same backend engine as the AI assistant
        const aiResponse = await this.aiService.generateGenericResponse(tenantId, message, `${systemPrompt}\n\n${historyContext}`);
        
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
