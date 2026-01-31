'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
];

export default function IntegrationsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
    const [aiConfig, setAiConfig] = useState({ enabled: false, prompt: '' });
    const [isSavingAI, setIsSavingAI] = useState(false);
    const [showEvolutionModal, setShowEvolutionModal] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState<any[]>([]);

    useEffect(() => {
        if (token) {
            fetchIntegrations();
            fetch('/api/ai/prompts', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => setSavedPrompts(data))
                .catch(err => console.error(err));
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
            enabled: integration.settings?.aiEnabled || false,
            prompt: integration.settings?.aiPrompt || ''
        });
    };

    const handleSaveAI = async () => {
        if (!selectedIntegration) return;
        setIsSavingAI(true);
        try {
            const res = await fetch(`/api/integrations/${selectedIntegration.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    settings: {
                        ...selectedIntegration.settings,
                        aiEnabled: aiConfig.enabled,
                        aiPrompt: aiConfig.prompt
                    }
                })
            });
            if (res.ok) {
                fetchIntegrations();
                setSelectedIntegration(null);
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
                    <h1 className="text-4xl font-extrabold tracking-tight">Canais Conectados</h1>
                    <p className="text-gray-400 mt-2">Ative e configure as redes onde sua empresa atende.</p>
                </div>
                {user?.role === 'superadmin' && (
                    <button
                        onClick={() => router.push('/dashboard/settings/api')}
                        className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 transition-all font-bold text-sm"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Configurar APIs Globais</span>
                    </button>
                )}
            </div>


            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-32 space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-gray-500 animate-pulse">Carregando integrações...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {PROVIDERS.map((app) => {
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
                                        {isConnected ? 'Ativo' : 'Pausado'}
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
                                                <span>GERENCIAR WHATSAPP (NOVO)</span>
                                            </button>

                                            {isConnected && (
                                                <button
                                                    onClick={() => openAIModal(integration)}
                                                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs py-2 rounded-xl transition font-bold flex items-center justify-center space-x-2 border border-primary/20"
                                                >
                                                    <Bot className="w-3.5 h-3.5" />
                                                    <span>Configurar IA</span>
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
                                                <span>Configurar</span>
                                            </button>
                                            <button
                                                onClick={() => openAIModal(integration)}
                                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs py-2 rounded-xl transition font-bold flex items-center justify-center space-x-2 border border-primary/20"
                                            >
                                                <Bot className="w-3.5 h-3.5" />
                                                <span>Configurar IA</span>
                                            </button>
                                            <button
                                                onClick={() => handleDisconnect(integration.id)}
                                                className="w-full bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] py-1.5 rounded-lg transition font-medium"
                                            >
                                                Interromper Conexão
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleConnect(app.id)}
                                            disabled={isConnecting}
                                            className="w-full bg-primary hover:bg-primary-dark text-white text-sm py-4 rounded-2xl transition font-black shadow-lg shadow-primary/20 flex items-center justify-center space-x-2"
                                        >
                                            {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                            <span>{isConnecting ? 'Conectando...' : 'Conectar Agora'}</span>
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
                            <div className="flex items-center space-x-4 mb-2">
                                <div className="p-3 bg-white/5 rounded-2xl">
                                    <Bot className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">Agente de IA</h2>
                                    <p className="text-gray-400 text-sm">{selectedIntegration.provider.toUpperCase()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div>
                                    <p className="font-bold">Ativar Automação</p>
                                    <p className="text-xs text-gray-400">O robô responderá automaticamente</p>
                                </div>
                                <button
                                    onClick={() => setAiConfig({ ...aiConfig, enabled: !aiConfig.enabled })}
                                    className={`w-14 h-8 rounded-full transition-all relative ${aiConfig.enabled ? 'bg-primary' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${aiConfig.enabled ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Instruções do Agente (Prompt)</label>

                                    <select
                                        className="bg-black/40 border border-white/10 rounded-lg text-xs px-2 py-1 text-white outline-none"
                                        onChange={(e) => {
                                            const selected = savedPrompts.find(p => p.id === e.target.value);
                                            if (selected) setAiConfig({ ...aiConfig, prompt: selected.content });
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Carregar Prompt Salvo...</option>
                                        {savedPrompts.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <textarea
                                    value={aiConfig.prompt}
                                    onChange={(e) => setAiConfig({ ...aiConfig, prompt: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm h-48 focus:border-primary outline-none transition-all resize-none"
                                    placeholder="Ex: Você é um vendedor simpático do Mercado Livre. Sempre tente fechar a venda e tire dúvidas técnicas sobre os produtos..."
                                />
                                <p className="text-[10px] text-gray-500">Defina a personalidade e as regras de abordagem para este canal específico.</p>
                            </div>
                        </div>

                        <div className="p-8 bg-white/5 flex space-x-4">
                            <button
                                onClick={() => setSelectedIntegration(null)}
                                className="flex-1 px-6 py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveAI}
                                disabled={isSavingAI}
                                className="flex-[2] bg-primary hover:bg-primary-dark text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 transition"
                            >
                                {isSavingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                <span>Salvar Configuração</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
