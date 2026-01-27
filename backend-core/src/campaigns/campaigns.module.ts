import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignLead } from './entities/campaign-lead.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CrmModule } from '../crm/crm.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Campaign, CampaignLead]),
        CrmModule,
    ],
    providers: [CampaignsService],
    controllers: [CampaignsController],
    exports: [CampaignsService],
})
export class CampaignsModule { }
