import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebugController } from './debug.controller';
import { Contact } from '../crm/entities/crm.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Contact])],
    controllers: [DebugController],
})
export class DebugModule { }
