'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
    Instagram,
    Facebook,
    Zap,
    Send,
    Youtube,
    Linkedin,
    Globe,
    Smartphone,
    CheckCircle2,
    XCircle,
    Plus,
    Loader2,
    Settings,
    ArrowRight,
    ShoppingBag,
    Store,
    Bot,
    Save,
    QrCode,
    Terminal
} from 'lucide-react';
import WhatsAppInstanceManager from '@/components/integrations/WhatsAppInstanceManager';
import AiModelSelector from '@/components/AiModelSelector';

interface Integration {
    id: string;
    provider: string;
    status: string;
}

const PROVIDERS = [
    { id: 'facebook', name: 'Meta / Facebook', icon: <Facebook className="w-8 h-8 text-blue-600" />, desc: 'Sincronize mensagens da sua página e automações.' },
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-8 h-8 text-pink-500" />, desc: 'Gerencie DMs e comentários em um só lugar.' },
    { id: 'whatsapp', name: 'WhatsApp API Oficial', icon: <Zap className="w-8 h-8 text-green-500" />, desc: 'Conecte o WhatsApp Business Oficial (Meta).' },
    { id: 'evolution', name: 'WhatsApp Não Oficial', icon: <QrCode className="w-8 h-8 text-primary" />, desc: 'Aparelho Conectado via QR Code (EvolutionAPI).' },
    { id: 'telegram', name: 'Telegram Bot', icon: <Send className="w-8 h-8 text-blue-400" />, desc: 'Gerencie bots de atendimento e vendas.' },
    { id: 'tiktok', name: 'TikTok Business', icon: <Smartphone className="w-8 h-8 text-black" />, desc: 'Responda comentários e mensagens do TikTok.' },
    { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-8 h-8 text-blue-800" />, desc: 'Automação e CRM para vendas B2B.' },
    { id: 'google_sheets', name: 'Google Sheets', icon: <Globe className="w-8 h-8 text-yellow-600" />, desc: 'Sincronize seus leads com planilhas.' },
    { id: 'mercadolivre', name: 'Mercado Livre', icon: <ShoppingBag className="w-8 h-8 text-yellow-500" />, desc: 'Gerencie perguntas e vendas do Mercado Livre.' },
    { id: 'olx', name: 'OLX', icon: <Store className="w-8 h-8 text-orange-600" />, desc: 'Responda chats e gerencie anúncios da OLX.' },
    { id: 'n8n', name: 'n8n Automation', icon: <Terminal className="w-8 h-8 text-orange-500" />, desc: 'Conecte Webhooks para automações de fluxos.' },
    { id: 'erp_zaplandia', name: 'ERP Zaplandia', icon: <Zap className="w-8 h-8 text-emerald-500" />, desc: 'Sincronize produtos, preços e estoque do seu ERP.' },
    { id: 'rifa', name: 'Rifa API', icon: <Smartphone className="w-8 h-8 text-indigo-500" />, desc: 'Conecte sua API de rifas para gerenciar números e pedidos.' },
];

export default function IntegrationsPage() {
    const { token, user } = useAuth();
    const { lang } = useLanguage();
    const router = useRouter();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
    const [aiConfig, setAiConfig] = useState({ enabled: false, promptId: '', aiModel: 'gemini-1.5-flash', n8nEnabled: false });
    const [isSavingAI, setIsSavingAI] = useState(false);
    const [showEvolutionModal, setShowEvolutionModal] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState<any[]>([]);

    const t: any = {
        pt_BR: {
            title: 'Canais Conectados',
            subtitle: 'Ative e configure as redes onde sua empresa atende.',
            configGlobal: 'Configurar APIs Globais',
            loading: 'Carregando integrações...',
            active: 'Ativo',
            paused: 'Pausado',
            manageWhatsapp: 'GERENCIAR WHATSAPP (NOVO)',
            configIA: 'Configurar IA',
            config: 'Configurar',
            disconnect: 'Interromper Conexão',
            connectNow: 'Conectar Agora',
            connecting: 'Conectando...',
            modalTitle: 'Automação do Canal',
            cancel: 'Cancelar',
            save: 'Salvar Configuração',
            aiAgent: 'Agente de IA (Gemini)',
            aiDesc: 'Processamento interno via Zaplandia',
            promptLabel: 'Prompt do Agente',
            noPrompts: 'Nenhum prompt salvo. Crie prompts em Configurações > Agentes de IA primeiro.',
            selectPrompt: 'Selecione um prompt...',
            modelLabel: 'Modelo',
            n8nTitle: 'Automação via n8n',
            n8nDesc: 'Fluxos externos e webhooks',
            n8nWarning: 'Com n8n ativo, as mensagens recebidas serão enviadas para seu webhook global. A IA interna será desativada para este canal.',
            configWebhook: 'Configurar Webhook URL',
            providers: {
                facebook: { name: 'Meta / Facebook', desc: 'Sincronize mensagens da sua página e automações.' },
                instagram: { name: 'Instagram', desc: 'Gerencie DMs e comentários em um só lugar.' },
                whatsapp: { name: 'WhatsApp API Oficial', desc: 'Conecte o WhatsApp Business Oficial (Meta).' },
                evolution: { name: 'WhatsApp Não Oficial', desc: 'Aparelho Conectado via QR Code (EvolutionAPI).' },
                telegram: { name: 'Telegram Bot', desc: 'Gerencie bots de atendimento e vendas.' },
                tiktok: { name: 'TikTok Business', desc: 'Responda comentários e mensagens do TikTok.' },
                linkedin: { name: 'LinkedIn', desc: 'Automação e CRM para vendas B2B.' },
                google_sheets: { name: 'Google Sheets', desc: 'Sincronize seus leads com planilhas.' },
                mercadolivre: { name: 'Mercado Livre', desc: 'Gerencie perguntas e vendas do Mercado Livre.' },
                olx: { name: 'OLX', desc: 'Responda chats e gerencie anúncios da OLX.' },
                n8n: { name: 'n8n Automation', desc: 'Conecte Webhooks para automações de fluxos.' },
                erp_zaplandia: { name: 'ERP Zaplandia', desc: 'Sincronize produtos, preços e estoque do seu ERP.' },
                rifa: { name: 'Rifa API', desc: 'Conecte sua API de rifas para gerenciar números e pedidos.' }
            }
        },
        en_US: {
            title: 'Connected Channels',
            subtitle: 'Activate and configure the networks where your company serves.',
            configGlobal: 'Configure Global APIs',
            loading: 'Loading integrations...',
            active: 'Active',
            paused: 'Paused',
            manageWhatsapp: 'MANAGE WHATSAPP (NEW)',
            configIA: 'Configure AI',
            config: 'Configure',
            disconnect: 'Stop Connection',
            connectNow: 'Connect Now',
            connecting: 'Connecting...',
            modalTitle: 'Channel Automation',
            cancel: 'Cancel',
            save: 'Save Configuration',
            aiAgent: 'AI Agent (Gemini)',
            aiDesc: 'Internal processing via Zaplandia',
            promptLabel: 'Agent Prompt',
            noPrompts: 'No prompts saved. Create prompts in Settings > AI Agents first.',
            selectPrompt: 'Select a prompt...',
            modelLabel: 'Model',
            n8nTitle: 'n8n Automation',
            n8nDesc: 'External flows and webhooks',
            n8nWarning: 'With n8n active, incoming messages will be sent to your global webhook. Internal AI will be disabled for this channel.',
            configWebhook: 'Configure Webhook URL',
            providers: {
                facebook: { name: 'Meta / Facebook', desc: 'Sync your page messages and automations.' },
                instagram: { name: 'Instagram', desc: 'Manage DMs and comments in one place.' },
                whatsapp: { name: 'Official WhatsApp API', desc: 'Connect Official WhatsApp Business (Meta).' },
                evolution: { name: 'Unofficial WhatsApp', desc: 'Device Connected via QR Code (EvolutionAPI).' },
                telegram: { name: 'Telegram Bot', desc: 'Manage service and sales bots.' },
                tiktok: { name: 'TikTok Business', desc: 'Reply to TikTok comments and messages.' },
                linkedin: { name: 'LinkedIn', desc: 'B2B sales automation and CRM.' },
                google_sheets: { name: 'Google Sheets', desc: 'Sync your leads with spreadsheets.' },
                mercadolivre: { name: 'Mercado Libre', desc: 'Manage Mercado Libre questions and sales.' },
                olx: { name: 'OLX', desc: 'Reply to chats and manage OLX ads.' },
                n8n: { name: 'n8n Automation', desc: 'Connect Webhooks for flow automations.' },
                erp_zaplandia: { name: 'ERP Zaplandia', desc: 'Sync products, prices and stock from your ERP.' },
                rifa: { name: 'Raffle API', desc: 'Connect your raffle API to manage numbers and orders.' }
            }
        },
        pt_PT: {
            title: 'Canais Ligados',
            subtitle: 'Ative e configure as redes onde a sua empresa atende.',
            configGlobal: 'Configurar APIs Globais',
            loading: 'A carregar integrações...',
            active: 'Ativo',
            paused: 'Pausado',
            manageWhatsapp: 'GERIR WHATSAPP (NOVO)',
            configIA: 'Configurar IA',
            config: 'Configurar',
            disconnect: 'Interromper Ligação',
            connectNow: 'Ligar Agora',
            connecting: 'A ligar...',
            modalTitle: 'Automação do Canal',
            cancel: 'Cancelar',
            save: 'Guardar Configuração',
            aiAgent: 'Agente de IA (Gemini)',
            aiDesc: 'Processamento interno via Zaplandia',
            promptLabel: 'Prompt do Agente',
            noPrompts: 'Nenhum prompt guardado. Crie prompts em Configurações > Agentes de IA primeiro.',
            selectPrompt: 'Selecione um prompt...',
            modelLabel: 'Modelo',
            n8nTitle: 'Automação via n8n',
            n8nDesc: 'Fluxos externos e webhooks',
            n8nWarning: 'Com n8n ativo, as mensagens recebidas serão enviadas para o seu webhook global. A IA interna será desativada para este canal.',
            configWebhook: 'Configurar Webhook URL',
            providers: {
                facebook: { name: 'Meta / Facebook', desc: 'Sincronize mensagens da sua página e automações.' },
                instagram: { name: 'Instagram', desc: 'Gerencie DMs e comentários num só lugar.' },
                whatsapp: { name: 'WhatsApp API Oficial', desc: 'Ligue o WhatsApp Business Oficial (Meta).' },
                evolution: { name: 'WhatsApp Não Oficial', desc: 'Aparelho Ligado via QR Code (EvolutionAPI).' },
                telegram: { name: 'Telegram Bot', desc: 'Gerencie bots de atendimento e vendas.' },
                tiktok: { name: 'TikTok Business', desc: 'Responda a comentários e mensagens do TikTok.' },
                linkedin: { name: 'LinkedIn', desc: 'Automação e CRM para vendas B2B.' },
                google_sheets: { name: 'Google Sheets', desc: 'Sincronize os seus leads com folhas de cálculo.' },
                mercadolivre: { name: 'Mercado Livre', desc: 'Gerencie perguntas e vendas do Mercado Livre.' },
                olx: { name: 'OLX', desc: 'Responda a chats e gerencie anúncios da OLX.' },
                n8n: { name: 'n8n Automation', desc: 'Ligue Webhooks para automações de fluxos.' },
                erp_zaplandia: { name: 'ERP Zaplandia', desc: 'Sincronize produtos, preços e stock do seu ERP.' },
                rifa: { name: 'Rifa API', desc: 'Ligue a sua API de rifas para gerir números e encomendas.' }
            }
        },
        it_IT: {
            title: 'Canali Collegati',
            subtitle: 'Attiva e configura le reti in cui la tua azienda serve.',
            configGlobal: 'Configura API Globali',
            loading: 'Caricamento integrazioni...',
            active: 'Attivo',
            paused: 'In pausa',
            manageWhatsapp: 'GESTISCI WHATSAPP (NUOVO)',
            configIA: 'Configura IA',
            config: 'Configura',
            disconnect: 'Interrompi Connessione',
            connectNow: 'Collega Ora',
            connecting: 'Connessione...',
            modalTitle: 'Automazione Canale',
            cancel: 'Annulla',
            save: 'Salva Configurazione',
            aiAgent: 'Agente AI (Gemini)',
            aiDesc: 'Elaborazione interna tramite Zaplandia',
            promptLabel: 'Prompt Agente',
            noPrompts: 'Nessun prompt salvato. Crea prima i prompt in Impostazioni > Agenti AI.',
            selectPrompt: 'Seleziona un prompt...',
            modelLabel: 'Modello',
            n8nTitle: 'Automazione via n8n',
            n8nDesc: 'Flussi esterni e webhook',
            n8nWarning: 'Con n8n attivo, i messaggi in arrivo verranno inviati al tuo webhook globale. L\'IA interna sarà disattivata per questo canale.',
            configWebhook: 'Configura URL Webhook',
            providers: {
                facebook: { name: 'Meta / Facebook', desc: 'Sincronizza i messaggi della tua pagina e le automazioni.' },
                instagram: { name: 'Instagram', desc: 'Gestisci DM e commenti in un unico posto.' },
                whatsapp: { name: 'WhatsApp API Ufficiale', desc: 'Collega WhatsApp Business Ufficiale (Meta).' },
                evolution: { name: 'WhatsApp Non Ufficiale', desc: 'Dispositivo collegato tramite QR Code (EvolutionAPI).' },
                telegram: { name: 'Telegram Bot', desc: 'Gestisci bot di assistenza e vendita.' },
                tiktok: { name: 'TikTok Business', desc: 'Rispondi ai commenti e ai messaggi di TikTok.' },
                linkedin: { name: 'LinkedIn', desc: 'Automazione delle vendite B2B e CRM.' },
                google_sheets: { name: 'Google Sheets', desc: 'Sincronizza i tuoi lead con i fogli di calcolo.' },
                mercadolivre: { name: 'Mercado Libre', desc: 'Gestisci domande e vendite di Mercado Libre.' },
                olx: { name: 'OLX', desc: 'Rispondi alle chat e gestisci gli annunci OLX.' },
                n8n: { name: 'n8n Automation', desc: 'Collega i Webhook per le automazioni dei flussi.' },
                erp_zaplandia: { name: 'ERP Zaplandia', desc: 'Sincronizza prodotti, prezzi e scorte dal tuo ERP.' },
                rifa: { name: 'Rifa API', desc: 'Collega la tua API delle lotterie per gestire numeri e ordini.' }
            }
        }
    };

    // Language sync handled by useLanguage()


    const PROVIDERS_LOCALIZED = [
        { id: 'facebook', name: t[lang].providers.facebook.name, icon: <Facebook className="w-8 h-8 text-blue-600" />, desc: t[lang].providers.facebook.desc },
        { id: 'instagram', name: t[lang].providers.instagram.name, icon: <Instagram className="w-8 h-8 text-pink-500" />, desc: t[lang].providers.instagram.desc },
        { id: 'whatsapp', name: t[lang].providers.whatsapp.name, icon: <Zap className="w-8 h-8 text-green-500" />, desc: t[lang].providers.whatsapp.desc },
        { id: 'evolution', name: t[lang].providers.evolution.name, icon: <QrCode className="w-8 h-8 text-primary" />, desc: t[lang].providers.evolution.desc },
        { id: 'telegram', name: t[lang].providers.telegram.name, icon: <Send className="w-8 h-8 text-blue-400" />, desc: t[lang].providers.telegram.desc },
        { id: 'tiktok', name: t[lang].providers.tiktok.name, icon: <Smartphone className="w-8 h-8 text-black" />, desc: t[lang].providers.tiktok.desc },
        { id: 'linkedin', name: t[lang].providers.linkedin.name, icon: <Linkedin className="w-8 h-8 text-blue-800" />, desc: t[lang].providers.linkedin.desc },
        { id: 'google_sheets', name: t[lang].providers.google_sheets.name, icon: <Globe className="w-8 h-8 text-yellow-600" />, desc: t[lang].providers.google_sheets.desc },
        { id: 'mercadolivre', name: t[lang].providers.mercadolivre.name, icon: <ShoppingBag className="w-8 h-8 text-yellow-500" />, desc: t[lang].providers.mercadolivre.desc },
        { id: 'olx', name: t[lang].providers.olx.name, icon: <Store className="w-8 h-8 text-orange-600" />, desc: t[lang].providers.olx.desc },
        { id: 'n8n', name: t[lang].providers.n8n.name, icon: <Terminal className="w-8 h-8 text-orange-500" />, desc: t[lang].providers.n8n.desc },
        { id: 'erp_zaplandia', name: t[lang].providers.erp_zaplandia.name, icon: <Zap className="w-8 h-8 text-emerald-500" />, desc: t[lang].providers.erp_zaplandia.desc },
        { id: 'rifa', name: t[lang].providers.rifa.name, icon: <Smartphone className="w-8 h-8 text-indigo-500" />, desc: t[lang].providers.rifa.desc },
    ];

    useEffect(() => {
        if (token) {
            fetchIntegrations();
            fetch('/api/ai/prompts', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => { if (Array.isArray(data)) setSavedPrompts(data); })
                .catch(err => console.error('Erro ao buscar prompts:', err));
        }
    }, [token]);

    const fetchIntegrations = async () => {
        try {
            console.log('Buscando integrações...');
            const res = await fetch('/api/integrations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Integrations Status:', res.status);
            if (res.status === 401) router.push('/auth/login');
            if (res.ok) {
                const data = await res.json();
                console.log('Integrações recebidas:', data);
                setIntegrations(data);
            }
        } catch (err) {
            console.error('Erro ao buscar integrações:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async (provider: string) => {
        if (provider === 'evolution') {
            setShowEvolutionModal(true);
            return;
        }
        setConnectingId(provider);
        try {
            const res = await fetch(`/api/integrations/connect/${provider}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ credentials: { mock: true } })
            });
            if (res.ok) fetchIntegrations();
        } catch (err) {
            console.error('Erro ao conectar:', err);
        } finally {
            setConnectingId(null);
        }
    };

    const handleDisconnect = async (id: string) => {
        try {
            const res = await fetch(`/api/integrations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchIntegrations();
        } catch (err) {
            console.error('Erro ao desconectar:', err);
        }
    };

    const openAIModal = (integration: any) => {
        setSelectedIntegration(integration);
        setAiConfig({
            enabled: integration.aiEnabled || false,
            promptId: integration.aiPromptId || '',
            aiModel: integration.aiModel || 'gemini-1.5-flash',
            n8nEnabled: integration.n8nEnabled || false
        });
    };

    const handleSaveAI = async () => {
        if (!selectedIntegration) return;
        setIsSavingAI(true);
        try {
            // Use the correct endpoint that updates aiEnabled and aiPromptId columns directly
            const integrationId = selectedIntegration.integrationId || selectedIntegration.id;
            const res = await fetch(`/api/ai/integration/${integrationId}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    enabled: aiConfig.enabled,
                    promptId: aiConfig.promptId || undefined,
                    aiModel: aiConfig.aiModel,
                    n8nEnabled: aiConfig.n8nEnabled
                })
            });
            if (res.ok) {
                fetchIntegrations();
                setSelectedIntegration(null);
            } else {
                const err = await res.json();
                console.error('Erro ao salvar IA:', err);
            }
        } catch (err) {
            console.error('Erro ao salvar config IA:', err);
        } finally {
            setIsSavingAI(false);
        }
    };

    const getStatus = (providerId: string) => {
        return integrations.find(i => i.provider === providerId) || null;
    };

    return (
        <div className="p-8 text-white pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">{t[lang].title}</h1>
                    <p className="text-gray-400 mt-2">{t[lang].subtitle}</p>
                </div>
                {user?.role === 'superadmin' && (
                    <button
                        onClick={() => router.push('/dashboard/settings/api')}
                        className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 transition-all font-bold text-sm"
                    >
                        <Settings className="w-4 h-4" />
                        <span>{t[lang].configGlobal}</span>
                    </button>
                )}
            </div>


            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-32 space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-gray-500 animate-pulse">{t[lang].loading}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {PROVIDERS_LOCALIZED.map((app) => {
                        const integration = getStatus(app.id);
                        const isConnected = !!integration;
                        const isConnecting = connectingId === app.id;

                        return (
                            <div key={app.id} className="relative bg-surface border border-white/5 rounded-3xl p-8 hover:border-primary/40 transition-all group overflow-hidden shadow-2xl">
                                {/* Background Accent */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10">
                                        {app.icon}
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-black ${isConnected ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 text-gray-500 border border-white/5'}`}>
                                        {isConnected ? t[lang].active : t[lang].paused}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black mb-3">{app.name}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed mb-8 min-h-[48px]">{app.desc}</p>

                                <div className="flex flex-col space-y-3">
                                    {/* FORCE WHATSAPP BEHAVIOR */}
                                    {app.id === 'evolution' ? (
                                        <div className="flex flex-col space-y-2">
                                            <button
                                                onClick={() => {
                                                    console.log('Force redirecting to WhatsApp manager...');
                                                    window.location.href = '/dashboard/integrations/whatsapp';
                                                }}
                                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm py-4 rounded-xl transition font-black shadow-lg shadow-green-500/20 flex items-center justify-center space-x-2 border border-white/10"
                                            >
                                                <QrCode className="w-5 h-5" />
                                                <span>{t[lang].manageWhatsapp}</span>
                                            </button>

                                            {isConnected && (
                                                <button
                                                    onClick={() => openAIModal(integration)}
                                                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs py-2 rounded-xl transition font-bold flex items-center justify-center space-x-2 border border-primary/20"
                                                >
                                                    <Bot className="w-3.5 h-3.5" />
                                                    <span>{t[lang].configIA}</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : isConnected ? (
                                        <>
                                            <button
                                                onClick={() => router.push('/dashboard/settings/api')}
                                                className="w-full bg-white/5 hover:bg-white/10 text-white text-sm py-3 rounded-2xl transition font-black flex items-center justify-center space-x-2 border border-white/5"
                                            >
                                                <Settings className="w-4 h-4" />
                                                <span>{t[lang].config}</span>
                                            </button>
                                            <button
                                                onClick={() => openAIModal(integration)}
                                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs py-2 rounded-xl transition font-bold flex items-center justify-center space-x-2 border border-primary/20"
                                            >
                                                <Bot className="w-3.5 h-3.5" />
                                                <span>{t[lang].configIA}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDisconnect(integration.id)}
                                                className="w-full bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] py-1.5 rounded-lg transition font-medium"
                                            >
                                                {t[lang].disconnect}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleConnect(app.id)}
                                            disabled={isConnecting}
                                            className="w-full bg-primary hover:bg-primary-dark text-white text-sm py-4 rounded-2xl transition font-black shadow-lg shadow-primary/20 flex items-center justify-center space-x-2"
                                        >
                                            {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                            <span>{isConnecting ? t[lang].connecting : t[lang].connectNow}</span>
                                        </button>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}

            {/* WhatsApp Instance Manager Modal */}
            {showEvolutionModal && (
                <WhatsAppInstanceManager
                    token={token || ''}
                    onClose={() => setShowEvolutionModal(false)}
                    onSuccess={() => {
                        setShowEvolutionModal(false);
                        fetchIntegrations();
                    }}
                />
            )}


            {/* AI Configuration Modal */}
            {selectedIntegration && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-surface border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 bg-primary/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-white/5 rounded-2xl">
                                        <Bot className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">{t[lang].modalTitle}</h2>
                                        <p className="text-gray-400 text-sm">{selectedIntegration.provider.toUpperCase()}</p>
                                    </div>
                                </div>
                                <button title="Fechar" onClick={() => setSelectedIntegration(null)} className="text-gray-500 hover:text-white transition">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 gap-4">
                                {/* AI Toggle */}
                                <div className={`flex flex-col p-5 rounded-2xl border transition-all ${aiConfig.enabled ? 'bg-primary/10 border-primary/40' : 'bg-white/5 border-white/5 opacity-60'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <Zap className={`w-5 h-5 ${aiConfig.enabled ? 'text-primary' : 'text-gray-500'}`} />
                                            <div>
                                                <p className="font-bold">{t[lang].aiAgent}</p>
                                                <p className="text-[10px] text-gray-400">{t[lang].aiDesc}</p>
                                            </div>
                                        </div>
                                        <button
                                            title="Ativar/Desativar IA"
                                            onClick={() => setAiConfig({ ...aiConfig, enabled: !aiConfig.enabled, n8nEnabled: false })}
                                            className={`w-12 h-6 rounded-full transition-all relative ${aiConfig.enabled ? 'bg-primary' : 'bg-gray-600'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${aiConfig.enabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {aiConfig.enabled && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{t[lang].promptLabel}</label>
                                                {savedPrompts.length === 0 ? (
                                                    <p className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                                                        {t[lang].noPrompts}
                                                    </p>
                                                ) : (
                                                    <select
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl text-sm px-4 py-3 text-white outline-none focus:border-primary transition"
                                                        value={aiConfig.promptId}
                                                        onChange={(e) => setAiConfig({ ...aiConfig, promptId: e.target.value })}
                                                    >
                                                        <option value="">{t[lang].selectPrompt}</option>
                                                        {savedPrompts.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">{t[lang].modelLabel}</label>
                                                <AiModelSelector
                                                    value={aiConfig.aiModel}
                                                    token={token || ''}
                                                    className="w-full bg-black/20 border-white/10"
                                                    onChange={(newModel) => setAiConfig({ ...aiConfig, aiModel: newModel })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* n8n Toggle */}
                                <div className={`flex flex-col p-5 rounded-2xl border transition-all ${aiConfig.n8nEnabled ? 'bg-orange-500/10 border-orange-500/40' : 'bg-white/5 border-white/5 opacity-60'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Terminal className={`w-5 h-5 ${aiConfig.n8nEnabled ? 'text-orange-500' : 'text-gray-500'}`} />
                                            <div>
                                                <p className="font-bold">{t[lang].n8nTitle}</p>
                                                <p className="text-[10px] text-gray-400">{t[lang].n8nDesc}</p>
                                            </div>
                                        </div>
                                        <button
                                            title="Ativar/Desativar n8n"
                                            onClick={() => setAiConfig({ ...aiConfig, n8nEnabled: !aiConfig.n8nEnabled, enabled: false })}
                                            className={`w-12 h-6 rounded-full transition-all relative ${aiConfig.n8nEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${aiConfig.n8nEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    {aiConfig.n8nEnabled && (
                                        <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                                {t[lang].n8nWarning}
                                            </p>
                                            <button 
                                                onClick={() => router.push('/dashboard/settings/api')}
                                                className="mt-3 text-[10px] text-orange-500 hover:underline font-bold"
                                            >
                                                {t[lang].configWebhook} &rarr;
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white/5 flex space-x-4">
                            <button
                                onClick={() => setSelectedIntegration(null)}
                                className="flex-1 px-6 py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition"
                            >
                                {t[lang].cancel}
                            </button>
                            <button
                                onClick={handleSaveAI}
                                disabled={isSavingAI}
                                className="flex-[2] bg-primary hover:bg-primary-dark text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 transition"
                            >
                                {isSavingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                <span>{t[lang].save}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
