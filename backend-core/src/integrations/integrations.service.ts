import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Integration, IntegrationProvider, IntegrationStatus } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';

@Injectable()
export class IntegrationsService {
    private readonly logger = new Logger(IntegrationsService.name);

    constructor(
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
        @InjectRepository(ApiCredential)
        private apiCredentialRepository: Repository<ApiCredential>,
    ) { }

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
        const finalTenantId = tenantId || null;
        this.logger.log(`[SAVE] Key: ${keyName}, Value Length: ${keyValue?.length}, Tenant: ${finalTenantId || 'GLOBAL'}`);

        let cred = await this.apiCredentialRepository.findOne({
            where: { tenantId: finalTenantId === null ? IsNull() : finalTenantId, key_name: keyName }
        });

        if (cred) {
            cred.key_value = keyValue;
            this.logger.log(`[UPDATE] Found existing ID: ${cred.id}`);
        } else {
            cred = this.apiCredentialRepository.create({
                tenantId: finalTenantId as any,
                key_name: keyName,
                key_value: keyValue,
            });
            this.logger.log(`[CREATE] Creating new entry`);
        }
        try {
            const saved = await this.apiCredentialRepository.save(cred);
            this.logger.log(`[SUCCESS] Saved ID: ${saved.id}`);
            return saved;
        } catch (error) {
            this.logger.error(`[ERROR] Failed to save ${keyName}: ${error.message}`);
            throw error;
        }
    }

    async getCredential(tenantId: string | null, keyName: string): Promise<string | null> {
        // Try tenant specific key
        const tenantCred = await this.apiCredentialRepository.findOne({
            where: { tenantId: tenantId ?? IsNull(), key_name: keyName }
        });
        if (tenantCred?.key_value) return tenantCred.key_value;

        // Fallback to global key (where tenantId is strictly IsNull)
        const globalCred = await this.apiCredentialRepository.findOne({
            where: { tenantId: IsNull(), key_name: keyName }
        });
        return globalCred?.key_value || null;
    }

    async findAllCredentials(tenantId: string | null, includeGlobal = true) {
        if (!includeGlobal || tenantId === null) {
            return this.apiCredentialRepository.find({
                where: { tenantId: tenantId ?? IsNull() }
            });
        }

        // Fetch both tenant and global
        return this.apiCredentialRepository.find({
            where: [
                { tenantId },
                { tenantId: IsNull() }
            ]
        });
    }
}
