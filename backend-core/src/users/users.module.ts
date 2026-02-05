import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import { UsersService } from './users.service';
import { AdminController } from './admin.controller';
import { TenantMigrationService } from './tenant-migration.service';
import { TenantMigrationController } from './tenant-migration.controller';
import { CrmModule } from '../crm/crm.module';
import { SupportModule } from '../support/support.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { Contact } from '../crm/entities/crm.entity';
import { Message } from '../crm/entities/message.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Tenant, Contact, Message, Integration, Campaign]),
        forwardRef(() => CrmModule),
        SupportModule,
        IntegrationsModule,
    ],
    controllers: [AdminController, TenantMigrationController],
    providers: [UsersService, TenantMigrationService],
    exports: [UsersService],
})
export class UsersModule { }
