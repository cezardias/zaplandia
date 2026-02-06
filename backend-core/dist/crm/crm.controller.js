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
var CrmController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmController = void 0;
const common_1 = require("@nestjs/common");
const crm_service_1 = require("./crm.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let CrmController = CrmController_1 = class CrmController {
    crmService;
    logger = new common_1.Logger(CrmController_1.name);
    constructor(crmService) {
        this.crmService = crmService;
    }
    async getDashboardStats(req, campaignId, campaignIdAlt, globId, instance) {
        this.logger.log(`[SECURITY] User ${req.user.email} (${req.user.role}) accessing stats for tenant ${req.user.tenantId}`);
        return this.crmService.getDashboardStats(req.user.tenantId, campaignId || campaignIdAlt || globId, instance);
    }
    async getContacts(req, q, campaignId, campaignIdAlt, globId, instance) {
        this.logger.log(`[SECURITY] User ${req.user.email} (${req.user.role}) accessing contacts for tenant ${req.user.tenantId}`);
        return this.crmService.findAllByTenant(req.user.tenantId, { search: q, campaignId: campaignId || campaignIdAlt || globId, instance });
    }
    async getContactsAlias(req, q, campaignId, campaignIdAlt, globId, instance) {
        this.logger.log(`[SECURITY] User ${req.user.email} (${req.user.role}) accessing contacts (alias) for tenant ${req.user.tenantId}`);
        return this.crmService.findAllByTenant(req.user.tenantId, { search: q, campaignId: campaignId || campaignIdAlt || globId, instance });
    }
    createContact(req, body) {
        return this.crmService.ensureContact(req.user.tenantId, body, { forceStage: 'NOVO' });
    }
    async getChats(req, instance) {
        this.logger.log(`[SECURITY] User ${req.user.email} (${req.user.role}) accessing chats for tenant ${req.user.tenantId}`);
        return this.crmService.getRecentChats(req.user.tenantId, req.user.role, { instance });
    }
    getMessages(req, contactId) {
        return this.crmService.getMessages(contactId, req.user.tenantId);
    }
    sendMessage(req, body) {
        return this.crmService.sendMessage(req.user.tenantId, body.contactId, body.content, body.provider, body.media);
    }
    updateContact(req, contactId, body) {
        return this.crmService.updateContact(req.user.tenantId, contactId, body);
    }
    deleteAllContacts(req) {
        return this.crmService.removeAllContacts(req.user.tenantId);
    }
};
exports.CrmController = CrmController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('campaignId')),
    __param(2, (0, common_1.Query)('campaign_id')),
    __param(3, (0, common_1.Query)('global_campaign_id')),
    __param(4, (0, common_1.Query)('instance')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('campaignId')),
    __param(3, (0, common_1.Query)('campaign_id')),
    __param(4, (0, common_1.Query)('global_campaign_id')),
    __param(5, (0, common_1.Query)('instance')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getContacts", null);
__decorate([
    (0, common_1.Get)('contacts'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('campaignId')),
    __param(3, (0, common_1.Query)('campaign_id')),
    __param(4, (0, common_1.Query)('global_campaign_id')),
    __param(5, (0, common_1.Query)('instance')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getContactsAlias", null);
__decorate([
    (0, common_1.Post)('contacts'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createContact", null);
__decorate([
    (0, common_1.Get)('chats'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('instance')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getChats", null);
__decorate([
    (0, common_1.Get)('chats/:contactId/messages'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('messages'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Patch)('chats/:contactId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('contactId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "updateContact", null);
__decorate([
    (0, common_1.Delete)('contacts/all'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "deleteAllContacts", null);
exports.CrmController = CrmController = CrmController_1 = __decorate([
    (0, common_1.Controller)('crm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [crm_service_1.CrmService])
], CrmController);
//# sourceMappingURL=crm.controller.js.map