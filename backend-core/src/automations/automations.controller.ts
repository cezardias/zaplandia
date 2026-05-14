import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Patch } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { UniversalAuthGuard } from '../auth/universal-auth.guard';

@Controller('automations')
@UseGuards(UniversalAuthGuard)
export class AutomationsController {
    constructor(private readonly automationsService: AutomationsService) {}

    @Get('settings')
    async getSettings(@Request() req: any) {
        return this.automationsService.getSettings(req.user.tenantId);
    }

    @Post('settings')
    async saveSettings(@Request() req: any, @Body() data: { apiUrl: string; apiKey: string }) {
        return this.automationsService.saveSettings(req.user.tenantId, data.apiUrl, data.apiKey);
    }

    @Get()
    async findAll(@Request() req: any) {
        return this.automationsService.findAll(req.user.tenantId);
    }

    @Post()
    async create(@Request() req: any, @Body() data: any) {
        return this.automationsService.create(req.user.tenantId, {
            ...data,
            createdBy: req.user.userId
        });
    }

    @Patch(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        return this.automationsService.update(req.user.tenantId, id, data);
    }

    @Delete(':id')
    async remove(@Request() req: any, @Param('id') id: string) {
        return this.automationsService.remove(req.user.tenantId, id);
    }

    @Post('architect/chat')
    async architectChat(@Request() req: any, @Body() data: { message: string; history: any[] }) {
        return this.automationsService.architectChat(
            req.user.tenantId,
            req.user.userId,
            data.message,
            data.history
        );
    }
}
