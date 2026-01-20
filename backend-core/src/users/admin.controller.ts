import { Controller, Post, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmService } from '../crm/crm.service';
import { UserRole } from './entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(private readonly crmService: CrmService) { }

    @Post('seed')
    async seed(@Request() req) {
        if (req.user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Apenas SuperAdmins podem gerar dados de teste.');
        }

        // We use req.user.tenantId if present, or a default dummy tenant for global demo
        const targetTenantId = req.user.tenantId || 'demo-tenant-id';
        await this.crmService.seedDemoData(targetTenantId);

        return { success: true, message: 'Dados de demonstração gerados com sucesso!' };
    }
}
