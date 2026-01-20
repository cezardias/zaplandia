import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationProvider } from './entities/integration.entity';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
    constructor(private readonly integrationsService: IntegrationsService) { }

    @Get()
    findAll(@Request() req) {
        return this.integrationsService.findAllByTenant(req.user.tenantId, req.user.role);
    }

    @Post('connect/:provider')
    connect(
        @Request() req,
        @Param('provider') provider: IntegrationProvider,
        @Body() body: any
    ) {
        // This will route to specific provider logic
        return this.integrationsService.create(req.user.tenantId, provider, body.credentials);
    }

    @Post('credentials')
    saveCredentials(@Request() req, @Body() body: { name: string, value: string }) {
        return this.integrationsService.saveApiCredential(req.user.tenantId, body.name, body.value);
    }

    @Get('credentials')
    getCredentials(@Request() req) {
        return this.integrationsService.findAllCredentials(req.user.tenantId);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.integrationsService.remove(id, req.user.tenantId);
    }
}
