import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { CrmModule } from '../crm/crm.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UniversalAuthGuard } from '../auth/guards/universal-auth.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([Team, User]),
        forwardRef(() => CrmModule),
        IntegrationsModule,
    ],
    controllers: [TeamsController],
    providers: [TeamsService, ApiKeyGuard, JwtAuthGuard, UniversalAuthGuard],
    exports: [TeamsService],
})
export class TeamsModule { }
