import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportArticle } from './entities/support-article.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([SupportArticle]),
    ],
    providers: [SupportService],
    controllers: [SupportController],
    exports: [SupportService],
})
export class SupportModule { }
