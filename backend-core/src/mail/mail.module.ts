import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { BillingConfig } from '../billing/entities/billing-config.entity';

@Global() // Make it global so BillingService can use it
@Module({
    imports: [
        TypeOrmModule.forFeature([BillingConfig]),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }
