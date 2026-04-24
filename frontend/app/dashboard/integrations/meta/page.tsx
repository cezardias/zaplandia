'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import {
    Loader2,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Facebook,
    Shield,
    ExternalLink,
    Search,
    MessageSquare,
    Phone,
    Copy,
    ChevronRight,
    ArrowLeft,
    Plus,
    X,
    Wifi,
    WifiOff,
    Zap,
    Lock
} from 'lucide-react';


export default function MetaApiPage() {
    const { token, user } = useAuth();
    const { lang } = useLanguage();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [creds, setCreds] = useState({
        META_ACCESS_TOKEN: '',
        META_WABA_ID: '',
        META_PHONE_NUMBER_ID: '',
        INSTAGRAM_ACCESS_TOKEN: '',
        INSTAGRAM_PAGE_ID: '',
        INSTAGRAM_APP_NAME: '',
        INSTAGRAM_APP_ID: '',
        INSTAGRAM_APP_SECRET: ''
    });

    const [profile, setProfile] = useState<any>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'phones'>('config');
    const [webhookStatus, setWebhookStatus] = useState<any>(null);
    const [subscribing, setSubscribing] = useState(false);

    // Template Creation State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateData, setTemplateData] = useState({
        name: '',
        category: 'MARKETING',
        language: 'pt_BR',
        bodyText: ''
    });

    const [showWizard, setShowWizard] = useState(false);

    // Language sync handled by useLanguage()


    const t: any = {
        pt_BR: {
            title: 'Integração Meta API',
            desc: 'Conecte sua conta do WhatsApp Business Oficial',
            config: 'Configurações',
            templates: 'Templates (BBM)',
            phones: 'Números de Telefone',
            save: 'Salvar Integração',
            test: 'Testar Conexão',
            fbLogin: 'Login com Facebook',
            fbDesc: 'Gere um Token permanentemente usando o Login com Facebook.',
            wizardBtn: 'Modo Review',
            wizardActive: 'Modo Review Ativo',
            wizardDesc: 'Use este modo para gravar o vídeo para a Meta. A interface está traduzida para facilitar a análise.',
            step1: 'Passo 1: Clique em Login do Facebook para conceder permissões.',
            step2: 'Passo 2: Salve as credenciais em sua conta.',
            step3: 'Passo 3: Teste a conexão para garantir que a API está ativa.',
            secTitle: 'Segurança e Credenciais',
            secDesc: 'Insira suas chaves de acesso para o Cloud API do WhatsApp.',
            instaTitle: 'Configurações Específicas para Instagram',
            instaDesc: 'ID da conta Business do Instagram (Opcional se igual ao Meta).',
            labelToken: 'Token de Acesso (Permanente)',
            labelWaba: 'WABA ID (Conta Business)',
            labelPhone: 'ID do Número de Telefone',
            labelInstaToken: 'Token de Acesso Instagram (Opcional)',
            labelInstaPage: 'ID da Página (Instagram)',
            labelAppName: 'Nome do App',
            labelAppId: 'ID do App',
            labelAppSecret: 'Chave Secreta (App Secret)',
            registerBtn: 'Ativar Número',
            helpTitle: 'Precisa de Ajuda?',
            helpDesc: 'Para integrar, você precisa criar um App na plataforma Meta for Developers e configurar o WhatsApp.',
            permToken: 'Token Permanente:',
            permStep1: 'Vá em Configurações do Negócio.',
            permStep2: 'Em Usuários do Sistema, adicione um novo usuário Admin.',
            permStep3: 'Clique em Gerar Novo Token e escolha o App Zaplandia.',
            permStep4: 'Marque whatsapp_business_messaging e whatsapp_business_management.',
            officialDocs: 'Documentação Oficial',
            webhookTitle: 'Recebimento de Mensagens (Webhook)',
            webhookChecking: 'Verificando status...',
            webhookActive: '✅ Ativo — mensagens chegando ao Zaplandia',
            webhookInactive: '❌ Inativo — o WhatsApp não está enviando mensagens recebidas para cá',
            webhookBtn: 'Ativar Recebimento',
            webhookSubscribed: 'Inscrito',
            phoneActive: 'Número Ativo',
            webhookUrlLabel: 'URL do Webhook (configurar no Meta for Developers)',
            copyUrl: 'Copiar URL',
            tempTitle: 'Templates de Mensagem (BBM)',
            tempDesc: 'Templates aprovados em sua conta Meta',
            searchPlaceholder: 'Buscar template...',
            newModelBtn: 'Novo Modelo',
            noTemplates: 'Nenhum template encontrado',
            noTemplatesDesc: 'Verifique a conexão ou crie templates no Meta Business Suite',
            viewDetails: 'Ver detalhes',
            registeredPhones: 'Números de Telefone Registrados',
            noPhones: 'Nenhum número encontrado',
            copyPhoneId: 'COPIAR PHONE ID',
            createModelTitle: 'Criar Novo Modelo (BBM)',
            createModelDesc: 'Este modelo será enviado para aprovação da Meta.',
            modelName: 'Nome do Modelo',
            modelNameHint: 'Apenas letras minúsculas, números e sublinhados.',
            category: 'Categoria',
            language: 'Idioma',
            bodyText: 'Texto do Corpo (Body)',
            cancel: 'Cancelar',
            createBtn: 'Criar Modelo',
            idCopied: 'ID copiado!',
            successSaved: 'Credenciais salvas com sucesso!',
            successConnected: 'Conexão estabelecida com sucesso!',
            successActivated: 'Número ativado com sucesso! Ele deve ficar On-line em instantes.',
            successTemplateCreated: 'Modelo enviado para aprovação com sucesso!',
            errorNameRequired: 'Nome e Texto são obrigatórios',
            instaTokenHint: 'Deve ser um Token de Página (EAAB...). Tokens IGAAR... NÃO funcionam para mensagens.',
            instaTokenPlaceholder: 'EAAB... (Recomendado deixar em branco para usar o do WhatsApp)',
            instaPageIdHint: 'O ID numérico da conta do Instagram Business (geralmente começa com 178).',
            instaSecretHint: 'Encontrada em Configurações > Painel no seu App da Meta.',
            connectedStatus: 'Status: Conectado',
            currency: 'Moeda',
            timezone: 'Zona',
            status: 'Status',
            marketing: 'Marketing',
            utility: 'Utilidade',
            authentication: 'Autenticação',
            portuguese: 'Português (BR)',
            english: 'Inglês (US)',
            spanish: 'Espanhol (ES)',
            placeholderAppName: 'Ex: Meu App Insta',
            placeholderAppId: 'Ex: 125148...',
            placeholderTemplate: 'ex: promocao_verao_2024',
            placeholderBody: 'Olá! Temos uma oferta especial para você...',
            verifyToken: 'Token de Verificação:',
            fbAccessing: 'Acessando ativos da Meta... Aguarde.',
            fbNoWaba: 'Nenhuma WABA encontrada no negócio.',
            fbGraphError: 'Falha na GraphAPI:',
            fbNoBiz: 'Nenhum negócio atrelado a este usuário foi encontrado.',
            fbIgNoPage: 'Nenhuma página ligada ao Instagram.',
            fbIgError: 'IG Erro:',
            fbNoFbPage: 'Nenhuma Página do Facebook encontrada na sua conta Google/Meta.',
            fbIgCrash: 'IG Crash:',
            fbSuccessAll: 'Token e IDs extraídos com sucesso (WhatsApp/Instagram)! Clique em Salvar.',
            fbSuccessWaba: 'Token e IDs do WhatsApp extraídos com sucesso!',
            fbNoIgAssoc: 'Sem Instagram associado.',
            fbTokenOnly: 'Token capturado!',
            fbManualFill: 'Preencha os IDs abaixo manualmente para continuar.',
            fbTokenCaptured: 'Token capturado com sucesso! (Autopreenchimento falhou). Preencha manualmente.',
            fbLoginCancel: 'Login cancelado ou não autorizado.',
            fbSdkIdError: 'Erro ao iniciar Facebook SDK:',
            errorSave: 'Falha ao salvar',
            errorConn: 'Erro na conexão:',
            errorActivation: 'Falha na ativação:',
            promptPin: 'Se você tem Verificação em Duas Etapas, digite o PIN de 6 dígitos. Se não tem, deixe em branco e clique em OK.',
            errorFetch: 'Falha ao carregar dados:',
            successSubscribed: 'App inscrito com sucesso! O WhatsApp agora enviará mensagens para o Zaplandia.',
            errorSubscribing: 'Falha ao inscrever:'
        },
        en_US: {
            title: 'Meta API Integration',
            desc: 'Connect your official WhatsApp Business account',
            config: 'Configuration',
            templates: 'Templates (BBM)',
            phones: 'Phone Numbers',
            save: 'Save Integration',
            test: 'Test Connection',
            fbLogin: 'Login with Facebook',
            fbDesc: 'Generate a permanent token using Facebook Login flow.',
            wizardBtn: 'Review Mode',
            wizardActive: 'Review Mode Active',
            wizardDesc: 'Recording mode active for Meta App Review. Interface in English.',
            step1: 'Step 1: Click Login with Facebook to grant permissions.',
            step2: 'Step 2: Save credentials to your account.',
            step3: 'Step 3: Test connection to ensure API is live.',
            secTitle: 'Security & Credentials',
            secDesc: 'Enter your access keys for WhatsApp Cloud API.',
            instaTitle: 'Instagram Specific Settings',
            instaDesc: 'Instagram Business account ID (Optional if same as Meta).',
            labelToken: 'Access Token (Permanent)',
            labelWaba: 'WABA ID (Business Account)',
            labelPhone: 'Phone Number ID',
            labelInstaToken: 'Instagram Token (Optional)',
            labelInstaPage: 'Page ID (Instagram)',
            labelAppName: 'App Name',
            labelAppId: 'App ID',
            labelAppSecret: 'App Secret',
            registerBtn: 'Activate Number',
            helpTitle: 'Need Help?',
            helpDesc: 'To integrate, you need to create an App on the Meta for Developers platform and configure WhatsApp.',
            permToken: 'Permanent Token:',
            permStep1: 'Go to Business Settings.',
            permStep2: 'Under System Users, add a new Admin user.',
            permStep3: 'Click Generate New Token and choose Zaplandia App.',
            permStep4: 'Check whatsapp_business_messaging and whatsapp_business_management.',
            officialDocs: 'Official Documentation',
            webhookTitle: 'Message Receiving (Webhook)',
            webhookChecking: 'Checking status...',
            webhookActive: '✅ Active — messages reaching Zaplandia',
            webhookInactive: '❌ Inactive — WhatsApp is not sending received messages here',
            webhookBtn: 'Activate Receiving',
            webhookSubscribed: 'Subscribed',
            phoneActive: 'Active Number',
            webhookUrlLabel: 'Webhook URL (configure in Meta for Developers)',
            copyUrl: 'Copy URL',
            tempTitle: 'Message Templates (BBM)',
            tempDesc: 'Approved templates in your Meta account',
            searchPlaceholder: 'Search template...',
            newModelBtn: 'New Model',
            noTemplates: 'No templates found',
            noTemplatesDesc: 'Check connection or create templates in Meta Business Suite',
            viewDetails: 'View details',
            registeredPhones: 'Registered Phone Numbers',
            noPhones: 'No numbers found',
            copyPhoneId: 'COPY PHONE ID',
            createModelTitle: 'Create New Template (BBM)',
            createModelDesc: 'This template will be sent for Meta approval.',
            modelName: 'Template Name',
            modelNameHint: 'Lowercase letters, numbers and underscores only.',
            category: 'Category',
            language: 'Language',
            bodyText: 'Body Text',
            cancel: 'Cancel',
            createBtn: 'Create Template',
            idCopied: 'ID copied!',
            successSaved: 'Credentials saved successfully!',
            successConnected: 'Connection established successfully!',
            successActivated: 'Number activated successfully! It should be online shortly.',
            successTemplateCreated: 'Template sent for approval successfully!',
            errorNameRequired: 'Name and Body are required',
            instaTokenHint: 'Must be a Page Token (EAAB...). IGAAR... tokens DO NOT work for messaging.',
            instaTokenPlaceholder: 'EAAB... (Recommended to leave blank to use WhatsApp token)',
            instaPageIdHint: 'The numeric ID of the Instagram Business account (usually starts with 178).',
            instaSecretHint: 'Found in Settings > Dashboard in your Meta App.',
            connectedStatus: 'Status: Connected',
            currency: 'Currency',
            timezone: 'Timezone',
            status: 'Status',
            marketing: 'Marketing',
            utility: 'Utility',
            authentication: 'Authentication',
            portuguese: 'Portuguese (BR)',
            english: 'English (US)',
            spanish: 'Spanish (ES)',
            placeholderAppName: 'Ex: My Insta App',
            placeholderAppId: 'Ex: 125148...',
            placeholderTemplate: 'ex: summer_promo_2024',
            placeholderBody: 'Hello! We have a special offer for you...',
            verifyToken: 'Verify Token:',
            fbAccessing: 'Accessing Meta assets... Please wait.',
            fbNoWaba: 'No WABA found in business.',
            fbGraphError: 'GraphAPI failure:',
            fbNoBiz: 'No business linked to this user was found.',
            fbIgNoPage: 'No page linked to Instagram.',
            fbIgError: 'IG Error:',
            fbNoFbPage: 'No Facebook Page found in your account.',
            fbIgCrash: 'IG Crash:',
            fbSuccessAll: 'Token and IDs successfully extracted (WhatsApp/Instagram)! Click Save.',
            fbSuccessWaba: 'WhatsApp Token and IDs successfully extracted!',
            fbNoIgAssoc: 'No Instagram associated.',
            fbTokenOnly: 'Token captured!',
            fbManualFill: 'Fill in the IDs below manually to continue.',
            fbTokenCaptured: 'Token successfully captured! (Auto-fill failed). Fill in manually.',
            fbLoginCancel: 'Login canceled or not authorized.',
            fbSdkIdError: 'Error starting Facebook SDK:',
            errorSave: 'Failed to save',
            errorConn: 'Connection error:',
            errorActivation: 'Activation failure:',
            promptPin: 'If you have Two-Step Verification, enter the 6-digit PIN. If not, leave blank and click OK.',
            errorFetch: 'Failed to load data:',
            successSubscribed: 'App successfully subscribed! WhatsApp will now send messages to Zaplandia.',
            errorSubscribing: 'Failed to subscribe:'
        },
        pt_PT: {
            title: 'Integração Meta API',
            desc: 'Ligue a sua conta do WhatsApp Business Oficial',
            config: 'Configurações',
            templates: 'Modelos (BBM)',
            phones: 'Números de Telefone',
            save: 'Guardar Integração',
            test: 'Testar Ligação',
            fbLogin: 'Login com Facebook',
            fbDesc: 'Gere um Token permanentemente usando o Login com Facebook.',
            wizardBtn: 'Modo de Revisão',
            wizardActive: 'Modo de Revisão Ativo',
            wizardDesc: 'Modo de gravação ativo para a Revisão da Meta. Interface em Português de Portugal.',
            step1: 'Passo 1: Clique em Login do Facebook para conceder permissões.',
            step2: 'Passo 2: Guarde as credenciais na sua conta.',
            step3: 'Passo 3: Teste a ligação para garantir que a API está ativa.',
            secTitle: 'Segurança e Credenciais',
            secDesc: 'Insira as suas chaves de acesso para a Cloud API do WhatsApp.',
            instaTitle: 'Configurações Específicas para Instagram',
            instaDesc: 'ID da conta Business do Instagram (Opcional se igual ao Meta).',
            labelToken: 'Token de Acesso (Permanente)',
            labelWaba: 'WABA ID (Conta Business)',
            labelPhone: 'ID do Número de Telefone',
            labelInstaToken: 'Token Instagram (Opcional)',
            labelInstaPage: 'ID da Página (Instagram)',
            labelAppName: 'Nome da App',
            labelAppId: 'ID da App',
            labelAppSecret: 'Chave Secreta (App Secret)',
            registerBtn: 'Ativar Número',
            helpTitle: 'Precisa de Ajuda?',
            helpDesc: 'Para integrar, precisa de criar uma App na plataforma Meta for Developers e configurar o WhatsApp.',
            permToken: 'Token Permanente:',
            permStep1: 'Vá a Configurações do Negócio.',
            permStep2: 'Em Utilizadores do Sistema, adicione um novo utilizador Admin.',
            permStep3: 'Clique em Gerar Novo Token e escolha a App Zaplandia.',
            permStep4: 'Marque whatsapp_business_messaging e whatsapp_business_management.',
            officialDocs: 'Documentação Oficial',
            webhookTitle: 'Recebimento de Mensagens (Webhook)',
            webhookChecking: 'A verificar status...',
            webhookActive: '✅ Ativo — mensagens a chegar ao Zaplandia',
            webhookInactive: '❌ Inativo — o WhatsApp não está a enviar mensagens recebidas para aqui',
            webhookBtn: 'Ativar Recebimento',
            webhookSubscribed: 'Inscrito',
            phoneActive: 'Número Ativo',
            webhookUrlLabel: 'URL do Webhook (configurar no Meta for Developers)',
            copyUrl: 'Copiar URL',
            tempTitle: 'Modelos de Mensagem (BBM)',
            tempDesc: 'Modelos aprovados na sua conta Meta',
            searchPlaceholder: 'Procurar modelo...',
            newModelBtn: 'Novo Modelo',
            noTemplates: 'Nenhum modelo encontrado',
            noTemplatesDesc: 'Verifique a ligação ou crie modelos no Meta Business Suite',
            viewDetails: 'Ver detalhes',
            registeredPhones: 'Números de Telefone Registados',
            noPhones: 'Nenhum número encontrado',
            copyPhoneId: 'COPIAR PHONE ID',
            createModelTitle: 'Criar Novo Modelo (BBM)',
            createModelDesc: 'Este modelo será enviado para aprovação da Meta.',
            modelName: 'Nome do Modelo',
            modelNameHint: 'Apenas letras minúsculas, números e sublinhados.',
            category: 'Categoria',
            language: 'Idioma',
            bodyText: 'Texto do Corpo (Body)',
            cancel: 'Cancelar',
            createBtn: 'Criar Modelo',
            idCopied: 'ID copiado!',
            successSaved: 'Credenciais guardadas com sucesso!',
            successConnected: 'Ligação estabelecida com sucesso!',
            successActivated: 'Número ativado com sucesso! Ficará Online em instantes.',
            successTemplateCreated: 'Modelo enviado para aprovação com sucesso!',
            errorNameRequired: 'Nome e Texto são obrigatórios',
            instaTokenHint: 'Deve ser um Token de Página (EAAB...). Tokens IGAAR... NÃO funcionam para mensagens.',
            instaTokenPlaceholder: 'EAAB... (Recomendado deixar em branco para usar o do WhatsApp)',
            instaPageIdHint: 'O ID numérico da conta do Instagram Business (geralmente começa com 178).',
            instaSecretHint: 'Encontrada em Configurações > Painel na sua App da Meta.',
            connectedStatus: 'Status: Ligado',
            currency: 'Moeda',
            timezone: 'Fuso Horário',
            status: 'Status',
            marketing: 'Marketing',
            utility: 'Utilidade',
            authentication: 'Autenticação',
            portuguese: 'Português (BR)',
            english: 'Inglês (US)',
            spanish: 'Espanhol (ES)',
            placeholderAppName: 'Ex: Minha App Insta',
            placeholderAppId: 'Ex: 125148...',
            placeholderTemplate: 'ex: promocao_verao_2024',
            placeholderBody: 'Olá! Temos uma oferta especial para si...',
            verifyToken: 'Token de Verificação:',
            fbAccessing: 'Acedendo aos ativos da Meta... Aguarde.',
            fbNoWaba: 'Nenhuma WABA encontrada no negócio.',
            fbGraphError: 'Falha na GraphAPI:',
            fbNoBiz: 'Nenhum negócio associado a este utilizador foi encontrado.',
            fbIgNoPage: 'Nenhuma página ligada ao Instagram.',
            fbIgError: 'IG Erro:',
            fbNoFbPage: 'Nenhuma Página do Facebook encontrada na sua conta.',
            fbIgCrash: 'IG Crash:',
            fbSuccessAll: 'Token e IDs extraídos com sucesso (WhatsApp/Instagram)! Clique em Guardar.',
            fbSuccessWaba: 'Token e IDs do WhatsApp extraídos com sucesso!',
            fbNoIgAssoc: 'Sem Instagram associado.',
            fbTokenOnly: 'Token capturado!',
            fbManualFill: 'Preencha os IDs abaixo manualmente para continuar.',
            fbTokenCaptured: 'Token capturado com sucesso! (Autopreenchimento falhou). Preencha manualmente.',
            fbLoginCancel: 'Login cancelado ou não autorizado.',
            fbSdkIdError: 'Erro ao iniciar Facebook SDK:',
            errorSave: 'Falha ao guardar',
            errorConn: 'Erro na ligação:',
            errorActivation: 'Falha na ativação:',
            promptPin: 'Se tem Verificação em Duas Etapas, digite o PIN de 6 dígitos. Se não tem, deixe em branco e clique em OK.',
            errorFetch: 'Falha ao carregar dados:',
            successSubscribed: 'App inscrito com sucesso! O WhatsApp agora enviará mensagens para o Zaplandia.',
            errorSubscribing: 'Falha ao inscrever:'
        },
        it_IT: {
            title: 'Integrazione API Meta',
            desc: 'Collega il tuo account WhatsApp Business ufficiale',
            config: 'Impostazioni',
            templates: 'Modelli (BBM)',
            phones: 'Numeri di Telefono',
            save: 'Salva Integrazione',
            test: 'Test Connessione',
            fbLogin: 'Accedi con Facebook',
            fbDesc: 'Genera un token permanente utilizzando il flusso di login di Facebook.',
            wizardBtn: 'Modalità Revisione',
            wizardActive: 'Modalità di Revisione Attiva',
            wizardDesc: 'Modalità di registrazione attiva per la Revisione Meta. Interfaccia in Italiano.',
            step1: 'Passaggio 1: Fai clic su Accedi con Facebook per concedere le autorizzazioni.',
            step2: 'Passaggio 2: Salva le credenziali sul tuo account.',
            step3: 'Passaggio 3: Testa la connessione per assicurarti que l\'API sia attiva.',
            secTitle: 'Sicurezza e Credenziali',
            secDesc: 'Inserisci le tue chiavi di accesso per il Cloud API di WhatsApp.',
            instaTitle: 'Impostazioni specifiche per Instagram',
            instaDesc: 'ID account aziendale Instagram (Opzionale se uguale a Meta).',
            labelToken: 'Token di Accesso (Permanente)',
            labelWaba: 'WABA ID (Account Business)',
            labelPhone: 'ID Numero di Telefono',
            labelInstaToken: 'Token Instagram (Opzionale)',
            labelInstaPage: 'ID Pagina (Instagram)',
            labelAppName: 'Nome App',
            labelAppId: 'ID App',
            labelAppSecret: 'App Secret (Chiave Segreta)',
            registerBtn: 'Attiva Numero',
            helpTitle: 'Serve Aiuto?',
            helpDesc: 'Per integrare, devi creare un\'app sulla piattaforma Meta for Developers e configurare WhatsApp.',
            permToken: 'Token Permanente:',
            permStep1: 'Vai in Impostazioni Aziendali.',
            permStep2: 'In Utenti di Sistema, aggiungi un nuovo utente Admin.',
            permStep3: 'Fai clic su Genera Nuovo Token e scegli l\'App Zaplandia.',
            permStep4: 'Seleziona whatsapp_business_messaging e whatsapp_business_management.',
            officialDocs: 'Documentazione Ufficiale',
            webhookTitle: 'Ricezione Messaggi (Webhook)',
            webhookChecking: 'Verifica dello stato...',
            webhookActive: '✅ Attivo — messaggi in arrivo a Zaplandia',
            webhookInactive: '❌ Inattivo — WhatsApp non invia messaggi ricevuti qui',
            webhookBtn: 'Attiva Ricezione',
            webhookSubscribed: 'Iscritto',
            phoneActive: 'Numero Ativo',
            webhookUrlLabel: 'URL Webhook (da configurare in Meta for Developers)',
            copyUrl: 'Copia URL',
            tempTitle: 'Modelli di Messaggio (BBM)',
            tempDesc: 'Modelli approvati nel tuo account Meta',
            searchPlaceholder: 'Cerca modello...',
            newModelBtn: 'Nuovo Modello',
            noTemplates: 'Nessun modello trovato',
            noTemplatesDesc: 'Controlla la connessione o crea modelli in Meta Business Suite',
            viewDetails: 'Visualizza dettagli',
            registeredPhones: 'Numeri di Telefono Registrati',
            noPhones: 'Nessun numero trovato',
            copyPhoneId: 'COPIA PHONE ID',
            createModelTitle: 'Crea Nuovo Modello (BBM)',
            createModelDesc: 'Questo modello sarà inviato per l\'approvazione di Meta.',
            modelName: 'Nome Modello',
            modelNameHint: 'Solo lettere minuscole, numeri e trattini bassi.',
            category: 'Categoria',
            language: 'Lingua',
            bodyText: 'Testo del Corpo',
            cancel: 'Annulla',
            createBtn: 'Crea Modello',
            idCopied: 'ID copiato!',
            successSaved: 'Credenziali salvate con successo!',
            successConnected: 'Connessione stabilita con successo!',
            successActivated: 'Numero attivato con successo! Sarà online a breve.',
            successTemplateCreated: 'Modello inviato per l\'approvazione con successo!',
            errorNameRequired: 'Nome e testo sono obbligatori',
            instaTokenHint: 'Deve essere un Token di Pagina (EAAB...). I token IGAAR... NON funzionano per i messaggi.',
            instaTokenPlaceholder: 'EAAB... (Consigliato lasciare vuoto per usare il token WhatsApp)',
            instaPageIdHint: 'L\'ID numerico dell\'account Instagram Business (solitamente inizia con 178).',
            instaSecretHint: 'Trovato in Impostazioni > Dashboard nella tua App Meta.',
            connectedStatus: 'Stato: Connesso',
            currency: 'Valuta',
            timezone: 'Fuso Orario',
            status: 'Stato',
            marketing: 'Marketing',
            utility: 'Utilità',
            authentication: 'Autenticazione',
            portuguese: 'Portoghese (BR)',
            english: 'Inglese (US)',
            spanish: 'Spagnolo (ES)',
            placeholderAppName: 'Es: Mia App Insta',
            placeholderAppId: 'Es: 125148...',
            placeholderTemplate: 'es: promo_estate_2024',
            placeholderBody: 'Ciao! Abbiamo un\'offerta speciale per te...',
            verifyToken: 'Verify Token:',
            fbAccessing: 'Accesso agli asset Meta... Attendere.',
            fbNoWaba: 'Nessun WABA trovato nel business.',
            fbGraphError: 'Errore GraphAPI:',
            fbNoBiz: 'Nessun business collegato a questo utente trovato.',
            fbIgNoPage: 'Nessuna pagina collegata a Instagram.',
            fbIgError: 'Errore IG:',
            fbNoFbPage: 'Nessuna Pagina Facebook trovata nel tuo account.',
            fbIgCrash: 'IG Crash:',
            fbSuccessAll: 'Token e ID estratti con successo (WhatsApp/Instagram)! Clicca su Salva.',
            fbSuccessWaba: 'Token e ID WhatsApp estratti con successo!',
            fbNoIgAssoc: 'Nessun Instagram associato.',
            fbTokenOnly: 'Token catturato!',
            fbManualFill: 'Inserisci manualmente gli ID qui sotto per continuare.',
            fbTokenCaptured: 'Token catturato con successo! (Autopieno fallito). Inserisci manualmente.',
            fbLoginCancel: 'Accesso annullato o non autorizzato.',
            fbSdkIdError: 'Errore durante l\'avvio di Facebook SDK:',
            errorSave: 'Salvataggio fallito',
            errorConn: 'Errore di connessione:',
            errorActivation: 'Attivazione fallita:',
            promptPin: 'Se hai la verifica in due passaggi, inserisci il PIN di 6 cifre. In caso contrario, lascia vuoto e fai clic su OK.',
            errorFetch: 'Salvataggio fallito:',
            successSubscribed: 'App registrata con successo! WhatsApp invierà ora i messaggi a Zaplandia.',
            errorSubscribing: 'Registrazione fallita:'
        }
    };
















    useEffect(() => {
        if (token) {
            fetchData();
            fetchWebhookStatus();
        }
    }, [token]);




    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch credentials
            const credRes = await fetch('/api/integrations/credentials', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (credRes.ok) {
                const data = await credRes.json();
                const metaCreds = {
                    META_ACCESS_TOKEN: data.find((c: any) => c.key_name === 'META_ACCESS_TOKEN')?.key_value || '',
                    META_WABA_ID: data.find((c: any) => c.key_name === 'META_WABA_ID')?.key_value || '',
                    META_PHONE_NUMBER_ID: data.find((c: any) => c.key_name === 'META_PHONE_NUMBER_ID')?.key_value || '',
                    INSTAGRAM_ACCESS_TOKEN: data.find((c: any) => c.key_name === 'INSTAGRAM_ACCESS_TOKEN')?.key_value || '',
                    INSTAGRAM_PAGE_ID: data.find((c: any) => c.key_name === 'INSTAGRAM_PAGE_ID')?.key_value || '',
                    INSTAGRAM_APP_NAME: data.find((c: any) => c.key_name === 'INSTAGRAM_APP_NAME')?.key_value || '',
                    INSTAGRAM_APP_ID: data.find((c: any) => c.key_name === 'INSTAGRAM_APP_ID')?.key_value || '',
                    INSTAGRAM_APP_SECRET: data.find((c: any) => c.key_name === 'INSTAGRAM_APP_SECRET')?.key_value || ''
                };
                setCreds(metaCreds);
            }

            // If we have WABA_ID, fetch remaining data
            const wabaId = await fetchWabaIdFromCreds();
            if (wabaId) {
                fetchMetaDetails();
            }
        } catch (e: any) {
            setError(t[lang].errorFetch + ' ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchWabaIdFromCreds = async () => {
        const res = await fetch('/api/integrations/credentials', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        return data.find((c: any) => c.key_name === 'META_WABA_ID')?.key_value;
    };

    const fetchWebhookStatus = async () => {
        try {
            const res = await fetch('/api/integrations/meta/webhook-status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWebhookStatus(data);
            }
        } catch (e) {
            console.error('Could not fetch webhook status', e);
        }
    };

    const handleSubscribeWebhook = async () => {
        setSubscribing(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch('/api/integrations/meta/subscribe-webhook', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(t[lang].successSubscribed);
                await fetchWebhookStatus();
            } else {
                setError(t[lang].errorSubscribing + ' ' + JSON.stringify(data));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubscribing(false);
        }
    };

    const fetchMetaDetails = async () => {
        try {
            const [profRes, tempRes, phoneRes] = await Promise.all([
                fetch('/api/integrations/meta/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/integrations/meta/templates', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/integrations/meta/phone-numbers', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (profRes.ok) setProfile(await profRes.json());
            if (tempRes.ok) {
                const tempData = await tempRes.json();
                setTemplates(tempData.data || []);
            }
            if (phoneRes.ok) {
                const phoneData = await phoneRes.json();
                setPhoneNumbers(phoneData.data || []);
            }
        } catch (e) {
            console.error('Meta details fetch error', e);
        }
    };

    const handleSaveCreds = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            for (const [key, value] of Object.entries(creds)) {
                // We send empty values as well to allow clearing credentials in the DB
                const res = await fetch('/api/integrations/credentials', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: key, value: value || "" })
                });
                if (!res.ok) throw new Error(`${t[lang].errorSave} ${key}`);
            }
            setSuccess(t[lang].successSaved);
            fetchMetaDetails();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch('/api/integrations/meta/test', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(t[lang].successConnected);
                fetchMetaDetails();
            } else {
                setError(t[lang].errorConn + ' ' + (data.error?.message || JSON.stringify(data.error)));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setTesting(false);
        }
    };

    const handleRegisterNumber = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const pin = prompt(t[lang].promptPin);
            const res = await fetch('/api/integrations/meta/register', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pin: pin || '000000' })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess(t[lang].successActivated);
                fetchMetaDetails();
            } else {
                setError(t[lang].errorActivation + ' ' + (data.message || 'Error'));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!templateData.name || !templateData.bodyText) {
            setError(t[lang].errorNameRequired);
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/integrations/meta/templates', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(templateData)
            });

            if (res.ok) {
                setSuccess(t[lang].successTemplateCreated);
                setIsModalOpen(false);
                setTemplateData({ name: '', category: 'MARKETING', language: 'pt_BR', bodyText: '' });
                fetchMetaDetails();
            } else {
                const data = await res.json();
                setError(t[lang].errorSubscribing + ' ' + (data.message || 'Error'));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSuccess(t[lang].idCopied);
        setTimeout(() => setSuccess(null), 2000);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 text-white max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center space-x-4">
                    <button onClick={() => router.push('/dashboard/integrations')} className="p-2 hover:bg-white/10 rounded-xl transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight flex items-center space-x-3">
                            <Facebook className="w-8 h-8 text-primary" />
                            <span>{t[lang].title}</span>
                        </h1>
                        <p className="text-gray-400 mt-1">{t[lang].desc}</p>
                    </div>
                </div>

                <div className="flex space-x-3 items-center">
                    <button
                        onClick={() => setShowWizard(!showWizard)}
                        className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${showWizard ? 'bg-orange-500 text-white animate-pulse' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}
                    >
                        <Zap className="w-3.5 h-3.5" />
                        {showWizard ? t[lang].wizardActive : t[lang].wizardBtn}
                    </button>


                    <button
                        onClick={fetchData}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleRegisterNumber}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition shadow-lg shadow-green-500/20"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>{t[lang].registerBtn}</span>
                    </button>
                    <button
                        onClick={handleTestConnection}
                        disabled={testing}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition shadow-lg shadow-primary/20"
                    >
                        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        <span>{t[lang].test}</span>
                    </button>

                </div>
            </div>

            {/* Compliance Wizard / Legend Banner */}
            {showWizard && (
                <div className="mb-8 p-6 bg-orange-500/10 border-2 border-dashed border-orange-500/40 rounded-3xl animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-start space-x-4">
                        <div className="p-3 bg-orange-500/20 rounded-2xl">
                            <Zap className="w-8 h-8 text-orange-500 fill-orange-500/20" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black text-orange-500 mb-2 uppercase tracking-tight">{t[lang].wizardActive}</h3>
                            <p className="text-sm text-orange-200/80 mb-6">{t[lang].wizardDesc}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[t[lang].step1, t[lang].step2, t[lang].step3].map((step: string, idx: number) => (
                                    <div key={idx} className="bg-black/20 p-4 rounded-xl border border-orange-500/10">
                                        <p className="text-xs font-bold text-orange-400">{step}</p>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Side - Vertical Tabs */}
                <div className="lg:col-span-3 space-y-2">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition font-bold text-sm ${activeTab === 'config' ? 'bg-primary text-white' : 'bg-surface border border-white/5 text-gray-400 hover:border-white/20'}`}
                    >
                        <Shield className="w-5 h-5" />
                        <span>{t[lang].config}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition font-bold text-sm ${activeTab === 'templates' ? 'bg-primary text-white' : 'bg-surface border border-white/5 text-gray-400 hover:border-white/20'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <MessageSquare className="w-5 h-5" />
                            <span>{t[lang].templates}</span>
                        </div>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{templates.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('phones')}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition font-bold text-sm ${activeTab === 'phones' ? 'bg-primary text-white' : 'bg-surface border border-white/5 text-gray-400 hover:border-white/20'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5" />
                            <span>{t[lang].phones}</span>
                        </div>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{phoneNumbers.length}</span>
                    </button>

                    <div className="pt-6">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                            <h3 className="text-blue-400 font-bold text-sm mb-2 flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>{t[lang].helpTitle}</span>
                            </h3>
                            <div className="space-y-4">
                                <p className="text-xs text-blue-400/80 leading-relaxed">
                                    {t[lang].helpDesc}
                                </p>
                                
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-blue-400/60">{t[lang].permToken}</p>
                                    <ol className="text-[10px] text-blue-400/80 list-decimal pl-4 space-y-1">
                                        <li>{t[lang].permStep1}</li>
                                        <li>{t[lang].permStep2}</li>
                                        <li>{t[lang].permStep3}</li>
                                        <li>{t[lang].permStep4}</li>
                                    </ol>
                                </div>

                                <a
                                    href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                                    target="_blank"
                                    className="text-xs font-bold text-blue-400 flex items-center space-x-1 hover:underline"
                                >
                                    <span>{t[lang].officialDocs}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Content Area */}
                <div className="lg:col-span-9 space-y-6">

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm flex items-center space-x-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-white/5 bg-white/2">
                                <h2 className="text-xl font-bold flex items-center space-x-3">
                                    <Shield className="w-6 h-6 text-primary" />
                                    <span>{t[lang].secTitle}</span>
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">{t[lang].secDesc}</p>
                            </div>

                            <div className="p-8 space-y-6">


                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t[lang].labelToken}</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={creds.META_ACCESS_TOKEN}
                                            onChange={(e) => setCreds({ ...creds, META_ACCESS_TOKEN: e.target.value })}
                                            placeholder="EAAG..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition font-mono"
                                        />
                                        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t[lang].labelWaba}</label>
                                        <input
                                            type="text"
                                            value={creds.META_WABA_ID}
                                            onChange={(e) => setCreds({ ...creds, META_WABA_ID: e.target.value })}
                                            placeholder="1234567890..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t[lang].labelPhone}</label>
                                        <input
                                            type="text"
                                            value={creds.META_PHONE_NUMBER_ID}
                                            onChange={(e) => setCreds({ ...creds, META_PHONE_NUMBER_ID: e.target.value })}
                                            placeholder="1234567890..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 mt-8 border-t border-white/5">
                                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        <span>{t[lang].instaTitle}</span>
                                    </h3>
                                    
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t[lang].labelInstaToken}</label>
                                            <input
                                                type="password"
                                                value={creds.INSTAGRAM_ACCESS_TOKEN}
                                                onChange={(e) => setCreds({ ...creds, INSTAGRAM_ACCESS_TOKEN: e.target.value })}
                                                placeholder={t[lang].instaTokenPlaceholder}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition"
                                            />
                                            <p className="text-[10px] text-gray-500">{t[lang].instaTokenHint}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t[lang].labelInstaPage}</label>
                                            <input
                                                type="text"
                                                value={creds.INSTAGRAM_PAGE_ID}
                                                onChange={(e) => setCreds({ ...creds, INSTAGRAM_PAGE_ID: e.target.value })}
                                                placeholder="Ex: 1784... (ID da conta, não do App)"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition"
                                            />
                                            <p className="text-[10px] text-gray-500">{t[lang].instaPageIdHint}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t[lang].labelAppName}</label>
                                                <input
                                                    type="text"
                                                    value={creds.INSTAGRAM_APP_NAME}
                                                    onChange={(e) => setCreds({ ...creds, INSTAGRAM_APP_NAME: e.target.value })}
                                                    placeholder={t[lang].placeholderAppName}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t[lang].labelAppId}</label>
                                                <input
                                                    type="text"
                                                    value={creds.INSTAGRAM_APP_ID}
                                                    onChange={(e) => setCreds({ ...creds, INSTAGRAM_APP_ID: e.target.value })}
                                                    placeholder="Ex: 125148..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t[lang].labelAppSecret}</label>
                                            <input
                                                type="password"
                                                value={creds.INSTAGRAM_APP_SECRET}
                                                onChange={(e) => setCreds({ ...creds, INSTAGRAM_APP_SECRET: e.target.value })}
                                                placeholder="••••••••"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition"
                                            />
                                            <p className="text-[10px] text-gray-500">{t[lang].instaSecretHint}</p>
                                        </div>
                                    </div>
                                </div>

                                {profile && (
                                    <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-primary/20 rounded-xl">
                                                <Facebook className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{profile.name}</p>
                                                <p className="text-xs text-primary/70 uppercase font-black tracking-widest">{t[lang].connectedStatus}</p>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-gray-500">
                                            <p>{t[lang].currency}: {profile.currency}</p>
                                            <p>{t[lang].timezone}: {profile.timezone_id}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Webhook Status Panel */}
                                <div className="mt-6 p-6 bg-white/2 border border-white/10 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-xl ${webhookStatus?.isSubscribed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                {webhookStatus?.isSubscribed
                                                    ? <Wifi className="w-5 h-5 text-green-400" />
                                                    : <WifiOff className="w-5 h-5 text-red-400" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{t[lang].webhookTitle}</p>
                                                <p className="text-xs text-gray-500">
                                                    {webhookStatus === null
                                                        ? t[lang].webhookChecking
                                                        : webhookStatus.isSubscribed
                                                            ? t[lang].webhookActive
                                                            : t[lang].webhookInactive}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSubscribeWebhook}
                                            disabled={subscribing || webhookStatus?.isSubscribed}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition ${
                                                webhookStatus?.isSubscribed
                                                    ? 'bg-green-500/10 text-green-400 cursor-default border border-green-500/20'
                                                    : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
                                            }`}
                                        >
                                            {subscribing
                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : webhookStatus?.isSubscribed
                                                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                                                    : <Zap className="w-3.5 h-3.5" />}
                                            <span>{webhookStatus?.isSubscribed ? t[lang].webhookSubscribed : t[lang].webhookBtn}</span>
                                        </button>
                                    </div>

                                    {/* Phone number live status */}
                                    {webhookStatus?.phoneStatus && (
                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{t[lang].phoneActive}</p>
                                                <p className="text-sm font-bold">{webhookStatus.phoneStatus.verified_name}</p>
                                                <p className="text-xs text-gray-400">+{webhookStatus.phoneStatus.display_phone_number}</p>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${
                                                webhookStatus.phoneStatus.status === 'FLAGGED' ? 'bg-red-500/20 text-red-400' :
                                                webhookStatus.phoneStatus.status === 'CONNECTED' ? 'bg-green-500/20 text-green-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {webhookStatus.phoneStatus.status || 'N/A'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Webhook URL info */}
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t[lang].webhookUrlLabel}</p>
                                        <div className="flex items-center space-x-2">
                                            <code className="flex-1 text-[11px] bg-black/30 px-3 py-2 rounded-xl text-green-400 font-mono truncate">
                                                {typeof window !== 'undefined'
                                                    ? `${window.location.protocol}//${window.location.hostname}/api/webhooks/meta`
                                                    : 'https://SEU_DOMINIO/api/webhooks/meta'}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(
                                                    typeof window !== 'undefined'
                                                        ? `${window.location.protocol}//${window.location.hostname}/api/webhooks/meta`
                                                        : ''
                                                )}
                                                className="p-2 hover:bg-white/10 rounded-lg transition"
                                                title={t[lang].copyUrl}
                                            >
                                                <Copy className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-600 mt-2">
                                            {t[lang].verifyToken} <span className="text-gray-400 font-mono">zaplandia_verify_token</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-white/2 border-t border-white/5 flex justify-end">
                                <button
                                    onClick={handleSaveCreds}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-2xl font-black flex items-center space-x-3 transition shadow-xl shadow-primary/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    <span>{t[lang].save}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="space-y-4">
                            <div className="bg-surface border border-white/5 rounded-3xl p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold">{t[lang].tempTitle}</h2>
                                        <p className="text-sm text-gray-400">{t[lang].tempDesc}</p>
                                    </div>
                                    <div className="flex items-center space-x-3 w-full md:w-auto">
                                        <div className="relative flex-1 md:w-64">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder={t[lang].searchPlaceholder}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2 text-sm outline-none focus:border-primary transition"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl transition shadow-lg flex items-center space-x-2"
                                            title={t[lang].newModelBtn}
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">{t[lang].newModelBtn}</span>
                                        </button>
                                    </div>
                                </div>

                                {templates.length === 0 ? (
                                    <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                                        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p className="text-gray-500 font-bold">{t[lang].noTemplates}</p>
                                        <p className="text-xs text-gray-600 mt-2">{t[lang].noTemplatesDesc}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {templates.map((temp: any) => (
                                            <div key={temp.id} className="bg-white/2 border border-white/5 hover:border-primary/30 rounded-2xl p-5 transition group cursor-pointer">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${temp.status === 'APPROVED' ? 'bg-green-500/20 text-green-500' :
                                                            temp.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                                                        }`}>
                                                        {temp.status}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-bold">ID: {temp.id.slice(0, 8)}...</span>
                                                </div>
                                                <h3 className="font-bold text-sm mb-1 truncate">{temp.name}</h3>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{temp.category} • {temp.language}</p>

                                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition">
                                                    <span className="text-[10px] text-primary font-bold">{t[lang].viewDetails}</span>
                                                    <ChevronRight className="w-4 h-4 text-primary" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'phones' && (
                        <div className="bg-surface border border-white/5 rounded-3xl p-8">
                            <h2 className="text-xl font-bold mb-6">{t[lang].registeredPhones}</h2>

                            {phoneNumbers.length === 0 ? (
                                <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                                    <Phone className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-gray-500 font-bold">{t[lang].noPhones}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {phoneNumbers.map((phone: any) => (
                                        <div key={phone.id} className="bg-white/2 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                                            <div className="flex items-center space-x-6">
                                                <div className="p-4 bg-primary/10 rounded-2xl">
                                                    <Phone className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black">{phone.verified_name}</h3>
                                                    <p className="text-sm text-gray-400 font-medium">+{phone.display_phone_number}</p>
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase">{phone.quality_rating} Quality</span>
                                                        <span className="text-[10px] font-black text-gray-500 bg-white/5 px-2 py-0.5 rounded uppercase">Tier: {phone.tier}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                                <button
                                                    onClick={() => copyToClipboard(phone.id)}
                                                    className="flex items-center space-x-2 text-[10px] font-black uppercase text-gray-500 hover:text-white transition"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    <span>{t[lang].copyPhoneId}</span>
                                                </button>
                                                <p className="text-[10px] text-gray-600 font-bold">ID: {phone.id}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Create Template Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 bg-white/2 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">{t[lang].createModelTitle}</h2>
                                <p className="text-xs text-gray-400 mt-1">{t[lang].createModelDesc}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{t[lang].modelName}</label>
                                <input
                                    type="text"
                                    value={templateData.name}
                                    onChange={(e) => setTemplateData({ ...templateData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                    placeholder={t[lang].placeholderTemplate}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition"
                                />
                                <p className="text-[10px] text-gray-500">{t[lang].modelNameHint}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{t[lang].category}</label>
                                    <select
                                        value={templateData.category}
                                        onChange={(e) => setTemplateData({ ...templateData, category: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition appearance-none"
                                    >
                                        <option value="MARKETING">{t[lang].marketing}</option>
                                        <option value="UTILITY">{t[lang].utility}</option>
                                        <option value="AUTHENTICATION">{t[lang].authentication}</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{t[lang].language}</label>
                                    <select
                                        value={templateData.language}
                                        onChange={(e) => setTemplateData({ ...templateData, language: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition appearance-none"
                                    >
                                        <option value="pt_BR">{t[lang].portuguese}</option>
                                        <option value="en_US">{t[lang].english}</option>
                                        <option value="es_ES">{t[lang].spanish}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{t[lang].bodyText}</label>
                                <textarea
                                    value={templateData.bodyText}
                                    onChange={(e) => setTemplateData({ ...templateData, bodyText: e.target.value })}
                                    placeholder={t[lang].placeholderBody}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-white/2 border-t border-white/5 flex gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black transition"
                            >
                                {t[lang].cancel}
                            </button>
                            <button
                                onClick={handleCreateTemplate}
                                disabled={saving}
                                className="flex-[2] bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition shadow-xl shadow-primary/20"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                <span>{t[lang].createBtn}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
