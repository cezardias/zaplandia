import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
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
            // Use ILike for PostgreSQL case-insensitive search
            return this.articleRepository.find({
                where: [
                    { title: ILike(`%${query}%`), ...where },
                    { content: ILike(`%${query}%`), ...where },
                    { category: ILike(`%${query}%`), ...where },
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
                title: 'WhatsApp Oficial: Configuração e Chaves API',
                category: 'WhatsApp',
                content: `Para configurar o WhatsApp Cloud API oficial:
- Acesse o portal Meta for Developers e crie um App 'Business'.
- Obtenha o Phone Number ID e o WhatsApp Business Account ID.
- Gere um Token de Acesso Permanente.
- No Zaplandia, insira as chaves em Configurações > WhatsApp para liberar o disparo de campanhas.`,
            },
            {
                title: 'Facebook e Instagram: Como conectar e responder no Omni Inbox',
                category: 'Meta',
                content: `Para gerenciar Facebook e Instagram no Omni Inbox:
- Verifique se o Instagram é conta empresarial vinculada a uma página.
- Ative as permissões de mensagens na Meta.
- No Zaplandia, conecte o canal para centralizar as conversas.
- Agora você pode responder chats e comentários de ambas as redes em uma única tela.`,
            },
            {
                title: 'Mercado Livre: Gerenciando Vendas e Perguntas',
                category: 'Mercado Livre',
                content: `Integração completa com Mercado Livre:
- Use o seu Client ID e Client Secret para vincular sua conta.
- Receba notificações de novas vendas e perguntas em tempo real.
- Responda compradores diretamente pelo Zaplandia para agilizar seu atendimento.`,
            },
            {
                title: 'OLX: Chat e Integração de Anúncios',
                category: 'OLX',
                content: `Gerencie seus leads da OLX:
- Conecte sua conta OLX usando as credenciais de desenvolvedor.
- Receba mensagens de interessados nos seus anúncios diretamente no nosso painel.
- Use a IA para responder dúvidas frequentes sobre preços e disponibilidade.`,
            },
            {
                title: 'YouTube: API Key e Captação de Leads',
                category: 'YouTube',
                content: `Transforme comentários do YouTube em vendas:
- Configure sua API Key do Google Cloud Console.
- O Zaplandia monitora comentários em seus vídeos.
- Leads interessados são automaticamente adicionados ao seu CRM para follow-up.`,
            }
        ];

        for (const article of articles) {
            const existing = await this.articleRepository.findOne({ where: { title: article.title } });
            if (existing) {
                // Update content if it exists to ensure the user gets latest version
                Object.assign(existing, article);
                await this.articleRepository.save(existing);
            } else {
                await this.create(article);
            }
        }
    }
}
