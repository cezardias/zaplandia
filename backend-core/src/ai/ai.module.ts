import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { Contact, Message } from '../crm/entities/crm.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { IntegrationsModule } from '../integrations/integrations.module';

import { AiPrompt } from '../integrations/entities/ai-prompt.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Contact, Message, Integration, AiPrompt]),
        forwardRef(() => IntegrationsModule),
    ],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
