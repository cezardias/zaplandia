'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
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
    X,
    ChevronDown
} from 'lucide-react';

interface Team {
    id: string;
    name: string;
    members: any[];
}

export default function TeamsPage() {
    const { token } = useAuth();
    const { lang } = useLanguage();
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

    const t: any = {
        pt_BR: {
            title: 'Gestão de Equipes',
            desc: 'Gerencie seus atendentes e configure transferências via REST API.',
            n8nTitle: 'Integração REST para n8n',
            n8nDesc: 'Use o endpoint /api/teams/transfer para rotear conversas. Envie o contactId e teamId ou userId no body (JSON).',
            errorLoad: 'Erro ao carregar dados.',
            successCreated: 'Equipe criada com sucesso!',
            errorCreate: 'Erro ao criar equipe.',
            errorConn: 'Erro de conexão.',
            confirmDelete: 'Tem certeza que deseja excluir esta equipe?',
            successDeleted: 'Equipe excluída.',
            errorDelete: 'Erro ao excluir.',
            successAssigned: 'Atendente atualizado.',
            errorAssign: 'Erro ao atribuir usuário.',
            successAgent: 'Atendente cadastrado com sucesso!',
            errorAgent: 'Erro ao cadastrar atendente. Verifique se o e-mail já existe.',
            errorAgentConn: 'Erro de conexão ao salvar atendente.',
            newTeam: 'Nova Equipe',
            placeholderTeam: 'Ex: Vendas, Suporte Técnico, Financeiro...',
            createBtn: 'Criar',
            noTeams: 'Nenhuma equipe cadastrada.',
            noMembers: 'Sem membros',
            attendantsLabel: 'Atendentes',
            newBtn: 'Novo',
            noTeamLabel: 'Sem Equipe',
            adminNote: 'Novos usuários devem ser cadastrados na Gestão de Usuários (Admin).',
            modalTitle: 'Novo Atendente',
            agentName: 'Nome do Atendente',
            agentNamePlaceholder: 'Nome Completo',
            agentEmail: 'E-mail (Login)',
            agentEmailPlaceholder: 'email@exemplo.com',
            agentPass: 'Senha Provisória',
            agentPassPlaceholder: 'Mínimo 6 caracteres',
            registerAgentBtn: 'Cadastrar Atendente'
        },
        en_US: {
            title: 'Team Management',
            desc: 'Manage your agents and configure transfers via REST API.',
            n8nTitle: 'REST Integration for n8n',
            n8nDesc: 'Use the /api/teams/transfer endpoint to route conversations. Send contactId and teamId or userId in the body (JSON).',
            errorLoad: 'Error loading data.',
            successCreated: 'Team created successfully!',
            errorCreate: 'Error creating team.',
            errorConn: 'Connection error.',
            confirmDelete: 'Are you sure you want to delete this team?',
            successDeleted: 'Team deleted.',
            errorDelete: 'Error deleting.',
            successAssigned: 'Agent updated.',
            errorAssign: 'Error assigning user.',
            successAgent: 'Agent registered successfully!',
            errorAgent: 'Error registering agent. Check if the email already exists.',
            errorAgentConn: 'Connection error when saving agent.',
            newTeam: 'New Team',
            placeholderTeam: 'Ex: Sales, Tech Support, Finance...',
            createBtn: 'Create',
            noTeams: 'No teams registered.',
            noMembers: 'No members',
            attendantsLabel: 'Agents',
            newBtn: 'New',
            noTeamLabel: 'No Team',
            adminNote: 'New users must be registered in User Management (Admin).',
            modalTitle: 'New Agent',
            agentName: 'Agent Name',
            agentNamePlaceholder: 'Full Name',
            agentEmail: 'E-mail (Login)',
            agentEmailPlaceholder: 'email@example.com',
            agentPass: 'Temporary Password',
            agentPassPlaceholder: 'Minimum 6 characters',
            registerAgentBtn: 'Register Agent'
        },
        pt_PT: {
            title: 'Gestão de Equipas',
            desc: 'Gerencie os seus atendentes e configure transferências via REST API.',
            n8nTitle: 'Integração REST para n8n',
            n8nDesc: 'Utilize o endpoint /api/teams/transfer para encaminhar conversas. Envie o contactId e teamId ou userId no body (JSON).',
            errorLoad: 'Erro ao carregar dados.',
            successCreated: 'Equipa criada com sucesso!',
            errorCreate: 'Erro ao criar equipa.',
            errorConn: 'Erro de ligação.',
            confirmDelete: 'Tem certeza que deseja eliminar esta equipa?',
            successDeleted: 'Equipa eliminada.',
            errorDelete: 'Erro ao eliminar.',
            successAssigned: 'Atendente atualizado.',
            errorAssign: 'Erro ao atribuir utilizador.',
            successAgent: 'Atendente registado com sucesso!',
            errorAgent: 'Erro ao registar atendente. Verifique se o e-mail já existe.',
            errorAgentConn: 'Erro de ligação ao guardar atendente.',
            newTeam: 'Nova Equipa',
            placeholderTeam: 'Ex: Vendas, Suporte Técnico, Financeiro...',
            createBtn: 'Criar',
            noTeams: 'Nenhuma equipa registada.',
            noMembers: 'Sem membros',
            attendantsLabel: 'Atendentes',
            newBtn: 'Novo',
            noTeamLabel: 'Sem Equipa',
            adminNote: 'Novos utilizadores devem ser registados na Gestão de Utilizadores (Admin).',
            modalTitle: 'Novo Atendente',
            agentName: 'Nome do Atendente',
            agentNamePlaceholder: 'Nome Completo',
            agentEmail: 'E-mail (Login)',
            agentEmailPlaceholder: 'email@exemplo.com',
            agentPass: 'Palavra-passe Provisória',
            agentPassPlaceholder: 'Mínimo 6 caracteres',
            registerAgentBtn: 'Registar Atendente'
        },
        it_IT: {
            title: 'Gestione Team',
            desc: 'Gestisci i tuoi operatori e configura i trasferimenti tramite REST API.',
            n8nTitle: 'Integrazione REST per n8n',
            n8nDesc: 'Usa l\'endpoint /api/teams/transfer per instradare le conversazioni. Invia contactId e teamId o userId nel body (JSON).',
            errorLoad: 'Errore durante il caricamento dei dati.',
            successCreated: 'Team creato con successo!',
            errorCreate: 'Errore durante la creazione del team.',
            errorConn: 'Errore di connessione.',
            confirmDelete: 'Sei sicuro di voler eliminare questo team?',
            successDeleted: 'Team eliminato.',
            errorDelete: 'Errore durante l\'eliminazione.',
            successAssigned: 'Operatore aggiornato.',
            errorAssign: 'Errore durante l\'assegnazione dell\'utente.',
            successAgent: 'Operatore registrato con successo!',
            errorAgent: 'Errore durante la registrazione dell\'operatore. Verifica se l\'e-mail esiste già.',
            errorAgentConn: 'Errore di connessione durante il salvataggio dell\'operatore.',
            newTeam: 'Nuovo Team',
            placeholderTeam: 'Es: Vendite, Supporto Tecnico, Finanza...',
            createBtn: 'Crea',
            noTeams: 'Nessun team registrato.',
            noMembers: 'Nessun membro',
            attendantsLabel: 'Operatori',
            newBtn: 'Nuovo',
            noTeamLabel: 'Senza Team',
            adminNote: 'I nuovi utenti devono essere registrati nella Gestione Utenti (Admin).',
            modalTitle: 'Nuovo Operatore',
            agentName: 'Nome Operatore',
            agentNamePlaceholder: 'Nome Completo',
            agentEmail: 'E-mail (Login)',
            agentEmailPlaceholder: 'email@esempio.com',
            agentPass: 'Password Temporanea',
            agentPassPlaceholder: 'Minimo 6 caratteri',
            registerAgentBtn: 'Registra Operatore'
        }
    };

    // Language sync handled by useLanguage()


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
            setError(t[lang].errorLoad);
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
                setSuccess(t[lang].successCreated);
                fetchData();
            } else {
                setError(t[lang].errorCreate);
            }
        } catch (err) {
            setError(t[lang].errorConn);
        } finally {
            setIsCreating(false);
        }
    };

    const deleteTeam = async (id: string) => {
        if (!confirm(t[lang].confirmDelete)) return;
        try {
            const res = await fetch(`/api/teams/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSuccess(t[lang].successDeleted);
                fetchData();
            }
        } catch (err) {
            setError(t[lang].errorDelete);
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
                setSuccess(t[lang].successAssigned);
                fetchData();
            }
        } catch (err) {
            setError(t[lang].errorAssign);
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
                setSuccess(t[lang].successAgent);
                setNewAgentData({ name: '', email: '', password: '' });
                setIsAgentModalOpen(false);
                fetchData();
            } else {
                setError(t[lang].errorAgent);
            }
        } catch (err) {
            setError(t[lang].errorAgentConn);
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
                <h1 className="text-4xl font-black tracking-tight flex items-center space-x-4 text-gray-800 dark:text-white">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Users className="w-10 h-10 text-primary" />
                    </div>
                    <span>{t[lang].title}</span>
                </h1>
                <p className="text-gray-500 mt-2 text-lg">{t[lang].desc}</p>
            </div>

            {/* Integration Alert */}
            <div className="mb-8 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-red-100" style={{ backgroundColor: '#fef2f2' }}>
                <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-2xl shrink-0" style={{ backgroundColor: '#fee2e2' }}>
                        <Terminal className="w-6 h-6" style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                        <h3 className="font-bold" style={{ color: '#991b1b' }}>{t[lang].n8nTitle}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {t[lang].n8nDesc}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-red-100 font-mono text-xs shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                    <span className="text-gray-400 font-bold">API Path:</span>
                    <span className="font-bold" style={{ color: '#ef4444' }}>/api/teams/transfer</span>
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
                            <span>{t[lang].newTeam}</span>
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text" 
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                placeholder={t[lang].placeholderTeam}
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-primary transition"
                            />
                            <button 
                                onClick={createTeam}
                                disabled={isCreating || !newTeamName}
                                className="bg-primary hover:bg-primary-dark px-8 py-4 rounded-2xl font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                <span>{t[lang].createBtn}</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isLoading ? (
                            <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
                        ) : teams.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-gray-500">{t[lang].noTeams}</div>
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
                                        )) : <span className="text-xs text-gray-600">{t[lang].noMembers}</span>}
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
                                        {team.members?.length || 0} {t[lang].attendantsLabel}
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
                            <span>{t[lang].attendantsLabel}</span>
                        </h2>
                        <button 
                            onClick={() => setIsAgentModalOpen(true)}
                            className="p-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition flex items-center space-x-2 text-xs font-bold"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>{t[lang].newBtn}</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {allUsers.map(u => (
                            <div key={u.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                        {u.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-sm truncate">{u.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                                    </div>
                                </div>
                                
                                <div className="relative group/userteam">
                                    <button
                                        onClick={() => document.getElementById(`user-team-dropdown-${u.id}`)?.classList.toggle('hidden')}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary transition font-bold flex justify-between items-center"
                                        style={{ backgroundColor: '#ffffff', color: '#374151' }}
                                    >
                                        <span>{u.teamId ? teams.find(tm => tm.id === u.teamId)?.name : t[lang].noTeamLabel}</span>
                                        <ChevronDown size={12} className="text-gray-400" />
                                    </button>
                                    <div id={`user-team-dropdown-${u.id}`} className="hidden absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                                        <button
                                            onClick={() => { assignUser(u.id, null); document.getElementById(`user-team-dropdown-${u.id}`)?.classList.add('hidden'); }}
                                            className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors ${!u.teamId ? 'bg-[#ef4444] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {t[lang].noTeamLabel}
                                        </button>
                                        {teams.map(team => (
                                            <button
                                                key={team.id}
                                                onClick={() => { assignUser(u.id, team.id); document.getElementById(`user-team-dropdown-${u.id}`)?.classList.add('hidden'); }}
                                                className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors ${u.teamId === team.id ? 'bg-[#ef4444] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                {team.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <p className="text-[10px] text-gray-600 mt-6 text-center">
                        {t[lang].adminNote}
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
                                <span>{t[lang].modalTitle}</span>
                            </h3>
                            <button onClick={() => setIsAgentModalOpen(false)} className="text-gray-500 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">{t[lang].agentName}</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                        type="text" 
                                        value={newAgentData.name}
                                        onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-primary transition"
                                        placeholder={t[lang].agentNamePlaceholder}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">{t[lang].agentEmail}</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                        type="email" 
                                        value={newAgentData.email}
                                        onChange={(e) => setNewAgentData({ ...newAgentData, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-primary transition"
                                        placeholder={t[lang].agentEmailPlaceholder}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">{t[lang].agentPass}</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                        type="password" 
                                        value={newAgentData.password}
                                        onChange={(e) => setNewAgentData({ ...newAgentData, password: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-primary transition"
                                        placeholder={t[lang].agentPassPlaceholder}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={createAgent}
                                disabled={isSavingAgent || !newAgentData.name || !newAgentData.email || newAgentData.password.length < 6}
                                className="w-full bg-primary hover:bg-primary-dark py-4 rounded-2xl font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4 shadow-lg shadow-primary/20"
                            >
                                {isSavingAgent ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                <span>{t[lang].registerAgentBtn}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
