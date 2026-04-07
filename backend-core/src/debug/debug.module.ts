import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebugController } from './debug.controller';
import { DebugAuditController } from './debug-audit.controller';
import { Contact, Message } from '../crm/entities/crm.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { IntegrationsModule } from '../integrations/integrations.module';
import { User } from '../users/entities/user.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Contact, Message, Integration, User, Campaign]),
        IntegrationsModule
    ],
    controllers: [DebugController, DebugAuditController],
})
export class DebugModule { }
