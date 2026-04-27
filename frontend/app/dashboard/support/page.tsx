'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
    Search,
    HelpCircle,
    Book,
    MessageCircle,
    Zap,
    Shield,
    Settings,
    ChevronRight,
    Loader2,
    X
} from 'lucide-react';

interface Article {
    id: string;
    title: string;
    content: string;
    category: string;
}

export default function SupportPage() {
    const { token } = useAuth();
    const { lang } = useLanguage();
    const [articles, setArticles] = useState<Article[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);


    const t: any = {
        pt_BR: {
            title: 'Como podemos ajudar?',
            subtitle: 'Pesquise em nossa base de conhecimento ou procure por categorias para dominar o Zaplandia.',
            searchPlaceholder: 'Pesquisar por ferramentas, canais, integrações...',
            searchButton: 'Buscar',
            loading: 'Buscando conhecimento...',
            noResults: 'Nenhum artigo encontrado para sua busca.',
            readProcedure: 'Ler Procedimento',
            footerNote: 'O conteúdo acima é gerado para auxiliar nos procedimentos do sistema Zaplandia.',
            errorFetching: 'Erro ao buscar artigos:'
        },
        en_US: {
            title: 'How can we help?',
            subtitle: 'Search our knowledge base or browse by categories to master Zaplandia.',
            searchPlaceholder: 'Search for tools, channels, integrations...',
            searchButton: 'Search',
            loading: 'Searching knowledge...',
            noResults: 'No articles found for your search.',
            readProcedure: 'Read Procedure',
            footerNote: 'The above content is generated to assist with Zaplandia system procedures.',
            errorFetching: 'Error fetching articles:',
            articles: {
                'WhatsApp Oficial: Configuração Completa e Disparos': {
                    title: 'Official WhatsApp: Complete Setup and Broadcasts',
                    content: `Ultimate guide to WhatsApp Cloud API (Official):

1. **Meta for Developers**:
   - Create a "Business" type App.
   - Add the "WhatsApp" product.
   - Go to "Setup" and get the **WhatsApp Business Account ID** and the **Phone Number ID**.

2. **Security and Tokens**:
   - In the Business Manager, create a "System User".
   - Assign the permissions \`whatsapp_business_messaging\` and \`whatsapp_business_management\`.
   - Generate a **Permanent Token**.

3. **Zaplandia Configuration**:
   - Go to **API Settings > WhatsApp**.
   - Enter the IDs and the generated Token.
   - Your account is ready to broadcast campaigns in the CRM.`
                },
                'FAQ: Como responder Facebook e Instagram no Omni Inbox': {
                    title: 'FAQ: How to answer Facebook and Instagram in Omni Inbox',
                    content: `Centralized service for social networks:

- **Setup**: Ensure your Instagram account is Business type and linked to a Facebook Page you manage.
- **Permissions**: When connecting to Zaplandia, grant permission to access page messages and Instagram directs.
- **Use in Omni Inbox**: 
  - All conversations appear in a single queue.
  - The icon next to the contact name indicates if the message came from Instagram or Facebook.
  - You can send text, emojis, and images directly through the panel.
- **AI Agent**: The AI can automatically reply to comments on posts and private messages, as configured in the Channels tab.`
                },
                'Integração Mercado Livre: Perguntas e Vendas': {
                    title: 'Mercado Libre Integration: Questions and Sales',
                    content: `Manage your e-commerce without leaving Zaplandia:

- **App ID and Client Secret**: Obtain these keys in the Mercado Libre developer portal (Dev Center).
- **Callback URL**: Use the URL provided in the Zaplandia configuration screen for the Redirect URI.
- **Advantages**:
  - Reply to listing questions in seconds.
  - Receive notifications of completed sales.
  - Centralize post-sales support in Omni Inbox.
- **AI**: Configure the AI to suggest answers based on your products' characteristics.`
                },
                'OLX: Chat e Propostas Automatizadas': {
                    title: 'OLX: Chat and Automated Proposals',
                    content: `Integrate your OLX listings:

- **Credentials**: Enter your OLX developer Client ID and Client Secret.
- **Service**: Chats from your listings appear in Zaplandia's Omni Inbox.
- **AI**: Let the AI Agent handle the first questions about availability ("Is it still available?") and value proposals, filtering only really interested leads for your human team.`
                },
                'YouTube: Captação de Leads via Comentários': {
                    title: 'YouTube: Lead Capture via Comments',
                    content: `Sell more through your videos:

- **Google Cloud Console**: Enable YouTube Data API v3 and generate your API Key.
- **Monitoring**: Zaplandia scans comments on your videos for keywords of interest or doubts.
- **CRM**: Contacts who comment on your videos are captured and automatically added to the CRM so you can start a conversation via WhatsApp or Direct.`
                },
                'Manual Geral: IA e Automação de Conversas': {
                    title: 'General Manual: AI and Conversation Automation',
                    content: `How Zaplandia AI works:

- **Personality**: Define how the AI should speak (formal, friendly, technical).
- **Knowledge Base**: The AI reads your manuals and company information to answer customer questions.
- **Transfer**: If the AI doesn't know how to answer or the customer asks to speak with a human, the conversation is marked as priority in Omni Inbox.`
                },
                'WhatsApp Não Oficial: Conexão EvolutionAPI (QR Code)': {
                    title: 'Unofficial WhatsApp: EvolutionAPI Connection (QR Code)',
                    content: `Connect any WhatsApp number without the official API:

1. **Access Integrations**: Go to the "Integrations" side menu and locate the "WhatsApp Unofficial (EvolutionAPI)" card.
2. **Generate Instance**: Click "Connect". The system will create an exclusive instance for your company on the global server.
3. **Scan the QR Code**: A QR Code will appear on the screen. Open WhatsApp on your phone, go to "Linked Devices" and scan the code.
4. **Status**: As soon as the phone reads the code, Zaplandia will update the status to "CONNECTED". Now you can receive messages in the Omni Inbox and broadcast campaigns.`
                },
                'Configurações de Admin: Servidor EvolutionAPI e n8n': {
                    title: 'Admin Settings: EvolutionAPI Server and n8n',
                    content: `Manual for System Super Admins:

1. **Access**: Go to Dashboard > Settings > API.
2. **EvolutionAPI**:
   - **URL**: Enter your EvolutionAPI server address (ex: https://evo.yourdomain.com).
   - **API Key**: Enter the global key (Global Api Key) configured in your Evolution .env file.
3. **n8n Webhook**: 
   - Enter your n8n Webhook URL (Production URL).
   - This ensures that all received messages are sent to your AI flow in n8n.
4. **Save All**: Use the "SAVE ALL" button at the bottom to ensure the keys are applied globally.`
                },
                'Campanhas do CRM: Seleção de Instância e Canais': {
                    title: 'CRM Campaigns: Instance and Channel Selection',
                    content: `How to choose which WhatsApp to use in each broadcast:

1. **New Campaign**: In the CRM > Campaigns menu, click "New Campaign".
2. **Channels**: When selecting the "WhatsApp" channel, a new selection field will appear.
3. **Instance Selection**: 
   - If you have multiple connections (ex: an Official and an EvolutionAPI), you must select which one should perform the broadcast for this specific campaign.
   - This allows separating marketing broadcasts from support broadcasts, for example.
4. **Finalization**: Follow the Audience and Message steps to complete the creation.`
                },
                'Integração Rifa API: Configuração e Uso': {
                    title: 'Raffle API Integration: Setup and Use',
                    content: `Connect your external raffle system to Zaplandia:

1. **Get your data**: In your raffle panel, get the **API URL** (ex: https://raffles.mydomain.com) and generate an **API Key**.
2. **Zaplandia Configuration**:
   - Go to **Settings > API**.
   - Locate the **Raffle API Integration** section.
   - Enter the **API URL** and your **Key** in the corresponding fields.
   - Click **SAVE**.
3. **Activation**:
   - Go to the **Integrations** side menu.
   - Locate the **Raffle API** card and click **Connect**.
   - The status will change to **CONNECTED**.
4. **Use**: Now the system can consult your raffles and numbers directly for automations.`
                },
                'IA: Automação para Venda de Rifas': {
                    title: 'AI: Automation for Raffle Sales',
                    content: `How the AI Agent helps you sell more raffles:

The Zaplandia AI Agent has native tools to interact with your Raffle API:

- **Automatic Inquiry**: If a customer asks "Which raffles are open?", the AI uses the \`get_raffles\` tool to list the real options.
- **Ticket Verification**: When the customer chooses a raffle, the AI can list available numbers using \`get_tickets\`.
- **Order Reservation**: The AI can collect the name and WhatsApp of the customer and reserve the chosen numbers via \`create_raffle_order\`.

**Tip**: You don't need to configure anything in the prompt. Just have the **Raffle API Key** configured and the AI Agent active on the desired channel.`
                },
                'Pausar Automação Individual (Omni Inbox)': {
                    title: 'Pause Individual Automation (Omni Inbox)',
                    content: `Full control over human service in Omni Inbox:

1. **Location**: Inside any conversation, in the top right header.
2. **Automation Button**:
   - **Green (Active)**: AI and n8n flows are operating normally for this contact.
   - **Red (Paused)**: All automatic replies are blocked for this contact.
3. **When to use**: Whenever you (human) take over a conversation and don't want the AI or n8n to "run over" your answers or send automatic messages while you negotiate.
4. **Independence**: Pausing one contact doesn't affect others; the rest of the system remains automated.`
                },
                'Criar Modelos de Mensagem (WhatsApp Oficial)': {
                    title: 'Create Message Templates (Official WhatsApp)',
                    content: `How to manage templates for the Official API (Meta):

1. **Access**: Go to **Integrations > Meta API** and select the **Templates (BBM)** tab.
2. **New Creation**: Click the **NEW TEMPLATE** button.
3. **Configuration**:
   - **Name**: Use only lowercase letters and underscores (ex: \`order_confirmation\`).
   - **Category**: Marketing (offers), Utility (notices) or Authentication (tokens).
   - **Body**: Main text of the message to be sent.
4. **Approval**: After clicking "Create", Meta will analyze the template. The status will change from **PENDING** to **APPROVED** when it is ready for use in campaigns.`
                },
                'Meta API: Onde encontrar Token, WABA ID e Phone ID': {
                    title: 'Meta API: Where to find Token, WABA ID and Phone ID',
                    content: `Setting up WhatsApp Cloud (Meta) requires 3 main values. Here's how to get them:

### 1. Creating the App on Meta
- Access [developers.facebook.com](https://developers.facebook.com).
- Click "My Apps" > "Create app".
- Select the **"Other"** type and then **"Business"**.
- In the side panel, add the **"WhatsApp"** product.

### 2. Getting the Phone Number ID and WABA ID
- In the WhatsApp menu (inside your app on Meta), click **"API Setup"**.
- There you will see:
  - **Phone Number ID**: Usually starts with 10... or 11...
  - **WhatsApp Business Account ID (WABA ID)**: Right below.
- Copy and paste these values into Zaplandia.

### 3. Generating the Permanent Access Token (Essential!)
Zaplandia needs a token that doesn't expire:
- Go to your **Business Settings** on Facebook.
- In "Users" > **"System Users"**, click "Add".
- Create a user with "Admin" role.
- Click **"Generate New Token"**.
- Select your Zaplandia App and check permissions:
  - \`whatsapp_business_messaging\`
  - \`whatsapp_business_management\`
- Copy the generated token. **It only appears once!**
- Paste in the "Permanent Access Token" field in Zaplandia.

**Tip**: If you use the "Temporary Token" from the developer screen, the integration will stop working after 24 hours. Always use the System User Token.`
                },
                'CRM: Qualificação Automática de Leads': {
                    title: 'CRM: Automated Lead Qualification',
                    content: `How to set up automatic lead movement in the Pipeline:

1. **Column Setup**:
   - Go to the **Pipeline** menu.
   - Click the three dots next to the column name and select **Qualification**.
   - Define the criteria for a lead to enter or leave this column.

2. **Automation Keywords**:
   - The system identifies keywords to move the lead automatically:
   - **Sent/Contacted**: If you use words like "enviada", "contatado" or "sent", the lead will be moved to this column as soon as a message is sent to them (manual or campaign).
   - **Replied/Negotiation**: If you use words like "respondeu", "negociação", "reply" or "interested", the lead will be automatically moved to this column as soon as the customer replies to your message.

3. **Advantages**:
   - Eliminates the manual work of dragging leads.
   - Keeps your sales funnel always updated in real-time.
   - Allows you to quickly identify which customers are already in the negotiation phase.`
                }
            }
        },
        pt_PT: {
            title: 'Como podemos ajudar?',
            subtitle: 'Pesquise na nossa base de conhecimento ou procure por categorias para dominar o Zaplandia.',
            searchPlaceholder: 'Pesquisar por ferramentas, canais, integrações...',
            searchButton: 'Procurar',
            loading: 'A procurar conhecimento...',
            noResults: 'Nenhum artigo encontrado para a sua procura.',
            readProcedure: 'Ler Procedimento',
            footerNote: 'O conteúdo acima é gerado para auxiliar nos procedimentos do sistema Zaplandia.',
            errorFetching: 'Erro ao procurar artigos:',
            articles: {
                'WhatsApp Oficial: Configuração Completa e Disparos': {
                    title: 'WhatsApp Oficial: Configuração Completa e Disparos',
                    content: `Guia definitivo para WhatsApp Cloud API (Oficial):

1. **Meta for Developers**:
   - Crie uma App do tipo "Business".
   - Adicione o produto "WhatsApp".
   - Vá a "Configuração" e obtenha o **WhatsApp Business Account ID** e o **Phone Number ID**.

2. **Segurança e Tokens**:
   - No Business Manager, crie um "System User".
   - Atribua as permissões \`whatsapp_business_messaging\` e \`whatsapp_business_management\`.
   - Gere um **Token Permanente**.

3. **Configuração no Zaplandia**:
   - Vá a **Configurações de API > WhatsApp**.
   - Insira os IDs e o Token gerado.
   - A sua conta está pronta para disparar campanhas no CRM.`
                },
                'FAQ: Como responder Facebook e Instagram no Omni Inbox': {
                    title: 'FAQ: Como responder Facebook e Instagram no Omni Inbox',
                    content: `Atendimento centralizado para redes sociais:

- **Configuração**: Certifique-se de que a sua conta do Instagram é do tipo Business e está ligada a uma Página do Facebook que gere.
- **Permissões**: Ao ligar ao Zaplandia, conceda permissão para aceder às mensagens da página e directs do Instagram.
- **Uso no Omni Inbox**: 
  - Todas as conversas aparecem numa fila única.
  - O ícone ao lado do nome do contacto indica se a mensagem veio do Instagram ou Facebook.
  - Pode enviar texto, emojis e imagens diretamente pelo painel.
- **Agente IA**: A IA pode responder automaticamente a comentários em posts e mensagens privadas, conforme configurado no separador Canais.`
                },
                'Integração Mercado Livre: Perguntas e Vendas': {
                    title: 'Integração Mercado Livre: Perguntas e Vendas',
                    content: `Gira o seu e-commerce sem sair do Zaplandia:

- **App ID e Client Secret**: Obtenha estas chaves no portal de developers do Mercado Livre (Dev Center).
- **Callback URL**: Utilize o URL fornecido no ecrã de configuração do Zaplandia para o Redirect URI.
- **Vantagens**:
  - Responda a perguntas de anúncios em segundos.
  - Receba notificações de vendas efetuadas.
  - Centralize o suporte pós-venda no Omni Inbox.
- **IA**: Configure a IA para sugerir respostas baseadas nas características dos seus produtos.`
                },
                'OLX: Chat e Propostas Automatizadas': {
                    title: 'OLX: Chat e Propostas Automatizadas',
                    content: `Integre os seus anúncios do OLX:

- **Credenciais**: Insira o seu Client ID e Client Secret de developer do OLX.
- **Atendimento**: Os chats dos seus anúncios aparecem no Omni Inbox do Zaplandia.
- **IA**: Deixe o Agente IA lidar com as primeiras dúvidas sobre disponibilidade ("Ainda está disponível?") e propostas de valor, filtrando apenas leads realmente interessados para a sua equipa humana.`
                },
                'YouTube: Captação de Leads via Comentários': {
                    title: 'YouTube: Captação de Leads via Comentários',
                    content: `Venda mais através dos seus vídeos:

- **Google Cloud Console**: Ative a YouTube Data API v3 e gere a sua API Key.
- **Monitorização**: O Zaplandia faz o scan de comentários nos seus vídeos à procura de palavras-chave de interesse ou dúvidas.
- **CRM**: Os contactos que comentam os seus vídeos são capturados e adicionados automaticamente ao CRM para que possa iniciar uma conversa via WhatsApp ou Direct.`
                },
                'Manual Geral: IA e Automação de Conversas': {
                    title: 'Manual Geral: IA e Automação de Conversas',
                    content: `Como funciona a IA do Zaplandia:

- **Personalidade**: Defina como a IA deve falar (formal, amigável, técnica).
- **Base de Conhecimento**: A IA lê os seus manuais e informações da empresa para responder a dúvidas de clientes.
- **Transbordo**: Se a IA não souber responder ou o cliente pedir para falar com um humano, a conversa é marcada como prioridade no Omni Inbox.`
                },
                'WhatsApp Não Oficial: Conexão EvolutionAPI (QR Code)': {
                    title: 'WhatsApp Não Oficial: Conexão EvolutionAPI (QR Code)',
                    content: `Ligue qualquer número de WhatsApp sem a API oficial:

1. **Aceda a Integrações**: Vá ao menu lateral "Integrações" e localize o card "WhatsApp Não Oficial (EvolutionAPI)".
2. **Gerar Instância**: Clique em "Ligar". O sistema criará uma instância exclusiva para a sua empresa no servidor global.
3. **Escaneie o QR Code**: Um QR Code aparecerá no ecrã. Abra o WhatsApp no seu telemóvel, vá a "Aparelhos Ligados" e leia o código.
4. **Status**: Assim que o telemóvel ler o código, o Zaplandia atualizará o status para "LIGADO". Agora já pode receber mensagens no Omni Inbox e disparar campanhas.`
                },
                'Configurações de Admin: Servidor EvolutionAPI e n8n': {
                    title: 'Configurações de Admin: Servidor EvolutionAPI e n8n',
                    content: `Manual para Super Admins do sistema:

1. **Acesso**: Vá a Dashboard > Configurações > API.
2. **EvolutionAPI**:
   - **URL**: Insira o endereço do seu servidor EvolutionAPI (ex: https://evo.oseudominio.com).
   - **API Key**: Insira a chave global (Global Api Key) configurada no seu ficheiro .env da Evolution.
3. **Webhook n8n**: 
   - Insira o seu URL de Webhook do n8n (Production URL).
   - Isto garante que todas as mensagens recebidas sejam enviadas para o seu fluxo de IA no n8n.
4. **Guardar Tudo**: Utilize o botão "GUARDAR TUDO" no fundo para garantir que as chaves são aplicadas globalmente.`
                },
                'Campanhas do CRM: Seleção de Instância e Canais': {
                    title: 'Campanhas do CRM: Seleção de Instância e Canais',
                    content: `Como escolher qual WhatsApp utilizar em cada disparo:

1. **Nova Campanha**: No menu CRM > Campanhas, clique em "Nova Campanha".
2. **Canais**: Ao selecionar o canal "WhatsApp", aparecerá um novo campo de seleção.
3. **Seleção de Instância**: 
   - Se tiver várias ligações (ex: uma Oficial e uma EvolutionAPI), deve selecionar qual deve realizar o disparo para esta campanha específica.
   - Isto permite separar disparos de marketing de disparos de suporte, por exemplo.
4. **Finalização**: Siga os passos de Público e Mensagem para concluir a criação.`
                },
                'Integração Rifa API: Configuração e Uso': {
                    title: 'Integração Rifa API: Configuração e Uso',
                    content: `Ligue o seu sistema de rifas externo ao Zaplandia:

1. **Obtenha os seus dados**: No seu painel de rifas, obtenha o **URL da API** (ex: https://rifas.meudominio.com) e gere uma **API Key**.
2. **Configuração no Zaplandia**:
   - Vá a **Configurações > API**.
   - Localize a secção **Integração Rifa API**.
   - Insira o **URL da API** e a sua **Chave** nos campos correspondentes.
   - Clique em **GUARDAR**.
3. **Ativação**:
   - Vá ao menu lateral **Integrações**.
   - Localize o card **Rifa API** e clique em **Ligar**.
   - O status mudará para **LIGADO**.
4. **Uso**: Agora o sistema pode consultar as suas rifas e números diretamente para automações.`
                },
                'IA: Automação para Venda de Rifas': {
                    title: 'IA: Automação para Venda de Rifas',
                    content: `Como o Agente IA o ajuda a vender mais rifas:

O Agente IA do Zaplandia possui ferramentas nativas para interagir com a sua Rifa API:

- **Consulta Automática**: Se um cliente perguntar "Quais rifas estão abertas?", a IA utiliza a ferramenta \`get_raffles\` para listar as opções reais.
- **Verificação de Números**: Quando o cliente escolhe uma rifa, a IA pode listar os números disponíveis usando \`get_tickets\`.
- **Reserva de Pedido**: A IA pode recolher o nome e WhatsApp do cliente e reservar os números escolhidos via \`create_raffle_order\`.

**Dica**: Não precisa de configurar nada no prompt. Basta ter a **Rifa API Key** configurada e o Agente IA ativo no canal desejado.`
                },
                'Pausar Automação Individual (Omni Inbox)': {
                    title: 'Pausar Automação Individual (Omni Inbox)',
                    content: `Controlo total sobre o atendimento humano no Omni Inbox:

1. **Localização**: Dentro de qualquer conversa, no cabeçalho superior direito.
2. **Botão de Automação**:
   - **Verde (Ativo)**: A IA e fluxos n8n estão a operar normalmente para este contacto.
   - **Vermelho (Pausado)**: Todas as respostas automáticas estão bloqueadas para este contacto.
3. **Quando usar**: Sempre que você (humano) assumir uma conversa e não quiser que a IA ou o n8n "atropelam" as suas respostas ou enviem mensagens automáticas enquanto negoceia.
4. **Independência**: Pausar um contacto não afeta os outros; o resto do sistema continua automatizado.`
                },
                'Criar Modelos de Mensagem (WhatsApp Oficial)': {
                    title: 'Criar Modelos de Mensagem (WhatsApp Oficial)',
                    content: `Como gerir templates para a API Oficial (Meta):

1. **Acesso**: Vá a **Integrações > Meta API** e selecione o separador **Modelos (BBM)**.
2. **Nova Criação**: Clique no botão **NOVO MODELO**.
3. **Configuração**:
   - **Nome**: Use apenas letras minúsculas e underscores (ex: \`confirmacao_pedido\`).
   - **Categoria**: Marketing (ofertas), Utilidade (avisos) ou Autenticação (tokens).
   - **Corpo**: Texto principal da mensagem a ser enviada.
4. **Aprovação**: Após clicar em "Criar", a Meta analisará o template. O status mudará de **PENDENTE** para **APROVADO** quando estiver pronto para uso em campanhas.`
                },
                'Meta API: Onde encontrar Token, WABA ID e Phone ID': {
                    title: 'Meta API: Onde encontrar Token, WABA ID e Phone ID',
                    content: `Configurar o WhatsApp Cloud (Meta) exige 3 valores principais. Veja como os obter:

### 1. Criar a App na Meta
- Aceda a [developers.facebook.com](https://developers.facebook.com).
- Clique em "As Minhas Apps" > "Criar app".
- Selecione o tipo **"Outro"** e depois **"Business"**.
- No painel lateral, adicione o produto **"WhatsApp"**.

### 2. Obter o Phone Number ID e WABA ID
- No menu WhatsApp (dentro da sua app na Meta), clique em **"Configuração da API"**.
- Lá verá:
  - **Phone Number ID**: Geralmente começa com 10... ou 11...
  - **WhatsApp Business Account ID (WABA ID)**: Logo abaixo.
- Copie e cole estes valores no Zaplandia.

### 3. Gerar o Token de Acesso Permanente (Essencial!)
O Zaplandia precisa de um token que não expire:
- Vá às **Definições do Negócio** no Facebook.
- Em "Utilizadores" > **"System Users"**, clique em "Adicionar".
- Crie um utilizador com função "Admin".
- Clique em **"Gerar Novo Token"**.
- Selecione a sua App Zaplandia e marque as permissões:
  - \`whatsapp_business_messaging\`
  - \`whatsapp_business_management\`
- Copie o token gerado. **Só aparece uma vez!**
- Cole no campo "Token de Acesso Permanente" no Zaplandia.

**Dica**: Se usar o "Token Temporário" do ecrã de developer, a integração deixará de funcionar após 24 horas. Use sempre o Token de System User.`
                },
                'CRM: Qualificação Automática de Leads': {
                    title: 'CRM: Qualificação Automática de Leads',
                    content: `Como configurar a movimentação automática de leads no Funil (Pipeline):

1. **Configuração da Coluna**:
   - Vá ao menu **Funil (Pipeline)**.
   - Clique nos três pontinhos ao lado do nome da coluna e selecione **Qualificação**.
   - Defina o critério para que um lead entre ou saia dessa coluna.

2. **Palavras-Chave de Automação**:
   - O sistema identifica palavras-chave para mover o lead automaticamente:
   - **Enviada/Contatado**: Se utilizar palavras como "enviada", "contatado" ou "sent", o lead será movido para esta coluna assim que uma mensagem for enviada para ele (manual ou campanha).
   - **Respondeu/Negociação**: Se utilizar palavras como "respondeu", "negociação", "reply" ou "interessado", o lead será movido automaticamente para esta coluna assim que o cliente responder à sua mensagem.

3. **Vantagens**:
   - Elimina o trabalho manual de arrastar leads.
   - Mantém o seu funil de vendas sempre atualizado em tempo real.
   - Permite identificar rapidamente quais clientes já estão em fase de negociação.`
                }
            }
        },
        it_IT: {
            title: 'Come possiamo aiutarti?',
            subtitle: 'Cerca nella nostra base di conoscenza o sfoglia per categorie per padroneggiare Zaplandia.',
            searchPlaceholder: 'Cerca strumenti, canali, integrazioni...',
            searchButton: 'Cerca',
            loading: 'Ricerca conoscenza...',
            noResults: 'Nessun articolo trovato per la tua ricerca.',
            readProcedure: 'Leggi Procedura',
            footerNote: 'Il contenuto sopra è generato per assistere nelle procedure del sistema Zaplandia.',
            errorFetching: 'Errore durante la ricerca degli articoli:',
            articles: {
                'WhatsApp Oficial: Configuração Completa e Disparos': {
                    title: 'WhatsApp Ufficiale: Configurazione Completa e Invii',
                    content: `Guida definitiva alla WhatsApp Cloud API (Ufficiale):

1. **Meta for Developers**:
   - Crea un'App di tipo "Business".
   - Aggiungi il prodotto "WhatsApp".
   - Vai su "Configurazione" e ottieni il **WhatsApp Business Account ID** e il **Phone Number ID**.

2. **Sicurezza e Token**:
   - Nel Business Manager, crea un "System User".
   - Assegna i permessi \`whatsapp_business_messaging\` e \`whatsapp_business_management\`.
   - Genera un **Token Permanente**.

3. **Configurazione in Zaplandia**:
   - Vai su **Impostazioni API > WhatsApp**.
   - Inserisci gli ID e il Token generato.
   - Il tuo account è pronto per inviare campagne nel CRM.`
                },
                'FAQ: Como responder Facebook e Instagram no Omni Inbox': {
                    title: 'FAQ: Come rispondere a Facebook e Instagram in Omni Inbox',
                    content: `Servizio centralizzato per i social network:

- **Configurazione**: Assicurati che il tuo account Instagram sia di tipo Business e collegato a una Pagina Facebook che gestisci.
- **Permessi**: Quando ti colleghi a Zaplandia, concedi il permesso di accedere ai messaggi della pagina e ai direct di Instagram.
- **Uso in Omni Inbox**: 
  - Tutte le conversazioni appaiono in un'unica coda.
  - L'icona accanto al nome del contatto indica se il messaggio proviene da Instagram o Facebook.
  - Puoi inviare testo, emoji e immagini direttamente dal pannello.
- **Agente IA**: L'IA può rispondere automaticamente ai commenti sui post e ai messaggi privati, come configurato nella scheda Canali.`
                },
                'Integração Mercado Livre: Perguntas e Vendas': {
                    title: 'Integrazione Mercado Libre: Domande e Vendite',
                    content: `Gestisci il tuo e-commerce senza uscire da Zaplandia:

- **App ID e Client Secret**: Ottieni queste chiavi nel portale sviluppatori di Mercado Libre (Dev Center).
- **Callback URL**: Usa l'URL fornito nella schermata di configurazione di Zaplandia per la Redirect URI.
- **Vantaggi**:
  - Rispondi alle domande sugli annunci in pochi secondi.
  - Ricevi notifiche sulle vendite completate.
  - Centralizza il supporto post-vendita in Omni Inbox.
- **IA**: Configura l'IA per suggerire risposte in base alle caratteristiche dei tuoi prodotti.`
                },
                'OLX: Chat e Propostas Automatizadas': {
                    title: 'OLX: Chat e Proposte Automatizzate',
                    content: `Integra i tuoi annunci OLX:

- **Credenziali**: Inserisci il tuo Client ID e Client Secret sviluppatore OLX.
- **Servizio**: Le chat dei tuoi annunci appaiono in Omni Inbox di Zaplandia.
- **IA**: Lascia che l'Agente IA gestisca le prime domande sulla disponibilità ("È ancora disponibile?") e le proposte di valore, filtrando solo i lead veramente interessati per il tuo team umano.`
                },
                'YouTube: Captação de Leads via Comentários': {
                    title: 'YouTube: Acquisizione Lead tramite Commenti',
                    content: `Vendi di più attraverso i tuoi video:

- **Google Cloud Console**: Abilita la YouTube Data API v3 e genera la tua API Key.
- **Monitoraggio**: Zaplandia scansiona i commenti sui tuoi video alla ricerca di parole chiave di interesse o dubbi.
- **CRM**: I contatti che commentano i tuoi video vengono acquisiti e aggiunti automaticamente al CRM in modo da poter iniziare una conversazione via WhatsApp o Direct.`
                },
                'Manual Geral: IA e Automação de Conversas': {
                    title: 'Manuale Generale: IA e Automazione delle Conversazioni',
                    content: `Come funziona l'IA di Zaplandia:

- **Personalità**: Definisci come l'IA deve parlare (formale, amichevole, tecnica).
- **Base di Conoscenza**: L'IA legge i tuoi manuali e le informazioni aziendali per rispondere alle domande dei clienti.
- **Trasferimento**: Se l'IA non sa come rispondere o il cliente chiede di parlare con un umano, la conversazione viene contrassegnata come prioritaria in Omni Inbox.`
                },
                'WhatsApp Não Oficial: Conexão EvolutionAPI (QR Code)': {
                    title: 'WhatsApp Non Ufficiale: Connessione EvolutionAPI (QR Code)',
                    content: `Collega qualsiasi numero WhatsApp senza l'API ufficiale:

1. **Accedi a Integrazioni**: Vai al menu laterale "Integrazioni" e individua la scheda "WhatsApp Non Ufficiale (EvolutionAPI)".
2. **Genera Istanza**: Clicca su "Connetti". Il sistema creerà un'istanza esclusiva per la tua azienda sul server globale.
3. **Scansiona il QR Code**: Sullo schermo apparirà un QR Code. Apri WhatsApp sul tuo telefono, vai su "Dispositivi collegati" e inquadra il codice.
4. **Stato**: Non appena il telefono legge il codice, Zaplandia aggiornerà lo stato in "CONNESSO". Ora puoi ricevere messaggi in Omni Inbox e inviare campagne.`
                },
                'Configurações de Admin: Servidor EvolutionAPI e n8n': {
                    title: 'Impostazioni Admin: Server EvolutionAPI e n8n',
                    content: `Manuale per i Super Admin di sistema:

1. **Accesso**: Vai su Dashboard > Impostazioni > API.
2. **EvolutionAPI**:
   - **URL**: Inserisci l'indirizzo del tuo server EvolutionAPI (es: https://evo.tuodominio.com).
   - **API Key**: Inserisci la chiave globale (Global Api Key) configurata nel file .env di Evolution.
3. **Webhook n8n**: 
   - Inserisci l'URL del tuo Webhook n8n (Production URL).
   - Questo garantisce che tutti i messaggi ricevuti vengano inviati al tuo flusso IA in n8n.
4. **Salva Tutto**: Usa il pulsante "SALVA TUTTO" in basso per assicurarti che le chiavi vengano applicate globalmente.`
                },
                'Campanhas do CRM: Seleção de Instância e Canais': {
                    title: 'Campagne CRM: Selezione Istanza e Canali',
                    content: `Come scegliere quale WhatsApp usare in ogni invio:

1. **Nuova Campagna**: Nel menu CRM > Campagne, clicca su "Nuova Campagna".
2. **Canali**: Quando selezioni il canale "WhatsApp", apparirà un nuovo campo di selezione.
3. **Selezione Istanza**: 
   - Se hai più collegamenti (es: uno Ufficiale e uno EvolutionAPI), devi selezionare quale deve eseguire l'invio per questa specifica campagna.
   - Questo permette di separare gli invii di marketing dagli invii di supporto, ad esempio.
4. **Finalizzazione**: Segui i passaggi Pubblico e Messaggio per completare la creazione.`
                },
                'Integração Rifa API: Configuração e Uso': {
                    title: 'Integrazione Rifa API: Configurazione e Uso',
                    content: `Collega il tuo sistema di lotterie esterno a Zaplandia:

1. **Ottieni i tuoi dati**: Nel tuo pannello lotterie, ottieni l'**URL API** (es: https://rifas.miodominio.com) e genera una **API Key**.
2. **Configurazione in Zaplandia**:
   - Vai su **Impostazioni > API**.
   - Individua la sezione **Integrazione Rifa API**.
   - Inserisci l'**URL API** e la tua **Chiave** nei campi corrispondenti.
   - Clicca su **SALVA**.
3. **Attivazione**:
   - Vai al menu laterale **Integrazioni**.
   - Individua la scheda **Rifa API** e clicca su **Connetti**.
   - Lo stato cambierà in **CONNESSO**.
4. **Uso**: Ora il sistema può consultare le tue lotterie e i numeri direttamente per le automazioni.`
                },
                'IA: Automação para Venda de Rifas': {
                    title: 'IA: Automazione per la Vendita di Lotterie',
                    content: `Come l'Agente IA ti aiuta a vendere più lotterie:

L'Agente IA di Zaplandia ha strumenti nativi per interagire con la tua Rifa API:

- **Consultazione Automatica**: Se un cliente chiede "Quali lotterie sono aperte?", l'IA usa lo strumento \`get_raffles\` per elencare le opzioni reali.
- **Verifica Biglietti**: Quando il cliente sceglie una lotteria, l'IA può elencare i numeri disponibili usando \`get_tickets\`.
- **Prenotazione Ordine**: l'IA può raccogliere il nome e il WhatsApp del cliente e prenotare i numeri scelti tramite \`create_raffle_order\`.

**Suggerimento**: Non è necessario configurare nulla nel prompt. Basta avere la **Rifa API Key** configurata e l'Agente IA attivo sul canale desiderato.`
                },
                'Pausar Automação Individual (Omni Inbox)': {
                    title: 'Sospendi Automazione Individuale (Omni Inbox)',
                    content: `Controllo totale sul servizio umano in Omni Inbox:

1. **Posizione**: All'interno di qualsiasi conversazione, nell'intestazione in alto a destra.
2. **Pulsante Automazione**:
   - **Verde (Attivo)**: L'IA e i flussi n8n operano normalmente per questo contatto.
   - **Rosso (Sospeso)**: Tutte le risposte automatiche sono bloccate per questo contatto.
3. **Quando usare**: Ogni volta che tu (umano) prendi in carico una conversazione e non vuoi che l'IA o n8n "travolgano" le tue risposte o inviino messaggi automatici mentre negozi.
4. **Indipendenza**: Sospendere un contatto non influisce sugli altri; il resto del sistema rimane automatizzato.`
                },
                'Criar Modelos de Mensagem (WhatsApp Oficial)': {
                    title: 'Crea Modelli di Messaggio (WhatsApp Ufficiale)',
                    content: `Come gestire i template per l'API Ufficiale (Meta):

1. **Accesso**: Vai su **Integrazioni > Meta API** e seleziona la scheda **Modelli (BBM)**.
2. **Nuova Creazione**: Clicca sul pulsante **NUOVO MODELLO**.
3. **Configurazione**:
   - **Nome**: Usa solo lettere minuscole e underscore (es: \`conferma_ordine\`).
   - **Categoria**: Marketing (offerte), Utility (avvisi) o Autenticazione (token).
   - **Corpo**: Testo principale del messaggio da inviare.
4. **Approvazione**: Dopo aver cliccato su "Crea", Meta analizzerà il template. Lo stato cambierà da **PENDENTE** a **APPROVATO** quando sarà pronto per l'uso nelle campagne.`
                },
                'Meta API: Onde encontrar Token, WABA ID e Phone ID': {
                    title: 'Meta API: Dove trovare Token, WABA ID e Phone ID',
                    content: `La configurazione di WhatsApp Cloud (Meta) richiede 3 valori principali. Ecco come ottenerli:

### 1. Creazione dell'App su Meta
- Accedi a [developers.facebook.com](https://developers.facebook.com).
- Clicca su "Le mie App" > "Crea app".
- Seleziona il tipo **"Altro"** e poi **"Business"**.
- Nel pannello laterale, aggiungi il prodotto **"WhatsApp"**.

### 2. Ottenere il Phone Number ID e il WABA ID
- Nel menu WhatsApp (all'interno della tua app su Meta), clicca su **"Configurazione API"**.
- Lì vedrai:
  - **Phone Number ID**: Di solito inizia con 10... o 11...
  - **WhatsApp Business Account ID (WABA ID)**: Subito sotto.
- Copia e incolla questi valori in Zaplandia.

### 3. Generazione del Token di Accesso Permanente (Essenziale!)
Zaplandia ha bisogno di un token che non scada:
- Vai alle **Impostazioni del Business** su Facebook.
- In "Utenti" > **"System Users"**, clicca su "Aggiungi".
- Crea un utente con ruolo "Admin".
- Clicca su **"Genera Nuovo Token"**.
- Seleziona la tua App Zaplandia e spunta i permessi:
  - \`whatsapp_business_messaging\`
  - \`whatsapp_business_management\`
- Copia il token generato. **Appare solo una volta!**
- Incolla nel campo "Token di Accesso Permanente" in Zaplandia.

**Suggerimento**: Se usi il "Token Temporario" dalla schermata sviluppatore, l'integrazione smetterà di funzionare dopo 24 ore. Usa sempre il Token System User.`
                },
                'CRM: Qualificação Automática de Leads': {
                    title: 'CRM: Qualificazione Automatica dei Lead',
                    content: `Come configurare lo spostamento automatico dei lead nella Pipeline:

1. **Configurazione della Colonna**:
   - Vai al menu **Funil (Pipeline)**.
   - Clicca sui tre puntini accanto al nome della colonna e seleziona **Qualificazione**.
   - Definisci i criteri per cui un lead entra o esce da questa colonna.

2. **Parole Chiave per l'Automazione**:
   - Il sistema identifica le parole chiave per spostare il lead automaticamente:
   - **Inviato/Contattato**: Se usi parole come "enviada", "contatado" o "sent", il lead verrà spostato in questa colonna non appena gli viene inviato un messaggio (manuale o campagna).
   - **Risposta/Negoziazione**: Se usi parole come "respondeu", "negociação", "reply" o "interessado", il lead verrà spostato automaticamente in questa colonna non appena il cliente risponde al tuo messaggio.

3. **Vantaggi**:
   - Elimina il lavoro manuale di trascinamento dei lead.
   - Mantiene il tuo funnel di vendita sempre aggiornato in tempo reale.
   - Permite di identificare rapidamente quali clienti sono già in fase di negoziazione.`
                }
            }
        }
    };

    const fetchArticles = async (query = '') => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/support/articles?q=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            }
        } catch (err) {
            console.error(t[lang].errorFetching, err);
        } finally {
            setIsLoading(false);
        }
    };

    // Language sync handled by useLanguage()


    useEffect(() => {
        if (token) fetchArticles();
    }, [token]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchArticles(search);
    };

    const getLocalizedArticle = (article: Article) => {
        if (lang === 'pt_BR') return article;
        const localized = t[lang]?.articles?.[article.title];
        if (localized) {
            return {
                ...article,
                title: localized.title,
                content: localized.content
            };
        }
        return article;
    };

    return (
        <div className="p-8 pb-20 max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-black mb-4 tracking-tight">{t[lang].title}</h1>
                <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">{t[lang].subtitle}</p>

                <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t[lang].searchPlaceholder}
                        className="w-full bg-surface border border-white/10 rounded-3xl pl-14 pr-6 py-5 text-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition shadow-2xl"
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary px-6 py-3 rounded-2xl font-bold text-sm"
                    >
                        {t[lang].searchButton}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? (
                    <div className="col-span-full py-20 flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-gray-500">{t[lang].loading}</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <HelpCircle className="w-16 h-16 text-gray-500 opacity-20 mx-auto mb-6" />
                        <p className="text-gray-400">{t[lang].noResults}</p>
                    </div>
                ) : (
                    articles.map(article => {
                        const localized = getLocalizedArticle(article);
                        return (
                            <button
                                key={article.id}
                                onClick={() => setSelectedArticle(localized)}
                                className="bg-surface border border-white/5 rounded-3xl p-8 hover:border-primary/40 transition-all text-left group shadow-xl hover:-translate-y-1 duration-300"
                            >
                                <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-6 group-hover:bg-primary/20 transition">
                                    <Book className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 leading-tight group-hover:text-primary transition">{localized.title}</h3>
                                <p className="text-sm text-gray-500 mb-6 truncate">{localized.category}</p>
                                <div className="flex items-center text-primary text-xs font-black uppercase tracking-widest bg-primary/5 w-fit px-4 py-2 rounded-xl group-hover:bg-primary/10 transition">
                                    <span>{t[lang].readProcedure}</span>
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Article Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-surface border border-white/10 w-full max-w-4xl h-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-8 border-b border-white/5 bg-background/50 flex justify-between items-center shrink-0">
                            <div>
                                <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">{selectedArticle.category}</p>
                                <h2 className="text-3xl font-black leading-tight">{selectedArticle.title}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="p-4 hover:bg-white/5 rounded-2xl transition"
                            >
                                <X className="w-8 h-8 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-8 md:p-12 overflow-y-auto flex-1 prose prose-invert max-w-none">
                            <div className="text-gray-400 leading-relaxed text-lg whitespace-pre-wrap">
                                {selectedArticle.content}
                            </div>
                        </div>
                        <div className="p-8 border-t border-white/5 bg-background/50 flex justify-center">
                            <p className="text-gray-500 text-sm italic">{t[lang].footerNote}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
