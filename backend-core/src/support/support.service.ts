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
        try {
            await this.seedInitialArticles();
        } catch (error) {
            this.logger.error('Failed to auto-seed support articles:', error.message);
        }
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
            },
            {
                title: 'WhatsApp Não Oficial: Conexão EvolutionAPI (QR Code)',
                category: 'WhatsApp',
                content: `Conecte qualquer número de WhatsApp sem a API oficial:

1. **Acesse Integrações**: Vá ao menu lateral "Integrações" e localize o card "WhatsApp Unofficial (EvolutionAPI)".
2. **Gerar Instância**: Clique em "Conectar". O sistema criará uma instância exclusiva para sua empresa no servidor global.
3. **Escaneie o QR Code**: Um QR Code aparecerá na tela. Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e escaneie o código.
4. **Status**: Assim que o celular ler o código, o Zaplandia atualizará o status para "CONECTADO". Agora você pode receber mensagens no Omni Inbox e disparar campanhas.`,
            },
            {
                title: 'Configurações de Admin: Servidor EvolutionAPI e n8n',
                category: 'Configurações',
                content: `Manual para Super Admins do Sistema:

1. **Acesso**: Vá em Dashboard > Configurações > API.
2. **EvolutionAPI**:
   - **URL**: Insira o endereço do seu servidor EvolutionAPI (ex: https://evo.seudominio.com).
   - **API Key**: Insira a chave global (Global Api Key) configurada no seu arquivo .env do Evolution.
3. **n8n Webhook**: 
   - Insira a URL do seu Webhook do n8n (Production URL).
   - Isso garante que todas as mensagens recebidas sejam enviadas para o seu fluxo de IA no n8n.
4. **Salvar Tudo**: Use o botão "SALVAR TUDO" no rodapé para garantir que as chaves sejam aplicadas globalmente.`,
            },
            {
                title: 'Campanhas do CRM: Seleção de Instância e Canais',
                category: 'CRM',
                content: `Como escolher qual WhatsApp usar em cada disparo:

1. **Nova Campanha**: No menu CRM > Campanhas, clique em "Nova Campanha".
2. **Canais**: Ao selecionar o canal "WhatsApp", um novo campo de seleção aparecerá.
3. **Seleção de Instância**: 
   - Se você tiver múltiplas conexões (ex: uma Oficial e uma EvolutionAPI), você deve selecionar qual delas deve realizar o disparo desta campanha específica.
   - Isso permite separar disparos de marketing de disparos de suporte, por exemplo.
4. **Finalização**: Siga os passos de Público e Mensagem para concluir a criação.`,
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
