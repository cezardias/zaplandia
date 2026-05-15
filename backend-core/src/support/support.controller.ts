import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    @Get('articles')
    findAll(@Query('q') query: string, @Query('category') category: string) {
        return this.supportService.findAll(query, category);
    }

    @Get('articles/:id')
    findOne(@Param('id') id: string) {
        return this.supportService.findOne(id);
    }

    // Admin endpoint to add help content
    @Post('articles')
    create(@Body() body: any) {
        return this.supportService.create(body);
    }

    // --- Tickets ---

    @Get('tickets')
    async getTickets(@Request() req: any) {
        return this.supportService.findUserTickets(req.user.tenantId, req.user.userId, req.user.role, req.user.email);
    }

    @Post('tickets')
    async createTicket(@Request() req: any, @Body() body: any) {
        return this.supportService.createTicket(req.user.tenantId, req.user.userId, body);
    }

    @Patch('tickets/:id')
    async updateTicket(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        return this.supportService.updateTicket(id, body);
    }

    @Post('tickets/:id/transfer')
    async transferTicket(@Request() req: any, @Param('id') id: string, @Body() data: { assigneeId: string, teamId?: string }) {
        return this.supportService.transferTicket(id, data.assigneeId, data.teamId);
    }
}
