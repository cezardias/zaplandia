import { Tenant } from '../../users/entities/tenant.entity';
export declare class AiPrompt {
    id: string;
    name: string;
    content: string;
    tenant: Tenant;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
