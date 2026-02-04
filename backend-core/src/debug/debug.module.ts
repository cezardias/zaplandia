import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebugController } from './debug.controller';
import { Contact, Message } from '../crm/entities/crm.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Contact, Message, Integration]), // Added Message entity here
        IntegrationsModule
    ],
    controllers: [DebugController],
})
export class DebugModule { }
