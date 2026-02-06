import { CrmService } from './crm.service';
export declare class CrmController {
    private readonly crmService;
    private readonly logger;
    constructor(crmService: CrmService);
    getDashboardStats(req: any, campaignId?: string, campaignIdAlt?: string, globId?: string, instance?: string): Promise<{
        total: any;
        trabalhadlos: any;
        naoTrabalhados: number;
        ganhos: any;
        perdidos: any;
        conversao: string;
        funnelData: {
            name: string;
            value: any;
            fill: string;
        }[];
    }>;
    getContacts(req: any, q?: string, campaignId?: string, campaignIdAlt?: string, globId?: string, instance?: string): Promise<any>;
    getContactsAlias(req: any, q?: string, campaignId?: string, campaignIdAlt?: string, globId?: string, instance?: string): Promise<any>;
    createContact(req: any, body: any): Promise<any>;
    getChats(req: any, instance?: string): Promise<any>;
    getMessages(req: any, contactId: string): Promise<any>;
    sendMessage(req: any, body: {
        contactId: string;
        content: string;
        provider: string;
        media?: any;
    }): Promise<any>;
    updateContact(req: any, contactId: string, body: any): Promise<any>;
    deleteAllContacts(req: any): Promise<any>;
}
