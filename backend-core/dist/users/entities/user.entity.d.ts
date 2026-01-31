import { Tenant } from './tenant.entity';
export declare enum UserRole {
    SUPERADMIN = "superadmin",
    ADMIN = "admin",
    USER = "user"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    tenant: Tenant;
    tenantId: string;
    createdAt: Date;
}
