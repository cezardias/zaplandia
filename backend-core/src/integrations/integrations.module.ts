import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';

import { User } from '../users/entities/user.entity';
import { N8nService } from './n8n.service';
import { EvolutionApiService } from './evolution-api.service';
import { WebhookSetupService } from './webhook-setup.service';

import { AiPrompt } from './entities/ai-prompt.entity';
import { AiModule } from '../ai/ai.module';
import { forwardRef } from '@nestjs/common';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Integration,
            ApiCredential,
            User,
            AiPrompt
        ]),
        forwardRef(() => AiModule),
    ],
    controllers: [IntegrationsController],
    providers: [IntegrationsService, N8nService, EvolutionApiService, WebhookSetupService],
    exports: [IntegrationsService, N8nService, EvolutionApiService],
})
export class IntegrationsModule { }
