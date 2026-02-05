import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class DatabaseCleanupService implements OnModuleInit {
    private readonly logger = new Logger(DatabaseCleanupService.name);

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
    ) { }

    /**
     * AUTO-EXECUTE: Clean database on startup
     * Removes all data except superadmin and HQ tenant
     */
    async onModuleInit() {
        try {
            this.logger.warn('🧹 [DATABASE CLEANUP] Starting cleanup on startup...');
            await this.cleanupDatabase();
        } catch (error) {
            this.logger.error(`[DATABASE CLEANUP] Failed: ${error.message}`);
        }
    }

    async cleanupDatabase(): Promise<void> {
        // 1. Find HQ tenant
        const hqTenant = await this.tenantsRepository.findOne({
            where: { slug: 'zaplandia-hq' }
        });

        if (!hqTenant) {
            this.logger.log('[DATABASE CLEANUP] HQ Tenant not found. Cleanup skipped.');
            return;
        }

        // 2. Delete all non-superadmin users
        const deletedUsers = await this.usersRepository
            .createQueryBuilder()
            .delete()
            .from(User)
            .where('role != :role', { role: UserRole.SUPERADMIN })
            .execute();

        this.logger.log(`🗑️ [DATABASE CLEANUP] Deleted ${deletedUsers.affected || 0} non-superadmin users`);

        // 3. Delete all non-HQ tenants
        const deletedTenants = await this.tenantsRepository
            .createQueryBuilder()
            .delete()
            .from(Tenant)
            .where('slug != :slug', { slug: 'zaplandia-hq' })
            .execute();

        this.logger.log(`🗑️ [DATABASE CLEANUP] Deleted ${deletedTenants.affected || 0} non-HQ tenants`);

        // 4. Clean data from other tenants (CASCADE should handle this, but let's be explicit)
        // Note: If you have CASCADE DELETE on foreign keys, steps below are redundant
        // But we keep them for safety

        this.logger.warn('✅ [DATABASE CLEANUP] Complete. Database is now clean with only superadmin.');
    }
}
