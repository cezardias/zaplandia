import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageService } from './usage.service';
import { DailyUsage } from './entities/daily-usage.entity';
import { UsageController } from './usage.controller';

@Module({
    imports: [TypeOrmModule.forFeature([DailyUsage])],
    controllers: [UsageController],
    providers: [UsageService],
    exports: [UsageService]
})
export class UsageModule { }
