import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { CrmModule } from '../crm/crm.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../crm/entities/crm.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message]),
        CrmModule,
        IntegrationsModule
    ],
    controllers: [DashboardController],
})
export class DashboardModule { }
