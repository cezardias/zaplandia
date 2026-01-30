import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import axios from 'axios';

@Injectable()
export class EvolutionApiService {
    private readonly logger = new Logger(EvolutionApiService.name);

    constructor(private readonly integrationsService: IntegrationsService) { }

    private async getBaseUrl(tenantId: string) {
        return await this.integrationsService.getCredential(tenantId, 'EVOLUTION_API_URL');
    }

    private async getApiKey(tenantId: string) {
        return await this.integrationsService.getCredential(tenantId, 'EVOLUTION_API_KEY');
    }

    async createInstance(tenantId: string, instanceName: string, userId: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) {
            throw new Error('EvolutionAPI não configurada para este tenant.');
        }

        try {
            const response = await axios.post(`${baseUrl}/instance/create`, {
                instanceName,
                token: userId, // Using userId as a token for this instance
                qrcode: true,
            }, {
                headers: { 'apikey': apiKey }
            });

            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao criar instância no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }

    async getQrCode(tenantId: string, instanceName: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const response = await axios.get(`${baseUrl}/instance/connect/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao buscar QR Code no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }

    async logoutInstance(tenantId: string, instanceName: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const response = await axios.delete(`${baseUrl}/instance/logout/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao fazer logout no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }

    async deleteInstance(tenantId: string, instanceName: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const response = await axios.delete(`${baseUrl}/instance/delete/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao deletar instância no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }

    async setWebhook(tenantId: string, instanceName: string, webhookUrl: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const response = await axios.post(`${baseUrl}/webhook/set/${instanceName}`, {
                url: webhookUrl,
                enabled: true,
                events: [
                    "MESSAGES_UPSERT",
                    "MESSAGES_UPDATE",
                    "MESSAGES_DELETE",
                    "SEND_MESSAGE",
                    "CONTACTS_UPSERT",
                    "CONTACTS_UPDATE",
                    "PRESENCE_UPDATE",
                    "CHATS_UPSERT",
                    "CHATS_UPDATE",
                    "CHATS_DELETE",
                    "GROUPS_UPSERT",
                    "GROUPS_UPDATE",
                    "GROUP_PARTICIPANTS_UPDATE",
                    "CONNECTION_UPDATE"
                ]
            }, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao configurar webhook no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }
}
