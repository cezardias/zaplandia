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

            const response = await axios.post(
                `${this.baseUrl}/${phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'text',
                    text: { body: text }
                },
                { params: { access_token: accessToken } }
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to send Meta text message: ${error.message}`);
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
            const errorMsg = error.response?.data?.error?.message || error.message;
            this.logger.error(`Failed to create Meta template: ${errorMsg}`);
            throw new Error(errorMsg);
        }
    }
}
