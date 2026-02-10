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
exports.DebugController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crm_entity_1 = require("../crm/entities/crm.entity");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const integrations_service_1 = require("../integrations/integrations.service");
const evolution_api_service_1 = require("../integrations/evolution-api.service");
const integration_entity_1 = require("../integrations/entities/integration.entity");
let DebugController = class DebugController {
    contactRepository;
    messageRepository;
    integrationRepository;
    integrationsService;
    evolutionApiService;
    constructor(contactRepository, messageRepository, integrationRepository, integrationsService, evolutionApiService) {
        this.contactRepository = contactRepository;
        this.messageRepository = messageRepository;
        this.integrationRepository = integrationRepository;
        this.integrationsService = integrationsService;
        this.evolutionApiService = evolutionApiService;
    }
    async getInstanceStats(req) {
        const tenantId = req.user.tenantId;
        const instanceCounts = await this.contactRepository
            .createQueryBuilder('contact')
            .select('contact.instance', 'instance')
            .addSelect('COUNT(*)', 'count')
            .where('contact.tenantId = :tenantId', { tenantId })
            .groupBy('contact.instance')
            .getRawMany();
        const withInstance = await this.contactRepository.find({
            where: { tenantId, instance: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) },
            take: 5,
            order: { createdAt: 'DESC' }
        });
        const withoutInstance = await this.contactRepository.find({
            where: { tenantId, instance: (0, typeorm_2.IsNull)() },
            take: 5,
            order: { createdAt: 'DESC' }
        });
        return {
            summary: instanceCounts,
            examples: {
                withInstance: withInstance.map(c => ({
                    id: c.id,
                    name: c.name,
                    instance: c.instance,
                    createdAt: c.createdAt
                })),
                withoutInstance: withoutInstance.map(c => ({
                    id: c.id,
                    name: c.name,
                    instance: c.instance,
                    createdAt: c.createdAt
                }))
            }
        };
    }
    async forceUpdateInstances(req) {
        const tenantId = req.user.tenantId;
        const contactsWithoutInstance = await this.contactRepository.find({
            where: { tenantId, instance: (0, typeorm_2.IsNull)() }
        });
        const defaultInstance = `tenant_${tenantId}_zaplandia_01`;
        for (const contact of contactsWithoutInstance) {
            contact.instance = defaultInstance;
        }
        await this.contactRepository.save(contactsWithoutInstance);
        return {
            message: `Atualizados ${contactsWithoutInstance.length} contatos com instância ${defaultInstance}`,
            updated: contactsWithoutInstance.length
        };
    }
    async syncEvolutionInstances(req) {
        const tenantId = req.user.tenantId;
        const instances = await this.evolutionApiService.listInstances(tenantId);
        const results = [];
        for (const inst of instances) {
            const instanceName = inst.name || inst.instance?.instanceName || inst.instanceName;
            const existing = await this.integrationRepository.findOne({
                where: {
                    tenantId,
                    provider: 'evolution',
                    settings: { instanceName }
                }
            });
            if (!existing) {
                const integration = await this.integrationsService.create(tenantId, 'evolution', { instanceName, syncedFromEvolution: true });
                results.push({ instanceName, action: 'created', id: integration.id });
            }
            else {
                results.push({ instanceName, action: 'already_exists', id: existing.id });
            }
        }
        return {
            message: 'Sincronização concluída',
            results
        };
    }
    async backfillInstances(req) {
        const tenantId = req.user.tenantId;
        const contactsWithInstance = await this.contactRepository.find({
            where: { tenantId, instance: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) }
        });
        let totalUpdated = 0;
        for (const contact of contactsWithInstance) {
            if (!contact.instance)
                continue;
            const result = await this.messageRepository.createQueryBuilder()
                .update('messages')
                .set({ instance: contact.instance })
                .where('contactId = :contactId', { contactId: contact.id })
                .andWhere('instance IS NULL')
                .execute();
            totalUpdated += (result.affected || 0);
        }
        return {
            message: `Backfill completed. Updated ${totalUpdated} messages across ${contactsWithInstance.length} contacts.`,
            updatedMessages: totalUpdated,
            contactsProcessed: contactsWithInstance.length
        };
    }
};
exports.DebugController = DebugController;
__decorate([
    (0, common_1.Get)('instances'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "getInstanceStats", null);
__decorate([
    (0, common_1.Post)('force-update-instances'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "forceUpdateInstances", null);
__decorate([
    (0, common_1.Post)('sync-evolution-instances'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "syncEvolutionInstances", null);
__decorate([
    (0, common_1.Post)('backfill-instances'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "backfillInstances", null);
exports.DebugController = DebugController = __decorate([
    (0, common_1.Controller)('debug'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPERADMIN),
    __param(0, (0, typeorm_1.InjectRepository)(crm_entity_1.Contact)),
    __param(1, (0, typeorm_1.InjectRepository)(crm_entity_1.Message)),
    __param(2, (0, typeorm_1.InjectRepository)(integration_entity_1.Integration)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        integrations_service_1.IntegrationsService,
        evolution_api_service_1.EvolutionApiService])
], DebugController);
//# sourceMappingURL=debug.controller.js.map