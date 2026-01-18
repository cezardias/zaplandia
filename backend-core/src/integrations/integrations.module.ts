import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { ApiCredential } from './entities/api-credential.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Integration, ApiCredential])],
    controllers: [],
    providers: [],
})
export class IntegrationsModule { }
