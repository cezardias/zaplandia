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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const crm_service_1 = require("../crm/crm.service");
const ai_service_1 = require("../integrations/ai.service");
const integrations_service_1 = require("../integrations/integrations.service");
const n8n_service_1 = require("../integrations/n8n.service");
const typeorm_1 = require("typeorm");
const crm_entity_1 = require("../crm/entities/crm.entity");
const typeorm_2 = require("@nestjs/typeorm");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    crmService;
    aiService;
    integrationsService;
    n8nService;
    contactRepository;
    messageRepository;
    logger = new common_1.Logger(WebhooksController_1.name);
    constructor(crmService, aiService, integrationsService, n8nService, contactRepository, messageRepository) {
        this.crmService = crmService;
        this.aiService = aiService;
        this.integrationsService = integrationsService;
        this.n8nService = n8nService;
        this.contactRepository = contactRepository;
        this.messageRepository = messageRepository;
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
                                tenantId: 'default-tenant'
                            });
                            await this.messageRepository.save(message);
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
        const { type, data, instance } = payload;
        let tenantId = 'default';
        if (instance && instance.startsWith('tenant_')) {
            const parts = instance.split('_');
            if (parts.length >= 2)
                tenantId = parts[1];
        }
        if (type === 'MESSAGES_UPSERT') {
            const messageData = data.data;
            if (!messageData || !messageData.key || messageData.key.fromMe)
                return { status: 'ignored' };
            const remoteJid = messageData.key.remoteJid;
            const pushName = messageData.pushName;
            let content = '';
            if (messageData.message?.conversation)
                content = messageData.message.conversation;
            else if (messageData.message?.extendedTextMessage?.text)
                content = messageData.message.extendedTextMessage.text;
            else if (messageData.message?.imageMessage?.caption)
                content = messageData.message.imageMessage.caption;
            if (!content)
                return { status: 'no_content' };
            this.logger.log(`WhatsApp Message from ${pushName} (${remoteJid}): ${content}`);
            const externalId = remoteJid.replace('@s.whatsapp.net', '');
            let contact = await this.contactRepository.findOne({ where: { externalId, tenantId } });
            if (!contact) {
                contact = this.contactRepository.create({
                    externalId,
                    name: pushName || `WhatsApp User ${externalId.slice(-4)}`,
                    provider: 'whatsapp',
                    tenantId
                });
                await this.contactRepository.save(contact);
            }
            const message = this.messageRepository.create({
                contactId: contact.id,
                content,
                direction: 'inbound',
                provider: 'whatsapp',
                tenantId
            });
            await this.messageRepository.save(message);
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
    __metadata("design:paramtypes", [crm_service_1.CrmService,
        ai_service_1.AiService,
        integrations_service_1.IntegrationsService,
        n8n_service_1.N8nService, typeof (_a = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_1.Repository !== "undefined" && typeorm_1.Repository) === "function" ? _b : Object])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map