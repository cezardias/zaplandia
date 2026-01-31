import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
    constructor(private readonly crmService: CrmService) { }

    @Get('stats')
    getStats(@Request() req) {
        return this.crmService.getDashboardStats(req.user.tenantId);
    }

    @Get('chats')
    getChats(@Request() req) {
        return this.crmService.getRecentChats(req.user.tenantId, req.user.role);
    }

    @Get('chats/:contactId/messages')
    getMessages(@Request() req, @Param('contactId') contactId: string) {
        return this.crmService.getMessages(contactId, req.user.tenantId);
    }

    @Post('messages')
    sendMessage(@Request() req, @Body() body: { contactId: string, content: string, provider: string }) {
        return this.crmService.sendMessage(req.user.tenantId, body.contactId, body.content, body.provider);
    }

    @Patch('chats/:contactId')
    updateContact(@Request() req, @Param('contactId') contactId: string, @Body() body: any) {
        return this.crmService.updateContact(req.user.tenantId, contactId, body);
    }
}
