import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import axios from 'axios';

@Injectable()
export class MetaApiService {
    private readonly logger = new Logger(MetaApiService.name);
    private readonly baseUrl = 'https://graph.facebook.com/v18.0';

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
        let facebookPageId = await this.integrationsService.getCredential(tenantId, 'FACEBOOK_PAGE_ID', true);
        let facebookAccessToken = await this.integrationsService.getCredential(tenantId, 'FACEBOOK_ACCESS_TOKEN', true);

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

                // Facebook fallbacks
                if (!facebookPageId) facebookPageId = parsed.facebookPageId || parsed.pageId;
                if (!facebookAccessToken) facebookAccessToken = parsed.facebookAccessToken || parsed.pageAccessToken || parsed.accessToken;
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

        return { 
            accessToken, 
            wabaId, 
            phoneNumberId, 
            instagramBusinessId, 
            instagramAccessToken, 
            instagramAppId, 
            instagramAppSecret,
            facebookPageId,
            facebookAccessToken
        };
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
    async sendInstagramMessage(tenantId: string, recipientPsid: string, text: string, forcedPageId?: string | null) {
        try {
            const { accessToken: defaultToken, instagramBusinessId: configIbId, instagramAccessToken } = await this.getCredentials(tenantId);
            const accessToken = instagramAccessToken || defaultToken;

            // Instagram page ID for the tenant
            let pageId: string | null | undefined = forcedPageId;
            if (!pageId) {
                pageId = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_PAGE_ID', true);
            }
            if (!pageId) pageId = configIbId; // Fallback to ID from META_APP_CONFIG
            
            if (!pageId) throw new Error('INSTAGRAM_PAGE_ID not configured for tenant');

            let cleanToken = accessToken ? accessToken.toString().trim().replace(/['"]+/g, '') : '';
            this.logger.log(`[INSTAGRAM_SEND] Token prefix: ${cleanToken.substring(0, 7)}... Length: ${cleanToken.length}`);

            const payload = {
                recipient: { id: recipientPsid },
                message: { text },
                messaging_type: 'RESPONSE'
            };

            let activeUrl = '';
            
            // Check if it's an Instagram-scoped token (IGAAR...) or a Facebook/Page-scoped token (EAA...)
            if (cleanToken.startsWith('IGAAR')) {
                // New endpoint suggested by Meta for Instagram Messaging API
                activeUrl = `https://graph.instagram.com/v18.0/me/messages`;
                this.logger.log(`[INSTAGRAM_SEND] Using Instagram-scoped API: ${activeUrl}`);
            } else {
                // Standard Instagram Graph API via Facebook Page
                activeUrl = `https://graph.facebook.com/v18.0/me/messages`;
                this.logger.log(`[INSTAGRAM_SEND] Using Facebook-scoped API: ${activeUrl} (Implicit Page via token, was explicit IG ID: ${pageId})`);
            }

            this.logger.debug(`[INSTAGRAM_SEND] Payload: ${JSON.stringify(payload)}`);

            const response = await axios.post(
                activeUrl,
                payload,
                { 
                    params: { 
                        access_token: cleanToken
                    } 
                }
            );

            this.logger.log(`[INSTAGRAM_SEND] SUCCESS: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error: any) {
            const errorData = error.response?.data?.error || {};
            const detailedMsg = errorData.message || error.message;
            const errorCode = errorData.code;
            const errorSubcode = errorData.error_subcode;
            
            this.logger.error(`[INSTAGRAM_SEND] FAILED (Code ${errorCode}, Sub ${errorSubcode}): ${detailedMsg}`);
            
            if (error.response?.data) {
                this.logger.error(`[INSTAGRAM_SEND] Full Error: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(`Meta API Error: ${detailedMsg} (Code: ${errorCode})`);
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
                `https://graph.facebook.com/v18.0/${psid}`,
                { params: { access_token: accessToken, fields: 'name,username,profile_pic' } }
            );

            return response.data;
        } catch (error: any) {
            this.logger.warn(`[INSTAGRAM_PROFILE] Could not fetch profile for PSID ${psid}: ${error.message}`);
            return null;
        }
    }

    /**
     * Get recent Instagram Media (Posts, Reels)
     * Handles both Page IDs and Instagram Business Account IDs automatically.
     */
    async getInstagramMedia(tenantId: string) {
        try {
            const { accessToken: defaultToken, instagramAccessToken, instagramBusinessId: configIbId } = await this.getCredentials(tenantId);
            const accessToken = instagramAccessToken || defaultToken;
            
            let id = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_PAGE_ID', true);
            if (!id) id = configIbId;
            if (!id) throw new Error('INSTAGRAM_PAGE_ID not configured for tenant');

            this.logger.debug(`[INSTAGRAM_MEDIA] Fetching media for ID ${id}...`);

            try {
                // Attempt 1: Direct fetch (assuming id is Instagram Business Account ID)
                const response = await axios.get(
                    `https://graph.facebook.com/v18.0/${id}/media`,
                    { params: { access_token: accessToken, fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count,like_count,owner{id,username,profile_picture_url},media_product_type,video_title' } }
                );
                return response.data;
            } catch (error: any) {
                // If it fails with #100, it might be a Page ID instead of an IG ID
                if (error.response?.data?.error?.code === 100) {
                    this.logger.log(`[INSTAGRAM_MEDIA] ID ${id} might be a Page ID. Attempting to resolve linked Instagram Business Account...`);
                    
                    const pageRes = await axios.get(
                        `https://graph.facebook.com/v18.0/${id}`,
                        { params: { access_token: accessToken, fields: 'instagram_business_account' } }
                    );

                    const igId = pageRes.data?.instagram_business_account?.id;
                    if (igId) {
                        this.logger.log(`[INSTAGRAM_MEDIA] Resolved IG ID: ${igId}. Retrying fetch...`);
                        const response = await axios.get(
                            `https://graph.facebook.com/v18.0/${igId}/media`,
                            { params: { access_token: accessToken, fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count,like_count,owner{id,username,profile_picture_url}' } }
                        );
                        return response.data;
                    }
                }
                throw error;
            }
        } catch (error: any) {
            const detailedMsg = error.response?.data?.error?.message || error.message;
            this.logger.error(`[INSTAGRAM_MEDIA] Failed to fetch media: ${detailedMsg}`);
            throw new Error(`Meta API Error: ${detailedMsg}`);
        }
    }

    /**
     * Get comments for a specific Instagram Media
     */
    /**
     * Get likes for a specific Instagram Media
     */
    async getInstagramLikes(tenantId: string, mediaId: string) {
        try {
            const { accessToken: defaultToken, instagramAccessToken } = await this.getCredentials(tenantId);
            const accessToken = instagramAccessToken || defaultToken;

            const response = await axios.get(
                `https://graph.facebook.com/v18.0/${mediaId}/likes`,
                { params: { access_token: accessToken } }
            );

            return response.data;
        } catch (error: any) {
            const detailedMsg = error.response?.data?.error?.message || error.message;
            this.logger.error(`[INSTAGRAM_LIKES] Failed to fetch likes: ${detailedMsg}`);
            throw new Error(`Meta API Error: ${detailedMsg}`);
        }
    }

    async getInstagramComments(tenantId: string, mediaId: string) {
        try {
            const { accessToken: defaultToken, instagramAccessToken } = await this.getCredentials(tenantId);
            const accessToken = instagramAccessToken || defaultToken;

            const response = await axios.get(
                `https://graph.facebook.com/v18.0/${mediaId}/comments`,
                { params: { access_token: accessToken, fields: 'id,text,timestamp,username,replies{id,text,timestamp,username}' } }
            );

            return response.data;
        } catch (error: any) {
            const detailedMsg = error.response?.data?.error?.message || error.message;
            this.logger.error(`[INSTAGRAM_COMMENTS] Failed to fetch comments: ${detailedMsg}`);
            throw new Error(`Meta API Error: ${detailedMsg}`);
        }
    }

    /**
     * Reply to an Instagram Comment
     */
    async replyToInstagramComment(tenantId: string, commentId: string, message: string) {
        const token = await this.getInstagramToken(tenantId);
        const url = `https://graph.facebook.com/v21.0/${commentId}/replies`;
        const res = await axios.post(url, { message }, { params: { access_token: token } });
        return res.data;
    }

    async getInstagramStories(tenantId: string) {
        try {
            const { accessToken: defaultToken, instagramAccessToken, instagramBusinessId: configIbId } = await this.getCredentials(tenantId);
            const accessToken = instagramAccessToken || defaultToken;
            
            let id = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_PAGE_ID', true);
            if (!id) id = configIbId;
            if (!id) throw new Error('INSTAGRAM_PAGE_ID not configured for tenant');

            try {
                const response = await axios.get(
                    `https://graph.facebook.com/v18.0/${id}/stories`,
                    { params: { access_token: accessToken, fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp' } }
                );
                return response.data;
            } catch (error: any) {
                const errorCode = error.response?.data?.error?.code;
                const errorMsg = error.response?.data?.error?.message || '';
                // If it's a type error (#100) or 400/404, it might be a Page ID
                if (errorCode === 100 || error.response?.status === 400 || error.response?.status === 404 || errorMsg.includes('Unknown path')) {
                    try {
                        const pageRes = await axios.get(`https://graph.facebook.com/v21.0/${id}`, {
                            params: { access_token: accessToken, fields: 'instagram_business_account' }
                        });
                        const igId = pageRes.data?.instagram_business_account?.id;
                        if (igId && igId !== id) {
                            const response = await axios.get(
                                `https://graph.facebook.com/v21.0/${igId}/stories`,
                                { params: { access_token: accessToken, fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp' } }
                            );
                            return response.data;
                        }
                    } catch (innerError) {
                        // If resolution fails, the first error was likely real
                    }
                }
                return { data: [] };
            }
        } catch (error: any) {
            const detailedMsg = error.response?.data?.error?.message || error.message;
            this.logger.error(`[INSTAGRAM_STORIES] Failed to fetch stories: ${detailedMsg}`);
            throw new Error(`Meta API Error: ${detailedMsg}`);
        }
    }
    /**
     * Get Instagram Highlights
     */
    async getInstagramHighlights(tenantId: string) {
        try {
            const { accessToken: defaultToken, instagramAccessToken, instagramBusinessId: configIbId } = await this.getCredentials(tenantId);
            const accessToken = instagramAccessToken || defaultToken;
            
            let id = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_PAGE_ID', true);
            if (!id) id = configIbId;
            if (!id) throw new Error('INSTAGRAM_PAGE_ID not configured for tenant');

            try {
                const response = await axios.get(
                    `https://graph.facebook.com/v18.0/${id}/highlights`,
                    { params: { access_token: accessToken, fields: 'id,name,cover_media{id,media_url,thumbnail_url}' } }
                );
                return response.data;
            } catch (error: any) {
                const errorCode = error.response?.data?.error?.code;
                const errorMsg = error.response?.data?.error?.message || '';
                
                // If it's a type error (#100), "Unknown path", or 400/404, it might be a Page ID
                if (errorCode === 100 || error.response?.status === 400 || error.response?.status === 404 || errorMsg.includes('Unknown path')) {
                    try {
                        this.logger.debug(`[INSTAGRAM_HIGHLIGHTS] ID ${id} failed. Attempting deep resolution for tenant ${tenantId}...`);
                        const pageRes = await axios.get(`https://graph.facebook.com/v21.0/${id}`, {
                            params: { access_token: accessToken, fields: 'instagram_business_account' }
                        });
                        const igId = pageRes.data?.instagram_business_account?.id;
                        if (igId && igId !== id) {
                            const response = await axios.get(
                                `https://graph.facebook.com/v21.0/${igId}/highlights`,
                                { params: { access_token: accessToken, fields: 'id,name,cover_media{id,media_url,thumbnail_url}' } }
                            );
                            return response.data;
                        }
                    } catch (e) {
                        this.logger.warn(`[INSTAGRAM_HIGHLIGHTS] Deep resolution failed for ${id}: ${e.message}`);
                    }
                }
                
                // Fail-safe: return empty if we really can't get it
                this.logger.warn(`[INSTAGRAM_HIGHLIGHTS] Could not fetch highlights for ${id}. Returning empty.`);
                return { data: [] };
            }
        } catch (error: any) {
            const detailedMsg = error.response?.data?.error?.message || error.message;
            this.logger.error(`[INSTAGRAM_HIGHLIGHTS] Failed to fetch highlights: ${detailedMsg}`);
            throw new Error(`Meta API Error: ${detailedMsg}`);
        }
    }

    /**
     * Get Facebook Page Media (Posts)
     */
    async getFacebookMedia(tenantId: string) {
        try {
            const { accessToken: defaultToken, facebookAccessToken, facebookPageId } = await this.getCredentials(tenantId);
            const accessToken = facebookAccessToken || defaultToken;
            
            if (!facebookPageId) {
                this.logger.debug(`[FACEBOOK_MEDIA] FACEBOOK_PAGE_ID not configured for tenant ${tenantId}. Returning empty feed.`);
                return { data: [] };
            }

            const response = await axios.get(
                `https://graph.facebook.com/v18.0/${facebookPageId}/feed`,
                { params: { access_token: accessToken, fields: 'id,message,full_picture,permalink_url,created_time' } }
            );

            return response.data;
        } catch (error: any) {
            const detailedMsg = error.response?.data?.error?.message || error.message;
            this.logger.error(`[FACEBOOK_MEDIA] Failed to fetch feed: ${detailedMsg}`);
            throw new Error(`Meta API Error: ${detailedMsg}`);
        }
    }

    /**
     * Get Instagram Mentions and Tags
     */
    async getInstagramTags(tenantId: string) {
        try {
            const { accessToken: defaultToken, instagramAccessToken, instagramBusinessId: configIbId } = await this.getCredentials(tenantId);
            const accessToken = instagramAccessToken || defaultToken;
            
            let id = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_PAGE_ID', true);
            if (!id) id = configIbId;
            if (!id) throw new Error('INSTAGRAM_PAGE_ID not configured for tenant');

            // Resolve ID if Page ID
            try {
                const response = await axios.get(
                    `https://graph.facebook.com/v18.0/${id}/tags`,
                    { params: { access_token: accessToken, fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username' } }
                );
                return response.data;
            } catch (error: any) {
                const errorCode = error.response?.data?.error?.code;
                const errorMsg = error.response?.data?.error?.message || '';

                if (errorCode === 100 || error.response?.status === 400 || error.response?.status === 404 || errorMsg.includes('Unknown path')) {
                    try {
                        const pageRes = await axios.get(`https://graph.facebook.com/v18.0/${id}`, {
                            params: { access_token: accessToken, fields: 'instagram_business_account' }
                        });
                        const igId = pageRes.data?.instagram_business_account?.id;
                        if (igId && igId !== id) {
                            const response = await axios.get(
                                `https://graph.facebook.com/v18.0/${igId}/tags`,
                                { params: { access_token: accessToken, fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username' } }
                            );
                            return response.data;
                        }
                    } catch (e) {}
                }
                throw error;
            }
        } catch (error: any) {
            const detailedMsg = error.response?.data?.error?.message || error.message;
            this.logger.error(`[INSTAGRAM_TAGS] Failed to fetch tags: ${detailedMsg}`);
            throw new Error(`Meta API Error: ${detailedMsg}`);
        }
    }

    async deleteInstagramComment(tenantId: string, commentId: string) {
        const token = await this.getInstagramToken(tenantId);
        const url = `https://graph.facebook.com/v21.0/${commentId}`;
        const res = await axios.delete(url, { params: { access_token: token } });
        return res.data;
    }

    async publishInstagramPost(tenantId: string, options: { 
        imageUrl: string, 
        caption: string, 
        mediaType?: 'FEED' | 'REELS',
        altText?: string, 
        locationId?: string,
        userTags?: any[],
        scheduledPublishTime?: number,
        commentsEnabled?: boolean
    }) {
        const token = await this.getInstagramToken(tenantId);
        const { instagramBusinessId: configIbId } = await this.getCredentials(tenantId);

        let pageId = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_PAGE_ID', true);
        if (!pageId) pageId = configIbId;
        if (!pageId) throw new Error('Instagram Business ID not configured.');

        // Step 1: Create Media Container
        const containerUrl = `https://graph.facebook.com/v21.0/${pageId}/media`;
        const payload: any = {
            caption: options.caption,
        };

        if (options.mediaType === 'REELS') {
            payload.video_url = options.imageUrl;
            payload.media_type = 'REELS';
        } else {
            payload.image_url = options.imageUrl;
        }

        if (options.altText) payload.alt_text = options.altText;
        if (options.locationId) payload.location_id = options.locationId;
        if (options.userTags) payload.user_tags = JSON.stringify(options.userTags);
        if (options.commentsEnabled !== undefined) payload.comments_enabled = options.commentsEnabled;

        const containerRes = await axios.post(containerUrl, payload, { params: { access_token: token } });
        const creationId = containerRes.data.id;

        // Step 2: Publish Media
        const publishUrl = `https://graph.facebook.com/v21.0/${pageId}/media_publish`;
        const publishPayload: any = {
            creation_id: creationId
        };

        if (options.scheduledPublishTime) {
            publishPayload.scheduled_publish_time = options.scheduledPublishTime;
        }

        const publishRes = await axios.post(publishUrl, publishPayload, { params: { access_token: token } });

        return publishRes.data;
    }

    /**
     * Get Instagram Insights (Account level)
     */
    async getInstagramInsights(tenantId: string) {
        try {
            const { accessToken: defaultToken, instagramAccessToken, instagramBusinessId: configIbId } = await this.getCredentials(tenantId);
            const accessToken = instagramAccessToken || defaultToken;
            
            let pageId = await this.integrationsService.getCredential(tenantId, 'INSTAGRAM_PAGE_ID', true);
            if (!pageId) pageId = configIbId;
            if (!pageId) throw new Error('INSTAGRAM_PAGE_ID not configured');

            const response = await axios.get(
                `https://graph.facebook.com/v18.0/${pageId}/insights`,
                { params: { 
                    access_token: accessToken, 
                    metric: 'reach,profile_views', 
                    period: 'day',
                    metric_type: 'total_value' 
                } }
            );

            return response.data;
        } catch (error: any) {
            const detailedMsg = error.response?.data?.error?.message || error.message;
            this.logger.warn(`[INSTAGRAM_INSIGHTS] Failed to fetch insights: ${detailedMsg}`);
            // Return empty data instead of throwing to avoid breaking UI if not approved yet
            return { data: [] };
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
    async deleteTemplate(tenantId: string, templateName: string) {
        try {
            const { accessToken, wabaId } = await this.getCredentials(tenantId);
            if (!wabaId) throw new Error('META_WABA_ID not configured');

            const response = await axios.delete(
                `${this.baseUrl}/${wabaId}/message_templates`,
                {
                    params: {
                        access_token: accessToken,
                        name: templateName
                    }
                }
            );

            this.logger.log(`[META_TEMPLATE] Deleted template ${templateName} for WABA ${wabaId}: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error: any) {
            const errorData = error.response?.data?.error || {};
            const detailedMsg = errorData.message || error.message;
            this.logger.error(`[META_TEMPLATE] Failed to delete template ${templateName}: ${detailedMsg}`);
            throw new Error(detailedMsg);
        }
    }

    private async getInstagramToken(tenantId: string): Promise<string> {
        const { accessToken: defaultToken, instagramAccessToken } = await this.getCredentials(tenantId);
        const token = instagramAccessToken || defaultToken;
        if (!token) throw new Error('Meta/Instagram Access Token not configured.');
        return token;
    }
}
