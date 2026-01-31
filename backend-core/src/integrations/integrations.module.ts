import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

import { User } from '../users/entities/user.entity';
import { N8nService } from './n8n.service';
import { EvolutionApiService } from './evolution-api.service';

import { AiPrompt } from './entities/ai-prompt.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Integration, ApiCredential, User, AiPrompt])],
    controllers: [IntegrationsController, AiController],
    providers: [IntegrationsService, N8nService, EvolutionApiService, AiService],
    exports: [IntegrationsService, N8nService, EvolutionApiService, AiService],
})
export class IntegrationsModule { }
