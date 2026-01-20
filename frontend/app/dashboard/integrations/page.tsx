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
    ArrowRight
} from 'lucide-react';

interface Integration {
    id: string;
    provider: string;
    status: string;
}

const PROVIDERS = [
    { id: 'facebook', name: 'Meta / Facebook', icon: <Facebook className="w-8 h-8 text-blue-600" />, desc: 'Sincronize mensagens da sua página e automações.' },
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-8 h-8 text-pink-500" />, desc: 'Gerencie DMs e comentários em um só lugar.' },
    { id: 'whatsapp', name: 'WhatsApp API', icon: <Zap className="w-8 h-8 text-green-500" />, desc: 'Conecte o WhatsApp Business para atendimentos.' },
    { id: 'telegram', name: 'Telegram Bot', icon: <Send className="w-8 h-8 text-blue-400" />, desc: 'Gerencie bots de atendimento e vendas.' },
    { id: 'tiktok', name: 'TikTok Business', icon: <Smartphone className="w-8 h-8 text-black" />, desc: 'Responda comentários e mensagens do TikTok.' },
    { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-8 h-8 text-blue-800" />, desc: 'Automação e CRM para vendas B2B.' },
    { id: 'google_sheets', name: 'Google Sheets', icon: <Globe className="w-8 h-8 text-yellow-600" />, desc: 'Sincronize seus leads com planilhas.' },
];

export default function IntegrationsPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [connectingId, setConnectingId] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            fetchIntegrations();
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
                <button
                    onClick={() => router.push('/dashboard/settings/api')}
                    className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 transition-all font-bold text-sm"
                >
                    <Settings className="w-4 h-4" />
                    <span>Configurar APIs Globais</span>
                </button>
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
                                    {isConnected ? (
                                        <>
                                            <button
                                                onClick={() => router.push('/dashboard/settings/api')}
                                                className="w-full bg-white/5 hover:bg-white/10 text-white text-sm py-3 rounded-2xl transition font-black flex items-center justify-center space-x-2 border border-white/5"
                                            >
                                                <Settings className="w-4 h-4" />
                                                <span>Configurar</span>
                                            </button>
                                            <button
                                                onClick={() => handleDisconnect(integration.id)}
                                                className="w-full bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs py-2 rounded-xl transition font-bold"
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
        </div>
    );
}
