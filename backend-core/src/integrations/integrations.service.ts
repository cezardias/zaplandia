import { Injectable, Logger } from '@nestjs/common';
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
            where: { tenantId: tenantId ?? IsNull(), key_name: keyName }
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

    async getCredential(tenantId: string, keyName: string, isOptional: boolean = false): Promise<string | null> {
        // 1. First try to get tenant-specific credential
        const tenantCred = await this.apiCredentialRepository.findOne({
            where: { tenantId, key_name: keyName }
        });

        if (tenantCred?.key_value) {
            this.logger.log(`[GET_CRED] SUCCESS: Found tenant-specific "${keyName}" for tenant ${tenantId}`);
            return tenantCred.key_value;
        }

        // 2. Fallback: get GLOBAL credential (tenantId = null)
        const globalCred = await this.apiCredentialRepository.findOne({
            where: { tenantId: IsNull(), key_name: keyName }
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
}
