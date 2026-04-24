import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import axios from 'axios';

@Injectable()
export class MetaApiService {
    private readonly logger = new Logger(MetaApiService.name);
    private readonly baseUrl = 'https://graph.facebook.com/v19.0';

    constructor(private readonly integrationsService: IntegrationsService) { }

    public async getCredentials(tenantId: string) {
        // Individual keys (Priority 1)
        let accessToken = await this.integrationsService.getCredential(tenantId, 'META_ACCESS_TOKEN', true);
        let wabaId = await this.integrationsService.getCredential(tenantId, 'META_WABA_ID', true);
        let phoneNumberId = await this.integrationsService.getCredential(tenantId, 'META_PHONE_NUMBER_ID', true);
        let instagramBusinessId = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_PAGE_ID', true);
        let instagramAccessToken = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_ACCESS_TOKEN', true);
        let instagramAppId = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_APP_ID', true);
        let instagramAppSecret = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_APP_SECRET', true);

        // Try load from JSON config (Priority 2)
        const metaAppConfig = await this.integrationsService.getCredential(tenantId, 'META_APP_CONFIG', true);
        if (metaAppConfig) {
            try {
                const parsed = JSON.parse(metaAppConfig);
                // WhatsApp fallbacks
                if (!accessToken) accessToken = parsed.accessToken || parsed.pageAccessToken;
                if (!wabaId) wabaId = parsed.whatsappBusinessAccountId || parsed.wabaId;
                if (!phoneNumberId) phoneNumberId = parsed.whatsappPhoneNumberId || parsed.phoneNumberId;
                
                // Instagram fallbacks
                if (!instagramBusinessId) instagramBusinessId = parsed.instagramBusinessId;
                if (!instagramAccessToken) instagramAccessToken = parsed.instagramAccessToken || parsed.pageAccessToken || parsed.accessToken;
                if (!instagramAppId) instagramAppId = parsed.instagramAppId;
                if (!instagramAppSecret) instagramAppSecret = parsed.instagramAppSecret;
            } catch (e) {
                this.logger.warn(`Failed to parse META_APP_CONFIG for tenant ${tenantId}`);
            }
        }

        if (!accessToken) {
            this.logger.warn(`[META_API] META_ACCESS_TOKEN (WhatsApp) not configured for tenant ${tenantId}`);
        } else {
            this.logger.debug(`[META_AUTH] Using WhatsApp token starting with: ${accessToken.substring(0, 5)}...`);
        }

        if (instagramAccessToken) {
            this.logger.debug(`[META_AUTH] Using Instagram specific token starting with: ${instagramAccessToken.substring(0, 5)}...`);
        }

        return { accessToken, wabaId, phoneNumberId, instagramBusinessId, instagramAccessToken, instagramAppId, instagramAppSecret };
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

    /**
     * Send an Instagram DM reply to a user via their Page-Scoped ID (PSID).
     * Requires instagram_manage_messages permission and the Page Access Token.
     * The recipient PSID comes from messaging.sender.id in the Instagram webhook payload.
     */
    async sendInstagramMessage(tenantId: string, recipientPsid: string, text: string) {
        try {
            const { accessToken: defaultToken, instagramBusinessId: configIbId, instagramAccessToken } = await this.getCredentials(tenantId);
            const accessToken = instagramAccessToken || defaultToken;
            const instagramAppSecret = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_APP_SECRET', true);

            // Instagram page ID for the tenant
            let pageId = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_PAGE_ID', true);
            if (!pageId) pageId = configIbId; // Fallback to ID from META_APP_CONFIG
            
            if (!pageId) throw new Error('INSTAGRAM_PAGE_ID not configured for tenant (check META_APP_CONFIG)');

            let cleanToken = accessToken ? accessToken.toString().trim().replace(/['"]+/g, '') : '';
            this.logger.log(`[INSTAGRAM_SEND] Token prefix: ${cleanToken.substring(0, 7)}... Length: ${cleanToken.length}`);

            const payload = {
                recipient: { id: recipientPsid },
                message: { text },
                messaging_type: 'RESPONSE',
            };

            const activeUrl = `https://graph.facebook.com/v19.0/${pageId}/messages`;
            this.logger.log(`[INSTAGRAM_SEND] Target URL: ${activeUrl}`);
            this.logger.debug(`[INSTAGRAM_SEND] Payload: ${JSON.stringify(payload)}`);

            // Security: Calculate appsecret_proof if optional instagramAppSecret is provided
            let appsecret_proof: string | undefined = undefined;
            if (instagramAppSecret) {
                const crypto = require('crypto');
                appsecret_proof = crypto
                    .createHmac('sha256', instagramAppSecret.toString().trim())
                    .update(cleanToken)
                    .digest('hex');
            }

            const response = await axios.post(
                activeUrl,
                payload,
                { 
                    params: { 
                        access_token: cleanToken,
                        ...(appsecret_proof && { appsecret_proof })
                    } 
                }
            );

            this.logger.log(`[INSTAGRAM_SEND] SUCCESS: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error: any) {
            const errorData = error.response?.data?.error || {};
            const detailedMsg = errorData.message || error.message;
            this.logger.error(`[INSTAGRAM_SEND] FAILED: ${detailedMsg}`);
            if (error.response?.data) {
                this.logger.error(`[INSTAGRAM_SEND] Full Error: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Fetches the Instagram user's real name from their PSID.
     * Used when creating a contact from an Instagram DM.
     */
    async getInstagramUserProfile(tenantId: string, psid: string): Promise<{ name: string; username?: string } | null> {
        try {
            const { accessToken: defaultToken, instagramAccessToken } = await this.getCredentials(tenantId);
            const accessToken = instagramAccessToken || defaultToken;
            
            if (!accessToken) {
                this.logger.warn(`[INSTAGRAM_PROFILE] No access token available for tenant ${tenantId}`);
                return null;
            }

            const response = await axios.get(
                `${this.baseUrl}/${psid}`,
                { params: { access_token: accessToken, fields: 'name,username' } }
            );
            return response.data;
        } catch (error: any) {
            this.logger.warn(`[INSTAGRAM_PROFILE] Could not fetch profile for PSID ${psid}: ${error.message}`);
            return null;
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
