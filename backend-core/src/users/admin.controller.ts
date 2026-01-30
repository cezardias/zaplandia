import { Controller, Post, Get, Put, Delete, UseGuards, Request, Body, Param, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmService } from '../crm/crm.service';
import { SupportService } from '../support/support.service';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(
        private readonly crmService: CrmService,
        private readonly supportService: SupportService,
        private readonly usersService: UsersService,
    ) { }

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
}
