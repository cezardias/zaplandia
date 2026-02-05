import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import { UsersService } from './users.service';
import { AdminController } from './admin.controller';
import { DatabaseCleanupService } from './database-cleanup.service';
import { CrmModule } from '../crm/crm.module';
import { SupportModule } from '../support/support.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Tenant]),
        forwardRef(() => CrmModule),
        SupportModule,
        IntegrationsModule,
    ],
    controllers: [AdminController],
    providers: [UsersService, DatabaseCleanupService],
    exports: [UsersService],
})
export class UsersModule { }
