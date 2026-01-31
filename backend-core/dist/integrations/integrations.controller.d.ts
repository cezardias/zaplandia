import { IntegrationsService } from './integrations.service';
import { EvolutionApiService } from './evolution-api.service';
import { N8nService } from './n8n.service';
export declare class IntegrationsController {
    private readonly integrationsService;
    private readonly evolutionApiService;
    private readonly n8nService;
    constructor(integrationsService: IntegrationsService, evolutionApiService: EvolutionApiService, n8nService: N8nService);
    findAll(req: any): Promise<any[]>;
    listEvolutionInstances(req: any): Promise<any>;
    createEvolutionInstance(req: any, body: {
        instanceName?: string;
    }): Promise<any>;
    getEvolutionQrCodeByName(req: any, instanceName: string): Promise<any>;
    getEvolutionQrCode(req: any): Promise<any>;
    getEvolutionInstanceStatus(req: any, instanceName: string): Promise<any>;
    deleteEvolutionInstanceByName(req: any, instanceName: string): Promise<any>;
    deleteEvolutionInstance(req: any): Promise<any>;
    handleEvolutionWebhook(payload: any): Promise<{
        success: boolean;
    }>;
    connect(req: any, provider: any, body: any): Promise<any>;
    saveCredentials(req: any, body: {
        name: string;
        value: string;
    }): Promise<any>;
    getCredentials(req: any): Promise<any>;
    remove(req: any, id: string): Promise<any>;
    updateSettings(req: any, id: string, body: {
        settings: any;
    }): Promise<any>;
}
