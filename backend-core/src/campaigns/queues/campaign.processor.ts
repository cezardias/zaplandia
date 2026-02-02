import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EvolutionApiService } from '../../integrations/evolution-api.service';
import { IntegrationsService } from '../../integrations/integrations.service';
import { CrmService } from '../../crm/crm.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CampaignLead, LeadStatus } from '../entities/campaign-lead.entity';
import { Campaign } from '../entities/campaign.entity';
import { Repository } from 'typeorm';

@Processor('campaign-queue')
export class CampaignProcessor {
    private readonly logger = new Logger(CampaignProcessor.name);
    // Simple in-memory tracker fallback (ideally use Redis)
    private dailyCounts: Record<string, { date: string, count: number }> = {};
    private readonly MAX_DAILY_LIMIT = 40;

    constructor(
        private readonly integrationsService: IntegrationsService,
        private readonly evolutionApiService: EvolutionApiService,
        private readonly crmService: CrmService,
        @InjectRepository(Campaign)
        private campaignRepository: Repository<Campaign>,
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
    ) { }

    @Process('send-message')
    async handleSendMessage(job: Job) {
        const { leadId, contactId, campaignId, externalId, message, instanceName, tenantId, variations, leadName } = job.data;
        this.logger.log(`[CAMPANHA] Processando lead ${leadName || leadId} (${externalId})`);

        if (!instanceName || (!message && (!variations || variations.length === 0))) {
            this.logger.error(`[ERRO] Instância ou mensagem ausente para o job ${job.id}`);
            return;
        }

        // 1. Rate Limiting Check
        if (!this.checkRateLimit(instanceName)) {
            this.logger.warn(`[LIMITE] Limite diário de ${this.MAX_DAILY_LIMIT} mensagens atingido para ${instanceName}. O envio continuará automaticamente amanhã.`);
            // Delay for 24 hours (in milliseconds)
            await (job as any).moveToDelayed(Date.now() + 24 * 60 * 60 * 1000);
            return;
        }

        // Fetch campaign to check status
        if (campaignId) {
            const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
            if (campaign && campaign.status === 'paused') {
                this.logger.warn(`[PAUSADO] Campanha ${campaignId} está pausada. Retentando em 1 min...`);
                await (job as any).moveToDelayed(60000); // Check again in 1 min
                return;
            }
        }

        // 2. Random Delay (Anti-Ban)
        // If it's the first few messages, we can be a bit faster, otherwise standard stagger
        const isFirstBatch = (job.id as any) < 5;
        const randomDelay = isFirstBatch
            ? Math.floor(Math.random() * 5000) + 1000  // 1-5s for first ones
            : Math.floor(Math.random() * 15000) + 15000; // 15-30s standard stagger

        this.logger.log(`[AGUARDANDO] Esperando ${Math.round(randomDelay / 1000)}s para evitar banimento no WhatsApp...`);
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        // 3. AI Variation & Personalization Logic
        let finalMessage = message;

        // Pick variation if available
        if (variations && Array.isArray(variations) && variations.length > 0) {
            const randomIndex = Math.floor(Math.random() * variations.length);
            finalMessage = variations[randomIndex];
            this.logger.log(`[VARIAÇÃO] Usando variação ${randomIndex + 1} para o contato ${externalId}`);
        }

        // Apply personalization ({{name}}, {{nome}}, etc.)
        const nameToUse = leadName || 'Contato';
        finalMessage = finalMessage.replace(/{{(name|nome|NAME|NOME|Name|Nome)}}/g, nameToUse);

        // Ensure externalId is not empty (it should be the phone number)
        const recipient = externalId || '';
        if (!recipient) {
            this.logger.error(`[ERRO] Lead ${leadId} sem telefone (externalId). Abortando.`);
            if (leadId) await this.leadRepository.update(leadId, { status: LeadStatus.FAILED, errorReason: 'Missing phone' });
            return;
        }

        // 4. Send Message & Metadata Update
        try {
            this.logger.log(`[ENVIANDO] Disparando mensagem para ${recipient}...`);
            await this.evolutionApiService.sendText(tenantId, instanceName, recipient, finalMessage);

            // Update Lead Status
            if (leadId) {
                await this.leadRepository.update(leadId, { status: LeadStatus.SENT, sentAt: new Date() });
            }

            // Update Contact Pipeline Stage (Automated)
            let cId = contactId;
            if (!cId && tenantId && recipient) {
                const contact = await this.crmService.findOneByExternalId(tenantId, recipient);
                if (contact) cId = contact.id;
            }

            if (cId) {
                await this.crmService.updateContact(tenantId, cId, { stage: 'CONTACTED' });
                this.logger.log(`[CRM] Lead ${recipient} atualizado para estágio 'PRIMEIRO CONTATO'`);
            }

            // Increment Counter
            this.incrementCounter(instanceName);

            this.logger.log(`[SUCESSO] Mensagem enviada com sucesso para ${recipient}`);
        } catch (error) {
            this.logger.error(`[FALHA] Erro ao enviar para ${recipient}: ${error.message}`);
            if (leadId) {
                await this.leadRepository.update(leadId, { status: LeadStatus.FAILED, errorReason: error.message });
            }
            throw error;
        }
    }

    private checkRateLimit(instanceName: string): boolean {
        const today = new Date().toISOString().split('T')[0];
        if (!this.dailyCounts[instanceName] || this.dailyCounts[instanceName].date !== today) {
            this.dailyCounts[instanceName] = { date: today, count: 0 };
        }

        if (this.dailyCounts[instanceName].count >= this.MAX_DAILY_LIMIT) {
            return false;
        }
        return true;
    }

    private incrementCounter(instanceName: string) {
        const today = new Date().toISOString().split('T')[0];
        if (!this.dailyCounts[instanceName] || this.dailyCounts[instanceName].date !== today) {
            this.dailyCounts[instanceName] = { date: today, count: 0 };
        }
        this.dailyCounts[instanceName].count++;
        this.logger.log(`Daily count for ${instanceName}: ${this.dailyCounts[instanceName].count}/${this.MAX_DAILY_LIMIT}`);
    }
}
