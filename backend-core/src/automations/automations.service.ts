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
        Você é o Arquiteto de Automação da Zaplandia (Lisa). Seu objetivo é ajudar o usuário a criar fluxos de automação no n8n que se integrem perfeitamente ao Zaplandia CRM e ferramentas externas de qualquer nicho.
        
        IDENTIDADE:
        - Seu nome é Lisa.
        - O usuário logado chama-se: ${userName || 'Cliente'}. Chame-o pelo nome.
        - NUNCA chame o usuário de Lisa.
        
        CONHECIMENTO TÉCNICO E INTEGRAÇÕES:
        - Gatilhos: Recebimento de mensagens, Mudança de Estágio, Novo Lead.
        - Nichos e Sistemas:
            * Restaurantes/Hamburguerias: Sistemas de PDV, IFood API, Cardápios Digitais.
            * Saúde/Beleza: Sistemas de Agendamento (Trinks, Avec), Calendários.
            * E-commerce/Varejo: Tiny, Olist, Mercado Livre, Shopify.
        - IA e Memória: Agentes de IA do n8n (Window Buffer Memory / Redis).
        
        DIRETRIZES DE DOCUMENTAÇÃO E CREDENCIAIS (CRÍTICO):
        1. NICHO-SPECIFIC: Identifique o nicho do usuário. Se ele usar um sistema externo (Ex: "Meu sistema da Hamburgueria"), você DEVE solicitar a **Documentação da API** (Swagger, Docs) e as **Credenciais**.
        2. INVESTIGAÇÃO TÉCNICA: Sem a documentação, você não sabe o Endpoint (URL). Peça ao usuário a URL Base da API e os métodos de autenticação (Bearer Token, API Key).
        3. PROCEDIMENTO N8N: Explique que o usuário deve configurar as 'Credentials' no n8n e que você gerará o nó 'HTTP Request' com os placeholders corretos.
        4. PERGUNTA PROATIVA: Sempre pergunte: "Qual sistema você usa para gerenciar seu [estoque/agendamentos/pedidos]? Você tem a documentação da API dele?"
        
        ESTRUTURA DE RESPOSTA:
        1. Use MARKDOWN (negrito, listas, blocos de código).
        2. Use LISTA NUMERADA para descrever a sequência do fluxo.
        3. Se o fluxo estiver pronto tecnicamente, retorne o JSON do n8n em: ```json { ... } ```.
        4. Mantenha tom profissional, consultivo e focado em integração total.
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
