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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CrmService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crm_entity_1 = require("./entities/crm.entity");
const n8n_service_1 = require("../integrations/n8n.service");
const integrations_service_1 = require("../integrations/integrations.service");
const evolution_api_service_1 = require("../integrations/evolution-api.service");
let CrmService = CrmService_1 = class CrmService {
    contactRepository;
    messageRepository;
    n8nService;
    integrationsService;
    evolutionApiService;
    logger = new common_1.Logger(CrmService_1.name);
    constructor(contactRepository, messageRepository, n8nService, integrationsService, evolutionApiService) {
        this.contactRepository = contactRepository;
        this.messageRepository = messageRepository;
        this.n8nService = n8nService;
        this.integrationsService = integrationsService;
        this.evolutionApiService = evolutionApiService;
    }
    async getRecentChats(tenantId, role) {
        const where = role === 'superadmin' ? {} : { tenantId };
        return this.contactRepository.find({
            where,
            relations: ['messages'],
            order: { updatedAt: 'DESC' },
            take: 20
        });
    }
    async findAllByTenant(tenantId) {
        return this.contactRepository.find({
            where: { tenantId }
        });
    }
    async getMessages(contactId, tenantId) {
        return this.messageRepository.find({
            where: { contactId, tenantId },
            order: { createdAt: 'ASC' }
        });
    }
    async sendMessage(tenantId, contactId, content, provider) {
        const message = this.messageRepository.create({
            tenantId,
            contactId,
            content,
            direction: 'outbound',
            provider
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
                if (contact?.externalId) {
                    const instances = await this.evolutionApiService.listInstances(tenantId);
                    const activeInstance = instances.find((i) => i.status === 'open' || i.status === 'connected') || instances[0];
                    if (activeInstance) {
                        const instanceName = activeInstance.name || activeInstance.instance?.instanceName || activeInstance.instanceName;
                        this.logger.log(`Sending WhatsApp message to ${contact.externalId} via ${instanceName}`);
                        await this.evolutionApiService.sendText(tenantId, instanceName, contact.externalId, content);
                    }
                    else {
                        this.logger.warn(`No active WhatsApp instance found for tenant ${tenantId}`);
                    }
                }
            }
            catch (err) {
                this.logger.error(`Failed to send WhatsApp message: ${err.message}`);
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
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = CrmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(crm_entity_1.Contact)),
    __param(1, (0, typeorm_1.InjectRepository)(crm_entity_1.Message)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, n8n_service_1.N8nService,
        integrations_service_1.IntegrationsService,
        evolution_api_service_1.EvolutionApiService])
], CrmService);
//# sourceMappingURL=crm.service.js.map