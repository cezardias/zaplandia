import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PipelineStageService } from './pipeline-stage.service';

@Controller('crm/stages')
@UseGuards(JwtAuthGuard)
export class PipelineStageController {
    constructor(private readonly stageService: PipelineStageService) { }

    @Get()
    async findAll(@Request() req: any) {
        return this.stageService.findAll(req.user.tenantId);
    }

    @Post()
    async create(@Request() req: any, @Body() data: { name: string, order?: number, color?: string }) {
        return this.stageService.create(req.user.tenantId, data);
    }

    @Patch(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        return this.stageService.update(id, req.user.tenantId, data);
    }

    @Delete(':id')
    async delete(@Request() req: any, @Param('id') id: string) {
        return this.stageService.delete(id, req.user.tenantId);
    }
}
