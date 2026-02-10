import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SupportArticle } from './entities/support-article.entity';
export declare class SupportService implements OnModuleInit {
    private articleRepository;
    private readonly logger;
    constructor(articleRepository: Repository<SupportArticle>);
    onModuleInit(): Promise<void>;
    findAll(query?: string, category?: string): Promise<SupportArticle[]>;
    findOne(id: string): Promise<SupportArticle | null>;
    create(data: any): Promise<SupportArticle[]>;
    seedInitialArticles(): Promise<void>;
}
