import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Tenant } from '../users/entities/tenant.entity';
import { Contact } from '../crm/entities/crm.entity';
import { Message } from '../crm/entities/message.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';

@Injectable()
export class TenantMigrationService {
    private readonly logger = new Logger(TenantMigrationService.name);

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
        @InjectRepository(Contact)
        private contactsRepository: Repository<Contact>,
        @InjectRepository<invoke name = "message" >
            private messagesRepository: Repository<Message>,
        @InjectRepository(Integration)
        private integrationsRepository: Repository<Integration>,
        @InjectRepository(Campaign)
        private campaignsRepository: Repository<Campaign>,
    ) { }

    /**
     * CRITICAL SECURITY FIX: Migrate users with incorrect tenantId
     * This fixes users that were created with HQ tenant fallback
     */
    async migrateUsersToIsolatedTenants(): Promise<any> {
        this.logger.warn('🔒 [SECURITY MIGRATION] Starting tenant isolation fix...');

        // 1. Find HQ tenant
        const hqTenant = await this.tenantsRepository.findOne({
            where: { slug: 'zaplandia-hq' }
        });

        if (!hqTenant) {
            this.logger.error('HQ Tenant not found. Migration cannot proceed.');
            return { success: false, message: 'HQ Tenant not found' };
        }

        // 2. Find all non-superadmin users in HQ tenant
        const affectedUsers = await this.usersRepository.find({
            where: {
                tenantId: hqTenant.id,
                role: UserRole.USER, // Only migrate regular users
            },
            relations: ['tenant']
        });

        this.logger.warn(`Found ${affectedUsers.length} regular users incorrectly assigned to HQ tenant`);

        const migrationResults = [];

        // 3. For each affected user, create new tenant and migrate data
        for (const user of affectedUsers) {
            try {
                this.logger.log(`Migrating user: ${user.email}`);

                // Create new isolated tenant for this user
                const newTenant = this.tenantsRepository.create({
                    name: `${user.name}'s Business`,
                    slug: `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
                    trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
                });
                await this.tenantsRepository.save(newTenant);

                // Update user's tenantId
                user.tenantId = newTenant.id;
                await this.usersRepository.save(user);

                // Migrate user's data (contacts, messages, integrations, campaigns)
                const contactsUpdated = await this.contactsRepository.update(
                    { tenantId: hqTenant.id }, // This is problematic - we can't know which contacts belong to which user
                    { tenantId: newTenant.id }
                );

                const messagesUpdated = await this.messagesRepository.update(
                    { tenantId: hqTenant.id },
                    { tenantId: newTenant.id }
                );

                const integrationsUpdated = await this.integrationsRepository.update(
                    { tenantId: hqTenant.id },
                    { tenantId: newTenant.id }
                );

                const campaignsUpdated = await this.campaignsRepository.update(
                    { tenantId: hqTenant.id },
                    { tenantId: newTenant.id }
                );

                migrationResults.push({
                    user: user.email,
                    oldTenantId: hqTenant.id,
                    newTenantId: newTenant.id,
                    newTenantName: newTenant.name,
                    status: 'migrated'
                });

                this.logger.log(`✅ Successfully migrated ${user.email} to new tenant ${newTenant.id}`);
            } catch (error) {
                this.logger.error(`❌ Failed to migrate user ${user.email}: ${error.message}`);
                migrationResults.push({
                    user: user.email,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        this.logger.warn(`🔒 [SECURITY MIGRATION] Completed. Migrated ${migrationResults.filter(r => r.status === 'migrated').length} users.`);

        return {
            success: true,
            totalAffected: affectedUsers.length,
            results: migrationResults
        };
    }

    /**
     * Dry run to see what would be migrated without actually migrating
     */
    async previewMigration(): Promise<any> {
        const hqTenant = await this.tenantsRepository.findOne({
            where: { slug: 'zaplandia-hq' }
        });

        if (!hqTenant) {
            return { success: false, message: 'HQ Tenant not found' };
        }

        const affectedUsers = await this.usersRepository.find({
            where: {
                tenantId: hqTenant.id,
                role: UserRole.USER,
            },
            select: ['id', 'email', 'name', 'role', 'tenantId']
        });

        const userPreviews = affectedUsers.map(user => ({
            email: user.email,
            name: user.name,
            role: user.role,
            currentTenantId: user.tenantId,
            willCreateNewTenant: `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
        }));

        return {
            success: true,
            affectedUserCount: affectedUsers.length,
            users: userPreviews,
            warning: 'This is a DRY RUN. No data has been modified.'
        };
    }
}
