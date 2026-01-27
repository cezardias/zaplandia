import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import { UsersService } from './users.service';
import { AdminController } from './admin.controller';
import { CrmModule } from '../crm/crm.module';
import { SupportModule } from '../support/support.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Tenant]),
        forwardRef(() => CrmModule),
        SupportModule,
    ],
    controllers: [AdminController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
