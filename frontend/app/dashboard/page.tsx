'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    BarChart3,
    MessageSquare,
    TrendingUp,
    Users,
    AlertCircle,
    Calendar,
    Loader2
} from 'lucide-react';

export default function DashboardPage() {
    const { user, token } = useAuth();
    const [realStats, setRealStats] = useState({
        messagesToday: 0,
        activeChats: 0,
        connectedIntegrations: 0
    });
    const [activity, setActivity] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchStats();
            fetchActivity();
        }
    }, [token]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRealStats(data);
            }
        } catch (err) {
            console.error('Erro ao buscar stats do dashboard:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActivity = async () => {
        try {
            const res = await fetch('/api/dashboard/activity', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setActivity(data);
            }
        } catch (err) {
            console.error('Erro ao buscar atividade:', err);
        }
    };

    const stats = [
        {
            name: 'Mensagens Hoje',
            value: realStats.messagesToday.toString(),
            change: '+--',
            icon: <MessageSquare className="text-primary" />
        },
        {
            name: 'Atendimentos Ativos',
            value: realStats.activeChats.toString(),
            change: '+--',
            icon: <Users className="text-green-500" />
        },
        {
            name: 'Integrações Conectadas',
            value: realStats.connectedIntegrations.toString(),
            change: 'Ativas',
            icon: <BarChart3 className="text-accent" />
        },
    ];

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-bold">Resumo Diário</h1>
                    <p className="text-gray-400 mt-1">Bem-vindo de volta, {user?.name}!</p>
                </div>
                <div className="flex space-x-3">
                    <div className="bg-surface border border-white/10 px-4 py-2 rounded-xl flex items-center space-x-2 text-sm text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-surface border border-white/5 p-6 rounded-2xl shadow-xl shadow-black/20 relative overflow-hidden">
                        {isLoading && (
                            <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/5 rounded-xl">{stat.icon}</div>
                            <span className="text-xs font-bold text-green-500 px-2 py-1 bg-green-500/10 rounded-lg">{stat.change}</span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface border border-white/5 rounded-2xl p-6 min-h-[300px]">
                    <h3 className="text-xl font-bold mb-6">Atividade Recente</h3>
                    <div className="space-y-4">
                        {activity.length === 0 ? (
                            <div className="flex items-center justify-center h-48 border-2 border-dashed border-white/5 rounded-xl text-gray-500 text-center px-4">
                                Acompanhe o fluxo de mensagens em tempo real aqui. Conecte uma integração para começar.
                            </div>
                        ) : (
                            activity.map((item, idx) => (
                                <div key={item.id || idx} className="flex items-center space-x-4 p-3 hover:bg-white/5 rounded-xl transition">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs uppercase font-bold">
                                        {item.provider?.charAt(0) || 'M'}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center bg-transparent">
                                            <p className="text-sm font-bold truncate">Mensagem {item.direction === 'outbound' ? 'Enviada' : 'Recebida'}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(item.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate mt-1">{item.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-surface border border-white/5 rounded-2xl p-6 min-h-[300px]">
                    <h3 className="text-xl font-bold mb-6">Agentes de IA</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl flex items-center justify-between border border-primary/20">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">🤖</div>
                                <div>
                                    <p className="font-bold">Agente Inteligente</p>
                                    <p className="text-xs text-green-500">{realStats.connectedIntegrations > 0 ? 'Status: Monitorando Integrações' : 'Status: Aguardando Integração'}</p>
                                </div>
                            </div>
                            <button className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg border border-primary/50">Configurar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
