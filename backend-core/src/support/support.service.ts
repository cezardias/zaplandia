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
                title: 'Configurando WhatsApp Cloud API (Oficial)',
                category: 'WhatsApp',
                content: `Para configurar o WhatsApp oficial, siga estes passos:
1. Acesse o portal **Meta for Developers**.
2. Crie um App do tipo **Business**.
3. No menu lateral, adicione o produto **WhatsApp**.
4. Obtenha o **WhatsApp Business Account ID** e o **Phone Number ID**.
5. Gere um **Token de Sistema Permanente** na aba de Usuários do Sistema no Gerenciador de Negócios.
6. No Zaplandia, vá em **Configurações API > Meta/WhatsApp** e preencha estes campos.`,
            },
            {
                title: 'Conectando Instagram e Facebook ao Omni Inbox',
                category: 'Meta',
                content: `Para receber mensagens do Instagram e Facebook no Zaplandia:
1. Garanta que seu Instagram seja **Conta Profissional** e esteja vinculado a uma **Página do Facebook**.
2. No portal Meta for Developers, adicione as permissões \`instagram_manage_messages\` e \`pages_messaging\`.
3. Configure o **Webhook** para apontar para a URL do Zaplandia.
4. No Dashboard do Zaplandia, acesse **Canais Conectados** e clique em "Conectar" para estas redes.
5. As conversas aparecerão automaticamente no seu **Omni Inbox**.`,
            },
            {
                title: 'Integração Mercado Livre: Como Configurar',
                category: 'Mercado Livre',
                content: `Para integrar suas vendas e perguntas do Mercado Livre:
1. Crie uma aplicação no **Mercado Libre Dev Center**.
2. Obtenha seu **App ID** e **Client Secret**.
3. Adicione as URLs de redirecionamento fornecidas pelo Zaplandia.
4. Em **Configurações API > Mercado Livre**, insira suas chaves e salve.
5. Agora você pode responder perguntas de compradores diretamente pelo Zaplandia.`,
            },
            {
                title: 'Integração OLX: Passo a Passo',
                category: 'OLX',
                content: `Para receber chats da OLX no Zaplandia:
1. Solicite acesso à API no portal de desenvolvedores da OLX Brasil.
2. Cadastro seu **Client ID** e **Client Secret** nas configurações do Zaplandia.
3. Vincule sua conta OLX na aba de **Canais Conectados**.
4. O Agente de IA poderá tratar propostas iniciais e dúvidas sobre seus anúncios automaticamente.`,
            },
            {
                title: 'YouTube: Configurando Comentários e Leads',
                category: 'YouTube',
                content: `Para monitorar comentários e gerar leads via YouTube:
1. Crie um projeto no **Google Cloud Console**.
2. Ative a **YouTube Data API v3**.
3. Gere uma **API Key** e configure as restrições de acesso.
4. No Zaplandia, insira sua chave nas configurações de vídeo.
5. O sistema irá capturar comentários relevantes e transformá-los em contatos no seu CRM.`,
            },
            {
                title: 'Como usar o Omni Inbox para Atendimento',
                category: 'Procedimentos',
                content: `O Omni Inbox é sua ferramenta central de resposta:
- No lado esquerdo, você vê a lista de chats com ícones indicando o canal (Zap, Inst, ML, etc).
- Ao clicar em uma conversa, o histórico completo é carregado.
- Você pode responder manualmente ou deixar o **Agente de IA** tratar a conversa.
- Use os botões de ação para classificar o contato ou exportar os dados.`,
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
