import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SupportArticle } from './entities/support-article.entity';

@Injectable()
export class SupportService {
    constructor(
        @InjectRepository(SupportArticle)
        private articleRepository: Repository<SupportArticle>,
    ) { }

    async findAll(query?: string, category?: string) {
        const where: any = {};
        if (category) {
            where.category = category;
        }
        if (query) {
            return this.articleRepository.find({
                where: [
                    { title: Like(`%${query}%`), ...where },
                    { content: Like(`%${query}%`), ...where },
                ],
                order: { updatedAt: 'DESC' },
            });
        }
        return this.articleRepository.find({
            where,
            order: { updatedAt: 'DESC' },
        });
    }

    async findOne(id: string) {
        return this.articleRepository.findOne({ where: { id } });
    }

    // Admin only - Logic to seed or create articles
    async create(data: any) {
        const article = this.articleRepository.create(data);
        return this.articleRepository.save(article);
    }

    async seedInitialArticles() {
        const articles = [
            {
                title: 'Como criar sua primeira campanha',
                category: 'Campanhas',
                content: 'Para criar uma campanha, vá até a seção CRM > Campanhas e clique em "Nova Campanha". Selecione os canais desejados e defina seu público.',
            },
            {
                title: 'Configurando o Agente de IA',
                category: 'IA',
                content: 'Você pode configurar o Agente de IA individualmente para cada canal na aba de Canais Conectados.',
            },
            {
                title: 'Subindo uma lista de leads via JSON',
                category: 'WhatsApp',
                content: 'Ao criar uma campanha de WhatsApp, você pode optar por subir um arquivo JSON com os campos `name` e `externalId` (número com DDI).',
            }
        ];
        for (const article of articles) {
            const exists = await this.articleRepository.findOne({ where: { title: article.title } });
            if (!exists) {
                await this.create(article);
            }
        }
    }
}
