import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Automation } from './entities/automation.entity';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';
import { AiModule } from '../ai/ai.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Automation]),
        AiModule,
        IntegrationsModule,
        AuthModule,
    ],
    controllers: [AutomationsController],
    providers: [AutomationsService],
    exports: [AutomationsService]
})
export class AutomationsModule {}
