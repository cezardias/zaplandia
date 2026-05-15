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

            // Multi-provider routing
            const providerConfigStr = await this.integrationsService.getCredential(tenantId, 'N8N_PROVIDER_CONFIG');
            if (providerConfigStr) {
                try {
                    const providerConfig = JSON.parse(providerConfigStr);
                    const provider = payload?.provider || payload?.type?.split('.')[0];
                    if (provider && providerConfig[provider]) {
                        this.logger.log(`[TRIGGER_N8N] Using specific webhook for provider ${provider}: ${providerConfig[provider]}`);
                        webhookUrl = providerConfig[provider];
                    }
                } catch (e) {
                    this.logger.error(`[TRIGGER_N8N] Failed to parse provider config for tenant ${tenantId}`);
                }
            }

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

            this.logger.log(`[TRIGGER_N8N] Sending to: ${webhookUrl} (Tenant: ${tenantId})`);
 
            // Send and WAIT for response if needed
            const response = await axios.post(webhookUrl, {
                ...payload,
                tenantId,
                integrationId: integration?.id,
                instanceName: integration?.credentials?.instanceName || integration?.settings?.instanceName || integration?.credentials?.name || integration?.credentials?.instance || integration?.settings?.name,
                timestamp: new Date().toISOString(),
                platform: 'zaplandia'
            }, { timeout: 10000 }); // 10s timeout

            this.logger.log(`[TRIGGER_N8N] SUCCESS: Webhook accepted for tenant ${tenantId}. Status: ${response.status}`);
            return response.data;

        } catch (error) {
            const status = error.response?.status;
            const data = error.response?.data;
            this.logger.error(`[TRIGGER_N8N] FAILURE: Error calling n8n for tenant ${tenantId}. Status: ${status}. Error: ${error.message}`);
            if (data) this.logger.debug(`[TRIGGER_N8N] Error Detail: ${JSON.stringify(data)}`);
            return null;
        }
    }

    async createWorkflow(tenantId: string, workflowData: any) {
        try {
            const apiUrl = await this.integrationsService.getCredential(tenantId, 'N8N_API_URL', true);
            const apiKey = await this.integrationsService.getCredential(tenantId, 'N8N_API_KEY', true);

            if (!apiUrl || !apiKey) {
                this.logger.error(`[CREATE_WORKFLOW] n8n credentials missing for tenant ${tenantId}`);
                throw new Error('n8n API URL or API Key not configured for this tenant.');
            }

            // Ensure we have the base URL without trailing slash and including api/v1 if not present
            let cleanUrl = apiUrl.replace(/\/$/, '');
            if (!cleanUrl.includes('/api/v1') && !cleanUrl.includes('/api/v2')) {
                cleanUrl = `${cleanUrl}/api/v1`;
            }

            const url = `${cleanUrl}/workflows`;
            this.logger.log(`[CREATE_WORKFLOW] Target URL: ${url}`);
            this.logger.debug(`[CREATE_WORKFLOW] Auth Header: X-N8N-API-KEY: ${apiKey.substring(0, 4)}...`);

            const response = await axios.post(url, {
                name: workflowData.name || `Zaplandia Flow - ${new Date().toLocaleDateString()}`,
                nodes: workflowData.nodes || [],
                connections: workflowData.connections || {},
                settings: workflowData.settings || {},
                staticData: workflowData.staticData || null,
                meta: workflowData.meta || {},
                tags: workflowData.tags || [],
                active: false // Start as inactive for safety
            }, {
                headers: {
                    'X-N8N-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            this.logger.log(`[CREATE_WORKFLOW] SUCCESS: Workflow created with ID ${response.data.id}`);
            return response.data;

        } catch (error) {
            const status = error.response?.status;
            const errorMsg = error.response?.data?.message || error.message;
            this.logger.error(`[CREATE_WORKFLOW] FAILURE: ${errorMsg} (Status: ${status})`);
            throw new Error(`n8n Deployment Failed: ${errorMsg}`);
        }
    }
}
