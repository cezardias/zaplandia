import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SupportArticle } from './entities/support-article.entity';
export declare class SupportService implements OnModuleInit {
    private articleRepository;
    private readonly logger;
    constructor(articleRepository: Repository<SupportArticle>);
    onModuleInit(): Promise<void>;
    findAll(query?: string, category?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(data: any): Promise<any>;
    seedInitialArticles(): Promise<void>;
}
