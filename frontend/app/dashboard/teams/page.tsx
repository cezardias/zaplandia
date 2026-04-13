'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
    Users, 
    Plus, 
    Trash2, 
    UserPlus, 
    Shield, 
    Terminal, 
    Loader2, 
    CheckCircle2,
    Copy,
    Layout,
    Mail,
    Lock,
    X
} from 'lucide-react';

interface Team {
    id: string;
    name: string;
    members: any[];
}

export default function TeamsPage() {
    const { token, user } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [newAgentData, setNewAgentData] = useState({ name: '', email: '', password: '' });
    const [isSavingAgent, setIsSavingAgent] = useState(false);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [teamsRes, usersRes] = await Promise.all([
                fetch('/api/teams', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (teamsRes.ok) setTeams(await teamsRes.json());
            if (usersRes.ok) {
                setAllUsers(await usersRes.json());
            }
        } catch (err) {
            console.error('Failed to fetch teams/users', err);
            setError('Erro ao carregar dados.');
        } finally {
            setIsLoading(false);
        }
    };

    const createTeam = async () => {
        if (!newTeamName.trim()) return;
        setIsCreating(true);
        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newTeamName })
            });

            if (res.ok) {
                setNewTeamName('');
                setSuccess('Equipe criada com sucesso!');
                fetchData();
            } else {
                setError('Erro ao criar equipe.');
            }
        } catch (err) {
            setError('Erro de conexão.');
        } finally {
            setIsCreating(false);
        }
    };

    const deleteTeam = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta equipe?')) return;
        try {
            const res = await fetch(`/api/teams/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSuccess('Equipe excluída.');
                fetchData();
            }
        } catch (err) {
            setError('Erro ao excluir.');
        }
    };

    const assignUser = async (userId: string, teamId: string | null) => {
        try {
            const res = await fetch('/api/teams/user/assign', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, teamId })
            });
            if (res.ok) {
                setSuccess('Atendente atualizado.');
                fetchData();
            }
        } catch (err) {
            setError('Erro ao atribuir usuário.');
        }
    };

    const createAgent = async () => {
        if (!newAgentData.name || !newAgentData.email || !newAgentData.password) return;
        setIsSavingAgent(true);
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAgentData)
            });

            if (res.ok) {
                setSuccess('Atendente cadastrado com sucesso!');
                setNewAgentData({ name: '', email: '', password: '' });
                setIsAgentModalOpen(false);
                fetchData();
            } else {
                setError('Erro ao cadastrar atendente. Verifique se o e-mail já existe.');
            }
        } catch (err) {
            setError('Erro de conexão ao salvar atendente.');
        } finally {
            setIsSavingAgent(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(text);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    return (
        <div className="p-8 text-white pb-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black tracking-tight flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Users className="w-10 h-10 text-primary" />
                    </div>
                    <span>Gestão de Equipes</span>
                </h1>
                <p className="text-gray-400 mt-2 text-lg">Gerencie seus atendentes e configure transferências via REST API.</p>
            </div>

            {/* Integration Alert */}
            <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-500/20 rounded-2xl shrink-0">
                        <Terminal className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-400">Integração REST para n8n</h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Use o endpoint <code>/api/teams/transfer</code> para rotear conversas. <br/>
                            Envie o <code>contactId</code> e <code>teamId</code> ou <code>userId</code> no body (JSON).
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5 font-mono text-xs">
                    <span className="text-gray-500">API Path:</span>
                    <span className="text-blue-300">/api/teams/transfer</span>
                </div>
            </div>

            {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">{error}</div>}
            {success && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm flex justify-between items-center">
                <span>{success}</span>
                <button onClick={() => setSuccess(null)}>✕</button>
            </div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Team Creation & List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface border border-white/10 rounded-3xl p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                            <Layout className="w-5 h-5 text-primary" />
                            <span>Nova Equipe</span>
                        </h2>
                        <div className="flex space-x-3">
                            <input 
                                type="text" 
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                placeholder="Ex: Vendas, Suporte Técnico, Financeiro..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-primary transition"
                            />
                            <button 
                                onClick={createTeam}
                                disabled={isCreating || !newTeamName}
                                className="bg-primary hover:bg-primary-dark px-8 py-4 rounded-2xl font-bold transition flex items-center space-x-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                <span>Criar</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isLoading ? (
                            <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
                        ) : teams.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-gray-500">Nenhuma equipe cadastrada.</div>
                        ) : teams.map(team => (
                            <div key={team.id} className="bg-surface border border-white/10 rounded-3xl p-6 hover:border-primary/30 transition group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold group-hover:text-primary transition">{team.name}</h3>
                                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                            <span className="font-mono">ID: {team.id.substring(0, 8)}...</span>
                                            <button 
                                                onClick={() => copyToClipboard(team.id)}
                                                className="hover:text-white transition"
                                                title="Copiar ID Completo"
                                            >
                                                {copySuccess === team.id ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => deleteTeam(team.id)}
                                        className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-xl transition"
                                        title="Excluir Equipe"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex -space-x-2">
                                        {team.members?.length > 0 ? team.members.map((m: any) => (
                                            <div key={m.id} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-surface flex items-center justify-center text-[10px] font-bold text-primary" title={m.name}>
                                                {m.name.charAt(0)}
                                            </div>
                                        )) : <span className="text-xs text-gray-600">Sem membros</span>}
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
                                        {team.members?.length || 0} Atendentes
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Agents Management */}
                <div className="bg-surface border border-white/10 rounded-3xl p-6 flex flex-col h-fit shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <span>Atendentes</span>
                        </h2>
                        <button 
                            onClick={() => setIsAgentModalOpen(true)}
                            className="p-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition flex items-center space-x-2 text-xs font-bold"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Novo</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {allUsers.map(u => (
                            <div key={u.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-sm truncate">{u.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                                    </div>
                                </div>
                                
                                <select 
                                    value={u.teamId || ''}
                                    onChange={(e) => assignUser(u.id, e.target.value || null)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary transition"
                                    title="Selecionar Equipe para o Atendente"
                                >
                                    <option value="">Sem Equipe</option>
                                    {teams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                    
                    <p className="text-[10px] text-gray-600 mt-6 text-center">
                        Novos usuários devem ser cadastrados na Gestão de Usuários (Admin).
                    </p>
                </div>
            </div>
            {/* Modal: New Agent */}
            {isAgentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAgentModalOpen(false)} />
                    <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center space-x-3">
                                <UserPlus className="text-primary" />
                                <span>Novo Atendente</span>
                            </h3>
                            <button onClick={() => setIsAgentModalOpen(false)} className="text-gray-500 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Nome do Atendente</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                        type="text" 
                                        value={newAgentData.name}
                                        onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-primary transition"
                                        placeholder="Nome Completo"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">E-mail (Login)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                        type="email" 
                                        value={newAgentData.email}
                                        onChange={(e) => setNewAgentData({ ...newAgentData, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-primary transition"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Senha Provisória</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                        type="password" 
                                        value={newAgentData.password}
                                        onChange={(e) => setNewAgentData({ ...newAgentData, password: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-primary transition"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={createAgent}
                                disabled={isSavingAgent || !newAgentData.name || !newAgentData.email || newAgentData.password.length < 6}
                                className="w-full bg-primary hover:bg-primary-dark py-4 rounded-2xl font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4 shadow-lg shadow-primary/20"
                            >
                                {isSavingAgent ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                <span>Cadastrar Atendente</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
