import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import axios from 'axios';

@Injectable()
export class N8nService {
    private readonly logger = new Logger(N8nService.name);

    constructor(private readonly integrationsService: IntegrationsService) { }

    async triggerWebhook(tenantId: string, payload: any) {
        try {
            const webhookUrl = await this.integrationsService.getCredential(tenantId, 'N8N_WEBHOOK_URL');

            if (!webhookUrl) {
                this.logger.debug(`n8n Webhook não configurado para o tenant ${tenantId}. Pulando.`);
                return;
            }

            this.logger.log(`Enviando evento para n8n: ${webhookUrl}`);

            // Send async to not block the main flow
            axios.post(webhookUrl, {
                ...payload,
                timestamp: new Date().toISOString(),
                platform: 'zaplandia'
            }).catch(err => {
                this.logger.error(`Erro ao enviar para n8n: ${err.message}`);
            });

        } catch (error) {
            this.logger.error(`Erro inesperado no trigger n8n: ${error.message}`);
        }
    }
}
