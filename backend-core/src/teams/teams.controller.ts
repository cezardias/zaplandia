import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.teamsService.findAll(req.user.tenantId);
    }

    @Post()
    create(@Request() req: any, @Body('name') name: string) {
        return this.teamsService.create(req.user.tenantId, name);
    }

    @Delete(':id')
    delete(@Request() req: any, @Param('id') id: string) {
        return this.teamsService.delete(id, req.user.tenantId);
    }

    @Post('user/assign')
    assignUser(@Request() req: any, @Body() data: { userId: string, teamId: string | null }) {
        return this.teamsService.assignUserToTeam(data.userId, data.teamId, req.user.tenantId);
    }

    @Post('transfer')
    transfer(@Request() req: any, @Body() data: { contactId: string, teamId?: string, userId?: string }) {
        return this.teamsService.transferContact(
            req.user.tenantId,
            data.contactId,
            data.teamId || null,
            data.userId || null
        );
    }
}
