import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebugController } from './debug.controller';
import { Contact } from '../crm/entities/crm.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Contact, Integration]),
        IntegrationsModule
    ],
    controllers: [DebugController],
})
export class DebugModule { }
