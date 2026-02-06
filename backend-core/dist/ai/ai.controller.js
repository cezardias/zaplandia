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
var _a, _b;
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
        const integration = await this.integrationRepository.findOne({
            where: { id: integrationId, tenantId: req.user.tenantId }
        });
        if (!integration) {
            return { success: false, message: 'Integration not found' };
        }
        integration.aiEnabled = body.enabled;
        if (body.promptId) {
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
    async generatePrompts(body, req) {
        const prompts = await this.aiService.generatePrompts(req.user.tenantId, body.topic, body.count);
        return { success: true, prompts };
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
    (0, common_1.Post)('prompts'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generatePrompts", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, typeorm_1.InjectRepository)(integration_entity_1.Integration)),
    __param(1, (0, typeorm_1.InjectRepository)(crm_entity_1.Contact)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map