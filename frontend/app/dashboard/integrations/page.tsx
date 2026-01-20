'use client';

import React, { useState, useEffect } from 'react';
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
    Settings
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
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchIntegrations();
        }
    }, [token]);

    const fetchIntegrations = async () => {
        try {
            const res = await fetch('/api/integrations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setIntegrations(data);
        } catch (err) {
            console.error('Erro ao buscar integrações:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async (provider: string) => {
        // Mock connection - in a real app would open OAuth or show a modal
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
        const found = integrations.find(i => i.provider === providerId);
        return found ? found : null;
    };

    return (
        <div className="p-8 text-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Integrações</h1>
                    <p className="text-gray-400">Conecte suas redes sociais e centralize sua comunicação</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PROVIDERS.map((app) => {
                        const integration = getStatus(app.id);
                        const isConnected = !!integration;

                        return (
                            <div key={app.id} className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-primary/50 transition group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                                        {app.icon}
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${isConnected ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                        {isConnected ? 'Conectado' : 'Desconectado'}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold mb-2">{app.name}</h3>
                                <p className="text-sm text-gray-400 mb-6">{app.desc}</p>

                                <div className="flex space-x-2">
                                    {isConnected ? (
                                        <>
                                            <button
                                                onClick={() => window.location.href = '/dashboard/settings/api'}
                                                className="flex-1 bg-white/5 hover:bg-white/10 text-sm py-2 rounded-lg transition font-medium flex items-center justify-center space-x-2"
                                            >
                                                <Settings className="w-4 h-4" />
                                                <span>Configurar</span>
                                            </button>
                                            <button
                                                onClick={() => handleDisconnect(integration.id)}
                                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm py-2 rounded-lg transition font-medium"
                                            >
                                                Desconectar
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleConnect(app.id)}
                                            className="w-full bg-primary/20 hover:bg-primary/30 text-primary text-sm py-2 rounded-lg transition font-medium"
                                        >
                                            Conectar agora
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
