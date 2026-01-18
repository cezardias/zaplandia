import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, Message } from './entities/crm.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Contact, Message])],
    controllers: [],
    providers: [],
})
export class CrmModule { }
