'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    BarChart3,
    MessageSquare,
    TrendingUp,
    Users,
    AlertCircle,
    Calendar
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();

    const stats = [
        { name: 'Mensagens Hoje', value: '1,284', change: '+12.5%', icon: <MessageSquare className="text-primary" /> },
        { name: 'Atendimentos Ativos', value: '42', change: '+2', icon: <Users className="text-green-500" /> },
        { name: 'Lead Score Médio', value: '8.4', change: '+0.4', icon: <TrendingUp className="text-accent" /> },
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
                        <span>17 de Janeiro, 2026</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-surface border border-white/5 p-6 rounded-2xl shadow-xl shadow-black/20">
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
                    <div className="flex items-center justify-center h-48 border-2 border-dashed border-white/5 rounded-xl text-gray-500">
                        Gráfico de atividade omnichannel em desenvolvimento...
                    </div>
                </div>

                <div className="bg-surface border border-white/5 rounded-2xl p-6 min-h-[300px]">
                    <h3 className="text-xl font-bold mb-6">Agentes de IA</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl flex items-center justify-between border border-primary/20">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">🤖</div>
                                <div>
                                    <p className="font-bold">Agente de Vendas 01</p>
                                    <p className="text-xs text-green-500">Status: Ativo & Aprendendo</p>
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
