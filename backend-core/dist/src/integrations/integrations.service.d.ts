import { Repository } from 'typeorm';
import { Integration, IntegrationProvider } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';
import { User } from '../users/entities/user.entity';
export declare class IntegrationsService {
    private integrationRepository;
    private apiCredentialRepository;
    private usersRepository;
    private readonly logger;
    constructor(integrationRepository: Repository<Integration>, apiCredentialRepository: Repository<ApiCredential>, usersRepository: Repository<User>);
    checkTenantExists(tenantId: string): Promise<boolean>;
    fetchUserTenantId(userId: string): Promise<string | null>;
    findAllByTenant(tenantId: string, role?: string): Promise<Integration[]>;
    findOne(id: string, tenantId: string): Promise<Integration | null>;
    create(tenantId: string, provider: IntegrationProvider, credentials: any): Promise<Integration>;
    remove(id: string, tenantId: string): Promise<Integration | undefined>;
    updateSettings(id: string, tenantId: string, settings: any): Promise<Integration | null>;
    connectMeta(tenantId: string, code: string): Promise<{
        success: boolean;
        message: string;
    }>;
    saveApiCredential(tenantId: string | null, keyName: string, keyValue: string): Promise<ApiCredential>;
    deleteCredential(tenantId: string, keyName: string): Promise<import("typeorm").DeleteResult>;
    getCredential(tenantId: string, keyName: string, isOptional?: boolean): Promise<string | null>;
    findAllCredentials(tenantId: string | null): Promise<ApiCredential[]>;
}
