import { Controller, Delete, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/usage')
@UseGuards(JwtAuthGuard)
export class UsageController {
    private readonly logger = new Logger(UsageController.name);

    constructor(private readonly usageService: UsageService) { }

    @Delete(':instanceName')
    async resetInstanceUsage(@Request() req, @Param('instanceName') instanceName: string) {
        this.logger.log(`[RESET_USAGE] Request to reset usage for instance ${instanceName} by user ${req.user.email}`);

        await this.usageService.resetUsage(req.user.tenantId, instanceName, 'whatsapp_messages');
        return { message: `Quota reset for instance ${instanceName}` };
    }
}
