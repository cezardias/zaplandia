import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingConfig } from './entities/billing-config.entity';
import { Transaction } from './entities/transaction.entity';
import { Tenant } from '../users/entities/tenant.entity';
import { BillingService } from './billing.service';
import { BtgService } from './btg.service';
import { BillingController } from './billing.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([BillingConfig, Transaction, Tenant]),
        forwardRef(() => UsersModule),
    ],
    providers: [BillingService, BtgService],
    controllers: [BillingController],
    exports: [BillingService],
})
export class BillingModule { }
