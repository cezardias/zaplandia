"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CampaignProcessor_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const evolution_api_service_1 = require("../../integrations/evolution-api.service");
const integrations_service_1 = require("../../integrations/integrations.service");
const crm_service_1 = require("../../crm/crm.service");
const typeorm_1 = require("@nestjs/typeorm");
const campaign_lead_entity_1 = require("../entities/campaign-lead.entity");
const campaign_entity_1 = require("../entities/campaign.entity");
const typeorm_2 = require("typeorm");
let CampaignProcessor = CampaignProcessor_1 = class CampaignProcessor {
    integrationsService;
    evolutionApiService;
    crmService;
    campaignRepository;
    leadRepository;
    logger = new common_1.Logger(CampaignProcessor_1.name);
    dailyCounts = {};
    MAX_DAILY_LIMIT = 40;
    constructor(integrationsService, evolutionApiService, crmService, campaignRepository, leadRepository) {
        this.integrationsService = integrationsService;
        this.evolutionApiService = evolutionApiService;
        this.crmService = crmService;
        this.campaignRepository = campaignRepository;
        this.leadRepository = leadRepository;
    }
    async handleSendMessage(job) {
        this.logger.log(`[JOB_RECEIVED] Job ${job.id} recebido pelo processador.`);
        const { leadId, contactId, campaignId, externalId, message, instanceName, tenantId, variations, leadName } = job.data;
        if (campaignId) {
            const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
            if (!campaign || campaign.status === 'failed' || campaign.status === 'completed') {
                this.logger.log(`[CANCELADO] Job abortado: Campanha ${campaignId} está ${campaign?.status || 'inexistente'}.`);
                return;
            }
            if (campaign.status === 'paused') {
                const waitTime = 5 * 60 * 1000;
                this.logger.log(`[PAUSADO] Campanha ${campaignId} em pausa. O envio só continuará quando você der PLAY.`);
                await job.moveToDelayed(Date.now() + waitTime);
                return;
            }
        }
        let leadToProcess = null;
        if (leadId) {
            leadToProcess = await this.leadRepository.findOne({ where: { id: leadId } });
            if (!leadToProcess || leadToProcess.status !== 'pending') {
                this.logger.log(`[IGNORADO] Lead ${leadId} já foi processado ou enviado (${leadToProcess?.status}). Cancelando job duplicado.`);
                return;
            }
        }
        if (externalId && tenantId) {
            const contact = await this.crmService.findOneByExternalId(tenantId, externalId);
            const isColdStage = !contact || ['NOVO', 'LEAD'].includes(contact.stage?.toUpperCase() || '');
            if (!isColdStage) {
                this.logger.log(`[BLOQUEADO] Lead ${externalId} já está em estágio ativo (${contact.stage}). Abortando automático para preservar atendimento humano.`);
                if (leadToProcess) {
                    leadToProcess.status = campaign_lead_entity_1.LeadStatus.SENT;
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
        if (!this.checkRateLimit(instanceName)) {
            this.logger.warn(`[LIMITE] Limite de 40 mensagens atingido em ${instanceName}. Parando disparos por hoje.`);
            await job.moveToDelayed(Date.now() + 24 * 60 * 60 * 1000);
            return;
        }
        const isFirstMessage = job.data.isFirst === true;
        if (isFirstMessage) {
            this.logger.log(`[PRIORIDADE] Este é o primeiro lead da campanha. Enviando IMEDIATAMENTE! 🚀`);
        }
        else {
            const minDelay = 30 * 1000;
            const maxDelay = 300 * 1000;
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            this.logger.log(`[AGUARDANDO] Intervalo orgânico (Anti-Ban): Esperando ${Math.round(randomDelay / 1000)}s antes do disparo...`);
            await new Promise(resolve => setTimeout(resolve, randomDelay));
        }
        let finalMessage = message;
        if (variations && Array.isArray(variations) && variations.length > 0) {
            const randomIndex = Math.floor(Math.random() * variations.length);
            finalMessage = variations[randomIndex];
            this.logger.log(`[VARIAÇÃO] Usando variação ${randomIndex + 1} para o contato ${externalId}`);
        }
        const nameToUse = leadName || 'Contato';
        finalMessage = finalMessage.replace(/{{(name|nome|NAME|NOME|Name|Nome)}}/g, nameToUse);
        const recipient = externalId || '';
        if (!recipient) {
            this.logger.error(`[ERRO] Lead ${leadId} sem telefone (externalId). Abortando.`);
            if (leadId)
                await this.leadRepository.update(leadId, { status: campaign_lead_entity_1.LeadStatus.FAILED, errorReason: 'Missing phone' });
            return;
        }
        const cleanRecipient = recipient.replace(/\D/g, '');
        try {
            this.logger.log(`[ENVIANDO] Disparando mensagem para ${cleanRecipient}...`);
            await this.evolutionApiService.sendText(tenantId, instanceName, cleanRecipient, finalMessage);
            if (leadId) {
                await this.leadRepository.update(leadId, { status: campaign_lead_entity_1.LeadStatus.SENT, sentAt: new Date(), errorReason: null });
            }
            let cId = contactId;
            if (!cId && tenantId && cleanRecipient) {
                const contact = await this.crmService.findOneByExternalId(tenantId, cleanRecipient);
                if (contact)
                    cId = contact.id;
            }
            if (cId) {
                await this.crmService.updateContact(tenantId, cId, { stage: 'CONTACTED', instance: instanceName });
                this.logger.log(`[CRM] Lead ${cleanRecipient} atualizado para estágio 'CONTACTED' e instância '${instanceName}'`);
            }
            this.incrementCounter(instanceName);
            this.logger.log(`[SUCESSO] Mensagem enviada com sucesso para ${cleanRecipient}`);
        }
        catch (error) {
            const errorMsg = error.message.toLowerCase();
            this.logger.error(`[FALHA] Erro ao enviar para ${cleanRecipient}: ${error.message}`);
            if (leadId) {
                const isInvalid = errorMsg.includes('does not exist') || errorMsg.includes('not found') || errorMsg.includes('exists":false');
                const newStatus = isInvalid ? campaign_lead_entity_1.LeadStatus.INVALID : campaign_lead_entity_1.LeadStatus.FAILED;
                await this.leadRepository.update(leadId, {
                    status: newStatus,
                    errorReason: error.message
                });
                this.logger.warn(`[CAMPANHA] Lead ${cleanRecipient} marcado como ${newStatus.toUpperCase()}`);
            }
            throw error;
        }
    }
    checkRateLimit(instanceName) {
        const today = new Date().toISOString().split('T')[0];
        if (!this.dailyCounts[instanceName] || this.dailyCounts[instanceName].date !== today) {
            this.dailyCounts[instanceName] = { date: today, count: 0 };
        }
        if (this.dailyCounts[instanceName].count >= this.MAX_DAILY_LIMIT) {
            return false;
        }
        return true;
    }
    incrementCounter(instanceName) {
        const today = new Date().toISOString().split('T')[0];
        if (!this.dailyCounts[instanceName] || this.dailyCounts[instanceName].date !== today) {
            this.dailyCounts[instanceName] = { date: today, count: 0 };
        }
        this.dailyCounts[instanceName].count++;
        this.logger.log(`Daily count for ${instanceName}: ${this.dailyCounts[instanceName].count}/${this.MAX_DAILY_LIMIT}`);
    }
};
exports.CampaignProcessor = CampaignProcessor;
__decorate([
    (0, bull_1.Process)('send-message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CampaignProcessor.prototype, "handleSendMessage", null);
exports.CampaignProcessor = CampaignProcessor = CampaignProcessor_1 = __decorate([
    (0, bull_1.Processor)('campaign-queue'),
    __param(3, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __param(4, (0, typeorm_1.InjectRepository)(campaign_lead_entity_1.CampaignLead)),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService,
        evolution_api_service_1.EvolutionApiService,
        crm_service_1.CrmService, typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], CampaignProcessor);
//# sourceMappingURL=campaign.processor.js.map