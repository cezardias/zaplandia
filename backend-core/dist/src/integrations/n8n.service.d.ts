import { IntegrationsService } from './integrations.service';
export declare class N8nService {
    private readonly integrationsService;
    private readonly logger;
    constructor(integrationsService: IntegrationsService);
    triggerWebhook(tenantId: string, payload: any): Promise<void>;
}
