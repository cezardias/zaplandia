import { CrmService } from './crm.service';
export declare class CrmController {
    private readonly crmService;
    private readonly logger;
    constructor(crmService: CrmService);
    getDashboardStats(req: any, campaignId?: string, campaignIdAlt?: string, globId?: string, instance?: string): Promise<{
        total: number;
        trabalhadlos: number;
        naoTrabalhados: number;
        ganhos: number;
        perdidos: number;
        conversao: string;
        funnelData: {
            name: string;
            value: number;
            fill: string;
        }[];
    }>;
    getContacts(req: any, q?: string, campaignId?: string, campaignIdAlt?: string, globId?: string, instance?: string): Promise<import("./entities/crm.entity").Contact[]>;
    getContactsAlias(req: any, q?: string, campaignId?: string, campaignIdAlt?: string, globId?: string, instance?: string): Promise<import("./entities/crm.entity").Contact[]>;
    createContact(req: any, body: any): Promise<import("./entities/crm.entity").Contact>;
    getChats(req: any, instance?: string): Promise<import("./entities/crm.entity").Contact[]>;
    getMessages(req: any, contactId: string): Promise<import("./entities/crm.entity").Message[]>;
    sendMessage(req: any, body: {
        contactId: string;
        content: string;
        provider: string;
        media?: any;
    }): Promise<import("./entities/crm.entity").Message>;
    updateContact(req: any, contactId: string, body: any): Promise<import("./entities/crm.entity").Contact | null>;
    deleteAllContacts(req: any): Promise<import("typeorm").DeleteResult>;
}
