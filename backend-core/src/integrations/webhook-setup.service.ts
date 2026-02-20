import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';
import { EvolutionApiService } from './evolution-api.service';

/**
 * Runs on application startup to ensure all Evolution API instances
 * have their webhook URL configured correctly.
 * This fixes the case where instances were created before the auto-webhook
 * setup was added, or where the webhook URL changed.
 */
@Injectable()
export class WebhookSetupService implements OnApplicationBootstrap {
    private readonly logger = new Logger(WebhookSetupService.name);

    constructor(
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
        @InjectRepository(ApiCredential)
        private apiCredentialRepository: Repository<ApiCredential>,
        private readonly evolutionApiService: EvolutionApiService,
    ) { }

    async onApplicationBootstrap(): Promise<void> {
        // Wait a bit for the DB connections to settle
        await new Promise(resolve => setTimeout(resolve, 3000));

        const webhookUrl = process.env.INTERNAL_WEBHOOK_URL;
        if (!webhookUrl) {
            this.logger.warn('[WEBHOOK_SETUP] INTERNAL_WEBHOOK_URL not set — skipping auto webhook setup.');
            return;
        }

        this.logger.log(`[WEBHOOK_SETUP] Starting auto-setup for all Evolution instances. Target URL: ${webhookUrl}`);

        try {
            // Find all Evolution integrations across all tenants
            const evolutionIntegrations = await this.integrationRepository.find({
                where: { provider: 'evolution' as any }
            });

            this.logger.log(`[WEBHOOK_SETUP] Found ${evolutionIntegrations.length} Evolution integration(s) in DB.`);

            // Also find the tenantId that has the global Evolution credentials (usually null = superadmin global)
            // We use the first integration's tenantId or null to get the API credentials
            let credTenantId: string | null = null;
            const globalCred = await this.apiCredentialRepository.findOne({
                where: { key_name: 'EVOLUTION_API_URL', tenantId: null as any }
            });
            if (!globalCred) {
                // Try to find a tenant-specific one
                const tenantCred = await this.apiCredentialRepository.findOne({
                    where: { key_name: 'EVOLUTION_API_URL' }
                });
                if (tenantCred) {
                    credTenantId = tenantCred.tenantId;
                }
            }

            this.logger.log(`[WEBHOOK_SETUP] Using credTenantId: ${credTenantId} for API calls`);

            for (const integration of evolutionIntegrations) {
                const instanceName = integration.credentials?.instanceName || integration.settings?.instanceName;
                if (!instanceName) {
                    this.logger.warn(`[WEBHOOK_SETUP] Skipping integration ${integration.id}: no instanceName found`);
                    continue;
                }

                try {
                    this.logger.log(`[WEBHOOK_SETUP] Configuring webhook for instance: ${instanceName}`);
                    await this.evolutionApiService.setWebhook(
                        credTenantId || integration.tenantId,
                        instanceName,
                        webhookUrl
                    );
                    this.logger.log(`[WEBHOOK_SETUP] ✅ Webhook configured for: ${instanceName} → ${webhookUrl}`);
                } catch (err) {
                    this.logger.error(`[WEBHOOK_SETUP] ❌ Failed for ${instanceName}: ${err.message}`);
                }
            }

            this.logger.log('[WEBHOOK_SETUP] Auto-setup complete.');
        } catch (err) {
            this.logger.error(`[WEBHOOK_SETUP] Fatal error during auto-setup: ${err.message}`);
        }
    }
}
