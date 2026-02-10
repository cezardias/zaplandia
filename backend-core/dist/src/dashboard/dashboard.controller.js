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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const crm_service_1 = require("../crm/crm.service");
const integrations_service_1 = require("../integrations/integrations.service");
const typeorm_1 = require("@nestjs/typeorm");
const crm_entity_1 = require("../crm/entities/crm.entity");
const typeorm_2 = require("typeorm");
let DashboardController = class DashboardController {
    crmService;
    integrationsService;
    messageRepository;
    constructor(crmService, integrationsService, messageRepository) {
        this.crmService = crmService;
        this.integrationsService = integrationsService;
        this.messageRepository = messageRepository;
    }
    async getStats(req) {
        console.log(`[SECURITY] User ${req.user.email} (${req.user.role}) accessing dashboard stats for tenant ${req.user.tenantId}`);
        const tenantId = req.user.tenantId;
        const role = req.user.role;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const messagesToday = await this.messageRepository.count({
            where: {
                tenantId: role === 'superadmin' ? undefined : tenantId,
                createdAt: (0, typeorm_2.Between)(today, tomorrow),
            },
        });
        const chats = await this.crmService.getRecentChats(tenantId, role);
        const activeChats = chats.length;
        const integrations = await this.integrationsService.findAllByTenant(tenantId, role);
        const connectedIntegrations = integrations.length;
        return {
            messagesToday,
            activeChats,
            connectedIntegrations,
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getStats", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(2, (0, typeorm_1.InjectRepository)(crm_entity_1.Message)),
    __metadata("design:paramtypes", [crm_service_1.CrmService,
        integrations_service_1.IntegrationsService,
        typeorm_2.Repository])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map