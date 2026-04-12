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
            
            let webhookUrl = await this.integrationsService.getCredential(tenantId, 'N8N_WEBHOOK_URL', true);

            if (!webhookUrl) {
                this.logger.warn(`[TRIGGER_N8N] Webhook NOT configured for tenant ${tenantId}. Skipping.`);
                return;
            }

            // AUTO-FIX: Common typos in protocol
            if (webhookUrl.startsWith('htthttps:')) {
                webhookUrl = webhookUrl.replace('htthttps:', 'https:');
            } else if (webhookUrl.startsWith('hhttps:')) {
                webhookUrl = webhookUrl.replace('hhttps:', 'https:');
            }

            this.logger.log(`[TRIGGER_N8N] Sending to: ${webhookUrl}`);
 
            // Send and WAIT for response if needed
            const response = await axios.post(webhookUrl, {
                ...payload,
                tenantId,
                integrationId: integration?.id,
                instanceName: integration?.credentials?.instanceName || integration?.settings?.instanceName || integration?.credentials?.name || integration?.credentials?.instance || integration?.settings?.name,
                timestamp: new Date().toISOString(),
                platform: 'zaplandia'
            });

            this.logger.log(`[TRIGGER_N8N] SUCCESS: Webhook accepted for tenant ${tenantId}. Status: ${response.status}`);
            return response.data;

        } catch (error) {
            this.logger.error(`[TRIGGER_N8N] UNEXPECTED ERROR: ${error.message}`);
        }
    }
}
