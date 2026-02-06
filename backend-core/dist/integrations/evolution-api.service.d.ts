import { IntegrationsService } from './integrations.service';
export declare class EvolutionApiService {
    private readonly integrationsService;
    private readonly logger;
    constructor(integrationsService: IntegrationsService);
    private getBaseUrl;
    private getApiKey;
    listInstances(tenantId: string, role?: string): Promise<any[]>;
    private extractTenantId;
    listAllInstances(): Promise<any>;
    getInstanceStatus(tenantId: string, instanceName: string): Promise<any>;
    createInstance(tenantId: string, instanceName: string, userId: string): Promise<any>;
    getQrCode(tenantId: string, instanceName: string): Promise<any>;
    logoutInstance(tenantId: string, instanceName: string): Promise<any>;
    deleteInstance(tenantId: string, instanceName: string): Promise<any>;
    setWebhook(tenantId: string, instanceName: string, webhookUrl: string): Promise<any>;
    setSettings(tenantId: string, instanceName: string): Promise<any>;
    sendText(tenantId: string, instanceName: string, number: string, text: string): Promise<any>;
    sendMedia(tenantId: string, instanceName: string, number: string, media: {
        type: string;
        mimetype: string;
        base64: string;
        fileName?: string;
        caption?: string;
    }): Promise<any>;
}
