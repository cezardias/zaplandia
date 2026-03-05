import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IntegrationsService } from './integrations.service';

@Injectable()
export class RifaApiService {
    private readonly logger = new Logger(RifaApiService.name);
    private readonly defaultBaseUrl = 'https://rifas.zaplandia.com.br';

    constructor(private readonly integrationsService: IntegrationsService) { }

    /**
     * Get API Key for tenant
     */
    private async getApiKey(tenantId: string): Promise<string | null> {
        return this.integrationsService.getCredential(tenantId, 'RIFA_API_KEY');
    }

    /**
     * Get Base URL for tenant
     */
    private async getBaseUrl(tenantId: string): Promise<string> {
        let configuredUrl = await this.integrationsService.getCredential(tenantId, 'RIFA_API_URL');
        if (configuredUrl) {
            // Clean up: trim whitespace and remove trailing slash
            let url = configuredUrl.trim().replace(/\/$/, '');

            // RESILIENCE: If the user pasted the full endpoint (e.g. .../api/external/raffles), strip the API path
            // We want to keep only the base domain/path
            url = url.replace(/\/api\/external\/.*$/, '');
            url = url.replace(/\/api\/external$/, '');

            return url;
        }
        return this.defaultBaseUrl;
    }

    /**
     * List all active raffles
     */
    async getRaffles(tenantId: string) {
        const apiKey = await this.getApiKey(tenantId);
        const baseUrl = await this.getBaseUrl(tenantId);

        if (!apiKey) {
            this.logger.warn(`Rifa API Key not found for tenant ${tenantId}`);
            return { error: 'Rifa API Key not configured' };
        }

        try {
            const url = `${baseUrl}/api/external/raffles`;
            this.logger.log(`Fetching raffles from ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'x-api-key': apiKey.trim(),
                    'Accept': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch raffles from ${baseUrl}: ${error.message}`);
            return { error: 'Failed to fetch raffles', details: error.response?.data || error.message };
        }
    }

    /**
     * List free tickets for a raffle
     */
    async getTickets(tenantId: string, raffleId: string) {
        const apiKey = await this.getApiKey(tenantId);
        const baseUrl = await this.getBaseUrl(tenantId);

        if (!apiKey) return { error: 'Rifa API Key not configured' };

        try {
            const url = `${baseUrl}/api/external/raffles/${raffleId}/tickets`;
            const response = await axios.get(url, {
                headers: {
                    'x-api-key': apiKey.trim(),
                    'Accept': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch tickets for raffle ${raffleId} at ${baseUrl}: ${error.message}`);
            return { error: 'Failed to fetch tickets', details: error.response?.data || error.message };
        }
    }

    /**
     * Reserve tickets for a client
     */
    async createOrder(tenantId: string, data: any) {
        const apiKey = await this.getApiKey(tenantId);
        const baseUrl = await this.getBaseUrl(tenantId);

        if (!apiKey) return { error: 'Rifa API Key not configured' };

        // MAPPING: Map fields from AI tool (raffleId, whatsapp, numbers) to external API (raffle_id, phone, tickets)
        const payload = {
            raffle_id: data.raffleId || data.raffle_id,
            name: data.name,
            phone: data.whatsapp || data.phone,
            tickets: data.numbers || data.tickets
        };

        try {
            const url = `${baseUrl}/api/external/orders`;
            this.logger.log(`Creating order at ${url} for raffle ${payload.raffle_id}`);
            const response = await axios.post(url, payload, {
                headers: {
                    'x-api-key': apiKey.trim(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to create order for raffle ${payload.raffle_id} at ${baseUrl}: ${error.message}`);
            return { error: 'Failed to create order', details: error.response?.data || error.message };
        }
    }
}
