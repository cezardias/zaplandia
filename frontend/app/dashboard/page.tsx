'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Users, PlayCircle, PauseCircle, Activity,
    DollarSign, UserX, BarChart3, Zap, Copy, FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function DashboardPage() {
    const { user, token } = useAuth();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = async (campaignId?: string) => {
        try {
            const url = campaignId ? `/api/crm/stats?campaignId=${campaignId}` : '/api/crm/stats';
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/campaigns', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data);
                // Auto-select latest if not selected
                if (data.length > 0 && !selectedCampaignId) {
                    setSelectedCampaignId(data[0].id);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        if (token) {
            setIsLoading(true);
            Promise.all([fetchStats(selectedCampaignId), fetchCampaigns()]).finally(() => setIsLoading(false));
        }
    }, [token]);

    useEffect(() => {
        if (token && selectedCampaignId) {
            fetchStats(selectedCampaignId);
        }
    }, [selectedCampaignId, token]);

    const handleStartCampaign = async () => {
        if (!selectedCampaignId) return alert('Selecione uma campanha!');
        if (!confirm('Deseja iniciar os disparos para esta campanha?')) return;

        try {
            const res = await fetch(`/api/campaigns/${selectedCampaignId}/start`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Campanha iniciada com sucesso! As mensagens entrarão na fila.');
                fetchCampaigns(); // Refresh status
            } else {
                const err = await res.json();
                alert(`Erro ao iniciar: ${err.message}`);
            }
        } catch (e) {
            alert('Erro de conexão.');
        }
    }

    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);

    const fetchLogs = async () => {
        if (!selectedCampaignId) return;
        try {
            const res = await fetch(`/api/crm/campaign-logs/${selectedCampaignId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (e) { console.error(e); }
    };

    const handlePauseCampaign = async () => {
        if (!selectedCampaignId) return;
        if (!confirm('Deseja pausar os disparos desta campanha?')) return;

        try {
            const res = await fetch(`/api/campaigns/${selectedCampaignId}/pause`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Campanha pausada com sucesso!');
                fetchCampaigns();
            } else {
                const err = await res.json();
                alert(`Erro ao pausar: ${err.message}`);
            }
        } catch (e) { alert('Erro de conexão.'); }
    };

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

    const kpiCards = [
        { title: 'Total de Leads', value: stats?.total || 0, icon: <Users className="text-gray-400" />, sub: '' },
        { title: 'Leads Trabalhados', value: stats?.trabalhadlos || 0, icon: <PlayCircle className="text-gray-400" />, sub: '' },
        { title: 'Leads Não Trabalhados', value: stats?.naoTrabalhados || 0, icon: <PauseCircle className="text-gray-400" />, sub: '' },
        { title: 'Leads Ganhos', value: stats?.ganhos || 0, icon: <DollarSign className="text-gray-400" />, sub: '$' },
        { title: 'Leads Perdidos', value: stats?.perdidos || 0, icon: <UserX className="text-gray-400" />, sub: '' },
        { title: 'Taxa de Conversão', value: `${stats?.conversao || 0}%`, icon: <Activity className="text-gray-400" />, sub: '%' },
    ];

    if (isLoading) return <div className="p-8 text-white">Carregando dashboard...</div>;

    const CustomXAxis = (props: any) => {
        const { x, y, stroke, payload } = props;
        return (
            <g transform={`translate(${x},${y})`}>
                <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)" fontSize={10}>
                    {payload.value}
                </text>
            </g>
        );
    };

    return (
        <div className="p-8 space-y-6 text-white h-full overflow-y-auto relative">
            {/* Global Actions */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-bold">Ações Globais</h2>
                    <p className="text-sm text-gray-400">Execute ações para todos os seus funis de uma só vez.</p>
                </div>
                <div className="flex space-x-4">
                    <button className="bg-primary hover:bg-primary-dark transition text-white px-6 py-2 rounded-lg font-bold flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>Gerar 10 Abordagens/Funil</span>
                    </button>
                    <button className="bg-primary hover:bg-primary-dark transition text-white px-6 py-2 rounded-lg font-bold flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>Gerar 10 Abordagens/Funil</span>
                    </button>
                    {user?.role === 'superadmin' && (
                        <button
                            onClick={async () => {
                                if (confirm('ATENÇÃO: Isso apagará TODOS os contatos do CRM. Tem certeza?')) {
                                    try {
                                        const res = await fetch('/api/crm/contacts/all', {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        if (res.ok) {
                                            alert('Base limpa com sucesso!');
                                            fetchStats();
                                            fetchCampaigns(); // Also refresh campaigns logic
                                        } else {
                                            const err = await res.json();
                                            alert(`Erro ao limpar: ${err.message || 'Falha desconhecida'}`);
                                        }
                                    } catch (e) {
                                        alert('Erro de conexão ao limpar base.');
                                    }
                                }
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-6 py-2 rounded-lg font-bold flex items-center space-x-2 transition"
                        >
                            <UserX className="w-4 h-4" />
                            <span>Limpar Base de Leads (Perigo)</span>
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpiCards.map((card, idx) => (
                    <div key={idx} className="bg-surface border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-32 hover:border-primary/50 transition">
                        <div className="flex justify-between items-start">
                            <span className="text-sm font-bold text-gray-400">{card.title}</span>
                            {card.icon}
                        </div>
                        <div className="text-3xl font-black">{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Campaign & Funnel Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                {/* Desempenho da Campanha */}
                <div className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col">
                    <div className="mb-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">Desempenho da Campanha</h3>
                            <p className="text-sm text-gray-400">Resultado dos disparos para o funil ativo.</p>
                        </div>
                        {/* Campaign Selector */}
                        <select
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-primary"
                        >
                            <option value="">Selecione uma campanha...</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({new Date(c.createdAt).toLocaleDateString()})</option>
                            ))}
                        </select>
                    </div>

                    {selectedCampaign ? (
                        <div className="flex-1 space-y-4 flex flex-col">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-gray-400">Status</div>
                                    <div className={`font-bold capitalize ${selectedCampaign.status === 'running' ? 'text-green-400' :
                                        selectedCampaign.status === 'paused' ? 'text-yellow-400' : 'text-gray-300'
                                        }`}>
                                        {selectedCampaign.status}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-gray-400">Canais</div>
                                    <div className="font-bold">{selectedCampaign.channels?.join(', ') || 'N/A'}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-gray-400">Template</div>
                                    <div className="font-bold truncate" title={selectedCampaign.messageTemplate}>
                                        {selectedCampaign.messageTemplate ? 'Definido' : 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 bg-white/5 rounded-xl p-4">
                                {stats?.sendChartData?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.sendChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis dataKey="hour" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                                        Nenhum envio registrado nas últimas 24h.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
                            Selecione um funil para ver o desempenho da campanha.
                        </div>
                    )}
                </div>

                {/* Saude do Funil */}
                <div className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold">Saúde do Funil</h3>
                        <p className="text-sm text-gray-400">Distribuição de leads ativos por etapa.</p>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.funnelData || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.funnelData?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Campaign Control (Bottom) */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg">Controle da Campanha</h3>
                    <p className="text-xs text-gray-400">Inicie, pare e monitore os disparos deste funil.</p>
                </div>
                {selectedCampaign && (
                    <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedCampaign.status === 'running' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                            selectedCampaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/20'
                            }`}>
                            Status: {selectedCampaign.status.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-white/5 text-gray-300 rounded-full text-xs font-bold border border-white/10 flex items-center space-x-2">
                            <span>Integração:</span>
                            <span className="text-primary truncate max-w-[150px]">{selectedCampaign.integrationId || 'N/A'}</span>
                        </span>
                    </div>
                )}
                <div className="flex space-x-2">
                    <button
                        onClick={handleStartCampaign}
                        disabled={!selectedCampaign || selectedCampaign.status === 'running'}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 transition ${!selectedCampaign || selectedCampaign.status === 'running'
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-primary hover:bg-primary-dark text-white'
                            }`}
                    >
                        <PlayCircle className="w-4 h-4" />
                        <span>Iniciar Campanha</span>
                    </button>
                    <button
                        onClick={handlePauseCampaign}
                        disabled={!selectedCampaign || selectedCampaign.status !== 'running'}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 transition ${!selectedCampaign || selectedCampaign.status !== 'running'
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                    >
                        <PauseCircle className="w-4 h-4" />
                        <span>Parar Campanha</span>
                    </button>
                    <button
                        onClick={() => {
                            fetchLogs();
                            setShowLogs(true);
                        }}
                        className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-4 py-2 rounded-lg font-bold text-sm"
                    >
                        Ver Detalhes e Logs
                    </button>
                </div>
            </div>

            {/* Logs Modal */}
            {showLogs && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">Logs de Envio</h3>
                                <p className="text-sm text-gray-400">Últimos 50 eventos da campanha.</p>
                            </div>
                            <button
                                onClick={() => setShowLogs(false)}
                                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 transition"
                            >
                                <Zap className="w-6 h-6 rotate-45" /> {/* Close button icon */}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <table className="w-full text-left">
                                <thead className="text-xs uppercase text-gray-500 border-b border-white/5">
                                    <tr>
                                        <th className="pb-3 px-2">Data/Hora</th>
                                        <th className="pb-3 px-2">Lead</th>
                                        <th className="pb-3 px-2">ID Externo</th>
                                        <th className="pb-3 px-2">Status</th>
                                        <th className="pb-3 px-2">Erro</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                    {logs.length > 0 ? logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition">
                                            <td className="py-4 px-2 text-gray-400">
                                                {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'Pendente'}
                                            </td>
                                            <td className="py-4 px-2 font-bold">{log.name}</td>
                                            <td className="py-4 px-2 text-primary font-mono text-xs">{log.externalId}</td>
                                            <td className="py-4 px-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${log.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                                                    log.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                                                        'bg-yellow-500/20 text-yellow-500'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-2 text-red-400 text-xs italic truncate max-w-[200px]" title={log.errorReason}>
                                                {log.errorReason || '-'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-gray-500 italic">
                                                Nenhum log encontrado para esta campanha.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
