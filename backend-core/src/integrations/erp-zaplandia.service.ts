import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IntegrationsService } from './integrations.service';

@Injectable()
export class ErpZaplandiaService {
    private readonly logger = new Logger(ErpZaplandiaService.name);
    private readonly baseUrl = 'https://erp.zaplandia.com.br/api/v1';

    constructor(private readonly integrationsService: IntegrationsService) { }

    /**
     * Get API Key for tenant
     */
    private async getApiKey(tenantId: string): Promise<string | null> {
        return this.integrationsService.getCredential(tenantId, 'ERP_ZAPLANDIA_KEY');
    }

    /**
     * List products from ERP
     */
    async getProducts(tenantId: string, search?: string) {
        const apiKey = await this.getApiKey(tenantId);
        if (!apiKey) {
            this.logger.warn(`ERP Zaplandia API Key not found for tenant ${tenantId}`);
            return { error: 'ERP API Key not configured' };
        }

        try {
            const url = `${this.baseUrl}/produtos`;
            const params = search ? { search } : {};

            this.logger.debug(`Fetching products from ERP-Zaplandia for tenant ${tenantId}${search ? ` with search: ${search}` : ''}`);

            const response = await axios.get(url, {
                headers: {
                    'X-API-Key': apiKey.trim(),
                    'Accept': 'application/json',
                    'User-Agent': 'ZaplandiaCore/1.0'
                },
                params
            });

            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch products from ERP-Zaplandia: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
            return { error: 'Failed to fetch products from ERP', details: error.response?.data || error.message };
        }
    }
}
