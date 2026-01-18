import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, Message } from './entities/crm.entity';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Contact, Message])],
    controllers: [CrmController],
    providers: [CrmService],
    exports: [CrmService],
})
export class CrmModule { }
