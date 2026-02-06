import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(AuditLog)
        private auditRepository: Repository<AuditLog>,
    ) { }

    async log(tenantId: string, userId: string, action: string, details: any, ip?: string) {
        try {
            const logEntry = this.auditRepository.create({
                tenantId,
                userId,
                action,
                details: JSON.stringify(details),
                ip
            });
            await this.auditRepository.save(logEntry);
            this.logger.log(`[AUDIT] ${action} by ${userId} in ${tenantId}`);
        } catch (error) {
            this.logger.error(`Failed to create audit log: ${error.message}`);
        }
    }
}
