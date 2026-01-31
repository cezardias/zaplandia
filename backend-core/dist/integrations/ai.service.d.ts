import { IntegrationsService } from './integrations.service';
export declare class AiService {
    private integrationsService;
    private readonly logger;
    private readonly aiUrl;
    constructor(integrationsService: IntegrationsService);
    getAiResponse(tenantId: string, prompt: string, provider: string, context?: string): Promise<any>;
}
