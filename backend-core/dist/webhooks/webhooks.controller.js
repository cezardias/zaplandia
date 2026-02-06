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
var WebhooksController_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const crm_service_1 = require("../crm/crm.service");
const ai_service_1 = require("../ai/ai.service");
const integrations_service_1 = require("../integrations/integrations.service");
const n8n_service_1 = require("../integrations/n8n.service");
const typeorm_1 = require("typeorm");
const crm_entity_1 = require("../crm/entities/crm.entity");
const campaign_lead_entity_1 = require("../campaigns/entities/campaign-lead.entity");
const typeorm_2 = require("@nestjs/typeorm");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    crmService;
    aiService;
    integrationsService;
    n8nService;
    contactRepository;
    messageRepository;
    leadRepository;
    logger = new common_1.Logger(WebhooksController_1.name);
    constructor(crmService, aiService, integrationsService, n8nService, contactRepository, messageRepository, leadRepository) {
        this.crmService = crmService;
        this.aiService = aiService;
        this.integrationsService = integrationsService;
        this.n8nService = n8nService;
        this.contactRepository = contactRepository;
        this.messageRepository = messageRepository;
        this.leadRepository = leadRepository;
    }
    async verifyMeta(mode, token, challenge) {
        this.logger.log('Verifying Meta Webhook...');
        const metaConfig = await this.integrationsService.getCredential('null', 'META_APP_CONFIG');
        let expectedToken = 'zaplandia_verify_token';
        try {
            if (metaConfig) {
                const parsed = JSON.parse(metaConfig);
                if (parsed.verifyToken)
                    expectedToken = parsed.verifyToken;
            }
        }
        catch (e) { }
        if (mode === 'subscribe' && token === expectedToken) {
            this.logger.log('Meta Webhook Verified!');
            return challenge;
        }
        return 'Forbidden';
    }
    async handleMeta(payload) {
        this.logger.debug('Received Meta Payload: ' + JSON.stringify(payload));
        if (payload.object !== 'instagram') {
            this.logger.warn(`Unsupported Meta object: ${payload.object}`);
            return { status: 'skipped' };
        }
        try {
            for (const entry of payload.entry) {
                const tenantId = entry.id;
                if (entry.messaging) {
                    for (const messaging of entry.messaging) {
                        const senderId = messaging.sender.id;
                        const recipientId = messaging.recipient.id;
                        const text = messaging.message?.text;
                        if (text) {
                            this.logger.log(`Instagram DM from ${senderId}: ${text}`);
                            let contact = await this.contactRepository.findOne({ where: { externalId: senderId } });
                            if (!contact) {
                                contact = this.contactRepository.create({
                                    externalId: senderId,
                                    name: `Instagram User ${senderId.slice(-4)}`,
                                    provider: 'instagram',
                                    tenant: { id: 'default-tenant' }
                                });
                                await this.contactRepository.save(contact);
                            }
                            const message = this.messageRepository.create({
                                contactId: contact.id,
                                content: text,
                                direction: 'inbound',
                                provider: 'instagram',
                                tenantId: 'default-tenant',
                                instance: tenantId
                            });
                            await this.messageRepository.save(message);
                            if (['NOVO', 'LEAD', 'CONTACTED', 'SENT'].includes(contact.stage || '')) {
                                await this.crmService.updateContact(tenantId, contact.id, { stage: 'NEGOTIATION' });
                            }
                            await this.n8nService.triggerWebhook('default-tenant', {
                                type: 'instagram.message',
                                sender_id: senderId,
                                recipient_id: recipientId,
                                content: text,
                                contact_id: contact.id
                            });
                        }
                    }
                }
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'comments' || change.field === 'mentions') {
                            const value = change.value;
                            this.logger.log(`Instagram ${change.field}: ${value.text}`);
                            await this.n8nService.triggerWebhook('default-tenant', {
                                type: `instagram.${change.field}`,
                                from: value.from,
                                content: value.text,
                                media_id: value.media_id,
                                comment_id: value.id
                            });
                        }
                    }
                }
            }
        }
        catch (e) {
            this.logger.error('Error processing Instagram Webhook', e.stack);
        }
        return { status: 'received' };
    }
    async handleEvolution(payload) {
        this.logger.log('Received Evolution Payload: ' + JSON.stringify(payload));
        const { type, event, data, instance, sender } = payload;
        const eventType = (type || event || '').toUpperCase();
        let tenantId = 'default';
        let instanceName = typeof instance === 'string' ? instance : (instance?.instanceName || instance?.name || '');
        if (instanceName && instanceName.startsWith('tenant_')) {
            const parts = instanceName.split('_');
            if (parts.length >= 2)
                tenantId = parts[1];
        }
        else if (sender && sender.startsWith('tenant_')) {
            instanceName = sender;
            const parts = sender.split('_');
            if (parts.length >= 2)
                tenantId = parts[1];
        }
        if (tenantId === 'default') {
            this.logger.error(`[CRITICAL] FAILED TO EXTRACT TENANT ID from instance: ${JSON.stringify(instance)} (Type: ${typeof instance}) or sender: ${sender}. Payload Key Keys: ${Object.keys(payload)}`);
        }
        else {
            this.logger.log(`Extracted tenantId: ${tenantId} from instance: ${instanceName}`);
        }
        if (eventType === 'MESSAGES_UPSERT' || eventType === 'SEND_MESSAGE' || eventType === 'MESSAGES.UPSERT' || eventType === 'SEND.MESSAGE') {
            const messageData = data.data || data;
            if (!messageData || !messageData.key) {
                this.logger.log(`Ignoring message: Data incomplete.`);
                return { status: 'ignored' };
            }
            const isOutbound = messageData.key.fromMe === true;
            const remoteJid = messageData.key.remoteJid;
            const pushName = messageData.pushName || payload.sender || (isOutbound ? 'Sistema' : 'WhatsApp User');
            let content = '';
            if (messageData.message?.conversation)
                content = messageData.message.conversation;
            else if (messageData.message?.extendedTextMessage?.text)
                content = messageData.message.extendedTextMessage.text;
            else if (messageData.message?.imageMessage?.caption)
                content = messageData.message.imageMessage.caption;
            else if (messageData.extendedTextMessage?.text)
                content = messageData.extendedTextMessage.text;
            if (!content) {
                this.logger.warn(`Message from ${remoteJid} has no text content. Type: ${messageData.messageType}`);
                return { status: 'no_content' };
            }
            this.logger.log(`WhatsApp (${isOutbound ? 'OUT' : 'IN'}) from ${pushName} (${remoteJid}): ${content}`);
            const externalId = remoteJid.replace(/:[0-9]+/, '');
            const phonePart = externalId.split('@')[0];
            this.logger.debug(`[JID] remoteJid: ${remoteJid} -> externalId: ${externalId} (Phone: ${phonePart})`);
            try {
                let contact = await this.contactRepository.findOne({
                    where: [
                        { externalId, tenantId },
                        { phoneNumber: phonePart, tenantId }
                    ]
                });
                if (!contact && phonePart.length >= 8) {
                    const suffix10 = phonePart.slice(-10);
                    const suffix8 = phonePart.slice(-8);
                    this.logger.log(`No exact match. Trying fuzzy match for suffix: ${suffix10} (10d) or ${suffix8} (8d)`);
                    let fuzzyMatches = await this.contactRepository.find({
                        where: [
                            { externalId: (0, typeorm_1.Like)(`%${suffix10}`), tenantId },
                            { phoneNumber: (0, typeorm_1.Like)(`%${suffix10}`), tenantId }
                        ],
                        take: 1,
                        order: { createdAt: 'DESC' }
                    });
                    if (fuzzyMatches.length === 0 && suffix8.length === 8) {
                        fuzzyMatches = await this.contactRepository.find({
                            where: [
                                { externalId: (0, typeorm_1.Like)(`%${suffix8}`), tenantId },
                                { phoneNumber: (0, typeorm_1.Like)(`%${suffix8}`), tenantId }
                            ],
                            take: 1,
                            order: { createdAt: 'DESC' }
                        });
                    }
                    if (fuzzyMatches.length > 0) {
                        contact = fuzzyMatches[0];
                        this.logger.log(`[Smart Link] Fuzzy matched contact: ${contact.name} via ${fuzzyMatches[0].externalId === contact.externalId ? 'externalId' : 'phoneNumber'}`);
                        const isNewLid = externalId.includes('@lid');
                        const isCurrentLid = contact.externalId?.includes('@lid');
                        const isSameInstance = !contact.instance || contact.instance === instanceName;
                        let shouldUpdate = false;
                        if (!isNewLid && isCurrentLid)
                            shouldUpdate = true;
                        if (isNewLid && isSameInstance)
                            shouldUpdate = true;
                        if (!isNewLid && !isCurrentLid)
                            shouldUpdate = true;
                        if (shouldUpdate) {
                            this.logger.log(`[Smart Link] Updating externalId: ${contact.externalId} -> ${externalId}`);
                            contact.externalId = externalId;
                            await this.contactRepository.save(contact);
                        }
                    }
                }
                if (contact && !contact.externalId) {
                    this.logger.log(`[Smart Link] Found contact by Phone. Linking initial externalId: ${externalId}`);
                    contact.externalId = externalId;
                    await this.contactRepository.save(contact);
                }
                let resolvedName = pushName;
                const isBadName = !resolvedName || resolvedName === 'Sistema' || resolvedName === 'WhatsApp User' || (resolvedName && resolvedName.includes('@')) || (resolvedName && /^\d+$/.test(resolvedName));
                let lead = null;
                if (isBadName || isOutbound) {
                    lead = await this.leadRepository.findOne({
                        where: {
                            externalId,
                            campaign: { tenantId }
                        },
                        relations: ['campaign'],
                        order: { createdAt: 'DESC' }
                    });
                    if (!lead && phonePart.length >= 8) {
                        const suffix10 = phonePart.slice(-10);
                        const suffix8 = phonePart.slice(-8);
                        lead = await this.leadRepository.findOne({
                            where: {
                                externalId: (0, typeorm_1.Like)(`%${suffix10}`),
                                campaign: { tenantId }
                            },
                            relations: ['campaign'],
                            order: { createdAt: 'DESC' }
                        });
                        if (!lead && suffix8.length === 8) {
                            lead = await this.leadRepository.findOne({
                                where: {
                                    externalId: (0, typeorm_1.Like)(`%${suffix8}`),
                                    campaign: { tenantId }
                                },
                                relations: ['campaign'],
                                order: { createdAt: 'DESC' }
                            });
                        }
                    }
                    if (lead && lead.name && isBadName)
                        resolvedName = lead.name;
                }
                if (!contact) {
                    if (isOutbound && !lead) {
                        this.logger.warn(`[Ghost Protection] Ignoring Outbound message from unknown ID ${externalId} (likely LID/Echo). Keeping CRM clean.`);
                        return { status: 'ignored_ghost' };
                    }
                    this.logger.log(`Creating contact for ${externalId} (Lead match: ${lead ? 'YES' : 'NO'}) in tenant ${tenantId}`);
                    contact = this.contactRepository.create({
                        externalId,
                        name: (resolvedName && !resolvedName.includes('@')) ? resolvedName : (lead?.name || `Novo Contato ${externalId.slice(-4)}`),
                        provider: 'whatsapp',
                        tenantId,
                        instance: instanceName
                    });
                    await this.contactRepository.save(contact);
                }
                else {
                    if ((!contact.instance || contact.instance !== instanceName) && instanceName) {
                        contact.instance = instanceName;
                        await this.contactRepository.save(contact);
                    }
                    const currentIsBad = !contact.name || contact.name.includes('@') || contact.name === contact.externalId || contact.name.startsWith('Novo Contato ') || contact.name.startsWith('Contato ');
                    const newIsBetter = resolvedName && !resolvedName.includes('@') && resolvedName !== 'Sistema' && !resolvedName.startsWith('Novo Contato ') && !resolvedName.startsWith('Contato ');
                    if (currentIsBad && newIsBetter) {
                        this.logger.log(`Updating JID/Generic name to human name: ${contact.name} -> ${resolvedName}`);
                        contact.name = resolvedName;
                        await this.contactRepository.save(contact);
                    }
                }
                const wamid = messageData.key.id;
                const existingMessage = await this.messageRepository.findOne({
                    where: { wamid, contactId: contact.id, direction: isOutbound ? 'outbound' : 'inbound' }
                });
                if (existingMessage) {
                    this.logger.warn(`[Deduplication] Message ${wamid} already exists. Skipping.`);
                    return { status: 'duplicate_skipped' };
                }
                const message = this.messageRepository.create({
                    contactId: contact.id,
                    content,
                    direction: isOutbound ? 'outbound' : 'inbound',
                    provider: 'whatsapp',
                    tenantId,
                    wamid: messageData.key.id,
                    instance: instanceName
                });
                await this.messageRepository.save(message);
                this.logger.log(`Message saved successfully. ID: ${message.id}`);
                contact.lastMessage = content;
                contact.updatedAt = new Date();
                await this.contactRepository.save(contact);
                if (!isOutbound && ['NOVO', 'LEAD', 'CONTACTED', 'SENT'].includes(contact.stage || '')) {
                    await this.crmService.updateContact(tenantId, contact.id, { stage: 'NEGOTIATION' });
                    this.logger.log(`Updated contact ${contact.id} stage to NEGOTIATION due to reply`);
                }
                try {
                    await this.n8nService.triggerWebhook(tenantId, {
                        type: 'whatsapp.message',
                        sender: remoteJid,
                        content,
                        contact_id: contact.id,
                        name: pushName,
                        message_id: message.id
                    });
                    this.logger.log('Triggered n8n webhook');
                }
                catch (n8nError) {
                    this.logger.error(`Failed to trigger n8n: ${n8nError.message}`);
                }
                if (!isOutbound) {
                    try {
                        const shouldRespond = await this.aiService.shouldRespond(contact, instanceName, tenantId);
                        if (shouldRespond) {
                            this.logger.log(`AI enabled for contact ${contact.id} on instance ${instanceName}. Generating response...`);
                            const aiResponse = await this.aiService.generateResponse(contact, content, tenantId, instanceName);
                            if (aiResponse) {
                                this.logger.log(`AI generated response for ${contact.id}: ${aiResponse.substring(0, 50)}...`);
                                const aiMessage = this.messageRepository.create({
                                    tenantId,
                                    contactId: contact.id,
                                    content: aiResponse,
                                    direction: 'outbound',
                                    provider: 'whatsapp',
                                    status: 'PENDING',
                                    instance: instanceName
                                });
                                await this.messageRepository.save(aiMessage);
                                await this.aiService.sendAIResponse(contact, aiResponse, tenantId, instanceName);
                                this.logger.log(`AI response sent successfully to contact ${contact.id} via ${instanceName}`);
                            }
                            else {
                                this.logger.warn(`AI failed to generate response for contact ${contact.id} (Check Gemini API Key and Prompt Configuration)`);
                            }
                        }
                        else {
                            this.logger.debug(`AI should not respond to contact ${contact.id} on instance ${instanceName}`);
                        }
                    }
                    catch (aiError) {
                        this.logger.error(`AI auto-response error: ${aiError.message}`);
                    }
                }
            }
            catch (err) {
                this.logger.error(`Error processing WhatsApp message: ${err.message}`, err.stack);
                throw err;
            }
        }
        else if (eventType === 'MESSAGES_UPDATE' || eventType === 'MESSAGES.UPDATE') {
            const eventData = data.data || data;
            if (eventData && eventData.id) {
                const messageId = eventData.id;
                const remoteJid = eventData.remoteJid;
                const status = eventData.status;
                const message = await this.messageRepository.findOne({ where: { wamid: messageId } });
                if (message) {
                    if (status) {
                        message.status = status;
                        await this.messageRepository.save(message);
                    }
                    if (remoteJid && message.contactId) {
                        const contact = await this.contactRepository.findOne({ where: { id: message.contactId } });
                        if (contact) {
                            const newExternalId = remoteJid.replace(/:[0-9]+/, '');
                            const currentExternalId = contact.externalId;
                            const isNewLid = newExternalId.includes('@lid');
                            const isCurrentLid = currentExternalId?.includes('@lid');
                            const isSameInstance = !contact.instance || contact.instance === instanceName;
                            let shouldUpdate = false;
                            if (!isNewLid && isCurrentLid)
                                shouldUpdate = true;
                            if (isNewLid && isSameInstance)
                                shouldUpdate = true;
                            if (!isNewLid && !isCurrentLid && newExternalId !== currentExternalId)
                                shouldUpdate = true;
                            if (shouldUpdate && !newExternalId.includes('status')) {
                                this.logger.log(`[Smart Link] Updating JID: ${currentExternalId} -> ${newExternalId} (Instance: ${instanceName})`);
                                contact.externalId = newExternalId;
                                await this.contactRepository.save(contact);
                            }
                        }
                    }
                }
            }
        }
        return { status: 'received' };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Get)('meta'),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "verifyMeta", null);
__decorate([
    (0, common_1.Post)('meta'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleMeta", null);
__decorate([
    (0, common_1.Post)('evolution'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleEvolution", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __param(4, (0, typeorm_2.InjectRepository)(crm_entity_1.Contact)),
    __param(5, (0, typeorm_2.InjectRepository)(crm_entity_1.Message)),
    __param(6, (0, typeorm_2.InjectRepository)(campaign_lead_entity_1.CampaignLead)),
    __metadata("design:paramtypes", [crm_service_1.CrmService,
        ai_service_1.AiService,
        integrations_service_1.IntegrationsService,
        n8n_service_1.N8nService, typeof (_a = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _c : Object])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map