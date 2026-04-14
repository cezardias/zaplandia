import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import axios from 'axios';

@Injectable()
export class MetaApiService {
    private readonly logger = new Logger(MetaApiService.name);
    private readonly baseUrl = 'https://graph.facebook.com/v21.0';

    constructor(private readonly integrationsService: IntegrationsService) { }

    private async getCredentials(tenantId: string) {
        const accessToken = await this.integrationsService.getCredential(tenantId, 'META_ACCESS_TOKEN');
        const wabaId = await this.integrationsService.getCredential(tenantId, 'META_WABA_ID');
        const phoneNumberId = await this.integrationsService.getCredential(tenantId, 'META_PHONE_NUMBER_ID');

        if (!accessToken) {
            throw new Error('META_ACCESS_TOKEN not configured');
        }

        this.logger.debug(`[META_AUTH] Using token starting with: ${accessToken.substring(0, 5)}...`);

        return { accessToken, wabaId, phoneNumberId };
    }

    async testConnection(tenantId: string) {
        try {
            const { accessToken, wabaId } = await this.getCredentials(tenantId);
            const response = await axios.get(`${this.baseUrl}/${wabaId}`, {
                params: { access_token: accessToken },
            });
            return { success: true, data: response.data };
        } catch (error) {
            this.logger.error(`Meta API connection test failed: ${error.message}`);
            return { success: false, error: error.response?.data || error.message };
        }
    }

