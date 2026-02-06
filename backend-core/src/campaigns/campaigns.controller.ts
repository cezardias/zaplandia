import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignStatus } from './entities/campaign.entity';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService) { }

    @Get()
    findAll(@Request() req) {
        return this.campaignsService.findAllByTenant(req.user.tenantId);
    }

    @Post()
    create(@Request() req, @Body() body: any) {
        return this.campaignsService.create(req.user.tenantId, body);
    }

    @Post(':id/start')
    start(@Request() req, @Param('id') id: string) {
        // Pass userId (sub) for audit logging
        return this.campaignsService.start(id, req.user.tenantId, req.user.id || req.user.sub);
    }

    @Post('funnels')
    createFunnel(@Request() req, @Body() body: any) {
        return this.campaignsService.createContactList(req.user.tenantId, body.name, body.contacts);
    }

    @Get('funnels')
    getFunnels(@Request() req) {
        return this.campaignsService.getContactLists(req.user.tenantId);
    }

    @Delete('funnels/:id')
    deleteFunnel(@Request() req, @Param('id') id: string) {
        return this.campaignsService.removeContactList(id, req.user.tenantId);
    }

    @Patch('funnels/:id')
    updateFunnel(@Request() req, @Param('id') id: string, @Body() body: any) {
        return this.campaignsService.updateContactList(id, req.user.tenantId, body);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.campaignsService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() body: any) {
        return this.campaignsService.update(id, req.user.tenantId, body);
    }

    @Patch(':id/status')
    updateStatus(@Request() req, @Param('id') id: string, @Body() body: { status: CampaignStatus }) {
        return this.campaignsService.updateStatus(id, req.user.tenantId, body.status);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.campaignsService.remove(id, req.user.tenantId);
    }
}
