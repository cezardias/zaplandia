import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { CrmModule } from '../crm/crm.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AiService } from '../integrations/ai.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';

@Module({
    imports: [
        CrmModule,
        IntegrationsModule,
        TypeOrmModule.forFeature([Contact, Message, CampaignLead])
    ],
    controllers: [WebhooksController],
    providers: [],
})
export class WebhooksModule { }
