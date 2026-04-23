import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Integration, IntegrationProvider, IntegrationStatus } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class IntegrationsService {
    private readonly logger = new Logger(IntegrationsService.name);

    constructor(
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
        @InjectRepository(ApiCredential)
        private apiCredentialRepository: Repository<ApiCredential>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async checkTenantExists(tenantId: string): Promise<boolean> {
        // QUICK FIX: Since we don't have TenantRepository injected and adding it might require import changes,
        // we check if there are any Integrations OR ApiCredentials for this tenant.
        // This is a safe proxy because an active tenant MUST have at least one of these (e.g. Evolution integration).
        const integrationCount = await this.integrationRepository.count({ where: { tenantId } });
        if (integrationCount > 0) return true;

        const credCount = await this.apiCredentialRepository.count({ where: { tenantId } });
        if (credCount > 0) return true;

        // Also check Users
        const userCount = await this.usersRepository.count({ where: { tenantId } });
        if (userCount > 0) return true;

        this.logger.warn(`Tenant ${tenantId} not found in Integrations, Credentials, or Users.`);
        return false;
    }

    async fetchUserTenantId(userId: string): Promise<string | null> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        return user?.tenantId || null;
    }

    async findAllByTenant(tenantId: string, role?: string) {
        if (role === 'superadmin') {
            return this.integrationRepository.find();
        }
        return this.integrationRepository.find({ where: { tenantId } });
    }

    async findOne(id: string, tenantId: string) {
        return this.integrationRepository.findOne({ where: { id, tenantId } });
    }

    async create(tenantId: string, provider: IntegrationProvider, credentials: any) {
        const integration = this.integrationRepository.create({
            tenantId,
            provider,
            credentials,
            status: IntegrationStatus.CONNECTED,
        });
        return this.integrationRepository.save(integration);
    }

    async remove(id: string, tenantId: string) {
        const integration = await this.findOne(id, tenantId);
        if (integration) {
            return this.integrationRepository.remove(integration);
        }
    }

    async updateSettings(id: string, tenantId: string, settings: any) {
        const integration = await this.findOne(id, tenantId);
        if (integration) {
            integration.settings = settings;
            return this.integrationRepository.save(integration);
        }
        return null;
    }

    // Logic to handle Meta OAuth code exchange would go here
    async connectMeta(tenantId: string, code: string) {
        this.logger.log(`Connecting Meta for tenant ${tenantId} with code ${code}`);
        // 1. Get client_id/secret for Meta (either from tenant settings or global)
        // 2. Exchange code for access_token
        // 3. Save integration
        return { success: true, message: 'Meta connected (Mock)' };
    }

    // Global and Tenant specific API Credentials
    async saveApiCredential(tenantId: string | null, keyName: string, keyValue: string) {
        this.logger.log(`[SAVE_CREDENTIAL] Attempting to save key "${keyName}" for tenant "${tenantId}"`);

        if (!tenantId) {
            this.logger.warn(`[SAVE_CREDENTIAL] Saving with NULL tenantId. This might be a legacy global key or a bug.`);
        }

        let cred = await this.apiCredentialRepository.findOne({
            where: { tenantId: tenantId ?? IsNull(), key_name: keyName },
            order: { createdAt: 'DESC' }
        });

        if (cred) {
            cred.key_value = keyValue;
            this.logger.log(`[SAVE_CREDENTIAL] Updating existing credential ID: ${cred.id}`);
        } else {
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
        } catch (error) {
            this.logger.error(`[SAVE_CREDENTIAL] FAILURE: Could not save ${keyName} for tenant ${tenantId}. Error: ${error.message}`);
            throw error;
        }
    }

    async deleteCredential(tenantId: string, keyName: string) {
        this.logger.log(`[DELETE_CRED] Deleting credential "${keyName}" for tenant "${tenantId}"`);
        return this.apiCredentialRepository.delete({ tenantId, key_name: keyName });
    }

    async getCredential(tenantId: string | null, keyName: string, isOptional: boolean = false): Promise<string | null> {
        // 1. First try to get tenant-specific credential
        const tenantCred = await this.apiCredentialRepository.findOne({
            where: { tenantId: tenantId ?? IsNull(), key_name: keyName },
            order: { createdAt: 'DESC' } // Use createdAt as fallback for build compatibility
        });

        if (tenantCred) {
            // Se o tenant salvou uma string vazia explícita (ex: o usuário apagou no painel)
            // Não devemos fazer fallback para token global, e sim retornar vazio.
            if (tenantCred.key_value === '') {
                this.logger.log(`[GET_CRED] SUCCESS: Tenant explicitly cleared "${keyName}". Returning empty.`);
                return '';
            }
            if (tenantCred.key_value) {
                this.logger.log(`[GET_CRED] SUCCESS: Found tenant-specific "${keyName}" for tenant ${tenantId}`);
                return tenantCred.key_value;
            }
        }

        // 2. Fallback: get GLOBAL credential (tenantId = null)
        const globalCred = await this.apiCredentialRepository.findOne({
            where: { tenantId: IsNull(), key_name: keyName },
            order: { createdAt: 'DESC' }
        });
        if (globalCred?.key_value) {
            this.logger.log(`[GET_CRED] SUCCESS: Found GLOBAL fallback "${keyName}"`);
            return globalCred.key_value;
        }

        if (isOptional) {
            this.logger.debug(`[GET_CRED] No credential found for "${keyName}" (Optional).`);
        } else {
            this.logger.warn(`[GET_CRED] No credential found for "${keyName}"`);
        }
        return null;
    }

    async findAllCredentials(tenantId: string | null) {
        this.logger.log(`[FIND_ALL] Tenant: ${tenantId}`);
        const whereClause = tenantId ? { tenantId } : { tenantId: IsNull() };
        const results = await this.apiCredentialRepository.find({ where: whereClause });
        this.logger.log(`[FIND_ALL] Found ${results.length} credentials for tenant ${tenantId}`);
        return results;
    }

    async resolveInstance(tenantId: string, instanceNameOrId: string): Promise<Integration | null> {
        // 1. Try by ID (UUID)
        if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(instanceNameOrId)) {
            return this.integrationRepository.findOne({ where: { id: instanceNameOrId, tenantId } });
        }

        // 2. Try by Name in Credentials/Settings
        const integrations = await this.findAllByTenant(tenantId);
        const normalizedInput = instanceNameOrId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        return integrations.find(i => {
            const name = i.credentials?.instanceName || i.settings?.instanceName || i.credentials?.name || i.credentials?.instance || '';
            const normalizedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return normalizedName === normalizedInput;
        }) || null;
    }

    async findCredentialByValue(keyName: string, keyValue: string): Promise<ApiCredential | null> {
        return this.apiCredentialRepository.findOne({
            where: { key_name: keyName, key_value: keyValue }
        });
    }

    async getOrCreateTenantApiKey(tenantId: string): Promise<string> {
        const existingKey = await this.getCredential(tenantId, 'TENANT_API_KEY', true);
        if (existingKey) return existingKey;

        const newKey = `zp_${crypto.randomBytes(32).toString('hex')}`;
        await this.saveApiCredential(tenantId, 'TENANT_API_KEY', newKey);
        this.logger.log(`[API_KEY] Generated new API Key for tenant ${tenantId}`);
        return newKey;
    }
}
