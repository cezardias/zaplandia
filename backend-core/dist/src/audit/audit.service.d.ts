import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
export declare class AuditService {
    private auditRepository;
    private readonly logger;
    constructor(auditRepository: Repository<AuditLog>);
    log(tenantId: string, userId: string, action: string, details: any, ip?: string): Promise<void>;
}
