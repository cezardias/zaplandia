import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import axios from 'axios';

@Injectable()
export class EvolutionApiService {
    private readonly logger = new Logger(EvolutionApiService.name);

    constructor(private readonly integrationsService: IntegrationsService) { }

    private async getBaseUrl() {
        return await this.integrationsService.getCredential(null, 'EVOLUTION_API_URL');
    }

    private async getApiKey() {
        return await this.integrationsService.getCredential(null, 'EVOLUTION_API_KEY');
    }

    async createInstance(instanceName: string, userId: string) {
        const baseUrl = await this.getBaseUrl();
        const apiKey = await this.getApiKey();

        if (!baseUrl || !apiKey) {
            throw new Error('EvolutionAPI não configurada globalmente.');
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

    async getQrCode(instanceName: string) {
        const baseUrl = await this.getBaseUrl();
        const apiKey = await this.getApiKey();

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

    async logoutInstance(instanceName: string) {
        const baseUrl = await this.getBaseUrl();
        const apiKey = await this.getApiKey();

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

    async deleteInstance(instanceName: string) {
        const baseUrl = await this.getBaseUrl();
        const apiKey = await this.getApiKey();

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

    async setWebhook(instanceName: string, webhookUrl: string) {
        const baseUrl = await this.getBaseUrl();
        const apiKey = await this.getApiKey();

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
