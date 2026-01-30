import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { N8nService } from './n8n.service';
import { EvolutionApiService } from './evolution-api.service';

@Module({
    imports: [TypeOrmModule.forFeature([Integration, ApiCredential])],
    controllers: [IntegrationsController],
    providers: [IntegrationsService, N8nService, EvolutionApiService],
    exports: [IntegrationsService, N8nService, EvolutionApiService],
})
export class IntegrationsModule { }
