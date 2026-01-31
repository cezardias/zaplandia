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
    fetchUserTenantId(userId: string): Promise<string | null>;
    findAllByTenant(tenantId: string, role?: string): Promise<any>;
    findOne(id: string, tenantId: string): Promise<any>;
    create(tenantId: string, provider: IntegrationProvider, credentials: any): Promise<any>;
    remove(id: string, tenantId: string): Promise<any>;
    updateSettings(id: string, tenantId: string, settings: any): Promise<any>;
    connectMeta(tenantId: string, code: string): Promise<{
        success: boolean;
        message: string;
    }>;
    saveApiCredential(tenantId: string, keyName: string, keyValue: string): Promise<any>;
    getCredential(tenantId: string, keyName: string): Promise<string | null>;
    findAllCredentials(tenantId: string | null): Promise<any>;
}
