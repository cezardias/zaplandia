import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { CrmModule } from '../crm/crm.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AiModule } from '../ai/ai.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';

@Module({
    imports: [
        CrmModule,
        IntegrationsModule,
        AiModule,
        TypeOrmModule.forFeature([Contact, Message, CampaignLead])
    ],
    controllers: [WebhooksController],
    providers: [],
})
export class WebhooksModule { }
