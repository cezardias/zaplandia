import { Controller, Post, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmService } from '../crm/crm.service';
import { SupportService } from '../support/support.service';
import { UserRole } from './entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(
        private readonly crmService: CrmService,
        private readonly supportService: SupportService, // Added this injection
    ) { }

    @Post('seed')
    async seed(@Request() req) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Apenas SuperAdmins podem gerar dados de teste.');
        }

        // We use req.user.tenantId if present, or a default dummy tenant for global demo
        const targetTenantId = req.user.tenantId || 'demo-tenant-id';

        console.log(`Starting seed for tenant ${targetTenantId}`);
        try {
            await this.crmService.seedDemoData(targetTenantId);
            console.log('CRM Seed done');
        } catch (e) {
            console.error('CRM Seed failed', e);
        }

        try {
            await this.supportService.seedInitialArticles();
            console.log('Support Seed done');
        } catch (e) {
            console.error('Support Seed failed', e);
        }

        return { message: 'Seeding process finished. Check logs.' };
    }
}
