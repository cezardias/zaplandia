import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query, Delete } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
    constructor(private readonly crmService: CrmService) { }

    @Get('stats')
    getStats(@Request() req, @Query('campaignId') campaignId?: string) {
        return this.crmService.getDashboardStats(req.user.tenantId, campaignId);
    }

    @Get('contacts')
    getAllContacts(@Request() req, @Query('q') q: string, @Query('campaignId') campaignId: string) {
        return this.crmService.findAllByTenant(req.user.tenantId, { search: q, campaignId });
    }

    @Post('contacts')
    createContact(@Request() req, @Body() body: any) {
        return this.crmService.ensureContact(req.user.tenantId, body, { forceStage: 'NOVO' });
    }

    @Get('chats')
    getChats(@Request() req, @Query('instance') instance?: string) {
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

    @Delete('contacts/all')
    deleteAllContacts(@Request() req) {
        return this.crmService.removeAllContacts(req.user.tenantId);
    }
}
