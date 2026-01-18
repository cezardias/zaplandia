import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Integration, ApiCredential])],
    controllers: [IntegrationsController],
    providers: [IntegrationsService],
    exports: [IntegrationsService],
})
export class IntegrationsModule { }
