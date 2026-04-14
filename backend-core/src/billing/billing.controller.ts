import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UniversalAuthGuard } from '../auth/guards/universal-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BillingService } from './billing.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingConfig } from './entities/billing-config.entity';

@Controller('billing')
export class BillingController {
    constructor(
        private billingService: BillingService,
        @InjectRepository(BillingConfig)
        private configRepository: Repository<BillingConfig>,
    ) { }

    @UseGuards(UniversalAuthGuard)
    @Get('status')
    async getStatus(@Request() req: any) {
        return this.billingService.getTenantSubscription(req.user.tenantId);
    }

    @UseGuards(UniversalAuthGuard)
    @Post('pay')
    async createPayment(@Request() req: any, @Body() body: { plan: 'monthly' | 'annual', method: 'pix' | 'credit_card' | 'debit_card' | 'boleto' }) {
        return this.billingService.initiatePayment(req.user.tenantId, body.plan, body.method);
    }

    @UseGuards(UniversalAuthGuard)
    @Post('tenant')
    async updateTenantInfo(@Request() req: any, @Body() data: any) {
        return this.billingService.updateTenantBillingInfo(req.user.tenantId, data);
    }

    @Post('webhook')
    async webhook(@Body() body: any) {
        // BTG Webhook Logic
        // In production, we should verify the signature/IP
        const { id, status } = body;
        return this.billingService.handleWebhook(id, status);
    }

    // --- SUPERADMIN ENDPOINTS ---

    @UseGuards(UniversalAuthGuard)
    @Roles(UserRole.SUPERADMIN)
    @Get('admin/revenue')
    async getRevenue(@Request() req: any) {
        if (req.user.role !== UserRole.SUPERADMIN) throw new ForbiddenException();
        return this.billingService.getMonthlyRevenue();
    }

    @UseGuards(UniversalAuthGuard)
    @Roles(UserRole.SUPERADMIN)
    @Get('admin/config')
    async getConfig(@Request() req: any) {
        if (req.user.role !== UserRole.SUPERADMIN) throw new ForbiddenException();
        return this.configRepository.findOne({ where: {} });
    }

    @UseGuards(UniversalAuthGuard)
    @Roles(UserRole.SUPERADMIN)
    @Post('admin/config')
    async updateConfig(@Request() req: any, @Body() data: any) {
        if (req.user.role !== UserRole.SUPERADMIN) throw new ForbiddenException();
        
        let config = await this.configRepository.findOne({ where: {} });
        if (!config) config = this.configRepository.create();
        
        Object.assign(config, data);
        return this.configRepository.save(config);
    }
}
