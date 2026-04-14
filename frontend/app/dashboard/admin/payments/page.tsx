'use client';

import React, { useState, useEffect } from 'react';
import { 
    CreditCard, 
    Save, 
    Key, 
    TrendingUp, 
    Calendar,
    ArrowUpRight,
    DollarSign,
    ShieldCheck
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';
import { useAuth } from '@/context/AuthContext';

export default function AdminPaymentsPage() {
    const { token } = useAuth();
    const [config, setConfig] = useState({ btgClientId: '', btgClientSecret: '', btgPixKey: '', btgWebhookSecret: '', isSandbox: false });
    const [revenueData, setRevenueData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [configRes, revenueRes] = await Promise.all([
                fetch(`${baseUrl}/api/billing/admin/config`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${baseUrl}/api/billing/admin/revenue`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (configRes.ok) setConfig(await configRes.json());
            if (revenueRes.ok) {
                const data = await revenueRes.json();
                // Map API data to Recharts format
                setRevenueData(data.map((item: any) => ({
                    month: item.month,
                    total: parseFloat(item.total)
                })).reverse());
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`${baseUrl}/api/billing/admin/config`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
            } else {
                setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Falha na conexão com o servidor.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 animate-pulse text-gray-500">Carregando painel financeiro...</div>;
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-xl">
                        <DollarSign className="text-primary" size={24} />
                    </div>
                    Gestão de Pagamentos
                </h1>
                <p className="text-gray-400 mt-2">Configurações globais e monitoramento de receita do sistema.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Summary */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Revenue Chart */}
                    <div className="bg-surface border border-white/5 rounded-3xl p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <TrendingUp className="text-green-500" size={20} />
                                    Receita Mensal (R$)
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Faturamento bruto confirmado dos últimos meses.</p>
                            </div>
                            <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Atualizado
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis 
                                        dataKey="month" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#4b5563', fontSize: 11 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#4b5563', fontSize: 11 }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px', fontSize: '12px' }}
                                        cursor={{ fill: '#ffffff05' }}
                                    />
                                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                                        {revenueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === revenueData.length - 1 ? '#0081ff' : '#0081ff50'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Feature Highlight Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface border border-white/5 rounded-2xl p-6 flex items-start gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Controle de Acesso</h4>
                                <p className="text-xs text-gray-400 mt-1">O sistema bloqueia automaticamente usuários com faturas pendentes ou trial expirado.</p>
                            </div>
                        </div>
                        <div className="bg-surface border border-white/5 rounded-2xl p-6 flex items-start gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Planos Dinâmicos</h4>
                                <p className="text-xs text-gray-400 mt-1">Mensal (R$ 300) e Anual (R$ 2.400) com renovação automática de acesso via Webhook.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BTG Config Sidebar */}
                <div className="space-y-8">
                    <div className="bg-surface border border-white/5 rounded-3xl p-8 shadow-xl sticky top-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <Key className="text-yellow-500" size={18} />
                                </div>
                                <h3 className="font-bold">Configuração BTG</h3>
                            </div>
                            <button 
                                onClick={() => setConfig({ ...config, isSandbox: !config.isSandbox })}
                                className={`text-[10px] font-bold px-3 py-1 rounded-full border transition flex items-center gap-2 ${config.isSandbox ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' : 'bg-green-500/10 border-green-500/50 text-green-500'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.isSandbox ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                                {config.isSandbox ? 'MODO SANDBOX' : 'MODO PRODUÇÃO'}
                            </button>
                        </div>

                        <form onSubmit={handleSaveConfig} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] uppercase text-gray-500 font-bold tracking-widest pl-1">Client ID</label>
                                <input 
                                    type="text"
                                    value={config.btgClientId}
                                    onChange={(e) => setConfig({ ...config, btgClientId: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition"
                                    placeholder="ID do Portal Developers"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] uppercase text-gray-500 font-bold tracking-widest pl-1">Client Secret</label>
                                <input 
                                    type="password"
                                    value={config.btgClientSecret}
                                    onChange={(e) => setConfig({ ...config, btgClientSecret: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition"
                                    placeholder="••••••••••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] uppercase text-gray-500 font-bold tracking-widest pl-1">Chave Pix BTG</label>
                                <input 
                                    type="text" 
                                    value={config.btgPixKey}
                                    onChange={(e) => setConfig({ ...config, btgPixKey: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition"
                                    placeholder="CPF, CNPJ, Email ou EVP"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] uppercase text-gray-500 font-bold tracking-widest pl-1">Webhook Secret BTG</label>
                                <input 
                                    type="password" 
                                    value={config.btgWebhookSecret}
                                    onChange={(e) => setConfig({ ...config, btgWebhookSecret: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition"
                                    placeholder="••••••••••••••••"
                                />
                                <p className="text-[10px] text-gray-500 pl-1 italic">Pegue esta chave no painel do BTG - Meus Aplicativos - Webhooks</p>
                            </div>

                            {message.text && (
                                <div className={`p-3 rounded-xl text-xs font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {message.text}
                                </div>
                            )}

                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <Save size={18} />
                                {isSaving ? 'Salvando...' : 'Salvar Chaves'}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs text-gray-500 italic leading-relaxed">
                                <ArrowUpRight size={14} className="text-primary shrink-0" />
                                <span>Note: Estas chaves são usadas para autenticação segura com o BTG Pactual via OAuth2.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
