import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantMigrationService } from './tenant-migration.service';

@Controller('admin/tenant-migration')
@UseGuards(JwtAuthGuard)
export class TenantMigrationController {
    constructor(private readonly migrationService: TenantMigrationService) { }

    /**
     * Preview what users would be migrated (DRY RUN)
     * GET /api/admin/tenant-migration/preview
     */
    @Get('preview')
    async previewMigration(@Request() req) {
        // Only superadmin can run migrations
        if (req.user.role !== 'superadmin') {
            return { success: false, message: 'Only superadmin can preview migrations' };
        }

        return this.migrationService.previewMigration();
    }

    /**
     * Execute the tenant isolation migration
     * POST /api/admin/tenant-migration/execute
     * ⚠️ WARNING: This will modify data!
     */
    @Post('execute')
    async executeMigration(@Request() req) {
        // Only superadmin can run migrations
        if (req.user.role !== 'superadmin') {
            return { success: false, message: 'Only superadmin can execute migrations' };
        }

        return this.migrationService.migrateUsersToIsolatedTenants();
    }
}
