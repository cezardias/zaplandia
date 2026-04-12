import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import axios from 'axios';

@Injectable()
export class N8nService {
    private readonly logger = new Logger(N8nService.name);

    constructor(private readonly integrationsService: IntegrationsService) { }

    async triggerWebhook(tenantId: string, payload: any, integration?: any) {
        try {
            this.logger.log(`[TRIGGER_N8N] Initiated for tenant: ${tenantId}, Event: ${payload?.type || 'unknown'}`);
            
            const webhookUrl = await this.integrationsService.getCredential(tenantId, 'N8N_WEBHOOK_URL', true);

            if (!webhookUrl) {
                this.logger.warn(`[TRIGGER_N8N] Webhook NOT configured for tenant ${tenantId}. Skipping.`);
                return;
            }

            this.logger.log(`[TRIGGER_N8N] Sending to: ${webhookUrl}`);

            // Send async to not block the main flow
            axios.post(webhookUrl, {
                ...payload,
                tenantId,
                integrationId: integration?.id,
                instanceName: integration?.credentials?.instanceName || integration?.settings?.instanceName || integration?.credentials?.name || integration?.credentials?.instance || integration?.settings?.name,
                timestamp: new Date().toISOString(),
                platform: 'zaplandia'
            }).then(response => {
                this.logger.log(`[TRIGGER_N8N] SUCCESS: Webhook accepted for tenant ${tenantId}. Status: ${response.status}`);
            }).catch(err => {
                this.logger.error(`[TRIGGER_N8N] FAILED: Error sending to n8n for tenant ${tenantId}: ${err.message}`);
                if (err.response) {
                    this.logger.error(`[TRIGGER_N8N] Response status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`);
                }
            });

        } catch (error) {
            this.logger.error(`[TRIGGER_N8N] UNEXPECTED ERROR: ${error.message}`);
        }
    }
}
