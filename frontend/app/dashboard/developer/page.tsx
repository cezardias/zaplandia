'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
    Terminal, 
    Copy, 
    RefreshCw, 
    Check, 
    ExternalLink, 
    Code2, 
    Key, 
    Server,
    ShieldAlert
} from 'lucide-react';

export default function DeveloperPage() {
    const { user, token: authContextToken } = useAuth();
    const { lang } = useLanguage();
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRotating, setIsRotating] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);


    const t: any = {
        pt_BR: {
            title: 'Aba de Desenvolvedor',
            subtitle: 'Gerencie suas chaves de acesso e integrações externas via API.',
            tenantIdLabel: 'Seu ID de Usuário (Tenant ID)',
            apiKeyLabel: 'Sua Chave de API (Secret Key)',
            externalUsage: 'Uso no n8n / Externo',
            apiSecurityWarning: 'Nunca compartilhe sua chave de API. Ela dá acesso total às suas automações.',
            rotateKey: 'Rotacionar Chave',
            generating: 'Gerando...',
            n8nGuideTitle: 'Guia rápido: Conectando no n8n',
            step1Title: 'Nó HTTP Request (n8n)',
            step1Subtitle: 'Transferência',
            step1Desc: 'Use este nó para mandar um contato para uma equipe específica e desativar a IA.',
            endpointUrl: 'URL do Endpoint',
            method: 'Método',
            auth: 'Autenticação',
            authManual: 'Header (Manual)',
            requiredHeaders: 'Headers Exigidos',
            step2Title: 'Corpo da Requisição (JSON)',
            step2Desc: 'Copie o JSON abaixo e cole no campo "Body Parameters" ou "Raw JSON" do n8n.',
            teamIdNote: 'O campo teamId você encontra na aba "Equipes". Ao transferir, a automação (IA/n8n) desse contato será pausada para o humano assumir.',
            step3Title: 'Evolution API (Webhook)',
            step3Desc: 'Cole esta URL no painel da sua Evolution API (Webhook > Global).',
            webhookUrl: 'URL do Webhook',
            criticalRule: '⚠️ Regra Crítica da Instância',
            criticalRuleDesc: 'O nome da sua instância deve começar com:',
            criticalRuleNote: 'Isso garante que as mensagens cheguem na sua conta corretamente.',
            supportLink: 'Precisa de ajuda com a integração? Clique aqui',
            rotateConfirm: 'Isso irá invalidar sua chave atual. Deseja continuar?',
            fetchError: 'Erro ao buscar dados do desenvolvedor:',
            rotateError: 'Erro ao rotacionar chave:'
        },
        en_US: {
            title: 'Developer Tab',
            subtitle: 'Manage your access keys and external integrations via API.',
            tenantIdLabel: 'Your User ID (Tenant ID)',
            apiKeyLabel: 'Your API Key (Secret Key)',
            externalUsage: 'Used in n8n / External',
            apiSecurityWarning: 'Never share your API key. It gives full access to your automations.',
            rotateKey: 'Rotate Key',
            generating: 'Generating...',
            n8nGuideTitle: 'Quick Guide: Connecting to n8n',
            step1Title: 'HTTP Request Node (n8n)',
            step1Subtitle: 'Transfer',
            step1Desc: 'Use this node to send a contact to a specific team and disable AI.',
            endpointUrl: 'Endpoint URL',
            method: 'Method',
            auth: 'Authentication',
            authManual: 'Header (Manual)',
            requiredHeaders: 'Required Headers',
            step2Title: 'Request Body (JSON)',
            step2Desc: 'Copy the JSON below and paste it into the "Body Parameters" or "Raw JSON" field in n8n.',
            teamIdNote: 'You can find the teamId field in the "Teams" tab. Upon transfer, the automation (AI/n8n) for this contact will be paused for a human to take over.',
            step3Title: 'Evolution API (Webhook)',
            step3Desc: 'Paste this URL into your Evolution API panel (Webhook > Global).',
            webhookUrl: 'Webhook URL',
            criticalRule: '⚠️ Critical Instance Rule',
            criticalRuleDesc: 'Your instance name must start with:',
            criticalRuleNote: 'This ensures messages reach your account correctly.',
            supportLink: 'Need help with integration? Click here',
            rotateConfirm: 'This will invalidate your current key. Do you want to continue?',
            fetchError: 'Error fetching developer data:',
            rotateError: 'Error rotating key:'
        },
        pt_PT: {
            title: 'Separador do Programador',
            subtitle: 'Gerencie as suas chaves de acesso e integrações externas via API.',
            tenantIdLabel: 'O seu ID de Utilizador (Tenant ID)',
            apiKeyLabel: 'A sua Chave de API (Secret Key)',
            externalUsage: 'Uso no n8n / Externo',
            apiSecurityWarning: 'Nunca partilhe a sua chave de API. Ela dá acesso total às suas automações.',
            rotateKey: 'Rodar Chave',
            generating: 'A gerar...',
            n8nGuideTitle: 'Guia rápido: Ligar ao n8n',
            step1Title: 'Nó HTTP Request (n8n)',
            step1Subtitle: 'Transferência',
            step1Desc: 'Use este nó para enviar um contacto para uma equipa específica e desativar a IA.',
            endpointUrl: 'URL do Endpoint',
            method: 'Método',
            auth: 'Autenticação',
            authManual: 'Header (Manual)',
            requiredHeaders: 'Headers Exigidos',
            step2Title: 'Corpo da Requisição (JSON)',
            step2Desc: 'Copie o JSON abaixo e cole no campo "Body Parameters" ou "Raw JSON" do n8n.',
            teamIdNote: 'O campo teamId encontra-o no separador "Equipas". Ao transferir, a automação (IA/n8n) desse contacto será pausada para o humano assumir.',
            step3Title: 'Evolution API (Webhook)',
            step3Desc: 'Cole este URL no painel da sua Evolution API (Webhook > Global).',
            webhookUrl: 'URL do Webhook',
            criticalRule: '⚠️ Regra Crítica da Instância',
            criticalRuleDesc: 'O nome da sua instância deve começar com:',
            criticalRuleNote: 'Isto garante que as mensagens cheguem à sua conta corretamente.',
            supportLink: 'Precisa de ajuda com a integração? Clique aqui',
            rotateConfirm: 'Isto irá invalidar a sua chave atual. Deseja continuar?',
            fetchError: 'Erro ao procurar dados do programador:',
            rotateError: 'Erro ao rodar chave:'
        },
        it_IT: {
            title: 'Scheda Sviluppatore',
            subtitle: 'Gestisci le tue chiavi di accesso e integrazioni esterne tramite API.',
            tenantIdLabel: 'Il tuo ID Utente (Tenant ID)',
            apiKeyLabel: 'La tua Chiave API (Secret Key)',
            externalUsage: 'Uso in n8n / Esterno',
            apiSecurityWarning: 'Non condividere mai la tua chiave API. Fornisce accesso completo alle tue automazioni.',
            rotateKey: 'Ruota Chiave',
            generating: 'Generazione...',
            n8nGuideTitle: 'Guida rapida: Connessione a n8n',
            step1Title: 'Nodo HTTP Request (n8n)',
            step1Subtitle: 'Trasferimento',
            step1Desc: 'Usa questo nodo per inviare un contatto a un team specifico e disabilitare l\'IA.',
            endpointUrl: 'URL Endpoint',
            method: 'Metodo',
            auth: 'Autenticazione',
            authManual: 'Header (Manuale)',
            requiredHeaders: 'Header Richiesti',
            step2Title: 'Corpo della Richiesta (JSON)',
            step2Desc: 'Copia il JSON qui sotto e incollalo nel campo "Body Parameters" o "Raw JSON" di n8n.',
            teamIdNote: 'Trovi il campo teamId nella scheda "Team". Al trasferimento, l\'automazione (IA/n8n) per questo contatto verrà messa in pausa per l\'intervento umano.',
            step3Title: 'Evolution API (Webhook)',
            step3Desc: 'Incolla questo URL nel pannello della tua Evolution API (Webhook > Global).',
            webhookUrl: 'URL Webhook',
            criticalRule: '⚠️ Regola Critica dell\'Istanza',
            criticalRuleDesc: 'Il nome della tua istanza deve iniziare con:',
            criticalRuleNote: 'Questo assicura che i messaggi arrivino correttamente al tuo account.',
            supportLink: 'Hai bisogno di aiuto con l\'integrazione? Clicca qui',
            rotateConfirm: 'Questo invaliderà la tua chiave attuale. Vuoi continuare?',
            fetchError: 'Errore nel recupero dei dati sviluppatore:',
            rotateError: 'Errore nella rotazione della chiave:'
        }
    };

    // Language sync handled by useLanguage()


    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = authContextToken || localStorage.getItem('zap_token');
            const keyRes = await fetch('/api/integrations/api-key', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const keyData = await keyRes.json();
            setApiKey(keyData.apiKey);
        } catch (error) {
            console.error(t[lang].fetchError, error);
        } finally {
            setIsLoading(false);
        }
    };

    const rotateApiKey = async () => {
        if (!confirm(t[lang].rotateConfirm)) return;
        
        setIsRotating(true);
        try {
            const token = authContextToken || localStorage.getItem('zap_token');
            const res = await fetch('/api/integrations/api-key/rotate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setApiKey(data.apiKey);
        } catch (error) {
            console.error(t[lang].rotateError, error);
        } finally {
            setIsRotating(false);
        }
    };

    const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'https://www.zaplandia.com.br';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3 text-gray-800">
                        <Terminal className="text-primary w-8 h-8" />
                        {t[lang].title}
                    </h1>
                    <p className="text-gray-500">{t[lang].subtitle}</p>
                </div>
            </div>

            {/* API Identity Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Server size={64} />
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{t[lang].tenantIdLabel}</p>
                    <div className="flex items-center gap-2">
                        <code className="text-lg font-mono text-primary font-bold">{user?.tenantId}</code>
                    </div>
                </div>

                <div className="md:col-span-2 bg-surface border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-400">{t[lang].apiKeyLabel}</p>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{t[lang].externalUsage}</span>
                        </div>
                        <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                            <Key className="text-primary shrink-0" size={20} />
                            <input 
                                type="password" 
                                readOnly 
                                value={apiKey} 
                                className="bg-transparent border-none outline-none text-gray-300 font-mono flex-1 text-sm tracking-widest"
                            />
                            <button 
                                onClick={() => copyToClipboard(apiKey, setCopiedKey)}
                                className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400"
                            >
                                {copiedKey ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-[11px] text-gray-500 max-w-[70%]">
                            <ShieldAlert size={12} className="inline mr-1 text-primary" />
                            {t[lang].apiSecurityWarning}
                        </p>
                        <button 
                            onClick={rotateApiKey}
                            disabled={isRotating}
                            className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1.5"
                        >
                            <RefreshCw size={14} className={isRotating ? 'animate-spin' : ''} />
                            {isRotating ? t[lang].generating : t[lang].rotateKey}
                        </button>
                    </div>
                </div>
            </div>

            {/* Documentation Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Code2 className="text-primary" />
                    {t[lang].n8nGuideTitle}
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* HTTP Request Step */}
                    <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[12px]">1</span>
                                {t[lang].step1Title}
                            </h3>
                            <span className="text-xs text-primary font-mono uppercase tracking-widest">{t[lang].step1Subtitle}</span>
                        </div>
                        <div className="p-6 space-y-4 flex-1">
                            <p className="text-sm text-gray-400">{t[lang].step1Desc}</p>
                            
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-200">
                                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{t[lang].endpointUrl}</p>
                                    <div className="flex items-center justify-between">
                                        <code className="text-[12px] text-gray-700 font-bold">{baseUrl}/api/teams/transfer</code>
                                        <button onClick={() => copyToClipboard(`${baseUrl}/api/teams/transfer`, setCopiedUrl)} className="text-gray-400 hover:text-primary transition">
                                            {copiedUrl ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-black/40 rounded-xl space-y-1 border border-white/5">
                                        <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{t[lang].method}</p>
                                        <p className="text-sm font-bold">POST</p>
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-xl space-y-1 border border-white/5">
                                        <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{t[lang].auth}</p>
                                        <p className="text-sm font-bold">{t[lang].authManual}</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-200">
                                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{t[lang].requiredHeaders}</p>
                                    <code className="text-[11px] block bg-white border border-gray-100 p-2 rounded text-gray-700">
                                        <span className="text-primary font-bold">Content-Type:</span> application/json<br />
                                        <span className="text-primary font-bold">x-api-key:</span> [SUA_CHAVE_DE_API]
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* JSON Payload Step */}
                    <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[12px]">2</span>
                                {t[lang].step2Title}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4 flex-1">
                            <p className="text-sm text-gray-400">{t[lang].step2Desc}</p>
                            
                             <pre className="p-4 bg-gray-50 rounded-xl text-[12px] font-mono leading-relaxed border border-gray-200 text-gray-700 overflow-x-auto font-bold">
{`{
  "contactId": "{{$node.contactId}}",
  "teamId": "id-da-equipe-alvo",
  "userId": "id-usuario-opcional"
}`}
                            </pre>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                                    <p className="text-xs text-gray-300 italic">
                                        {t[lang].teamIdNote}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Evolution API Webhook */}
                    <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[12px]">3</span>
                                {t[lang].step3Title}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4 flex-1">
                            <p className="text-sm text-gray-400">{t[lang].step3Desc}</p>
                            
                            <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-200">
                                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{t[lang].webhookUrl}</p>
                                <div className="flex items-center justify-between">
                                    <code className="text-[11px] text-gray-700 font-bold">{baseUrl}/api/webhooks/evolution</code>
                                    <button onClick={() => copyToClipboard(`${baseUrl}/api/webhooks/evolution`, setCopiedUrl)} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400">
                                        {copiedUrl ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <p className="text-[11px] text-primary font-bold mb-1 uppercase tracking-tighter">{t[lang].criticalRule}</p>
                                    <p className="text-xs text-gray-400">
                                        {t[lang].criticalRuleDesc} <br/>
                                        <code className="text-white font-mono bg-black/40 px-1 rounded">tenant_{user?.tenantId}_</code>
                                    </p>
                                </div>
                                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                                    {t[lang].criticalRuleNote}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support Link */}
            <div className="flex justify-center pt-8">
                <a 
                    href="/dashboard/support" 
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition"
                >
                    {t[lang].supportLink}
                    <ExternalLink size={14} />
                </a>
            </div>
        </div>
    );
}
