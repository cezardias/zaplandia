import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Integration])],
    controllers: [],
    providers: [],
})
export class IntegrationsModule { }
