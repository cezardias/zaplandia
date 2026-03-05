import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IntegrationsService } from './integrations.service';

@Injectable()
export class RifaApiService {
    private readonly logger = new Logger(RifaApiService.name);
    private readonly baseUrl = 'https://rifas.zaplandia.com.br'; // Base URL as per context or placeholder

    constructor(private readonly integrationsService: IntegrationsService) { }

    /**
     * Get API Key for tenant
     */
    private async getApiKey(tenantId: string): Promise<string | null> {
        return this.integrationsService.getCredential(tenantId, 'RIFA_API_KEY');
    }

    /**
     * List all active raffles
     */
    async getRaffles(tenantId: string) {
        const apiKey = await this.getApiKey(tenantId);
        if (!apiKey) {
            this.logger.warn(`Rifa API Key not found for tenant ${tenantId}`);
            return { error: 'Rifa API Key not configured' };
        }

        try {
            const response = await axios.get(`${this.baseUrl}/api/external/raffles`, {
                headers: {
                    'x-api-key': apiKey.trim(),
                    'Accept': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch raffles: ${error.message}`);
            return { error: 'Failed to fetch raffles', details: error.response?.data || error.message };
        }
    }

    /**
     * List free tickets for a raffle
     */
    async getTickets(tenantId: string, raffleId: string) {
        const apiKey = await this.getApiKey(tenantId);
        if (!apiKey) return { error: 'Rifa API Key not configured' };

        try {
            const response = await axios.get(`${this.baseUrl}/api/external/raffles/${raffleId}/tickets`, {
                headers: {
                    'x-api-key': apiKey.trim(),
                    'Accept': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch tickets for raffle ${raffleId}: ${error.message}`);
            return { error: 'Failed to fetch tickets', details: error.response?.data || error.message };
        }
    }

    /**
     * Reserve tickets for a client
     */
    async createOrder(tenantId: string, data: { raffle_id: string, name: string, phone: string, tickets: string[] }) {
        const apiKey = await this.getApiKey(tenantId);
        if (!apiKey) return { error: 'Rifa API Key not configured' };

        try {
            const response = await axios.post(`${this.baseUrl}/api/external/orders`, data, {
                headers: {
                    'x-api-key': apiKey.trim(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to create order for raffle ${data.raffle_id}: ${error.message}`);
            return { error: 'Failed to create order', details: error.response?.data || error.message };
        }
    }
}
