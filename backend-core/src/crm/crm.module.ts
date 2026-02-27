import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, Message } from './entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { UploadController } from './upload.controller';
import { IntegrationsModule } from '../integrations/integrations.module';

import { Campaign } from '../campaigns/entities/campaign.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Contact, Message, CampaignLead, Campaign]),
        IntegrationsModule,
        BullModule.registerQueue({
            name: 'campaign-queue',
        }),
    ],
    controllers: [CrmController, UploadController],
    providers: [CrmService],
    exports: [CrmService],
})
export class CrmModule { }
