"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CrmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crm_entity_1 = require("./entities/crm.entity");
const campaign_lead_entity_1 = require("../campaigns/entities/campaign-lead.entity");
const campaign_entity_1 = require("../campaigns/entities/campaign.entity");
const n8n_service_1 = require("../integrations/n8n.service");
const integrations_service_1 = require("../integrations/integrations.service");
const evolution_api_service_1 = require("../integrations/evolution-api.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let CrmService = CrmService_1 = class CrmService {
    contactRepository;
    messageRepository;
    leadRepository;
    campaignRepository;
    n8nService;
    integrationsService;
    evolutionApiService;
    logger = new common_1.Logger(CrmService_1.name);
    constructor(contactRepository, messageRepository, leadRepository, campaignRepository, n8nService, integrationsService, evolutionApiService) {
        this.contactRepository = contactRepository;
        this.messageRepository = messageRepository;
        this.leadRepository = leadRepository;
        this.campaignRepository = campaignRepository;
        this.n8nService = n8nService;
        this.integrationsService = integrationsService;
        this.evolutionApiService = evolutionApiService;
    }
    async onApplicationBootstrap() {
        this.logger.log('Checking for messages that need instance backfill...');
        try {
            await this.messageRepository.query(`
                UPDATE messages
                SET instance = c.instance
                FROM contacts c
                WHERE messages."contactId" = c.id
                AND messages.instance IS NULL
                AND c.instance IS NOT NULL
            `);
            this.logger.log('Automatic backfill of message instances completed.');
        }
        catch (error) {
            this.logger.error('Failed to run automatic backfill:', error);
        }
    }
    async getRecentChats(tenantId, role, filters) {
        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId });
        if (filters?.stage) {
            query.andWhere('contact.stage = :stage', { stage: filters.stage });
        }
        if (filters?.instance && filters.instance !== 'all') {
            let instanceName = filters.instance;
            if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(instanceName)) {
                const integration = await this.integrationsService.findOne(instanceName, tenantId);
                if (integration) {
                    instanceName = integration.credentials?.instanceName || integration.settings?.instanceName || integration.credentials?.name || instanceName;
                }
            }
            else {
                const allIntegrations = await this.integrationsService.findAllByTenant(tenantId);
                const normalizedFilter = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const matchedIntegration = allIntegrations.find(i => {
                    const name = i.credentials?.instanceName || i.settings?.instanceName || i.credentials?.name || '';
                    const normalizedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    return normalizedName === normalizedFilter;
                });
                if (matchedIntegration) {
                    instanceName = matchedIntegration.credentials?.instanceName || matchedIntegration.settings?.instanceName || matchedIntegration.credentials?.name || instanceName;
                }
            }
            let matchingCampaignIds = [];
            const allCampaigns = await this.campaignRepository.find({ where: { tenantId } });
            for (const camp of allCampaigns) {
                if (!camp.integrationId)
                    continue;
                if (camp.integrationId === instanceName) {
                    matchingCampaignIds.push(camp.id);
                    continue;
                }
                if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(camp.integrationId)) {
                    const integration = await this.integrationsService.findOne(camp.integrationId, tenantId);
                    const resolvedName = integration?.credentials?.instanceName || integration?.settings?.instanceName || integration?.credentials?.name || integration?.credentials?.instance || integration?.settings?.name;
                    if (resolvedName) {
                        const rNorm = resolvedName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        if (rNorm === iNorm) {
                            matchingCampaignIds.push(camp.id);
                        }
                    }
                }
                else {
                    const cNorm = camp.integrationId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    if (cNorm === iNorm) {
                        matchingCampaignIds.push(camp.id);
                    }
                }
            }
            let campaignFilter = '';
            let campaignParams = {};
            if (matchingCampaignIds.length > 0) {
                const subQuery = this.leadRepository.createQueryBuilder('cl')
                    .select('1')
                    .where('cl.campaignId IN (:...matchCampIds)')
                    .andWhere(new typeorm_2.Brackets(qb => {
                    qb.where('cl.externalId = contact.externalId')
                        .orWhere('cl.externalId = contact.phoneNumber');
                }))
                    .getQuery();
                query.andWhere(new typeorm_2.Brackets(qb => {
                    qb.where('contact.instance = :instance', { instance: instanceName })
                        .orWhere('contact.instance = :originalInstance', { originalInstance: filters.instance })
                        .orWhere('contact.instance ILIKE :instancePattern', { instancePattern: instanceName })
                        .orWhere(`EXISTS (SELECT 1 FROM messages m WHERE m."contactId" = contact.id AND (m.instance = :instance OR m.instance = :originalInstance))`, { instance: instanceName, originalInstance: filters.instance })
                        .orWhere(new typeorm_2.Brackets(qb2 => {
                        qb2.where("(contact.instance IS NULL OR contact.instance = '' OR contact.instance = 'default' OR contact.instance = 'undefined')")
                            .andWhere(`EXISTS (${subQuery})`, { matchCampIds: matchingCampaignIds });
                    }));
                }));
            }
            else {
                query.andWhere(`(contact.instance = :instance OR contact.instance = :originalInstance OR contact.instance ILIKE :instancePattern OR EXISTS (SELECT 1 FROM messages m WHERE m."contactId" = contact.id AND (m.instance = :instance OR m.instance = :originalInstance)))`, {
                    instance: instanceName,
                    originalInstance: filters.instance,
                    instancePattern: instanceName
                });
            }
        }
        if (filters?.campaignId && filters.campaignId !== '') {
            query.innerJoin('campaign_leads', 'cl', '(cl.externalId = contact.externalId OR cl.externalId = contact.phoneNumber) AND cl.campaignId = :campaignId', { campaignId: filters.campaignId });
        }
        const distinctInstances = await this.contactRepository.createQueryBuilder('c')
            .select('DISTINCT c.instance', 'instance')
            .where('c.tenantId = :tenantId', { tenantId })
            .getRawMany();
        this.logger.debug(`[DEBUG_INSTANCES] Tenant ${tenantId} has instances: ${JSON.stringify(distinctInstances.map(d => d.instance))}`);
        return query.orderBy('contact.updatedAt', 'DESC').getMany();
    }
    async findAllByTenant(tenantId, filters) {
        this.logger.debug(`[FIND_ALL] Tenant: ${tenantId}, Filters: ${JSON.stringify(filters)}`);
        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId });
        if (filters?.instance && filters.instance !== 'all') {
            let instanceName = filters.instance;
            if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(instanceName)) {
                const integration = await this.integrationsService.findOne(instanceName, tenantId);
                if (integration) {
                    instanceName = integration.credentials?.instanceName || integration.settings?.instanceName || integration.credentials?.name || instanceName;
                }
            }
            else {
                const allIntegrations = await this.integrationsService.findAllByTenant(tenantId);
                const normalizedFilter = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const matchedIntegration = allIntegrations.find(i => {
                    const name = i.credentials?.instanceName || i.settings?.instanceName || i.credentials?.name || '';
                    const normalizedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    return normalizedName === normalizedFilter;
                });
                if (matchedIntegration) {
                    instanceName = matchedIntegration.credentials?.instanceName || matchedIntegration.settings?.instanceName || matchedIntegration.credentials?.name || instanceName;
                }
            }
            let matchingCampaignIds = [];
            const allCampaigns = await this.campaignRepository.find({ where: { tenantId } });
            for (const camp of allCampaigns) {
                if (!camp.integrationId)
                    continue;
                if (camp.integrationId === instanceName) {
                    matchingCampaignIds.push(camp.id);
                    continue;
                }
                if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(camp.integrationId)) {
                    const integration = await this.integrationsService.findOne(camp.integrationId, tenantId);
                    const resolvedName = integration?.credentials?.instanceName || integration?.settings?.instanceName || integration?.credentials?.name || integration?.credentials?.instance || integration?.settings?.name;
                    if (resolvedName) {
                        const rNorm = resolvedName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        if (rNorm === iNorm) {
                            matchingCampaignIds.push(camp.id);
                        }
                    }
                }
                else {
                    const cNorm = camp.integrationId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    if (cNorm === iNorm) {
                        matchingCampaignIds.push(camp.id);
                    }
                }
            }
            let campaignFilter = '';
            let campaignParams = {};
            if (filters.campaignId && filters.campaignId !== '' && filters.campaignId !== 'null' && filters.campaignId !== 'undefined') {
                query.andWhere('(contact.instance = :instance OR contact.instance ILIKE :instancePattern OR contact.instance IS NULL)', {
                    instance: instanceName,
                    instancePattern: instanceName
                });
            }
            else {
                if (matchingCampaignIds.length > 0) {
                    const subQuery = this.leadRepository.createQueryBuilder('cl')
                        .select('1')
                        .where('cl.campaignId IN (:...matchCampIds)')
                        .andWhere(new typeorm_2.Brackets(qb => {
                        qb.where('cl.externalId = contact.externalId')
                            .orWhere('cl.externalId = contact.phoneNumber');
                    }))
                        .getQuery();
                    query.andWhere(new typeorm_2.Brackets(qb => {
                        qb.where('contact.instance = :instance', { instance: instanceName })
                            .orWhere('contact.instance ILIKE :instancePattern', { instancePattern: instanceName })
                            .orWhere(`EXISTS (SELECT 1 FROM messages m WHERE m."contactId" = contact.id AND (m.instance = :instance OR m.instance = :instancePattern))`, { instance: instanceName, instancePattern: instanceName })
                            .orWhere(new typeorm_2.Brackets(qb2 => {
                            qb2.where("(contact.instance IS NULL OR contact.instance = '' OR contact.instance = 'default' OR contact.instance = 'undefined')")
                                .andWhere(`EXISTS (${subQuery})`, { matchCampIds: matchingCampaignIds });
                        }));
                    }));
                }
                else {
                    query.andWhere(`(contact.instance = :instance OR contact.instance ILIKE :instancePattern OR EXISTS (SELECT 1 FROM messages m WHERE m."contactId" = contact.id AND (m.instance = :instance OR m.instance = :instancePattern)))`, {
                        instance: instanceName,
                        instancePattern: instanceName
                    });
                }
            }
        }
        if (filters?.stage) {
            query.andWhere('contact.stage = :stage', { stage: filters.stage });
        }
        if (filters?.campaignId && filters.campaignId !== '' && filters.campaignId !== 'null' && filters.campaignId !== 'undefined') {
            this.logger.debug(`[CAMPAIGN_FILTER] Filtering by campaignId: ${filters.campaignId}`);
            query.leftJoin('campaign_leads', 'cl', '(cl.externalId = contact.externalId OR cl.externalId = contact.phoneNumber) AND cl.campaignId = :campaignId', { campaignId: filters.campaignId })
                .andWhere('cl.id IS NOT NULL');
        }
        if (filters?.search) {
            query.andWhere('(contact.name ILIKE :search OR contact.phoneNumber ILIKE :search OR contact.externalId ILIKE :search)', { search: `%${filters.search}%` });
        }
        return query.orderBy('contact.createdAt', 'DESC').getMany();
    }
    async findOneByExternalId(tenantId, externalId) {
        const cleanId = externalId.replace(/\D/g, '');
        if (!cleanId)
            return null;
        let contact = await this.contactRepository.findOne({
            where: [
                { tenantId, externalId: cleanId },
                { tenantId, phoneNumber: cleanId },
                { tenantId, externalId: (0, typeorm_2.Like)(`%${cleanId}%`) }
            ]
        });
        if (contact)
            return contact;
        if (cleanId.length >= 8) {
            const suffix = cleanId.slice(-8);
            contact = await this.contactRepository.findOne({
                where: {
                    tenantId,
                    externalId: (0, typeorm_2.Like)(`%${suffix}%`)
                }
            });
        }
        return contact || null;
    }
    async getMessages(contactId, tenantId) {
        return this.messageRepository.find({
            where: { contactId, tenantId },
            order: { createdAt: 'ASC' }
        });
    }
    async sendMessage(tenantId, contactId, content, provider, media) {
        const message = this.messageRepository.create({
            tenantId,
            contactId,
            content,
            direction: 'outbound',
            provider,
            mediaUrl: media?.url,
            mediaType: media?.type,
            mediaMimeType: media?.mimetype,
            mediaFileName: media?.fileName,
        });
        await this.messageRepository.save(message);
        await this.n8nService.triggerWebhook(tenantId, {
            type: 'message.new',
            message: {
                id: message.id,
                content: message.content,
                direction: message.direction,
                provider: message.provider,
                contactId: message.contactId
            }
        });
        if (provider === 'instagram') {
            try {
                const metaConfig = await this.integrationsService.getCredential(tenantId, 'META_APP_CONFIG');
                if (metaConfig) {
                    const { pageAccessToken } = JSON.parse(metaConfig);
                    const contact = await this.contactRepository.findOne({ where: { id: contactId } });
                    if (pageAccessToken && contact?.externalId) {
                        this.logger.log(`Sending Instagram message to ${contact.externalId}`);
                        await axios_1.default.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                            recipient: { id: contact.externalId },
                            message: { text: content }
                        });
                    }
                }
            }
            catch (err) {
                this.logger.error(`Failed to send Instagram message: ${err.response?.data?.error?.message || err.message}`);
            }
        }
        else if (provider === 'whatsapp') {
            try {
                const contact = await this.contactRepository.findOne({ where: { id: contactId } });
                this.logger.log(`WhatsApp Send Request - Contact: ${contactId}, Name: ${contact?.name}, Provider: ${contact?.provider}, Phone: ${contact?.phoneNumber}, ExtId: ${contact?.externalId}`);
                let targetNumber = (contact?.externalId && contact.externalId.includes('@')) ? contact.externalId : null;
                if (!targetNumber) {
                    targetNumber = contact?.phoneNumber || null;
                }
                if (!targetNumber && contact?.provider === 'whatsapp' && contact?.externalId) {
                    if (contact.externalId.length < 15 && /^\d+$/.test(contact.externalId)) {
                        targetNumber = contact.externalId;
                    }
                    else {
                        this.logger.warn(`Skipping externalId '${contact.externalId}' as it looks invalid for WhatsApp.`);
                    }
                }
                if (!targetNumber && contact?.name) {
                    const nameParts = contact.name.trim().split(' ');
                    const searchName = nameParts[0];
                    this.logger.log(`Searching for duplicates to heal contact ${contactId} (Name: ${contact.name}). Broad Search: '${searchName}%'...`);
                    const duplicates = await this.contactRepository.find({
                        where: {
                            tenantId,
                            name: (0, typeorm_2.Like)(`${searchName}%`)
                        }
                    });
                    this.logger.log(`Found ${duplicates.length} candidates starting with '${searchName}'`);
                    const healthyContact = duplicates.find(c => c.id !== contactId && ((c.phoneNumber && c.phoneNumber.length > 8) ||
                        (c.provider === 'whatsapp' && c.externalId && c.externalId.length > 8 && c.externalId.length < 15 && /^\d+$/.test(c.externalId))));
                    if (healthyContact) {
                        const recoveredNumber = healthyContact.phoneNumber || healthyContact.externalId;
                        this.logger.log(`Auto-healing phone from duplicate ${healthyContact.id} (${healthyContact.name}): ${recoveredNumber}`);
                        targetNumber = recoveredNumber;
                        await this.contactRepository.update(contactId, { phoneNumber: targetNumber });
                    }
                    else {
                        const candidateInfo = duplicates.map(d => `${d.name} (Ph: ${d.phoneNumber}, Ext: ${d.externalId})`).join(', ');
                        this.logger.warn(`No healthy duplicate found for '${searchName}'. Candidates: ${candidateInfo}`);
                    }
                }
                if (!targetNumber) {
                    this.logger.error(`No valid WhatsApp number found for contact ${contactId}`);
                    throw new common_1.BadRequestException('Contato não possui número de WhatsApp válido vinculado (adicione um telefone ao contato).');
                }
                if (provider === 'whatsapp' && !targetNumber.includes('@')) {
                    if (/^\d+$/.test(targetNumber)) {
                        targetNumber = `${targetNumber}@s.whatsapp.net`;
                    }
                }
                if (targetNumber) {
                    const instances = await this.evolutionApiService.listInstances(tenantId);
                    let activeInstance;
                    if (contact?.instance) {
                        activeInstance = instances.find((i) => {
                            const instanceName = i.name || i.instance?.instanceName || i.instanceName;
                            return instanceName === contact.instance || instanceName.endsWith(`_${contact.instance}`);
                        });
                        if (activeInstance) {
                            this.logger.log(`Using contact's instance: ${contact.instance}`);
                        }
                        else {
                            this.logger.warn(`Contact's instance '${contact.instance}' not found. Falling back to first available.`);
                        }
                    }
                    if (!activeInstance) {
                        activeInstance = instances.find((i) => i.status === 'open' || i.status === 'connected') || instances[0];
                        this.logger.warn(`No instance found for contact. Using fallback: ${activeInstance?.name || 'none'}`);
                    }
                    if (activeInstance) {
                        const instanceName = activeInstance.name || activeInstance.instance?.instanceName || activeInstance.instanceName;
                        if (media && media.url) {
                            this.logger.log(`Sending WhatsApp MEDIA to ${targetNumber} via ${instanceName}`);
                            const filename = media.url.split('/').pop() || 'unknown_file';
                            const filePath = path.join(process.cwd(), 'uploads', filename);
                            if (fs.existsSync(filePath)) {
                                const fileBuffer = fs.readFileSync(filePath);
                                const base64 = fileBuffer.toString('base64');
                                const response = await this.evolutionApiService.sendMedia(tenantId, instanceName, targetNumber, {
                                    type: media.type || 'image',
                                    mimetype: media.mimetype || '',
                                    base64: base64,
                                    fileName: media.fileName || filename,
                                    caption: content
                                });
                                if (response?.key?.id) {
                                    message.wamid = response.key.id;
                                    message.status = 'SENT';
                                    await this.messageRepository.save(message);
                                    this.logger.log(`Updated Outbound WAMID: ${message.wamid}`);
                                }
                            }
                            else {
                                this.logger.error(`Media file not found at ${filePath}. Sending text only.`);
                                const response = await this.evolutionApiService.sendText(tenantId, instanceName, targetNumber, content);
                                if (response?.key?.id) {
                                    message.wamid = response.key.id;
                                    message.status = 'SENT';
                                    await this.messageRepository.save(message);
                                }
                            }
                        }
                        else {
                            this.logger.log(`Sending WhatsApp message to ${targetNumber} via ${instanceName}`);
                            const response = await this.evolutionApiService.sendText(tenantId, instanceName, targetNumber, content);
                            if (response?.key?.id) {
                                message.wamid = response.key.id;
                                message.status = 'SENT';
                                await this.messageRepository.save(message);
                                this.logger.log(`Updated Outbound WAMID: ${message.wamid}`);
                            }
                        }
                    }
                    else {
                        this.logger.warn(`No active WhatsApp instance found for tenant ${tenantId}`);
                    }
                }
            }
            catch (err) {
                this.logger.error(`Failed to send WhatsApp message: ${err.message}`);
                if (err instanceof common_1.BadRequestException)
                    throw err;
                throw new common_1.BadRequestException(`Falha no envio: ${err.message}`);
            }
        }
        return message;
    }
    async seedDemoData(tenantId) {
        const contactsData = [
            { name: 'Ana Silva', provider: 'whatsapp', externalId: '5511999998888' },
            { name: 'Bernardo Souza', provider: 'instagram', externalId: 'inst_user_123' },
            { name: 'Clara Mendes', provider: 'facebook', externalId: 'fb_user_456' },
        ];
        for (const data of contactsData) {
            let contact = await this.contactRepository.findOne({ where: { externalId: data.externalId, tenantId } });
            if (!contact) {
                contact = this.contactRepository.create({ ...data, tenantId });
                await this.contactRepository.save(contact);
            }
            const messages = [
                { content: 'Olá, gostaria de saber mais sobre o Zaplandia!', direction: 'inbound' },
                { content: 'Com certeza, Ana! O Zaplandia é o melhor CRM Omnichannel.', direction: 'outbound' },
            ];
            for (const msgData of messages) {
                const msg = this.messageRepository.create({
                    ...msgData,
                    contactId: contact.id,
                    tenantId,
                    provider: contact.provider
                });
                await this.messageRepository.save(msg);
            }
            contact.lastMessage = messages[1].content;
            await this.contactRepository.save(contact);
        }
    }
    async updateContact(tenantId, contactId, updates) {
        const contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId } });
        if (!contact)
            return null;
        await this.contactRepository.update(contactId, updates);
        return this.contactRepository.findOne({ where: { id: contactId } });
    }
    async ensureContact(tenantId, data, options) {
        const where = [];
        if (data.phoneNumber && data.phoneNumber !== '')
            where.push({ phoneNumber: data.phoneNumber, tenantId });
        if (data.externalId && data.externalId !== '')
            where.push({ externalId: data.externalId, tenantId });
        if (where.length === 0) {
            const contact = this.contactRepository.create({
                ...data,
                tenantId,
                stage: 'NOVO',
                externalId: data.externalId || data.phoneNumber || `gen-${Date.now()}`
            });
            return this.contactRepository.save(contact);
        }
        let contact = await this.contactRepository.findOne({ where });
        if (!contact) {
            contact = this.contactRepository.create({
                ...data,
                tenantId,
                stage: 'NOVO',
                externalId: data.externalId || data.phoneNumber
            });
            await this.contactRepository.save(contact);
        }
        else {
            let hasParamsToUpdate = false;
            if (data.name && data.name !== contact.name && data.name.toLowerCase() !== 'contato') {
                contact.name = data.name;
                hasParamsToUpdate = true;
            }
            if (data.phoneNumber && data.phoneNumber !== contact.phoneNumber) {
                contact.phoneNumber = data.phoneNumber;
                hasParamsToUpdate = true;
            }
            if (data.instance && data.instance !== contact.instance) {
                contact.instance = data.instance;
                hasParamsToUpdate = true;
            }
            if (options?.forceStage && contact.stage !== options.forceStage) {
                contact.stage = options.forceStage;
                hasParamsToUpdate = true;
            }
            if (hasParamsToUpdate) {
                await this.contactRepository.save(contact);
            }
        }
        return contact;
    }
    async removeAllContacts(tenantId) {
        this.logger.warn(`Deleting ALL contacts for tenant ${tenantId}`);
        await this.messageRepository.delete({ tenantId });
        return this.contactRepository.delete({ tenantId });
    }
    async getDashboardStats(tenantId, campaignId, instance) {
        this.logger.debug(`[STATS] Tenant: ${tenantId}, Campaign: ${campaignId}, Instance: ${instance}`);
        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId });
        if (instance && instance !== 'all') {
            let instanceName = instance;
            if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(instanceName)) {
                const integration = await this.integrationsService.findOne(instanceName, tenantId);
                if (integration) {
                    instanceName = integration.credentials?.instanceName || integration.settings?.instanceName || integration.credentials?.name || instanceName;
                }
            }
            else {
                const allIntegrations = await this.integrationsService.findAllByTenant(tenantId);
                const normalizedFilter = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const matchedIntegration = allIntegrations.find(i => {
                    const name = i.credentials?.instanceName || i.settings?.instanceName || i.credentials?.name || '';
                    const normalizedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    return normalizedName === normalizedFilter;
                });
                if (matchedIntegration) {
                    instanceName = matchedIntegration.credentials?.instanceName || matchedIntegration.settings?.instanceName || matchedIntegration.credentials?.name || instanceName;
                }
            }
            let matchingCampaignIds = [];
            const allCampaigns = await this.campaignRepository.find({ where: { tenantId } });
            for (const camp of allCampaigns) {
                if (!camp.integrationId)
                    continue;
                if (camp.integrationId === instanceName) {
                    matchingCampaignIds.push(camp.id);
                    continue;
                }
                if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(camp.integrationId)) {
                    const integration = await this.integrationsService.findOne(camp.integrationId, tenantId);
                    const resolvedName = integration?.credentials?.instanceName || integration?.settings?.instanceName || integration?.credentials?.name || integration?.credentials?.instance || integration?.settings?.name;
                    if (resolvedName) {
                        const rNorm = resolvedName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        if (rNorm === iNorm) {
                            matchingCampaignIds.push(camp.id);
                        }
                    }
                }
                else {
                    const cNorm = camp.integrationId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    if (cNorm === iNorm) {
                        matchingCampaignIds.push(camp.id);
                    }
                }
            }
            let campaignFilter = '';
            let campaignParams = {};
            if (matchingCampaignIds.length > 0) {
                const subQuery = this.leadRepository.createQueryBuilder('cl')
                    .select('1')
                    .where('cl.campaignId IN (:...matchCampIds)')
                    .andWhere(new typeorm_2.Brackets(qb => {
                    qb.where('cl.externalId = contact.externalId')
                        .orWhere('cl.externalId = contact.phoneNumber');
                }))
                    .getQuery();
                query.andWhere(new typeorm_2.Brackets(qb => {
                    qb.where('contact.instance = :instance', { instance: instanceName })
                        .orWhere('contact.instance ILIKE :instancePattern', { instancePattern: instanceName })
                        .orWhere(`EXISTS (SELECT 1 FROM messages m WHERE m.contactId = contact.id AND (m.instance = :instance OR m.instance = :instancePattern))`, { instance: instanceName, instancePattern: instanceName })
                        .orWhere(new typeorm_2.Brackets(qb2 => {
                        qb2.where("(contact.instance IS NULL OR contact.instance = '' OR contact.instance = 'default' OR contact.instance = 'undefined')")
                            .andWhere(`EXISTS (${subQuery})`, { matchCampIds: matchingCampaignIds });
                    }));
                }));
            }
            else {
                query.andWhere('(contact.instance = :instance OR contact.instance ILIKE :instancePattern OR EXISTS (SELECT 1 FROM messages m WHERE m.contactId = contact.id AND (m.instance = :instance OR m.instance = :instancePattern)) OR contact.instance IS NULL OR contact.instance = :defVal OR contact.instance = :emptyVal OR contact.instance = :undefVal)', {
                    instance: instanceName,
                    instancePattern: instanceName,
                    defVal: 'default',
                    emptyVal: '',
                    undefVal: 'undefined'
                });
            }
        }
        if (campaignId && campaignId !== '') {
            query.innerJoin('campaign_leads', 'cl', '(cl.externalId = contact.externalId OR cl.externalId = contact.phoneNumber) AND cl.campaignId = :campaignId', { campaignId });
        }
        const contacts = await query.getMany();
        const total = contacts.length;
        const trabalhadlos = contacts.filter(c => c.stage !== 'NOVO' && c.stage !== 'LEAD').length;
        const naoTrabalhados = total - trabalhadlos;
        const ganhos = contacts.filter(c => c.stage === 'CONVERTIDO').length;
        const perdidos = contacts.filter(c => c.stage === 'NOT_INTERESTED').length;
        const conversao = total > 0 ? ((ganhos / total) * 100).toFixed(1) : '0.0';
        const funnelData = [
            { name: 'Novo', value: contacts.filter(c => c.stage === 'NOVO' || c.stage === 'LEAD').length, fill: '#0088FE' },
            { name: 'Contatados', value: contacts.filter(c => c.stage === 'CONTACTED').length, fill: '#00C49F' },
            { name: 'Em Negociação', value: contacts.filter(c => c.stage === 'NEGOTIATION').length, fill: '#FFBB28' },
            { name: 'Interessados', value: contacts.filter(c => c.stage === 'INTERESTED').length, fill: '#FF8042' },
            { name: 'Convertido', value: contacts.filter(c => c.stage === 'CONVERTIDO').length, fill: '#8884d8' },
        ].filter(d => d.value > 0);
        return {
            total,
            trabalhadlos,
            naoTrabalhados,
            ganhos,
            perdidos,
            conversao,
            funnelData
        };
    }
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = CrmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(crm_entity_1.Contact)),
    __param(1, (0, typeorm_1.InjectRepository)(crm_entity_1.Message)),
    __param(2, (0, typeorm_1.InjectRepository)(campaign_lead_entity_1.CampaignLead)),
    __param(3, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        n8n_service_1.N8nService,
        integrations_service_1.IntegrationsService,
        evolution_api_service_1.EvolutionApiService])
], CrmService);
//# sourceMappingURL=crm.service.js.map