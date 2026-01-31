import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Integration, ApiCredential, User])],
    controllers: [IntegrationsController, AiController],
    providers: [IntegrationsService, N8nService, EvolutionApiService, AiService],
    exports: [IntegrationsService, N8nService, EvolutionApiService, AiService],
})
export class IntegrationsModule { }
