import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, Message } from './entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { UploadController } from './upload.controller';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Contact, Message, CampaignLead]),
        IntegrationsModule
    ],
    controllers: [CrmController, UploadController],
    providers: [CrmService],
    exports: [CrmService],
})
export class CrmModule { }
