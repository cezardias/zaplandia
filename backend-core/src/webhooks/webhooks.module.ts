import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { CrmModule } from '../crm/crm.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AiService } from '../integrations/ai.service';

@Module({
    imports: [CrmModule, IntegrationsModule],
    controllers: [WebhooksController],
    providers: [AiService],
})
export class WebhooksModule { }
