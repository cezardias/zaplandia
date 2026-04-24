'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
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
    const [articles, setArticles] = useState<Article[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [lang, setLang] = useState<'pt_BR' | 'en_US' | 'pt_PT' | 'it_IT'>('pt_BR');

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
            errorFetching: 'Erro ao procurar artigos:'
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
            errorFetching: 'Errore durante la ricerca degli articoli:'
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

    useEffect(() => {
        const saved = localStorage.getItem('zap_lang');
        if (saved) setLang(saved as any);

        const handleLangChange = () => {
            const current = localStorage.getItem('zap_lang');
            if (current) setLang(current as any);
        };
        window.addEventListener('languageChange', handleLangChange);
        return () => window.removeEventListener('languageChange', handleLangChange);
    }, []);

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
