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

        // 0. Campaign Status Check (Critical for Pausing)
        if (campaignId) {
            const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });

            // If campaign doesn't exist or is in a terminal state, stop job
            if (!campaign || campaign.status === 'failed' || campaign.status === 'completed') {
                this.logger.log(`[CANCELADO] Job abortado: Campanha ${campaignId} está ${campaign?.status || 'inexistente'}.`);
                return;
            }

            // If paused, wait indefinitely (check every 5 min)
            if (campaign.status === 'paused') {
                const waitTime = 5 * 60 * 1000;
                this.logger.log(`[PAUSADO] Campanha ${campaignId} em pausa. O envio só continuará quando você der PLAY.`);
                await (job as any).moveToDelayed(Date.now() + waitTime);
                return;
            }
        }

        // 0.1 Lead Status Check (Prevent Duplicates on Resume)
        let leadToProcess: CampaignLead | null = null;
        if (leadId) {
            leadToProcess = await this.leadRepository.findOne({ where: { id: leadId } });
            if (!leadToProcess || leadToProcess.status !== 'pending') {
                this.logger.log(`[IGNORADO] Lead ${leadId} já foi processado ou enviado (${leadToProcess?.status}). Cancelando job duplicado.`);
                return;
            }
        }

        // 0.2 CRM Stage Check (Hyper-Restrictive Safety)
        if (externalId && tenantId) {
            const contact = await this.crmService.findOneByExternalId(tenantId, externalId);
            const isColdStage = !contact || ['NOVO', 'LEAD'].includes(contact.stage?.toUpperCase() || '');

            if (!isColdStage) {
                this.logger.log(`[BLOQUEADO] Lead ${externalId} já está em estágio ativo (${contact.stage}). Abortando automático para preservar atendimento humano.`);
                if (leadToProcess) {
                    leadToProcess.status = LeadStatus.SENT;
                    await this.leadRepository.save(leadToProcess);
                }
                return;
            }
        }

        this.logger.log(`[CAMPANHA] Processando lead ${leadName || leadToProcess?.name || leadId} (${externalId}) via ${instanceName}`);

        if (!instanceName || (!message && (!variations || variations.length === 0))) {
            this.logger.error(`[ERRO] Instância ou mensagem ausente para o job ${job.id}`);
            return;
        }

        // 1. Hard Daily Limit Check (40 Messages)
        if (!this.checkRateLimit(instanceName)) {
            this.logger.warn(`[LIMITE] Limite de 40 mensagens atingido em ${instanceName}. Parando disparos por hoje.`);
            // Move to tomorrow (24h)
            await (job as any).moveToDelayed(Date.now() + 24 * 60 * 60 * 1000);
            return;
        }

        // 2. Random Delay (Organic Human Staggering: 30s to 5min)
        // User requested: 30s, 2m, 5m, 1m variations.
        // We use a wide random spread: 30,000ms to 300,000ms
        const minDelay = 30 * 1000;
        const maxDelay = 300 * 1000;
        const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

        this.logger.log(`[AGUARDANDO] Intervalo orgânico (Anti-Ban): Esperando ${Math.round(randomDelay / 1000)}s antes do disparo...`);
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
        const cleanRecipient = recipient.replace(/\D/g, '');

        try {
            this.logger.log(`[ENVIANDO] Disparando mensagem para ${cleanRecipient}...`);
            await this.evolutionApiService.sendText(tenantId, instanceName, cleanRecipient, finalMessage);

            // Update Lead Status
            if (leadId) {
                await this.leadRepository.update(leadId, { status: LeadStatus.SENT, sentAt: new Date(), errorReason: null });
            }

            // Update Contact Pipeline Stage (Automated)
            let cId = contactId;
            if (!cId && tenantId && cleanRecipient) {
                const contact = await this.crmService.findOneByExternalId(tenantId, cleanRecipient);
                if (contact) cId = contact.id;
            }

            if (cId) {
                await this.crmService.updateContact(tenantId, cId, { stage: 'CONTACTED' });
                this.logger.log(`[CRM] Lead ${cleanRecipient} atualizado para estágio 'PRIMEIRO CONTATO'`);
            }

            // Increment Counter
            this.incrementCounter(instanceName);

            this.logger.log(`[SUCESSO] Mensagem enviada com sucesso para ${cleanRecipient}`);
        } catch (error) {
            const errorMsg = error.message.toLowerCase();
            this.logger.error(`[FALHA] Erro ao enviar para ${cleanRecipient}: ${error.message}`);

            if (leadId) {
                // If it's a "does not exist" error, mark as INVALID instead of FAILED
                const isInvalid = errorMsg.includes('does not exist') || errorMsg.includes('not found') || errorMsg.includes('exists":false');
                const newStatus = isInvalid ? LeadStatus.INVALID : LeadStatus.FAILED;

                await this.leadRepository.update(leadId, {
                    status: newStatus,
                    errorReason: error.message
                });

                this.logger.warn(`[CAMPANHA] Lead ${cleanRecipient} marcado como ${newStatus.toUpperCase()}`);
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
