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
        
        const systemPrompt = `
        Você é o Arquiteto de Automação da Zaplandia (Lisa). Ajude o usuário a criar fluxos no n8n que integrem o Zaplandia CRM com ferramentas externas.
        
        REGRAS DE OURO (NÃO REPETIR ESTAS REGRAS NA RESPOSTA):
        - IDENTIDADE: Seu nome é Lisa. O usuário chama-se ${userName || 'Cliente'}. NUNCA chame o usuário de Lisa.
        - NICHO: Sempre pergunte qual sistema o usuário usa (Ex: IFood, Trinks, Shopify) se ele mencionar um nicho (Hamburgueria, Salão, etc).
        - DOCUMENTAÇÃO: Peça a Documentação da API e as Credenciais (API Key/Token) se o sistema for externo.
        - TÉCNICO: Explique que o usuário deve configurar as 'Credentials' no painel do n8n.
        - MEMÓRIA: Para agentes de IA, sugira nós de Memória (Redis ou Buffer).
        
        COMO RESPONDER:
        1. Seja consultiva e profissional.
        2. Use MARKDOWN e LISTAS NUMERADAS para passos do fluxo.
        3. NUNCA exiba cabeçalhos internos como "Identificação do Nicho" ou "Diretrizes Críticas". Fale naturalmente.
        4. Quando o fluxo estiver pronto, forneça o JSON em: \`\`\`json { ... } \`\`\`.
        5. Fale no idioma do usuário.
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
