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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const crm_service_1 = require("../crm/crm.service");
const support_service_1 = require("../support/support.service");
const users_service_1 = require("./users.service");
const integrations_service_1 = require("../integrations/integrations.service");
const user_entity_1 = require("./entities/user.entity");
let AdminController = class AdminController {
    crmService;
    supportService;
    usersService;
    integrationsService;
    constructor(crmService, supportService, usersService, integrationsService) {
        this.crmService = crmService;
        this.supportService = supportService;
        this.usersService = usersService;
        this.integrationsService = integrationsService;
    }
    async getTenantCredentials(req, tenantId) {
        if (req.user.role !== user_entity_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Acesso negado.');
        }
        console.log(`[ADMIN_GET] Tenant: ${tenantId}`);
        return this.integrationsService.findAllCredentials(tenantId);
    }
    async saveTenantCredential(req, tenantId, body) {
        if (req.user.role !== user_entity_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Acesso negado.');
        }
        const { name, value } = body;
        console.log(`[ADMIN_SAVE] Tenant: ${tenantId}, Key: ${name}`);
        return this.integrationsService.saveApiCredential(tenantId, name, value);
    }
    async findAllTenants(req) {
        if (req.user.role !== user_entity_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Acesso negado.');
        }
        return this.usersService.findAllTenants();
    }
    async findAll(req) {
        if (req.user.role !== user_entity_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Acesso negado.');
        }
        return this.usersService.findAll();
    }
    async create(req, userData) {
        if (req.user.role !== user_entity_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Acesso negado.');
        }
        console.log('[ADMIN_CREATE] Received userData:', JSON.stringify(userData));
        const role = (userData.role || '').toLowerCase();
        const hasTenantId = userData.tenantId && userData.tenantId.trim() !== '';
        console.log('[ADMIN_CREATE] Role:', role, 'HasTenantId:', hasTenantId);
        if (role === 'user' && !hasTenantId) {
            const companyName = userData.companyName || `${userData.name}'s Business`;
            const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const uniqueSlug = `${baseSlug}-${Date.now()}`;
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 15);
            const tenant = await this.usersService.createTenant({
                name: companyName,
                slug: uniqueSlug,
                trialEndsAt: trialEndDate,
            });
            console.log(`[ADMIN_CREATE] ✅ Auto-created tenant for user: ${tenant.name} (ID: ${tenant.id})`);
            userData.tenantId = tenant.id;
        }
        console.log('[ADMIN_CREATE] Final userData with tenantId:', userData.tenantId);
        return this.usersService.create(userData);
    }
    async update(req, id, userData) {
        if (req.user.role !== user_entity_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Acesso negado.');
        }
        return this.usersService.update(id, userData);
    }
    async remove(req, id) {
        if (req.user.role !== user_entity_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Acesso negado.');
        }
        return this.usersService.remove(id);
    }
    async seed(req) {
        if (req.user.role !== user_entity_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Apenas SuperAdmins podem gerar dados de teste.');
        }
        const targetTenantId = req.user.tenantId || 'demo-tenant-id';
        console.log(`Starting seed for tenant ${targetTenantId}`);
        try {
            await this.crmService.seedDemoData(targetTenantId);
            console.log('CRM Seed done');
        }
        catch (e) {
            console.error('CRM Seed failed', e);
        }
        try {
            await this.supportService.seedInitialArticles();
            console.log('Support Seed done');
        }
        catch (e) {
            console.error('Support Seed failed', e);
        }
        return { message: 'Seeding process finished. Check logs.' };
    }
    async getGlobalCredentials(req) {
        if (req.user.role !== user_entity_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Apenas SuperAdmin pode acessar credenciais globais.');
        }
        console.log('[ADMIN_GET_GLOBAL] Fetching global credentials');
        return this.integrationsService.findAllCredentials(null);
    }
    async saveGlobalCredential(req, body) {
        if (req.user.role !== user_entity_1.UserRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Apenas SuperAdmin pode configurar credenciais globais.');
        }
        console.log(`[ADMIN_SAVE_GLOBAL] Saving global credential: ${body.name}`);
        return this.integrationsService.saveApiCredential(null, body.name, body.value);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('tenants/:tenantId/credentials'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenantCredentials", null);
__decorate([
    (0, common_1.Post)('tenants/:tenantId/credentials'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "saveTenantCredential", null);
__decorate([
    (0, common_1.Get)('tenants'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "findAllTenants", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('users'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "create", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('seed'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "seed", null);
__decorate([
    (0, common_1.Get)('credentials/global'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getGlobalCredentials", null);
__decorate([
    (0, common_1.Post)('credentials/global'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "saveGlobalCredential", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [crm_service_1.CrmService,
        support_service_1.SupportService,
        users_service_1.UsersService,
        integrations_service_1.IntegrationsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map