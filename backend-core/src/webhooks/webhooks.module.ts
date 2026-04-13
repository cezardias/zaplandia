import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { CrmModule } from '../crm/crm.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AiModule } from '../ai/ai.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
import { Integration } from '../integrations/entities/integration.entity';

import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UniversalAuthGuard } from '../auth/guards/universal-auth.guard';

@Module({
    imports: [
        CrmModule,
        IntegrationsModule,
        AiModule,
        TypeOrmModule.forFeature([Contact, Message, CampaignLead, Integration])
    ],
    controllers: [WebhooksController],
    providers: [ApiKeyGuard, JwtAuthGuard, UniversalAuthGuard],
})
export class WebhooksModule { }
