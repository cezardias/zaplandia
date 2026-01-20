import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { N8nService } from './n8n.service';

@Module({
    imports: [TypeOrmModule.forFeature([Integration, ApiCredential])],
    controllers: [IntegrationsController],
    providers: [IntegrationsService, N8nService],
    exports: [IntegrationsService, N8nService],
})
export class IntegrationsModule { }
