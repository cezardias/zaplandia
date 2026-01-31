import { CrmService } from './crm.service';
export declare class CrmController {
    private readonly crmService;
    constructor(crmService: CrmService);
    getChats(req: any): Promise<any>;
    getMessages(req: any, contactId: string): Promise<any>;
    sendMessage(req: any, body: {
        contactId: string;
        content: string;
        provider: string;
    }): Promise<any>;
}
