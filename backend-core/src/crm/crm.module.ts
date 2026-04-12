import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, Message } from './entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { CrmService } from './crm.service';
import { PipelineStageService } from './pipeline-stage.service';
import { CrmController } from './crm.controller';
import { PipelineStageController } from './pipeline-stage.controller';
import { UploadController } from './upload.controller';
import { IntegrationsModule } from '../integrations/integrations.module';

import { Campaign } from '../campaigns/entities/campaign.entity';
import { Integration } from '../integrations/entities/integration.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Contact, Message, CampaignLead, Campaign, PipelineStage, Integration]),
        IntegrationsModule,
        BullModule.registerQueue({
            name: 'campaign-queue',
        }),
    ],
    controllers: [CrmController, PipelineStageController, UploadController],
    providers: [CrmService, PipelineStageService],
    exports: [CrmService, PipelineStageService],
})
export class CrmModule { }
