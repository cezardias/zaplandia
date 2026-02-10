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
var CampaignsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const campaign_entity_1 = require("./entities/campaign.entity");
const contact_list_entity_1 = require("./entities/contact-list.entity");
const campaign_lead_entity_1 = require("./entities/campaign-lead.entity");
const crm_service_1 = require("../crm/crm.service");
const integrations_service_1 = require("../integrations/integrations.service");
const bull_1 = require("@nestjs/bull");
const audit_service_1 = require("../audit/audit.service");
const usage_service_1 = require("../usage/usage.service");
const integration_entity_1 = require("../integrations/entities/integration.entity");
let CampaignsService = CampaignsService_1 = class CampaignsService {
    campaignRepository;
    leadRepository;
    contactListRepository;
    crmService;
    integrationsService;
    campaignQueue;
    usageService;
    auditService;
    logger = new common_1.Logger(CampaignsService_1.name);
    constructor(campaignRepository, leadRepository, contactListRepository, crmService, integrationsService, campaignQueue, usageService, auditService) {
        this.campaignRepository = campaignRepository;
        this.leadRepository = leadRepository;
        this.contactListRepository = contactListRepository;
        this.crmService = crmService;
        this.integrationsService = integrationsService;
        this.campaignQueue = campaignQueue;
        this.usageService = usageService;
        this.auditService = auditService;
    }
    async resolveInstanceName(integrationId, tenantId) {
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(integrationId);
        if (isUuid) {
            const integration = await this.integrationsService.findOne(integrationId, tenantId);
            if (!integration)
                return null;
            const val = integration.credentials?.instanceName ||
                integration.settings?.instanceName ||
                integration.credentials?.name ||
                integration.credentials?.instance ||
                integration.settings?.name || null;
            return val ? val.trim() : null;
        }
        return integrationId.trim();
    }
    async createContactList(tenantId, name, contacts) {
        const list = this.contactListRepository.create({
            tenantId,
            name,
            contacts
        });
        return this.contactListRepository.save(list);
    }
    async getContactLists(tenantId) {
        return this.contactListRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' }
        });
    }
    async removeContactList(id, tenantId) {
        const list = await this.contactListRepository.findOne({ where: { id, tenantId } });
        if (list) {
            return this.contactListRepository.remove(list);
        }
    }
    async updateContactList(id, tenantId, data) {
        const list = await this.contactListRepository.findOne({ where: { id, tenantId } });
        if (list) {
            list.name = data.name;
            if (data.contacts) {
                list.contacts = data.contacts;
            }
            return this.contactListRepository.save(list);
        }
        return null;
    }
    async start(id, tenantId, userId) {
        const campaign = await this.findOne(id, tenantId);
        if (!campaign)
            throw new Error('Campanha não encontrada.');
        if (campaign.status === campaign_entity_1.CampaignStatus.RUNNING)
            throw new Error('Campanha já está rodando.');
        const integration = await this.integrationsService.findOne(campaign.integrationId, tenantId);
        let dailyLimit = 40;
        let instanceName = 'unknown';
        if (integration) {
            const provider = integration.provider;
            if (provider === integration_entity_1.IntegrationProvider.EVOLUTION) {
                dailyLimit = 40;
            }
            else if (provider === integration_entity_1.IntegrationProvider.WHATSAPP) {
                dailyLimit = 1000;
            }
            else {
                dailyLimit = 1000;
            }
            instanceName = await this.resolveInstanceName(campaign.integrationId, tenantId) || 'unknown';
        }
        else {
            instanceName = await this.resolveInstanceName(campaign.integrationId, tenantId) || 'unknown';
        }
        if (!instanceName || instanceName === 'unknown') {
            this.logger.error(`[MOTOR] Falha ao resolver instanceName para campanha ${id}. integrationId: ${campaign.integrationId}`);
            throw new Error('Nome da instância não encontrado na integração.');
        }
        this.logger.log(`[MOTOR] Campanha ${id} resolvida para instância: ${instanceName}. Limite Diário: ${dailyLimit}`);
        const remainingQuota = await this.usageService.getRemainingQuota(tenantId, instanceName, 'whatsapp_messages', dailyLimit);
        if (remainingQuota <= 0) {
            throw new Error(`Limite diário de ${dailyLimit} envios já atingido para a instância ${instanceName}. Tente novamente amanhã.`);
        }
        const leads = await this.leadRepository.find({
            where: { campaignId: id, status: campaign_lead_entity_1.LeadStatus.PENDING },
            take: remainingQuota
        });
        if (!leads || leads.length === 0) {
            const totalLeads = await this.leadRepository.count({ where: { campaignId: id } });
            const pendingLeads = await this.leadRepository.count({ where: { campaignId: id, status: campaign_lead_entity_1.LeadStatus.PENDING } });
            if (totalLeads === 0) {
                throw new Error('A campanha está vazia! Adicione leads antes de iniciar.');
            }
            if (pendingLeads === 0 && totalLeads > 0) {
                const failed = await this.leadRepository.count({ where: { campaignId: id, status: campaign_lead_entity_1.LeadStatus.FAILED } });
                const sent = await this.leadRepository.count({ where: { campaignId: id, status: campaign_lead_entity_1.LeadStatus.SENT } });
                throw new Error(`Todos os ${totalLeads} leads desta campanha já foram processados (Enviados: ${sent}, Falhas: ${failed}). Para reenviar, você precisa recriar a campanha ou reiniciar os leads.`);
            }
            throw new Error(`Não foi possível buscar leads pendentes (Cota: ${remainingQuota}, Pendentes: ${pendingLeads}).`);
        }
        this.logger.log(`[MOTOR] Cota restante: ${remainingQuota}. Leads pendentes encontrados: ${leads.length}. Processando lote...`);
        await this.usageService.checkAndReserve(tenantId, instanceName, 'whatsapp_messages', leads.length, dailyLimit);
        campaign.status = campaign_entity_1.CampaignStatus.RUNNING;
        await this.campaignRepository.save(campaign);
        if (userId) {
            await this.auditService.log(tenantId, userId, 'CAMPAIGN_START', {
                campaignId: id,
                campaignName: campaign.name,
                leadsCount: leads.length,
                instanceName
            });
        }
        this.logger.log(`[MOTOR] Iniciando campanha ${id} (${campaign.name}). Enfileirando ${leads.length} leads...`);
        const STAGGER_MS = 30 * 1000;
        const CHUNK_SIZE = 50;
        for (let i = 0; i < leads.length; i += CHUNK_SIZE) {
            const chunk = leads.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (lead, chunkIndex) => {
                const globalIndex = i + chunkIndex;
                const delay = globalIndex * STAGGER_MS;
                await this.campaignQueue.add('send-message', {
                    leadId: lead.id,
                    leadName: lead.name,
                    campaignId: id,
                    externalId: lead.externalId,
                    message: campaign.messageTemplate,
                    instanceName: instanceName,
                    tenantId: tenantId,
                    variations: campaign.variations,
                    dailyLimit: dailyLimit,
                    isFirst: globalIndex === 0
                }, {
                    removeOnComplete: true,
                    attempts: 3,
                    backoff: 5000,
                    delay: delay
                });
            }));
            this.logger.log(`[QUEUE] Lote ${Math.floor(i / CHUNK_SIZE) + 1} de ${Math.ceil(leads.length / CHUNK_SIZE)} enfileirado.`);
        }
        this.logger.log(`[SUCESSO] Campanha ${id} iniciada com sucesso.`);
        return campaign;
    }
    async pause(id, tenantId) {
        const campaign = await this.findOne(id, tenantId);
        if (!campaign)
            throw new Error('Campanha não encontrada.');
        campaign.status = campaign_entity_1.CampaignStatus.PAUSED;
        await this.campaignRepository.save(campaign);
        this.logger.log(`[MOTOR] Campanha ${id} pausada pelo usuário.`);
        return campaign;
    }
    async findAllByTenant(tenantId) {
        return this.campaignRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
        });
    }
    extractLeadName(l) {
        const nameKeys = ['title', 'titulo', 'name', 'nome', 'fullname', 'nomecompleto', 'nome_completo', 'full_name', 'contato', 'público', 'publico', 'Name', 'Nome', 'Razão Social', 'razao_social'];
        const foundKey = Object.keys(l).find(k => nameKeys.some(nk => nk.toLowerCase() === k.toLowerCase().trim()));
        if (foundKey && l[foundKey] && String(l[foundKey]).trim().toLowerCase() !== 'contato' && String(l[foundKey]).trim() !== '') {
            return String(l[foundKey]).trim();
        }
        const fallback = l.name || l.nome || l.Name || l.Nome;
        if (fallback && String(fallback).trim().toLowerCase() !== 'contato' && String(fallback).trim() !== '') {
            return String(fallback).trim();
        }
        const looseKey = Object.keys(l).find(k => k.toLowerCase().includes('nome') || k.toLowerCase().includes('name'));
        if (looseKey && l[looseKey] && String(looseKey).trim() !== '') {
            return String(l[looseKey]).trim();
        }
        return 'Contato';
    }
    normalizePhoneNumber(raw) {
        let sanitized = raw.replace(/\D/g, '');
        if (sanitized.startsWith('0'))
            sanitized = sanitized.substring(1);
        if (sanitized.length === 10 || sanitized.length === 11) {
            sanitized = '55' + sanitized;
        }
        return sanitized;
    }
    extractPhoneNumber(l) {
        const phoneKeys = [
            'phoneNumber', 'telefone', 'phone', 'celular', 'externalId', 'whatsapp', 'wa', 'number', 'numero', 'tel', 'cell',
            'Phone', 'Telefone', 'Celular', 'Número', 'Numero', 'WhatsApp', 'Público', 'Publico'
        ];
        const foundKey = Object.keys(l).find(k => phoneKeys.some(pk => pk.toLowerCase() === k.toLowerCase().trim()));
        if (foundKey && l[foundKey]) {
            const normalized = this.normalizePhoneNumber(String(l[foundKey]));
            if (normalized.length >= 8)
                return normalized;
        }
        const looseKey = Object.keys(l).find(k => {
            const lowKey = k.toLowerCase();
            return lowKey.includes('tel') || lowKey.includes('phone') || lowKey.includes('cel') || lowKey.includes('zap') || lowKey.includes('num');
        });
        if (looseKey && l[looseKey]) {
            const normalized = this.normalizePhoneNumber(String(l[looseKey]));
            if (normalized.length >= 8)
                return normalized;
        }
        return '';
    }
    async create(tenantId, data) {
        try {
            const campaignData = {
                name: data.name,
                channels: data.channels,
                messageTemplate: data.messageTemplate,
                integrationId: data.integrationId,
                status: campaign_entity_1.CampaignStatus.PAUSED,
                tenantId,
                variations: data.variations
            };
            const campaign = this.campaignRepository.create(campaignData);
            const saved = await this.campaignRepository.save(campaign);
            const campaignId = saved.id;
            let instanceName = 'default';
            if (data.integrationId) {
                const resolved = await this.resolveInstanceName(data.integrationId, tenantId);
                if (resolved)
                    instanceName = resolved;
            }
            let leadsToProcess = [];
            if (data.leads && Array.isArray(data.leads)) {
                const leadsData = data.leads;
                const chunkSize = 50;
                for (let i = 0; i < leadsData.length; i += chunkSize) {
                    const chunk = leadsData.slice(i, i + chunkSize);
                    await Promise.all(chunk.map(l => {
                        const name = this.extractLeadName(l);
                        const phone = this.extractPhoneNumber(l);
                        if (!phone)
                            return Promise.resolve();
                        return this.crmService.ensureContact(tenantId, {
                            name: name,
                            phoneNumber: phone,
                            externalId: phone,
                            instance: instanceName
                        }, { forceStage: 'NOVO' });
                    }));
                    const leadsToCreate = chunk.map(l => {
                        const name = this.extractLeadName(l);
                        const phone = this.extractPhoneNumber(l);
                        if (!phone) {
                            this.logger.warn(`Lead sem telefone ignorado na importação: ${name}`);
                            return null;
                        }
                        return this.leadRepository.create({
                            name: name,
                            externalId: phone,
                            campaignId: campaignId,
                            status: campaign_lead_entity_1.LeadStatus.PENDING
                        });
                    }).filter(l => l !== null);
                    const savedLeads = await this.leadRepository.save(leadsToCreate);
                    leadsToProcess.push(...savedLeads);
                }
                this.logger.log(`Created ${leadsToProcess.length} leads for campaign ${campaignId}`);
            }
            else if (data.useExistingContacts) {
                const filters = data.filters || {};
                const contacts = await this.crmService.findAllByTenant(tenantId, filters);
                if (contacts.length > 0) {
                    let filteredContacts = contacts;
                    if (data.integrationId) {
                        filteredContacts = await this.crmService.findAllByTenant(tenantId, {
                            ...filters,
                            instance: data.integrationId
                        });
                    }
                    const leadsToCreateEntities = filteredContacts.map(c => {
                        const phone = c.externalId || c.phoneNumber || '';
                        if (!phone)
                            return null;
                        return this.leadRepository.create({
                            name: c.name || 'Contato',
                            externalId: phone,
                            campaignId: campaignId,
                            status: campaign_lead_entity_1.LeadStatus.PENDING
                        });
                    }).filter(l => l !== null);
                    const chunkSize = 500;
                    for (let i = 0; i < leadsToCreateEntities.length; i += chunkSize) {
                        const chunk = leadsToCreateEntities.slice(i, i + chunkSize);
                        const savedChunk = await this.leadRepository.save(chunk);
                        leadsToProcess.push(...savedChunk);
                    }
                    this.logger.log(`Created ${leadsToProcess.length} leads from contacts for campaign ${campaignId}`);
                }
            }
            if (leadsToProcess.length === 0) {
                throw new Error('Nenhum lead encontrado para esta campanha. Verifique o arquivo ou os filtros.');
            }
            return {
                id: saved.id,
                name: saved.name,
                status: saved.status,
                channels: saved.channels,
                messageTemplate: saved.messageTemplate,
                createdAt: saved.createdAt
            };
        }
        catch (error) {
            this.logger.error(`Error creating campaign: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findOne(id, tenantId) {
        return this.campaignRepository.findOne({
            where: { id, tenantId },
            relations: ['leads'],
        });
    }
    async updateStatus(id, tenantId, status) {
        if (status === campaign_entity_1.CampaignStatus.RUNNING) {
            return this.start(id, tenantId);
        }
        const campaign = await this.findOne(id, tenantId);
        if (campaign) {
            campaign.status = status;
            return this.campaignRepository.save(campaign);
        }
        return null;
    }
    async update(id, tenantId, data) {
        return this.campaignRepository.update({ id, tenantId }, {
            name: data.name,
            channels: data.channels,
            integrationId: data.integrationId,
            messageTemplate: data.messageTemplate,
            variations: data.variations
        });
    }
    async remove(id, tenantId) {
        const campaign = await this.findOne(id, tenantId);
        if (campaign) {
            await this.leadRepository.delete({ campaignId: id });
            return this.campaignRepository.remove(campaign);
        }
    }
    async getReportStats(tenantId, campaignId) {
        const query = this.leadRepository.createQueryBuilder('lead')
            .select('lead.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .innerJoin('lead.campaign', 'campaign')
            .where('campaign.tenantId = :tenantId', { tenantId });
        if (campaignId && campaignId !== 'all') {
            query.andWhere('lead.campaignId = :campaignId', { campaignId });
        }
        const rawStats = await query.groupBy('lead.status').getRawMany();
        const stats = {
            total: 0,
            pending: 0,
            sent: 0,
            failed: 0,
            invalid: 0
        };
        rawStats.forEach(s => {
            const count = parseInt(s.count, 10);
            stats.total += count;
            const status = s.status.toLowerCase();
            if (stats[status] !== undefined) {
                stats[status] += count;
            }
            else if (status === 'error' || status === 'unavailable') {
                stats.failed += count;
            }
        });
        return {
            added: stats.total,
            sent: stats.sent,
            notSent: stats.total - stats.sent,
            details: stats
        };
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = CampaignsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __param(1, (0, typeorm_1.InjectRepository)(campaign_lead_entity_1.CampaignLead)),
    __param(2, (0, typeorm_1.InjectRepository)(contact_list_entity_1.ContactList)),
    __param(5, (0, bull_1.InjectQueue)('campaign-queue')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        crm_service_1.CrmService,
        integrations_service_1.IntegrationsService, Object, usage_service_1.UsageService,
        audit_service_1.AuditService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map