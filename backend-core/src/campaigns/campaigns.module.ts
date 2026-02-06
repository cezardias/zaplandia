import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignLead } from './entities/campaign-lead.entity';
import { ContactList } from './entities/contact-list.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CrmModule } from '../crm/crm.module';
import { BullModule } from '@nestjs/bull';
import { IntegrationsModule } from '../integrations/integrations.module';
import { CampaignProcessor } from './queues/campaign.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([Campaign, CampaignLead, ContactList]),
        CrmModule,
        BullModule.registerQueue({
            name: 'campaign-queue',
        }),
        IntegrationsModule, // Needed for CampaignProcessor
        AuditModule,
        UsageModule
    ],
    providers: [CampaignsService, CampaignProcessor],
    controllers: [CampaignsController],
    exports: [CampaignsService],
})
export class CampaignsModule { }
