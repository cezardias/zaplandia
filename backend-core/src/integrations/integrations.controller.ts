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
    async findAll(@Request() req) {
        console.log(`[SECURITY] User ${req.user.email} (${req.user.role}) listing integrations for tenant ${req.user.tenantId}`);

        // 1. Fetch DB Integrations (Official Meta, Mercado Livre, etc.)
        const dbIntegrations = await this.integrationsService.findAllByTenant(req.user.tenantId, req.user.role);

        // 2. Fetch EvolutionAPI Instances (WhatsApp)
        let liveInstancesRaw: any[] = [];
        let evolutionInstances: any[] = [];
        try {
            // Pass user role to allow superadmin to see all
            liveInstancesRaw = await this.evolutionApiService.listInstances(req.user.tenantId, req.user.role);
            evolutionInstances = await Promise.all(liveInstancesRaw.map(async (inst: any) => {
                const rawName = inst.name || inst.instance?.instanceName || inst.instanceName;
                // Clean name: remove technical prefix "tenant_<uuid>_"
                // We keep everything after the second underscore
                const friendlyName = rawName.replace(/^tenant_[0-9a-fA-F-]{36}_/, '');

                // Find the corresponding integration in the database by matching the instance name
                const dbIntegration = dbIntegrations.find(i =>
                    i.provider === 'evolution' &&
                    (i.settings?.instanceName === rawName || i.credentials?.instanceName === rawName)
                );

                // Skip if already in database (we will process it in step 3)
                if (dbIntegration) {
                    return null;
                }

                return {
                    id: rawName, // Use rawName as fallback ID
                    name: friendlyName,
                    instanceName: rawName, // Keep raw name for filtering chats
                    provider: 'evolution',
                    status: inst.status === 'open' || inst.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED',
                    integrationId: inst.integrationId || `evo_${rawName}`,
                    settings: inst
                };
            }));

            // Filter out null entries (instances already in DB)
            evolutionInstances = evolutionInstances.filter(inst => inst !== null);
        } catch (e) {
            console.error('Failed to fetch evolution instances for list:', e.message);
        }

        // 3. Merge and Polish Names
        const finalIntegrations = dbIntegrations.map(i => {
            if (i.provider === 'evolution') {
                // Extract friendly name from credentials.instanceName
                const instanceName = i.credentials?.instanceName || i.settings?.instanceName;
                const friendlyName = instanceName
                    ? instanceName.replace(/^tenant_[0-9a-fA-F-]{36}_/, '')
                    : 'Evolution';

                // Check if this DB instance actually exists in the live list from API
                const liveInst = liveInstancesRaw.find(li =>
                    (li.name || li.instance?.instanceName || li.instanceName) === instanceName
                );

                return {
                    ...i,
                    name: friendlyName,
                    instanceName: instanceName,
                    // If not found in live API, mark as DISCONNECTED to avoid "ghost" instances
                    status: liveInst ? (liveInst.status === 'open' || liveInst.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED') : 'DISCONNECTED'
                };
            }

            return {
                ...i,
                name: i.provider === 'whatsapp' ? 'WhatsApp Oficial' :
                    i.provider.charAt(0).toUpperCase() + i.provider.slice(1)
            };
        });


        const result = [...finalIntegrations, ...evolutionInstances];
        console.log('Integrations being returned:', JSON.stringify(result, null, 2));
        return result;
    }

    // EvolutionAPI Management - List all instances for tenant (or ALL for SuperAdmin)
    @UseGuards(JwtAuthGuard)
    @Get('evolution/instances')
    async listEvolutionInstances(@Request() req) {
        // Use listInstances for both regular users and superadmins.
        // It correctly handles showing all instances if the role is superadmin,
        // while also correctly looking up credentials in the user's tenant context.
        return this.evolutionApiService.listInstances(req.user.tenantId, req.user.role);
    }

    // Create instance with custom name
    @UseGuards(JwtAuthGuard)
    @Post('evolution/instance')
    async createEvolutionInstance(@Request() req, @Body() body: { instanceName?: string }) {
        // Generate a unique instance name: tenant_<tenantId>_<customName or timestamp>
        const customName = body.instanceName || Date.now().toString();
        const instanceName = `tenant_${req.user.tenantId}_${customName}`;

        // Create instance in Evolution API
        const evolutionResponse = await this.evolutionApiService.createInstance(req.user.tenantId, instanceName, req.user.userId);

        // Save integration to database
        const integration = await this.integrationsService.create(
            req.user.tenantId,
            'evolution' as any,
            { instanceName, evolutionData: evolutionResponse }
        );

        return { ...evolutionResponse, integrationId: integration.id };
    }

    // Get QR Code for specific instance
    @UseGuards(JwtAuthGuard)
    @Get('evolution/qrcode/:instanceName')
    async getEvolutionQrCodeByName(@Request() req, @Param('instanceName') instanceName: string) {
        return this.evolutionApiService.getQrCode(req.user.tenantId, instanceName);
    }

    // Legacy: Get QR Code for default instance
    @UseGuards(JwtAuthGuard)
    @Get('evolution/qrcode')
    async getEvolutionQrCode(@Request() req) {
        const instanceName = `tenant_${req.user.tenantId}`;
        return this.evolutionApiService.getQrCode(req.user.tenantId, instanceName);
    }

    // Get instance connection status
    @UseGuards(JwtAuthGuard)
    @Get('evolution/status/:instanceName')
    async getEvolutionInstanceStatus(@Request() req, @Param('instanceName') instanceName: string) {
        return this.evolutionApiService.getInstanceStatus(req.user.tenantId, instanceName);
    }

    // Manual Webhook Setup (Force)
    @UseGuards(JwtAuthGuard)
    @Post('evolution/webhook/:instanceName')
    async setEvolutionWebhook(@Request() req, @Param('instanceName') instanceName: string) {
        const webhookUrl = `${process.env.API_URL || 'https://api.zaplandia.com.br'}/webhooks/evolution`;
        return this.evolutionApiService.setWebhook(req.user.tenantId, instanceName, webhookUrl);
    }

    // Delete specific instance
    @UseGuards(JwtAuthGuard)
    @Delete('evolution/instance/:instanceName')
    async deleteEvolutionInstanceByName(@Request() req, @Param('instanceName') instanceName: string) {
        return this.evolutionApiService.deleteInstance(req.user.tenantId, instanceName);
    }

    // Legacy: Delete default instance
    @UseGuards(JwtAuthGuard)
    @Delete('evolution/instance')
    async deleteEvolutionInstance(@Request() req) {
        const instanceName = `tenant_${req.user.tenantId}`;
        return this.evolutionApiService.deleteInstance(req.user.tenantId, instanceName);
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
    async saveCredentials(@Request() req, @Body() body: { name: string, value: string }) {
        console.log('[SAVE_CRED] req.user:', JSON.stringify(req.user));
        // Fallback: if tenantId is missing from token (legacy users), fetch from DB
        let tenantId = req.user.tenantId;
        console.log('[SAVE_CRED] Initial tenantId from token:', tenantId);
        if (!tenantId) {
            console.log('[SAVE_CRED] Fetching tenantId from DB for userId:', req.user.userId);
            tenantId = await this.integrationsService.fetchUserTenantId(req.user.userId);
            console.log('[SAVE_CRED] Fetched tenantId from DB:', tenantId);
        }
        if (!tenantId) {
            console.error('[SAVE_CRED] FATAL: No tenantId found!');
            throw new Error('Cannot save credentials: user has no associated tenant.');
        }

        // 🔧 CRITICAL FIX: Evolution API should be GLOBAL for SuperAdmin
        const isSuperAdmin = req.user.role === 'superadmin';
        const isEvolutionConfig = body.name === 'EVOLUTION_API_URL' || body.name === 'EVOLUTION_API_KEY';

        let finalTenantId: string | null = tenantId;

        if (isSuperAdmin && isEvolutionConfig) {
            finalTenantId = null; // Save as GLOBAL
            console.log(`[SAVE_CRED] ✅ SuperAdmin saving ${body.name} as GLOBAL (tenantId=null)`);

            // CLEANUP: Delete any tenant-specific override that might hide this global key
            if (tenantId) {
                await this.integrationsService.deleteCredential(tenantId, body.name);
                console.log(`[SAVE_CRED] 🗑️ Deleted conflicting tenant-specific key for ${tenantId}`);
            }
        } else {
            console.log('[SAVE_CRED] Final tenantId:', tenantId, 'Key:', body.name);
        }

        return this.integrationsService.saveApiCredential(finalTenantId, body.name, body.value);
    }

    @UseGuards(JwtAuthGuard)
    @Get('credentials')
    async getCredentials(@Request() req) {
        console.log('[GET_CRED] req.user:', JSON.stringify(req.user));
        let tenantId = req.user.tenantId;
        console.log('[GET_CRED] Initial tenantId from token:', tenantId);
        if (!tenantId) {
            console.log('[GET_CRED] Fetching tenantId from DB for userId:', req.user.userId);
            tenantId = await this.integrationsService.fetchUserTenantId(req.user.userId);
            console.log('[GET_CRED] Fetched tenantId from DB:', tenantId);
        }
        console.log('[GET_CRED] Final tenantId:', tenantId);

        const tenantCreds = await this.integrationsService.findAllCredentials(tenantId);

        if (req.user.role === 'superadmin') {
            const globalCreds = await this.integrationsService.findAllCredentials(null);
            return [...globalCreds, ...tenantCreds];
        }

        return tenantCreds;
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
