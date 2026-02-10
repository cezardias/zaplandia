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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const integration_entity_1 = require("../integrations/entities/integration.entity");
const crm_entity_1 = require("../crm/entities/crm.entity");
const ai_service_1 = require("./ai.service");
let AiController = class AiController {
    integrationRepository;
    contactRepository;
    aiService;
    constructor(integrationRepository, contactRepository, aiService) {
        this.integrationRepository = integrationRepository;
        this.contactRepository = contactRepository;
        this.aiService = aiService;
    }
    async toggleIntegrationAI(integrationId, body, req) {
        let integration;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(integrationId);
        if (isUuid) {
            integration = await this.integrationRepository.findOne({
                where: { id: integrationId, tenantId: req.user.tenantId }
            });
        }
        else {
            integration = await this.integrationRepository.createQueryBuilder('integration')
                .where('integration.tenantId = :tenantId', { tenantId: req.user.tenantId })
                .andWhere(`integration.provider = 'evolution'`)
                .andWhere(`(integration.settings->>'instanceName' = :instanceName OR integration.credentials->>'instanceName' = :instanceName)`, { instanceName: integrationId })
                .getOne();
        }
        if (!integration) {
            if (!isUuid && integrationId.startsWith('tenant_')) {
                const newIntegration = this.integrationRepository.create({
                    tenantId: req.user.tenantId,
                    provider: integration_entity_1.IntegrationProvider.EVOLUTION,
                    status: integration_entity_1.IntegrationStatus.CONNECTED,
                    settings: { instanceName: integrationId },
                    aiEnabled: body.enabled,
                    aiPromptId: body.promptId,
                    aiModel: body.aiModel
                });
                await this.integrationRepository.save(newIntegration);
                return {
                    success: true,
                    integration: {
                        id: newIntegration.id,
                        aiEnabled: newIntegration.aiEnabled,
                        aiPromptId: newIntegration.aiPromptId,
                        aiModel: newIntegration.aiModel
                    }
                };
            }
            return { success: false, message: 'Integration not found' };
        }
        integration.aiEnabled = body.enabled;
        if (body.promptId !== undefined) {
            integration.aiPromptId = body.promptId;
        }
        if (body.aiModel) {
            integration.aiModel = body.aiModel;
        }
        await this.integrationRepository.save(integration);
        return {
            success: true,
            integration: {
                id: integration.id,
                aiEnabled: integration.aiEnabled,
                aiPromptId: integration.aiPromptId,
                aiModel: integration.aiModel
            }
        };
    }
    async toggleContactAI(contactId, body, req) {
        const contact = await this.contactRepository.findOne({
            where: { id: contactId, tenantId: req.user.tenantId }
        });
        if (!contact) {
            return { success: false, message: 'Contact not found' };
        }
        contact.aiEnabled = body.enabled;
        await this.contactRepository.save(contact);
        return {
            success: true,
            contact: {
                id: contact.id,
                aiEnabled: contact.aiEnabled
            }
        };
    }
    async generateVariations(body, req) {
        const variations = await this.aiService.generateVariations(req.user.tenantId, body.baseMessage, body.prompt, body.count);
        return { success: true, variations };
    }
    async getPrompts(req) {
        return this.aiService.findAll(req.user.tenantId);
    }
    async generatePrompts(body, req) {
        const prompts = await this.aiService.generatePrompts(req.user.tenantId, body.topic, body.count);
        return { success: true, prompts };
    }
    async savePrompt(body, req) {
        try {
            if (body.id) {
                const updated = await this.aiService.updatePrompt(req.user.tenantId, body.id, {
                    name: body.name,
                    content: body.content
                });
                return { success: true, prompt: updated };
            }
            else {
                const created = await this.aiService.createPrompt(req.user.tenantId, body.name, body.content);
                return { success: true, prompt: created };
            }
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
    async deletePrompt(id, req) {
        try {
            await this.aiService.deletePrompt(req.user.tenantId, id);
            return { success: true };
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('integration/:id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "toggleIntegrationAI", null);
__decorate([
    (0, common_1.Post)('contact/:id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "toggleContactAI", null);
__decorate([
    (0, common_1.Post)('generate-variations'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateVariations", null);
__decorate([
    (0, common_1.Get)('prompts'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getPrompts", null);
__decorate([
    (0, common_1.Post)('prompts'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generatePrompts", null);
__decorate([
    (0, common_1.Post)('prompts/save'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "savePrompt", null);
__decorate([
    (0, common_1.Delete)('prompts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "deletePrompt", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, typeorm_1.InjectRepository)(integration_entity_1.Integration)),
    __param(1, (0, typeorm_1.InjectRepository)(crm_entity_1.Contact)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map