    async getTemplates(tenantId: string) {
        try {
            const { accessToken, wabaId } = await this.getCredentials(tenantId);
            const response = await axios.get(`${this.baseUrl}/${wabaId}/message_templates`, {
                params: { access_token: accessToken },
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch Meta templates: ${error.message}`);
            throw error;
        }
    }

    async getPhoneNumbers(tenantId: string) {
        try {
            const { accessToken, wabaId } = await this.getCredentials(tenantId);
            const response = await axios.get(`${this.baseUrl}/${wabaId}/phone_numbers`, {
                params: { access_token: accessToken },
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch Meta phone numbers: ${error.message}`);
            throw error;
        }
    }

    async getBusinessAccount(tenantId: string) {
        try {
            const { accessToken, wabaId } = await this.getCredentials(tenantId);
            const response = await axios.get(`${this.baseUrl}/${wabaId}`, {
                params: {
                    access_token: accessToken,
                    fields: 'id,name,currency,timezone_id,message_template_namespace'
                },
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch Meta business account: ${error.message}`);
            throw error;
        }
    }

    async sendTemplateMessage(tenantId: string, to: string, templateName: string, languageCode: string, components: any[] = []) {
        try {
            const { accessToken, phoneNumberId } = await this.getCredentials(tenantId);
            if (!phoneNumberId) throw new Error('META_PHONE_NUMBER_ID not configured');

            const response = await axios.post(
                `${this.baseUrl}/${phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: languageCode },
                        components
                    },
                },
                { params: { access_token: accessToken } }
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to send Meta template message: ${error.message}`);
            throw error;
        }
    }

    async sendTextMessage(tenantId: string, to: string, text: string) {
        try {
            const { accessToken, phoneNumberId } = await this.getCredentials(tenantId);
            if (!phoneNumberId) throw new Error('META_PHONE_NUMBER_ID not configured');

            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'text',
                text: { body: text }
            };

            this.logger.log(`[META_DEBUG] Sending text to ${to} via ID ${phoneNumberId}`);
            // this.logger.debug(`[META_DEBUG] Payload: ${JSON.stringify(payload)}`);

            const response = await axios.post(
                `${this.baseUrl}/${phoneNumberId}/messages`,
                payload,
                { params: { access_token: accessToken } }
            );

            this.logger.log(`[META_DEBUG] SUCCESS: Message ID ${response.data?.messages?.[0]?.id}`);
            return response.data;
        } catch (error: any) {
            const errorData = error.response?.data?.error || {};
            const detailedMsg = errorData.message || error.message;
            this.logger.error(`[META_DEBUG] FAILED to send to ${to}: ${detailedMsg}`);
            if (error.response?.data) {
                this.logger.error(`[META_DEBUG] Full Error Data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    async createTemplate(tenantId: string, templateData: { name: string, category: string, language: string, bodyText: string }) {
        try {
            const { accessToken, wabaId } = await this.getCredentials(tenantId);
            if (!wabaId) throw new Error('META_WABA_ID not configured');

            const response = await axios.post(
                `${this.baseUrl}/${wabaId}/message_templates`,
                {
                    name: templateData.name,
                    category: templateData.category,
                    language: templateData.language,
                    components: [
                        {
                            type: 'BODY',
                            text: templateData.bodyText
                        }
                    ]
                },
                { params: { access_token: accessToken } }
            );
            return response.data;
        } catch (error) {
            const errorData = error.response?.data?.error || {};
            const detailedMsg = errorData.message || error.message;
            this.logger.error(`Failed to create Meta template: ${detailedMsg}`);
            if (error.response?.data) {
                this.logger.error(`[META_TEMPLATE_ERROR] Full Response: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(detailedMsg);
        }
    }

    async registerNumber(tenantId: string, pin: string) {
        try {
            const { accessToken, phoneNumberId } = await this.getCredentials(tenantId);
            if (!phoneNumberId) throw new Error('META_PHONE_NUMBER_ID not configured');

            const response = await axios.post(
                `${this.baseUrl}/${phoneNumberId}/register`,
                {
                    messaging_product: 'whatsapp',
                    pin: pin || '000000'
                },
                { params: { access_token: accessToken } }
            );

            this.logger.log(`[META_AUTH] SUCCESS: Number registered successfully: ${phoneNumberId}`);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data?.error || {};
            const detailedMsg = errorData.message || error.message;
            this.logger.error(`Failed to register Meta number: ${detailedMsg}`);
            if (error.response?.data) {
                this.logger.error(`[META_REG_ERROR] Full Response: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(detailedMsg);
        }
    }

    /**
     * Subscribes the app to the WABA to receive webhooks for the 'messages' field.
     * This is equivalent to clicking "Subscribe" in the Meta for Developers dashboard.
     * The actual webhook URL & verify token must be set in the Meta app dashboard.
     */
    async setupWebhookSubscription(tenantId: string) {
        try {
            const { accessToken, wabaId } = await this.getCredentials(tenantId);
            if (!wabaId) throw new Error('META_WABA_ID not configured');

            // Subscribe the app to the WABA webhook for messages
            const response = await axios.post(
                `${this.baseUrl}/${wabaId}/subscribed_apps`,
                {},
                { params: { access_token: accessToken } }
            );

            this.logger.log(`[META_WEBHOOK] App subscribed to WABA ${wabaId}: ${JSON.stringify(response.data)}`);
            return { success: true, data: response.data };
        } catch (error) {
            const errorData = error.response?.data?.error || {};
            const detailedMsg = errorData.message || error.message;
            this.logger.error(`[META_WEBHOOK] Failed to subscribe app: ${detailedMsg}`);
            throw new Error(detailedMsg);
        }
    }

    /**
     * Returns the current webhook subscription status for the WABA.
     */
    async getWebhookStatus(tenantId: string) {
        try {
            const { accessToken, wabaId, phoneNumberId } = await this.getCredentials(tenantId);

            // Get subscribed apps for the WABA
            const subRes = await axios.get(
                `${this.baseUrl}/${wabaId}/subscribed_apps`,
                { params: { access_token: accessToken } }
            ).catch(() => ({ data: { data: [] } }));

            // Get phone number status
            let phoneStatus: any = null;
            if (phoneNumberId) {
                try {
                    const phoneRes = await axios.get(
                        `${this.baseUrl}/${phoneNumberId}`,
                        { params: { access_token: accessToken, fields: 'id,display_phone_number,status,quality_rating,verified_name,code_verification_status,is_official_business_account' } }
                    );
                    phoneStatus = phoneRes.data;
                } catch (e) {
                    this.logger.warn(`[META_WEBHOOK] Could not fetch phone status: ${e.message}`);
                }
            }

            const subscribedApps = subRes.data?.data || [];
            const isSubscribed = subscribedApps.length > 0;

            return {
                isSubscribed,
                subscribedApps,
                phoneStatus,
                wabaId,
                phoneNumberId,
            };
        } catch (error) {
            const errorData = error.response?.data?.error || {};
            const detailedMsg = errorData.message || error.message;
            this.logger.error(`[META_WEBHOOK] Failed to get webhook status: ${detailedMsg}`);
            throw new Error(detailedMsg);
        }
    }
}
