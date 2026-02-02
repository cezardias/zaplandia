import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
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

    @Post('funnels')
    createFunnel(@Request() req, @Body() body: any) {
        return this.campaignsService.createContactList(req.user.tenantId, body.name, body.contacts);
    }

    @Get('funnels')
    getFunnels(@Request() req) {
        return this.campaignsService.getContactLists(req.user.tenantId);
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
