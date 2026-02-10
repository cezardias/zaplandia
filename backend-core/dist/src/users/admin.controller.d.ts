import { CrmService } from '../crm/crm.service';
import { SupportService } from '../support/support.service';
import { UsersService } from './users.service';
import { IntegrationsService } from '../integrations/integrations.service';
export declare class AdminController {
    private readonly crmService;
    private readonly supportService;
    private readonly usersService;
    private readonly integrationsService;
    constructor(crmService: CrmService, supportService: SupportService, usersService: UsersService, integrationsService: IntegrationsService);
    getTenantCredentials(req: any, tenantId: string): Promise<import("../integrations/entities/api-credential.entity").ApiCredential[]>;
    saveTenantCredential(req: any, tenantId: string, body: any): Promise<import("../integrations/entities/api-credential.entity").ApiCredential>;
    findAllTenants(req: any): Promise<import("./entities/tenant.entity").Tenant[]>;
    findAll(req: any): Promise<import("./entities/user.entity").User[]>;
    create(req: any, userData: any): Promise<import("./entities/user.entity").User>;
    update(req: any, id: string, userData: any): Promise<import("./entities/user.entity").User | null>;
    remove(req: any, id: string): Promise<void>;
    seed(req: any): Promise<{
        message: string;
    }>;
    getGlobalCredentials(req: any): Promise<import("../integrations/entities/api-credential.entity").ApiCredential[]>;
    saveGlobalCredential(req: any, body: {
        name: string;
        value: string;
    }): Promise<import("../integrations/entities/api-credential.entity").ApiCredential>;
}
