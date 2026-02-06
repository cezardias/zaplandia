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
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const integrations_service_1 = require("./integrations.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const evolution_api_service_1 = require("./evolution-api.service");
const n8n_service_1 = require("./n8n.service");
let IntegrationsController = class IntegrationsController {
    integrationsService;
    evolutionApiService;
    n8nService;
    constructor(integrationsService, evolutionApiService, n8nService) {
        this.integrationsService = integrationsService;
        this.evolutionApiService = evolutionApiService;
        this.n8nService = n8nService;
    }
    async findAll(req) {
        console.log(`[SECURITY] User ${req.user.email} (${req.user.role}) listing integrations for tenant ${req.user.tenantId}`);
        const dbIntegrations = await this.integrationsService.findAllByTenant(req.user.tenantId, req.user.role);
        let evolutionInstances = [];
        try {
            const instances = await this.evolutionApiService.listInstances(req.user.tenantId, req.user.role);
            evolutionInstances = await Promise.all(instances.map(async (inst) => {
                const rawName = inst.name || inst.instance?.instanceName || inst.instanceName;
                const friendlyName = rawName.replace(/^tenant_[0-9a-fA-F-]{36}_/, '');
                const dbIntegration = dbIntegrations.find(i => i.provider === 'evolution' &&
                    (i.settings?.instanceName === rawName || i.credentials?.instanceName === rawName));
                if (dbIntegration) {
                    return null;
                }
                return {
                    id: rawName,
                    name: friendlyName,
                    instanceName: rawName,
                    provider: 'evolution',
                    status: inst.status === 'open' || inst.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED',
                    integrationId: inst.integrationId || `evo_${rawName}`,
                    settings: inst
                };
            }));
            evolutionInstances = evolutionInstances.filter(inst => inst !== null);
        }
        catch (e) {
            console.error('Failed to fetch evolution instances for list:', e.message);
        }
        const finalIntegrations = dbIntegrations.map(i => {
            if (i.provider === 'evolution') {
                const instanceName = i.credentials?.instanceName || i.settings?.instanceName;
                const friendlyName = instanceName
                    ? instanceName.replace(/^tenant_[0-9a-fA-F-]{36}_/, '')
                    : 'Evolution';
                return {
                    ...i,
                    name: friendlyName,
                    instanceName: instanceName
                };
            }
            return {
                ...i,
                name: i.provider === 'whatsapp' ? 'WhatsApp Oficial' :
                    i.provider.charAt(0).toUpperCase() + i.provider.slice(1)
            };
        });
        const result = [...finalIntegrations, ...evolutionInstances];
        console.log('Integrations being returned:', JSON.stringify(result, null, 2));
        return result;
    }
    async listEvolutionInstances(req) {
        const isSuperAdmin = req.user.role === 'superadmin';
        if (isSuperAdmin) {
            return this.evolutionApiService.listAllInstances();
        }
        else {
            return this.evolutionApiService.listInstances(req.user.tenantId);
        }
    }
    async createEvolutionInstance(req, body) {
        const customName = body.instanceName || Date.now().toString();
        const instanceName = `tenant_${req.user.tenantId}_${customName}`;
        const evolutionResponse = await this.evolutionApiService.createInstance(req.user.tenantId, instanceName, req.user.userId);
        const integration = await this.integrationsService.create(req.user.tenantId, 'evolution', { instanceName, evolutionData: evolutionResponse });
        return { ...evolutionResponse, integrationId: integration.id };
    }
    async getEvolutionQrCodeByName(req, instanceName) {
        return this.evolutionApiService.getQrCode(req.user.tenantId, instanceName);
    }
    async getEvolutionQrCode(req) {
        const instanceName = `tenant_${req.user.tenantId}`;
        return this.evolutionApiService.getQrCode(req.user.tenantId, instanceName);
    }
    async getEvolutionInstanceStatus(req, instanceName) {
        return this.evolutionApiService.getInstanceStatus(req.user.tenantId, instanceName);
    }
    async setEvolutionWebhook(req, instanceName) {
        const webhookUrl = `${process.env.API_URL || 'https://api.zaplandia.com.br'}/webhooks/evolution`;
        return this.evolutionApiService.setWebhook(req.user.tenantId, instanceName, webhookUrl);
    }
    async deleteEvolutionInstanceByName(req, instanceName) {
        return this.evolutionApiService.deleteInstance(req.user.tenantId, instanceName);
    }
    async deleteEvolutionInstance(req) {
        const instanceName = `tenant_${req.user.tenantId}`;
        return this.evolutionApiService.deleteInstance(req.user.tenantId, instanceName);
    }
    async handleEvolutionWebhook(payload) {
        const instanceName = payload.instance;
        if (instanceName && instanceName.startsWith('tenant_')) {
            const tenantId = instanceName.replace('tenant_', '');
            await this.n8nService.triggerWebhook(tenantId, payload);
        }
        return { success: true };
    }
    connect(req, provider, body) {
        return this.integrationsService.create(req.user.tenantId, provider, body.credentials);
    }
    async saveCredentials(req, body) {
        console.log('[SAVE_CRED] req.user:', JSON.stringify(req.user));
        let tenantId = req.user.tenantId;
        console.log('[SAVE_CRED] Initial tenantId from token:', tenantId);
        if (!tenantId) {
            console.log('[SAVE_CRED] Fetching tenantId from DB for userId:', req.user.userId);
            tenantId = await this.integrationsService.fetchUserTenantId(req.user.userId);
            console.log('[SAVE_CRED] Fetched tenantId from DB:', tenantId);
        }
        if (!tenantId) {
            console.error('[SAVE_CRED] FATAL: No tenantId found!');
            throw new Error('Cannot save credentials: user has no associated tenant.');
        }
        const isSuperAdmin = req.user.role === 'superadmin';
        const isEvolutionConfig = body.name === 'EVOLUTION_API_URL' || body.name === 'EVOLUTION_API_KEY';
        let finalTenantId = tenantId;
        if (isSuperAdmin && isEvolutionConfig) {
            finalTenantId = null;
            console.log(`[SAVE_CRED] ✅ SuperAdmin saving ${body.name} as GLOBAL (tenantId=null)`);
        }
        else {
            console.log('[SAVE_CRED] Final tenantId:', tenantId, 'Key:', body.name);
        }
        return this.integrationsService.saveApiCredential(finalTenantId, body.name, body.value);
    }
    async getCredentials(req) {
        console.log('[GET_CRED] req.user:', JSON.stringify(req.user));
        let tenantId = req.user.tenantId;
        console.log('[GET_CRED] Initial tenantId from token:', tenantId);
        if (!tenantId) {
            console.log('[GET_CRED] Fetching tenantId from DB for userId:', req.user.userId);
            tenantId = await this.integrationsService.fetchUserTenantId(req.user.userId);
            console.log('[GET_CRED] Fetched tenantId from DB:', tenantId);
        }
        console.log('[GET_CRED] Final tenantId:', tenantId);
        return this.integrationsService.findAllCredentials(tenantId);
    }
    remove(req, id) {
        return this.integrationsService.remove(id, req.user.tenantId);
    }
    updateSettings(req, id, body) {
        return this.integrationsService.updateSettings(id, req.user.tenantId, body.settings);
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('evolution/instances'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "listEvolutionInstances", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('evolution/instance'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "createEvolutionInstance", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('evolution/qrcode/:instanceName'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('instanceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getEvolutionQrCodeByName", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('evolution/qrcode'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getEvolutionQrCode", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('evolution/status/:instanceName'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('instanceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getEvolutionInstanceStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('evolution/webhook/:instanceName'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('instanceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "setEvolutionWebhook", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('evolution/instance/:instanceName'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('instanceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "deleteEvolutionInstanceByName", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('evolution/instance'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "deleteEvolutionInstance", null);
__decorate([
    (0, common_1.Post)('evolution/webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "handleEvolutionWebhook", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('connect/:provider'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('provider')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "connect", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('credentials'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "saveCredentials", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('credentials'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getCredentials", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "updateSettings", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, common_1.Controller)('integrations'),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService,
        evolution_api_service_1.EvolutionApiService,
        n8n_service_1.N8nService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map