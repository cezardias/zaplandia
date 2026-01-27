import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { SupportArticle } from './entities/support-article.entity';

@Injectable()
export class SupportService implements OnModuleInit {
    private readonly logger = new Logger(SupportService.name);

    constructor(
        @InjectRepository(SupportArticle)
        private articleRepository: Repository<SupportArticle>,
    ) { }

    async onModuleInit() {
        await this.seedInitialArticles();
    }

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
        this.logger.log('Seeding initial support articles...');
        const articles = [
            {
                title: 'WhatsApp Oficial: Configuração Completa e Disparos',
                category: 'WhatsApp',
                content: `Guia definitivo para WhatsApp Cloud API (Oficial):

1. **Meta for Developers**:
   - Crie um App do tipo "Business".
   - Adicione o produto "WhatsApp".
   - Vá em "Configuração" e pegue o **WhatsApp Business Account ID** e o **Phone Number ID**.

2. **Segurança e Tokens**:
   - No Gerenciador de Negócios (Business Manager), crie um "Usuário do Sistema".
   - Atribua as permissões \`whatsapp_business_messaging\` e \`whatsapp_business_management\`.
   - Gere um **Token Permanente**.

3. **Configuração no Zaplandia**:
   - Acesse **Configurações API > WhatsApp**.
   - Insira os IDs e o Token gerado.
   - Sua conta está pronta para disparar campanhas no CRM.`,
            },
            {
                title: 'FAQ: Como responder Facebook e Instagram no Omni Inbox',
                category: 'Meta',
                content: `Atendimento centralizado para redes sociais:

- **Configuração**: Garante que sua conta do Instagram seja do tipo Empresarial e esteja vinculada a uma Página do Facebook que você administra.
- **Permissões**: Ao conectar no Zaplandia, conceda permissão para acessar mensagens da página e directs do Instagram.
- **Uso no Omni Inbox**: 
  - Todas as conversas aparecem em uma fila única.
  - O ícone ao lado do nome do contato indica se a mensagem veio do Instagram ou Facebook.
  - Você pode enviar textos, emojis e imagens diretamente pelo painel.
- **Agente de IA**: A IA pode responder automaticamente comentários em posts e mensagens privadas, conforme configurado na aba de Canais.`,
            },
            {
                title: 'Integração Mercado Livre: Perguntas e Vendas',
                category: 'Mercado Livre',
                content: `Gerencie seu e-commerce sem sair do Zaplandia:

- **App ID e Client Secret**: Obtenha essas chaves no portal de desenvolvedores do Mercado Livre (Dev Center).
- **Callback URL**: Use a URL fornecida na tela de configuração do Zaplandia para o Redirect URI.
- **Vantagens**:
  - Responda perguntas de anúncios em segundos.
  - Receba notificações de vendas concluídas.
  - Centralize o suporte pós-venda no Omni Inbox.
- **IA**: Configure a IA para sugerir respostas baseadas nas características dos seus produtos.`,
            },
            {
                title: 'OLX: Chat e Propostas Automatizadas',
                category: 'OLX',
                content: `Integre seus anúncios da OLX:

- **Credenciais**: Insira seu Client ID e Client Secret de desenvolvedor OLX.
- **Atendimento**: Os chats dos seus anúncios aparecem no Omni Inbox do Zaplandia.
- **IA**: Deixe o Agente de IA tratar as primeiras perguntas sobre disponibilidade ("Ainda está disponível?") e propostas de valor, filtrando apenas os leads realmente interessados para o seu time humano.`,
            },
            {
                title: 'YouTube: Captação de Leads via Comentários',
                category: 'YouTube',
                content: `Venda mais através dos seus vídeos:

- **Google Cloud Console**: Ative a YouTube Data API v3 e gere sua API Key.
- **Monitoramento**: O Zaplandia escaneia os comentários dos seus vídeos em busca de palavras-chave de interesse ou dúvidas.
- **CRM**: Contatos que comentam em seus vídeos são capturados e adicionados automaticamente ao CRM para que você possa iniciar uma conversa via WhatsApp ou Direct.`,
            },
            {
                title: 'Manual Geral: IA e Automação de Conversas',
                category: 'IA',
                content: `Como a IA do Zaplandia funciona:

- **Personalidade**: Defina como a IA deve falar (formal, amigável, técnico).
- **Base de Conhecimento**: A IA lê seus manuais e informações da empresa para responder dúvidas dos clientes.
- **Transferência**: Se a IA não souber responder ou o cliente pedir falar com humano, a conversa é marcada como prioritária no Omni Inbox.`,
            }
        ];

        for (const article of articles) {
            const existing = await this.articleRepository.findOne({ where: { title: article.title } });
            if (existing) {
                Object.assign(existing, article);
                await this.articleRepository.save(existing);
            } else {
                await this.create(article);
            }
        }
        this.logger.log('Seeding completed.');
    }
}
