import { Controller, Post, Get, Put, Delete, UseGuards, Request, Body, Param, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmService } from '../crm/crm.service';
import { SupportService } from '../support/support.service';
import { UsersService } from './users.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { UserRole } from './entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(
        private readonly crmService: CrmService,
        private readonly supportService: SupportService,
        private readonly usersService: UsersService,
        private readonly integrationsService: IntegrationsService,
    ) { }

    @Get('tenants/:tenantId/credentials')
    async getTenantCredentials(@Request() req, @Param('tenantId') tenantId: string) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Acesso negado.');
        }
        console.log(`[ADMIN_GET] Tenant: ${tenantId}`);
        const tenantCreds = await this.integrationsService.findAllCredentials(tenantId);
        const globalCreds = await this.integrationsService.findAllCredentials(null);
        return [...globalCreds, ...tenantCreds];
    }

    @Post('tenants/:tenantId/credentials')
    async saveTenantCredential(@Request() req, @Param('tenantId') tenantId: string, @Body() body: any) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Acesso negado.');
        }
        const { name, value } = body;

        // FIX: Admin saving Evolution API settings should be GLOBAL
        if (name === 'EVOLUTION_API_URL' || name === 'EVOLUTION_API_KEY') {
            console.log(`[ADMIN_SAVE] 🌍 Saving ${name} as GLOBAL (ignoring tenant ${tenantId})`);
            return this.integrationsService.saveApiCredential(null, name, value);
        }

        console.log(`[ADMIN_SAVE] Tenant: ${tenantId}, Key: ${name}`);
        return this.integrationsService.saveApiCredential(tenantId, name, value);
    }

    @Get('tenants')
    async findAllTenants(@Request() req) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Acesso negado.');
        }
        return this.usersService.findAllTenants();
    }

    @Get('users')
    async findAll(@Request() req) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Acesso negado.');
        }
        return this.usersService.findAll();
    }

    @Post('users')
    async create(@Request() req, @Body() userData: any) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Acesso negado.');
        }

        console.log('[ADMIN_CREATE] Received userData:', JSON.stringify(userData));

        // ✅ AUTO-CREATE TENANT FOR REGULAR USERS
        // If creating a regular 'user' without explicit tenantId, create one automatically
        const role = (userData.role || '').toLowerCase();
        const hasTenantId = userData.tenantId && userData.tenantId.trim() !== '';

        console.log('[ADMIN_CREATE] Role:', role, 'HasTenantId:', hasTenantId);

        if (role === 'user' && !hasTenantId) {
            const companyName = userData.companyName || `${userData.name}'s Business`;
            const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const uniqueSlug = `${baseSlug}-${Date.now()}`;

            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 15);

            const tenant = await this.usersService.createTenant({
                name: companyName,
                slug: uniqueSlug,
                trialEndsAt: trialEndDate,
            });

            console.log(`[ADMIN_CREATE] ✅ Auto-created tenant for user: ${tenant.name} (ID: ${tenant.id})`);
            userData.tenantId = tenant.id;
        }

        console.log('[ADMIN_CREATE] Final userData with tenantId:', userData.tenantId);
        return this.usersService.create(userData);
    }

    @Put('users/:id')
    async update(@Request() req, @Param('id') id: string, @Body() userData: any) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Acesso negado.');
        }
        return this.usersService.update(id, userData);
    }

    @Delete('users/:id')
    async remove(@Request() req, @Param('id') id: string) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Acesso negado.');
        }
        return this.usersService.remove(id);
    }

    @Post('seed')
    async seed(@Request() req) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Apenas SuperAdmins podem gerar dados de teste.');
        }
        // ... previous seed logic

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

    // ============================================
    // GLOBAL CREDENTIALS (Evolution API, etc)
    // ============================================

    @Get('credentials/global')
    async getGlobalCredentials(@Request() req) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Apenas SuperAdmin pode acessar credenciais globais.');
        }
        console.log('[ADMIN_GET_GLOBAL] Fetching global credentials');
        return this.integrationsService.findAllCredentials(null);
    }

    @Post('credentials/global')
    async saveGlobalCredential(@Request() req, @Body() body: { name: string, value: string }) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Apenas SuperAdmin pode configurar credenciais globais.');
        }
        console.log(`[ADMIN_SAVE_GLOBAL] Saving global credential: ${body.name}`);
        return this.integrationsService.saveApiCredential(null, body.name, body.value);
    }
}
