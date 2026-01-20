'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    BarChart3,
    MessageSquare,
    TrendingUp,
    Users,
    AlertCircle,
    Calendar,
    Loader2,
    ArrowRight,
    Zap,
    Send,
    PlusCircle,
    Database
} from 'lucide-react';

export default function DashboardPage() {
    const { user, token } = useAuth();
    const router = useRouter();
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

    const handleSeed = async () => {
        if (!confirm('Deseja gerar dados de demonstração? Isso irá popular seu dashboard com chats e mensagens fictícias.')) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/seed', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Dados gerados com sucesso! Recarregando...');
                fetchStats();
                fetchActivity();
            }
        } catch (err) {
            alert('Erro ao gerar dados.');
        } finally {
            setIsLoading(false);
        }
    };

    const stats = [
        {
            name: 'Mensagens Hoje',
            value: realStats.messagesToday.toString(),
            change: 'Tempo real',
            icon: <MessageSquare className="text-primary" />
        },
        {
            name: 'Atendimentos Ativos',
            value: realStats.activeChats.toString(),
            change: 'Inbox',
            icon: <Users className="text-green-500" />
        },
        {
            name: 'Canais Conectados',
            value: realStats.connectedIntegrations.toString(),
            change: 'Ativos',
            icon: <BarChart3 className="text-accent" />
        },
    ];

    return (
        <div className="p-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Painel de Controle</h1>
                    <p className="text-gray-400 mt-1 uppercase text-[10px] tracking-widest font-bold">Bem-vindo, {user?.name}</p>
                </div>
                <div className="flex items-center space-x-4">
                    {user?.role === 'superadmin' && (
                        <button
                            onClick={handleSeed}
                            className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-2 rounded-xl border border-white/5 font-bold uppercase tracking-widest transition-all flex items-center space-x-2"
                        >
                            <Database className="w-3 h-3" />
                            <span>Gerar Dados de Teste</span>
                        </button>
                    )}
                    <div className="bg-surface border border-white/10 px-4 py-2 rounded-2xl flex items-center space-x-2 text-sm text-gray-300 shadow-xl">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-bold">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* Onboarding Banner if no integrations */}
            {!isLoading && realStats.connectedIntegrations === 0 && (
                <div className="mb-10 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 p-8 rounded-[2rem] relative overflow-hidden group shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 text-center md:text-left">
                        <div className="max-w-xl">
                            <h2 className="text-2xl font-black mb-2 flex items-center justify-center md:justify-start space-x-3">
                                <Zap className="w-8 h-8 text-yellow-500 fill-yellow-500 animate-pulse" />
                                <span>Vamos começar o seu império?</span>
                            </h2>
                            <p className="text-gray-300 font-medium">Você ainda não conectou nenhum canal. Configure suas APIs e conecte o WhatsApp, Instagram ou Facebook para ver a mágica acontecer.</p>
                        </div>
                        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                            <button
                                onClick={() => router.push('/dashboard/settings/api')}
                                className="bg-white text-black px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-transform flex items-center justify-center space-x-2 shadow-xl"
                            >
                                <PlusCircle className="w-5 h-5" />
                                <span>Configurar APIs</span>
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/integrations')}
                                className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-transform flex items-center justify-center space-x-2 shadow-xl shadow-primary/30"
                            >
                                <span>Ir para Integrações</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-surface border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-primary/20 transition-all">
                        {isLoading && (
                            <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm flex items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform ring-1 ring-white/10">{stat.icon}</div>
                            <span className="text-[10px] font-black text-green-500 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 uppercase tracking-widest">{stat.change}</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.name}</h3>
                        <p className="text-4xl font-black mt-2">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-surface border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-black">Atividade Recente</h3>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                    </div>
                    <div className="space-y-6">
                        {activity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/5 rounded-3xl text-gray-500 text-center px-8 space-y-4">
                                <Send className="w-12 h-12 opacity-10" />
                                <p className="font-medium text-sm">O fluxo de mensagens em tempo real aparecerá aqui assim que você conectar um canal.</p>
                                <button
                                    onClick={() => router.push('/dashboard/integrations')}
                                    className="text-primary font-black text-xs hover:underline uppercase tracking-widest"
                                >
                                    Conectar Agora
                                </button>
                            </div>
                        ) : (
                            activity.map((item, idx) => (
                                <div key={item.id || idx} className="flex items-center space-x-4 p-4 hover:bg-white/5 rounded-2xl transition-all group border border-transparent hover:border-white/5">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm uppercase font-black group-hover:bg-primary group-hover:text-white transition-all">
                                        {item.provider?.charAt(0) || 'M'}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-black tracking-tight underline decoration-primary/30 decoration-2 underline-offset-4">
                                                Mensagem {item.direction === 'outbound' ? 'Enviada' : 'Recebida'}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-2 font-medium">{item.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-surface border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                    <h3 className="text-2xl font-black mb-8">Status da IA</h3>
                    <div className="space-y-6">
                        <div className="p-6 bg-gradient-to-br from-white/5 to-transparent rounded-3xl flex flex-col space-y-4 border border-white/5 group hover:border-primary/30 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-2xl shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">🤖</div>
                                    <div>
                                        <p className="font-black text-lg">Agente Inteligente</p>
                                        <p className="text-[10px] text-green-500 uppercase tracking-widest font-black flex items-center space-x-2 mt-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                            <span>{realStats.connectedIntegrations > 0 ? 'Monitorando Canais' : 'Aguardando Canais'}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push('/dashboard/settings/api')}
                                    className="text-[10px] bg-primary/10 text-primary px-4 py-2 rounded-xl border border-primary/20 font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                                >
                                    Configurar
                                </button>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full bg-primary transition-all duration-1000 ${realStats.connectedIntegrations > 0 ? 'w-[75%]' : 'w-[10%]'}`}></div>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium">A IA do Zaplandia opera sobre as APIs configuradas para responder autonomamente seus clientes.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
