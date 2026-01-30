import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Patch } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EvolutionApiService } from './evolution-api.service';
import { N8nService } from './n8n.service';

@Controller('integrations')
export class IntegrationsController {
    constructor(
        private readonly integrationsService: IntegrationsService,
        private readonly evolutionApiService: EvolutionApiService,
        private readonly n8nService: N8nService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req) {
        return this.integrationsService.findAllByTenant(req.user.tenantId, req.user.role);
    }

    // EvolutionAPI Management
    @UseGuards(JwtAuthGuard)
    @Post('evolution/instance')
    async createEvolutionInstance(@Request() req) {
        const instanceName = `tenant_${req.user.tenantId}`;
        return this.evolutionApiService.createInstance(instanceName, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('evolution/qrcode')
    async getEvolutionQrCode(@Request() req) {
        const instanceName = `tenant_${req.user.tenantId}`;
        return this.evolutionApiService.getQrCode(instanceName);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('evolution/instance')
    async deleteEvolutionInstance(@Request() req) {
        const instanceName = `tenant_${req.user.tenantId}`;
        return this.evolutionApiService.deleteInstance(instanceName);
    }

    // Public Webhook for EvolutionAPI
    @Post('evolution/webhook')
    async handleEvolutionWebhook(@Body() payload: any) {
        // EvolutionAPI sends instance name in payload. Example: "tenant_<uuid>"
        const instanceName = payload.instance;
        if (instanceName && instanceName.startsWith('tenant_')) {
            const tenantId = instanceName.replace('tenant_', '');
            // Forward to n8n for automation
            await this.n8nService.triggerWebhook(tenantId, payload);
        }
        return { success: true };
    }

    @UseGuards(JwtAuthGuard)
    @Post('connect/:provider')
    connect(
        @Request() req,
        @Param('provider') provider: any,
        @Body() body: any
    ) {
        // This will route to specific provider logic
        return this.integrationsService.create(req.user.tenantId, provider, body.credentials);
    }

    @UseGuards(JwtAuthGuard)
    @Post('credentials')
    saveCredentials(@Request() req, @Body() body: { name: string, value: string, isGlobal?: boolean }) {
        const tenantId = (req.user.role === 'superadmin' && body.isGlobal) ? null : req.user.tenantId;
        return this.integrationsService.saveApiCredential(tenantId, body.name, body.value);
    }

    @UseGuards(JwtAuthGuard)
    @Get('credentials')
    getCredentials(@Request() req) {
        return this.integrationsService.findAllCredentials(req.user.tenantId, req.user.role === 'superadmin');
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.integrationsService.remove(id, req.user.tenantId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    updateSettings(@Request() req, @Param('id') id: string, @Body() body: { settings: any }) {
        return this.integrationsService.updateSettings(id, req.user.tenantId, body.settings);
    }
}
