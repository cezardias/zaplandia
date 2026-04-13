import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Logger, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
    private readonly logger = new Logger(TeamsController.name);

    constructor(private readonly teamsService: TeamsService) { }

    @Get()
    async findAll(@Request() req) {
        return this.teamsService.findAll(req.user.tenantId);
    }

    @Post()
    async create(@Request() req, @Body() body: { name: string }) {
        if (req.user.role === 'agent') throw new ForbiddenException('Atendentes não podem criar equipes.');
        return this.teamsService.create(req.user.tenantId, body.name);
    }

    @Delete(':id')
    async remove(@Request() req, @Param('id') id: string) {
        if (req.user.role === 'agent') throw new ForbiddenException('Atendentes não podem excluir equipes.');
        return this.teamsService.remove(req.user.tenantId, id);
    }

    @Post('user/assign')
    async assignUser(@Request() req, @Body() body: { userId: string, teamId: string | null }) {
        return this.teamsService.assignUserToTeam(req.user.tenantId, body.userId, body.teamId);
    }

    @Post('transfer')
    async transferContact(@Request() req, @Body() body: { contactId: string, teamId?: string, userId?: string }) {
        this.logger.log(`[TEAM_TRANSFER] Contact ${body.contactId} being routed for tenant ${req.user.tenantId}`);
        return this.teamsService.transferContact(req.user.tenantId, body.contactId, {
            teamId: body.teamId,
            userId: body.userId
        });
    }
}
