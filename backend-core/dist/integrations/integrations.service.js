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
var IntegrationsService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const integration_entity_1 = require("./entities/integration.entity");
const api_credential_entity_1 = require("./entities/api-credential.entity");
const user_entity_1 = require("../users/entities/user.entity");
let IntegrationsService = IntegrationsService_1 = class IntegrationsService {
    integrationRepository;
    apiCredentialRepository;
    usersRepository;
    logger = new common_1.Logger(IntegrationsService_1.name);
    constructor(integrationRepository, apiCredentialRepository, usersRepository) {
        this.integrationRepository = integrationRepository;
        this.apiCredentialRepository = apiCredentialRepository;
        this.usersRepository = usersRepository;
    }
    async fetchUserTenantId(userId) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        return user?.tenantId || null;
    }
    async findAllByTenant(tenantId, role) {
        if (role === 'superadmin') {
            return this.integrationRepository.find();
        }
        return this.integrationRepository.find({ where: { tenantId } });
    }
    async findOne(id, tenantId) {
        return this.integrationRepository.findOne({ where: { id, tenantId } });
    }
    async create(tenantId, provider, credentials) {
        const integration = this.integrationRepository.create({
            tenantId,
            provider,
            credentials,
            status: integration_entity_1.IntegrationStatus.CONNECTED,
        });
        return this.integrationRepository.save(integration);
    }
    async remove(id, tenantId) {
        const integration = await this.findOne(id, tenantId);
        if (integration) {
            return this.integrationRepository.remove(integration);
        }
    }
    async updateSettings(id, tenantId, settings) {
        const integration = await this.findOne(id, tenantId);
        if (integration) {
            integration.settings = settings;
            return this.integrationRepository.save(integration);
        }
        return null;
    }
    async connectMeta(tenantId, code) {
        this.logger.log(`Connecting Meta for tenant ${tenantId} with code ${code}`);
        return { success: true, message: 'Meta connected (Mock)' };
    }
    async saveApiCredential(tenantId, keyName, keyValue) {
        this.logger.log(`[SAVE_CREDENTIAL] Attempting to save key "${keyName}" for tenant "${tenantId}"`);
        if (!tenantId) {
            this.logger.warn(`[SAVE_CREDENTIAL] Saving with NULL tenantId. This might be a legacy global key or a bug.`);
        }
        let cred = await this.apiCredentialRepository.findOne({
            where: { tenantId: tenantId ?? (0, typeorm_2.IsNull)(), key_name: keyName }
        });
        if (cred) {
            cred.key_value = keyValue;
            this.logger.log(`[SAVE_CREDENTIAL] Updating existing credential ID: ${cred.id}`);
        }
        else {
            cred = this.apiCredentialRepository.create({
                tenantId: tenantId || undefined,
                key_name: keyName,
                key_value: keyValue,
            });
            this.logger.log(`[SAVE_CREDENTIAL] Creating new credential entry`);
        }
        try {
            const saved = await this.apiCredentialRepository.save(cred);
            this.logger.log(`[SAVE_CREDENTIAL] SUCCESS: Saved ID ${saved.id} for key ${keyName}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`[SAVE_CREDENTIAL] FAILURE: Could not save ${keyName} for tenant ${tenantId}. Error: ${error.message}`);
            throw error;
        }
    }
    async getCredential(tenantId, keyName) {
        const tenantCred = await this.apiCredentialRepository.findOne({
            where: { tenantId, key_name: keyName }
        });
        if (tenantCred?.key_value) {
            this.logger.log(`[GET_CRED] Found tenant-specific "${keyName}" for tenant ${tenantId}`);
            return tenantCred.key_value;
        }
        const globalCred = await this.apiCredentialRepository.findOne({
            where: { tenantId: (0, typeorm_2.IsNull)(), key_name: keyName }
        });
        if (globalCred?.key_value) {
            this.logger.log(`[GET_CRED] Found GLOBAL "${keyName}" (fallback)`);
            return globalCred.key_value;
        }
        this.logger.warn(`[GET_CRED] No credential found for "${keyName}"`);
        return null;
    }
    async findAllCredentials(tenantId) {
        this.logger.log(`[FIND_ALL] Tenant: ${tenantId}`);
        const whereClause = tenantId ? { tenantId } : { tenantId: (0, typeorm_2.IsNull)() };
        const results = await this.apiCredentialRepository.find({ where: whereClause });
        this.logger.log(`[FIND_ALL] Found ${results.length} credentials for tenant ${tenantId}`);
        return results;
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = IntegrationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(integration_entity_1.Integration)),
    __param(1, (0, typeorm_1.InjectRepository)(api_credential_entity_1.ApiCredential)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object])
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map