'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Plus,
    Search,
    BarChart2,
    Clock,
    MoreHorizontal,
    Zap,
    Instagram,
    Facebook,
    ShoppingBag,
    Store,
    Youtube,
    Loader2,
    Play,
    Pause,
    Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Campaign {
    id: string;
    name: string;
    status: string;
    channels: string[];
    createdAt: string;
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();
    const router = useRouter();

    const fetchCampaigns = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/campaigns', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data);
            }
        } catch (err) {
            console.error('Erro ao buscar campanhas:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [token]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'paused': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-red-500/10 text-red-500 border-red-500/20';
        }
    };

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'whatsapp': return <Zap className="w-4 h-4 text-green-500" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
            case 'mercadolivre': return <ShoppingBag className="w-4 h-4 text-yellow-500" />;
            case 'olx': return <Store className="w-4 h-4 text-orange-600" />;
            case 'youtube': return <Youtube className="w-4 h-4 text-red-600" />;
            default: return null;
        }
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Gestão de Campanhas</h1>
                    <p className="text-gray-400 mt-2">Crie e monitore suas transmissões em massa.</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/crm/campaigns/new')}
                    className="flex items-center space-x-2 bg-primary hover:bg-primary-dark px-6 py-3 rounded-2xl transition shadow-lg shadow-primary/20 font-black"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nova Campanha</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-32 space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-gray-500 animate-pulse">Carregando suas campanhas...</p>
                </div>
            ) : campaigns.length === 0 ? (
                <div className="bg-surface border border-white/5 rounded-3xl p-20 text-center flex flex-col items-center justify-center">
                    <BarChart2 className="w-16 h-16 text-gray-500 opacity-20 mb-6" />
                    <h3 className="text-xl font-bold mb-2">Nenhuma campanha por aqui ainda</h3>
                    <p className="text-gray-500 max-w-sm mb-8">Comece criando sua primeira campanha de engajamento para seus clientes.</p>
                    <button
                        onClick={() => router.push('/dashboard/crm/campaigns/new')}
                        className="bg-white/5 hover:bg-white/10 px-8 py-3 rounded-2xl border border-white/10 transition font-bold"
                    >
                        Criar Agora
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {campaigns.map((campaign) => (
                        <div key={campaign.id} className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition group flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center space-x-4">
                                <div className={`p-4 rounded-xl bg-white/5 flex items-center justify-center`}>
                                    <BarChart2 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{campaign.name}</h3>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <div className="flex items-center -space-x-1">
                                            {campaign.channels.map(c => (
                                                <div key={c} className="bg-background p-1 rounded-full border border-surface shadow-sm">
                                                    {getChannelIcon(c)}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-500">• Criada em {new Date(campaign.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(campaign.status)}`}>
                                    {campaign.status}
                                </span>

                                <div className="h-4 w-px bg-white/10 hidden md:block"></div>

                                <div className="flex items-center space-x-2">
                                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition" title="Pausar/Retomar">
                                        {campaign.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                    <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition" title="Excluir">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
