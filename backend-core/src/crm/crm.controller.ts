import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query, Delete, Logger } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
    private readonly logger = new Logger(CrmController.name);
    constructor(private readonly crmService: CrmService) { }

    @Get('stats')
    async getDashboardStats(@Request() req, @Query('campaignId') campaignId?: string, @Query('campaign_id') campaignIdAlt?: string, @Query('global_campaign_id') globId?: string, @Query('instance') instance?: string) {
        this.logger.log(`[SECURITY] User ${req.user.email} (${req.user.role}) accessing stats for tenant ${req.user.tenantId}`);
        return this.crmService.getDashboardStats(req.user.tenantId, campaignId || campaignIdAlt || globId, instance);
    }

    @Get()
    async getContacts(@Request() req, @Query('q') q?: string, @Query('campaignId') campaignId?: string, @Query('campaign_id') campaignIdAlt?: string, @Query('global_campaign_id') globId?: string, @Query('instance') instance?: string) {
        this.logger.log(`[SECURITY] User ${req.user.email} (${req.user.role}) accessing contacts for tenant ${req.user.tenantId}`);
        return this.crmService.findAllByTenant(req.user.tenantId, { search: q, campaignId: campaignId || campaignIdAlt || globId, instance });
    }

    @Get('contacts')
    async getContactsAlias(@Request() req, @Query('q') q?: string, @Query('campaignId') campaignId?: string, @Query('campaign_id') campaignIdAlt?: string, @Query('global_campaign_id') globId?: string, @Query('instance') instance?: string) {
        this.logger.log(`[SECURITY] User ${req.user.email} (${req.user.role}) accessing contacts (alias) for tenant ${req.user.tenantId}`);
        return this.crmService.findAllByTenant(req.user.tenantId, { search: q, campaignId: campaignId || campaignIdAlt || globId, instance });
    }

    @Post('contacts')
    createContact(@Request() req, @Body() body: any) {
        return this.crmService.ensureContact(req.user.tenantId, body, { forceStage: 'NOVO' });
    }

    @Get('chats')
    async getChats(@Request() req, @Query('instance') instance?: string) {
        this.logger.log(`[SECURITY] User ${req.user.email} (${req.user.role}) accessing chats for tenant ${req.user.tenantId}`);
        return this.crmService.getRecentChats(req.user.tenantId, req.user.role, { instance });
    }

    @Get('chats/:contactId/messages')
    getMessages(@Request() req, @Param('contactId') contactId: string) {
        return this.crmService.getMessages(contactId, req.user.tenantId);
    }

    @Post('messages')
    sendMessage(@Request() req, @Body() body: { contactId: string, content: string, provider: string, media?: any }) {
        return this.crmService.sendMessage(req.user.tenantId, body.contactId, body.content, body.provider, body.media);
    }

    @Patch('chats/:contactId')
    updateContact(@Request() req, @Param('contactId') contactId: string, @Body() body: any) {
        return this.crmService.updateContact(req.user.tenantId, contactId, body);
    }

    @Get('campaign-logs/:campaignId')
    async getCampaignLogs(@Request() req, @Param('campaignId') campaignId: string) {
        return this.crmService.getCampaignLogs(req.user.tenantId, campaignId);
    }

    @Delete('contacts/all')
    deleteAllContacts(@Request() req) {
        return this.crmService.removeAllContacts(req.user.tenantId);
    }

    @Delete('contacts/cleanup-orphans')
    async cleanupOrphans(@Request() req) {
        const deletedCount = await this.crmService.cleanupGlobalOrphanedContacts(req.user.tenantId);
        return { success: true, message: `Limpeza concluída. ${deletedCount} contatos órfãos removidos.`, deletedCount };
    }
}
