import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmService } from '../crm/crm.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from '../crm/entities/crm.entity';
import { Repository, Between } from 'typeorm';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(
        private readonly crmService: CrmService,
        private readonly integrationsService: IntegrationsService,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
    ) { }

    @Get('stats')
    async getStats(@Request() req) {
        console.log(`[SECURITY] User ${req.user.email} (${req.user.role}) accessing dashboard stats for tenant ${req.user.tenantId}`);

        const tenantId = req.user.tenantId;
        const role = req.user.role;

        // 1. Messages Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const messagesToday = await this.messageRepository.count({
            where: {
                tenantId: role === 'superadmin' ? undefined : tenantId,
                createdAt: Between(today, tomorrow),
            },
        });

        // 2. Active Chats (Contacts with messages)
        const chats = await this.crmService.getRecentChats(tenantId, role);
        const activeChats = chats.length;

        // 3. Connected Integrations
        const integrations = await this.integrationsService.findAllByTenant(tenantId, role);
        const connectedIntegrations = integrations.length;

        return {
            messagesToday,
            activeChats,
            connectedIntegrations,
        };
    }
}
