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
    const [lang, setLang] = useState<'pt_BR' | 'en_US' | 'pt_PT' | 'it_IT'>('pt_BR');

    const t: any = {
        pt_BR: {
            loading: 'Carregando dashboard...',
            globalActions: 'Ações Globais',
            globalDesc: 'Execute ações para todos os seus funis de uma só vez.',
            generateLead: 'Gerar 10 Abordagens/Funil',
            clearBase: 'Limpar Base de Leads (Perigo)',
            clearBaseConfirm: 'ATENÇÃO: Isso apagará TODOS os contatos do CRM. Tem certeza?',
            clearBaseSuccess: 'Base limpa com sucesso!',
            clearBaseError: 'Erro ao limpar:',
            clearBaseConnError: 'Erro de conexão ao limpar base.',
            totalLeads: 'Total de Leads',
            workedLeads: 'Leads Trabalhados',
            unworkedLeads: 'Leads Não Trabalhados',
            wonLeads: 'Leads Ganhos',
            lostLeads: 'Leads Perdidos',
            conversionRate: 'Taxa de Conversão',
            campaignPerf: 'Desempenho da Campanha',
            campaignPerfDesc: 'Resultado dos disparos para o funil ativo.',
            selectCampaign: 'Selecione uma campanha...',
            nextSend: 'Próximo envio',
            limitReset: 'Reset do Limite',
            quota: 'Cota',
            status: 'Status',
            channels: 'Canais',
            template: 'Template',
            defined: 'Definido',
            notAvailable: 'N/A',
            noData24h: 'Nenhum envio registrado nas últimas 24h.',
            selectFunnelDesc: 'Selecione um funil para ver o desempenho da campanha.',
            funnelHealth: 'Saúde do Funil',
            funnelHealthDesc: 'Distribuição de leads ativos por etapa.',
            campaignControl: 'Controle da Campanha',
            campaignControlDesc: 'Inicie, pare e monitore os disparos deste funil.',
            integration: 'Integração',
            forceResume: 'Forçar Retomada',
            startCampaign: 'Iniciar Campanha',
            stopCampaign: 'Parar Campanha',
            viewDetails: 'Ver Detalhes e Logs',
            limitReached: 'O limite diário de 40 envios foi atingido. Deseja forçar o reinício da cota para continuar agora?',
            startConfirm: 'Deseja iniciar os disparos para esta campanha?',
            startSuccess: 'Campanha iniciada com sucesso! As mensagens entrarão na fila.',
            startError: 'Erro ao iniciar:',
            connError: 'Erro de conexão.',
            pauseConfirm: 'Deseja pausar os disparos desta campanha?',
            pauseSuccess: 'Campanha pausada com sucesso!',
            pauseError: 'Erro ao pausar:',
            logsTitle: 'Logs de Envio',
            logsDesc: 'Últimos 50 eventos da campanha.',
            logDate: 'Data/Hora',
            logLead: 'Lead',
            logExtId: 'ID Externo',
            logStatus: 'Status',
            logError: 'Erro',
            noLogs: 'Nenhum log encontrado para esta campanha.',
            now: 'Agora',
            selectCampaignAlert: 'Selecione uma campanha!'
        },
        en_US: {
            loading: 'Loading dashboard...',
            globalActions: 'Global Actions',
            globalDesc: 'Perform actions for all your funnels at once.',
            generateLead: 'Generate 10 Leads/Funnel',
            clearBase: 'Clear Leads Base (Danger)',
            clearBaseConfirm: 'WARNING: This will delete ALL CRM contacts. Are you sure?',
            clearBaseSuccess: 'Base cleared successfully!',
            clearBaseError: 'Error clearing:',
            clearBaseConnError: 'Connection error while clearing base.',
            totalLeads: 'Total Leads',
            workedLeads: 'Worked Leads',
            unworkedLeads: 'Unworked Leads',
            wonLeads: 'Won Leads',
            lostLeads: 'Lost Leads',
            conversionRate: 'Conversion Rate',
            campaignPerf: 'Campaign Performance',
            campaignPerfDesc: 'Results of dispatches for the active funnel.',
            selectCampaign: 'Select a campaign...',
            nextSend: 'Next send',
            limitReset: 'Limit Reset',
            quota: 'Quota',
            status: 'Status',
            channels: 'Channels',
            template: 'Template',
            defined: 'Defined',
            notAvailable: 'N/A',
            noData24h: 'No dispatches recorded in the last 24h.',
            selectFunnelDesc: 'Select a funnel to see campaign performance.',
            funnelHealth: 'Funnel Health',
            funnelHealthDesc: 'Distribution of active leads per stage.',
            campaignControl: 'Campaign Control',
            campaignControlDesc: 'Start, stop and monitor the dispatches of this funnel.',
            integration: 'Integration',
            forceResume: 'Force Resume',
            startCampaign: 'Start Campaign',
            stopCampaign: 'Stop Campaign',
            viewDetails: 'View Details and Logs',
            limitReached: 'Daily limit of 40 sends reached. Do you want to force quota reset to continue now?',
            startConfirm: 'Do you want to start dispatches for this campaign?',
            startSuccess: 'Campaign started successfully! Messages will enter the queue.',
            startError: 'Error starting:',
            connError: 'Connection error.',
            pauseConfirm: 'Do you want to pause dispatches for this campaign?',
            pauseSuccess: 'Campaign paused successfully!',
            pauseError: 'Error pausing:',
            logsTitle: 'Send Logs',
            logsDesc: 'Last 50 events of the campaign.',
            logDate: 'Date/Time',
            logLead: 'Lead',
            logExtId: 'External ID',
            logStatus: 'Status',
            logError: 'Error',
            noLogs: 'No logs found for this campaign.',
            now: 'Now',
            selectCampaignAlert: 'Please select a campaign!'
        },
        pt_PT: {
            loading: 'A carregar dashboard...',
            globalActions: 'Ações Globais',
            globalDesc: 'Execute ações para todos os seus funis de uma só vez.',
            generateLead: 'Gerar 10 Abordagens/Funil',
            clearBase: 'Limpar Base de Leads (Perigo)',
            clearBaseConfirm: 'ATENÇÃO: Isto apagará TODOS os contactos do CRM. Tem a certeza?',
            clearBaseSuccess: 'Base limpa com sucesso!',
            clearBaseError: 'Erro ao limpar:',
            clearBaseConnError: 'Erro de ligação ao limpar base.',
            totalLeads: 'Total de Leads',
            workedLeads: 'Leads Trabalhados',
            unworkedLeads: 'Leads Não Trabalhados',
            wonLeads: 'Leads Ganhos',
            lostLeads: 'Leads Perdidos',
            conversionRate: 'Taxa de Conversão',
            campaignPerf: 'Desempenho da Campanha',
            campaignPerfDesc: 'Resultado dos disparos para o funil ativo.',
            selectCampaign: 'Selecione uma campanha...',
            nextSend: 'Próximo envio',
            limitReset: 'Reset do Limite',
            quota: 'Cota',
            status: 'Status',
            channels: 'Canais',
            template: 'Template',
            defined: 'Definido',
            notAvailable: 'N/A',
            noData24h: 'Nenhum envio registado nas últimas 24h.',
            selectFunnelDesc: 'Selecione um funil para ver o desempenho da campanha.',
            funnelHealth: 'Saúde do Funil',
            funnelHealthDesc: 'Distribuição de leads ativos por etapa.',
            campaignControl: 'Controle da Campanha',
            campaignControlDesc: 'Inicie, pare e monitorize os disparos deste funil.',
            integration: 'Integração',
            forceResume: 'Forçar Retoma',
            startCampaign: 'Iniciar Campanha',
            stopCampaign: 'Parar Campanha',
            viewDetails: 'Ver Detalhes e Logs',
            limitReached: 'O limite diário de 40 envios foi atingido. Deseja forçar o reinício da cota para continuar agora?',
            startConfirm: 'Deseja iniciar os disparos para esta campanha?',
            startSuccess: 'Campanha iniciada com sucesso! As mensagens entrarão na fila.',
            startError: 'Erro ao iniciar:',
            connError: 'Erro de ligação.',
            pauseConfirm: 'Deseja pausar os disparos desta campanha?',
            pauseSuccess: 'Campanha pausada com sucesso!',
            pauseError: 'Erro ao pausar:',
            logsTitle: 'Logs de Envio',
            logsDesc: 'Últimos 50 eventos da campanha.',
            logDate: 'Data/Hora',
            logLead: 'Lead',
            logExtId: 'ID Externo',
            logStatus: 'Status',
            logError: 'Erro',
            noLogs: 'Nenhum log encontrado para esta campanha.',
            now: 'Agora',
            selectCampaignAlert: 'Selecione uma campanha!'
        },
        it_IT: {
            loading: 'Caricamento dashboard...',
            globalActions: 'Azioni Globali',
            globalDesc: 'Esegui azioni per tutti i tuoi funnel contemporaneamente.',
            generateLead: 'Genera 10 Lead/Funnel',
            clearBase: 'Pulisci Base Lead (Pericolo)',
            clearBaseConfirm: 'ATTENZIONE: Questo cancellerà TUTTI i contatti del CRM. Sei sicuro?',
            clearBaseSuccess: 'Base pulita con successo!',
            clearBaseError: 'Errore durante la pulizia:',
            clearBaseConnError: 'Errore di connessione durante la pulizia della base.',
            totalLeads: 'Totale Lead',
            workedLeads: 'Lead Lavorati',
            unworkedLeads: 'Lead Non Lavorati',
            wonLeads: 'Lead Vinti',
            lostLeads: 'Lead Persi',
            conversionRate: 'Tasso di Conversione',
            campaignPerf: 'Prestazioni della Campagna',
            campaignPerfDesc: 'Risultato degli invii per il funnel attivo.',
            selectCampaign: 'Seleziona una campagna...',
            nextSend: 'Prossimo invio',
            limitReset: 'Reset del Limite',
            quota: 'Quota',
            status: 'Stato',
            channels: 'Canali',
            template: 'Template',
            defined: 'Definito',
            notAvailable: 'N/A',
            noData24h: 'Nessun invio registrato nelle ultime 24 ore.',
            selectFunnelDesc: 'Seleziona un funnel per vedere le prestazioni della campagna.',
            funnelHealth: 'Salute del Funnel',
            funnelHealthDesc: 'Distribuzione dei lead attivi per fase.',
            campaignControl: 'Controllo della Campagna',
            campaignControlDesc: 'Avvia, ferma e monitora gli invii di questo funnel.',
            integration: 'Integrazione',
            forceResume: 'Forza Ripresa',
            startCampaign: 'Avvia Campagna',
            stopCampaign: 'Ferma Campagna',
            viewDetails: 'Visualizza Dettagli e Log',
            limitReached: 'Il limite giornaliero di 40 invii è stato raggiunto. Vuoi forzare il reset della quota per continuare ora?',
            startConfirm: 'Vuoi avviare gli invii per questa campagna?',
            startSuccess: 'Campagna avviata con successo! I messaggi entreranno in coda.',
            startError: 'Errore durante l\'avvio:',
            connError: 'Errore di connessione.',
            pauseConfirm: 'Vuoi mettere in pausa gli invii per questa campagna?',
            pauseSuccess: 'Campagna in pausa con successo!',
            pauseError: 'Errore durante la pausa:',
            logsTitle: 'Log di Invio',
            logsDesc: 'Ultimi 50 eventi della campagna.',
            logDate: 'Data/Ora',
            logLead: 'Lead',
            logExtId: 'ID Esterno',
            logStatus: 'Stato',
            logError: 'Errore',
            noLogs: 'Nessun log trovato per questa campagna.',
            now: 'Adesso',
            selectCampaignAlert: 'Per favore seleziona una campagna!'
        }
    };

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
        const saved = localStorage.getItem('zap_lang');
        if (saved) setLang(saved as any);

        const handleLangChange = () => {
            const current = localStorage.getItem('zap_lang');
            if (current) setLang(current as any);
        };
        window.addEventListener('languageChange', handleLangChange);
        return () => window.removeEventListener('languageChange', handleLangChange);
    }, []);

    useEffect(() => {
        if (token && selectedCampaignId) {
            fetchStats(selectedCampaignId);
        }
    }, [selectedCampaignId, token]);

    const handleStartCampaign = async (force: boolean = false) => {
        if (!selectedCampaignId) return alert(t[lang].selectCampaignAlert);
        if (!force && !confirm(t[lang].startConfirm)) return;

        try {
            const url = `/api/campaigns/${selectedCampaignId}/start${force ? '?force=true' : ''}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert(t[lang].startSuccess);
                fetchCampaigns(); // Refresh status
            } else {
                const err = await res.json();
                alert(`${t[lang].startError} ${err.message}`);
            }
        } catch (e) {
            alert(t[lang].connError);
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
        if (!confirm(t[lang].pauseConfirm)) return;

        try {
            const res = await fetch(`/api/campaigns/${selectedCampaignId}/pause`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert(t[lang].pauseSuccess);
                fetchCampaigns();
            } else {
                const err = await res.json();
                alert(`${t[lang].pauseError} ${err.message}`);
            }
        } catch (e) { alert(t[lang].connError); }
    };

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

    const kpiCards = [
        { title: t[lang].totalLeads, value: stats?.total || 0, icon: <Users className="text-gray-400" />, sub: '' },
        { title: t[lang].workedLeads, value: stats?.trabalhadlos || 0, icon: <PlayCircle className="text-gray-400" />, sub: '' },
        { title: t[lang].unworkedLeads, value: stats?.naoTrabalhados || 0, icon: <PauseCircle className="text-gray-400" />, sub: '' },
        { title: t[lang].wonLeads, value: stats?.ganhos || 0, icon: <DollarSign className="text-gray-400" />, sub: '$' },
        { title: t[lang].lostLeads, value: stats?.perdidos || 0, icon: <UserX className="text-gray-400" />, sub: '' },
        { title: t[lang].conversionRate, value: `${stats?.conversao || 0}%`, icon: <Activity className="text-gray-400" />, sub: '%' },
    ];

    if (isLoading) return <div className="p-8 text-white">{t[lang].loading}</div>;

    const Countdown = ({ targetDate, label }: { targetDate: string | Date | null, label: string }) => {
        const [timeLeft, setTimeLeft] = useState<string>('');

        useEffect(() => {
            if (!targetDate) return;
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const target = new Date(targetDate).getTime();
                const diff = target - now;

                if (diff <= 0) {
                    setTimeLeft(t[lang].now);
                    clearInterval(timer);
                    return;
                }

                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setTimeLeft(`${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`);
            }, 1000);

            return () => clearInterval(timer);
        }, [targetDate]);

        if (!targetDate) return null;

        return (
            <div className="flex items-center space-x-2 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full animate-pulse">
                <Activity className="w-3 h-3" />
                <span>{label}: {timeLeft}</span>
            </div>
        );
    };

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
            {user?.email === 'cezar.dias@gmail.com' && (
                <div className="bg-surface border border-white/10 rounded-2xl p-6">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold">{t[lang].globalActions}</h2>
                        <p className="text-sm text-gray-400">{t[lang].globalDesc}</p>
                    </div>
                    <div className="flex space-x-4">
                        <button className="bg-primary hover:bg-primary-dark transition text-white px-6 py-2 rounded-lg font-bold flex items-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>{t[lang].generateLead}</span>
                        </button>
                        <button className="bg-primary hover:bg-primary-dark transition text-white px-6 py-2 rounded-lg font-bold flex items-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>{t[lang].generateLead}</span>
                        </button>
                        {user?.role === 'superadmin' && (
                            <button
                                onClick={async () => {
                                    if (confirm(t[lang].clearBaseConfirm)) {
                                        try {
                                            const res = await fetch('/api/crm/contacts/all', {
                                                method: 'DELETE',
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (res.ok) {
                                                alert(t[lang].clearBaseSuccess);
                                                fetchStats();
                                                fetchCampaigns(); // Also refresh campaigns logic
                                            } else {
                                                const err = await res.json();
                                                alert(`${t[lang].clearBaseError} ${err.message || 'Falha desconhecida'}`);
                                            }
                                        } catch (e) {
                                            alert(t[lang].clearBaseConnError);
                                        }
                                    }
                                }}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-6 py-2 rounded-lg font-bold flex items-center space-x-2 transition"
                            >
                                <UserX className="w-4 h-4" />
                                <span>{t[lang].clearBase}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

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
                            <h3 className="text-xl font-bold">{t[lang].campaignPerf}</h3>
                            <p className="text-sm text-gray-400">{t[lang].campaignPerfDesc}</p>
                        </div>
                        {/* Campaign Selector */}
                        <select
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-primary"
                        >
                            <option value="">{t[lang].selectCampaign}</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id} className="bg-surface text-white">{c.name} ({new Date(c.createdAt).toLocaleDateString()})</option>
                            ))}
                        </select>
                    </div>

                    {selectedCampaign ? (
                        <div className="flex-1 space-y-4 flex flex-col">
                            <div className="flex justify-between items-center px-1">
                                <div className="flex space-x-2">
                                    <Countdown targetDate={stats?.nextSendTime} label={t[lang].nextSend} />
                                    {stats?.limitRemaining === 0 && (
                                        <Countdown targetDate={stats?.limitResetTime} label={t[lang].limitReset} />
                                    )}
                                </div>
                                {stats?.limitRemaining !== undefined && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stats.limitRemaining > 5 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                                        {t[lang].quota}: {stats.limitRemaining}/40
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-gray-400">{t[lang].status}</div>
                                    <div className={`font-bold capitalize ${selectedCampaign.status === 'running' ? 'text-green-400' :
                                        selectedCampaign.status === 'paused' ? 'text-yellow-400' : 'text-gray-300'
                                        }`}>
                                        {selectedCampaign.status}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-gray-400">{t[lang].channels}</div>
                                    <div className="font-bold">{selectedCampaign.channels?.join(', ') || t[lang].notAvailable}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-gray-400">{t[lang].template}</div>
                                    <div className="font-bold truncate" title={selectedCampaign.messageTemplate}>
                                        {selectedCampaign.messageTemplate ? t[lang].defined : t[lang].notAvailable}
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
                                        {t[lang].noData24h}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-xl text-center px-4">
                            {t[lang].selectFunnelDesc}
                        </div>
                    )}
                </div>

                {/* Saude do Funil */}
                <div className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold">{t[lang].funnelHealth}</h3>
                        <p className="text-sm text-gray-400">{t[lang].funnelHealthDesc}</p>
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
            <div className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-lg">{t[lang].campaignControl}</h3>
                    <p className="text-xs text-gray-400">{t[lang].campaignControlDesc}</p>
                </div>
                {selectedCampaign && (
                    <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedCampaign.status === 'running' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                            selectedCampaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/20'
                            }`}>
                            {t[lang].status}: {selectedCampaign.status.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-white/5 text-gray-300 rounded-full text-xs font-bold border border-white/10 flex items-center space-x-2">
                            <span>{t[lang].integration}:</span>
                            <span className="text-primary truncate max-w-[150px]">{selectedCampaign.integrationId || t[lang].notAvailable}</span>
                        </span>
                    </div>
                )}
                <div className="flex space-x-2">
                    <button
                        onClick={async () => {
                            if (stats?.limitRemaining === 0) {
                                if (confirm('O limite diário de 40 envios foi atingido. Deseja forçar o reinício da cota para continuar agora?')) {
                                    handleStartCampaign(true);
                                }
                            } else {
                                handleStartCampaign();
                            }
                        }}
                        disabled={!selectedCampaign || (selectedCampaign.status === 'running' && stats?.limitRemaining > 0)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 transition ${!selectedCampaign || (selectedCampaign.status === 'running' && stats?.limitRemaining > 0)
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : stats?.limitRemaining === 0 ? 'bg-orange-500 hover:bg-orange-600 text-white animate-bounce' : 'bg-primary hover:bg-primary-dark text-white'
                            }`}
                    >
                        <PlayCircle className="w-4 h-4" />
                        <span>{stats?.limitRemaining === 0 ? t[lang].forceResume : t[lang].startCampaign}</span>
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
                        <span>{t[lang].stopCampaign}</span>
                    </button>
                    <button
                        onClick={() => {
                            fetchLogs();
                            setShowLogs(true);
                        }}
                        className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-4 py-2 rounded-lg font-bold text-sm"
                    >
                        {t[lang].viewDetails}
                    </button>
                </div>
            </div>

            {/* Logs Modal */}
            {showLogs && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">{t[lang].logsTitle}</h3>
                                <p className="text-sm text-gray-400">{t[lang].logsDesc}</p>
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
                                        <th className="pb-3 px-2">{t[lang].logDate}</th>
                                        <th className="pb-3 px-2">{t[lang].logLead}</th>
                                        <th className="pb-3 px-2">{t[lang].logExtId}</th>
                                        <th className="pb-3 px-2">{t[lang].logStatus}</th>
                                        <th className="pb-3 px-2">{t[lang].logError}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                    {logs.length > 0 ? logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition">
                                            <td className="py-4 px-2 text-gray-400">
                                                {log.sentAt ? new Date(log.sentAt).toLocaleString() : t[lang].notAvailable}
                                            </td>
                                            <td className="py-4 px-2 font-bold">{log.name}</td>
                                            <td className="py-4 px-2 text-primary font-mono text-xs">{log.externalId}</td>
                                            <td className="py-4 px-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${log.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                                                    log.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                                                        'bg-yellow-500/20 text-yellow-400'
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
                                                {t[lang].noLogs}
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
