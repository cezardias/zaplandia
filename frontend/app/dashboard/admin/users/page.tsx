'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Search,
    Edit,
    Trash2,
    Shield,
    Building2,
    Mail,
    Calendar,
    MoreVertical,
    X,
    Save,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface UserData {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    tenant?: {
        name: string;
    };
}

export default function UserManagementPage() {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);
        const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
        const method = editingUser ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStatus({ type: 'success', msg: editingUser ? 'Usuário atualizado!' : 'Usuário criado!' });
                fetchUsers();
                setTimeout(() => setIsModalOpen(false), 1500);
            } else {
                throw new Error('Falha ao processar requisição');
            }
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
            }
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    const openModal = (user: UserData | null = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role
            });
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'user' });
        }
        setIsModalOpen(true);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (currentUser?.role !== 'superadmin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
                <p className="text-gray-400">Você não tem permissão para acessar esta área.</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center space-x-4">
                        <Users className="w-10 h-10 text-primary" />
                        <span>Gestão de Usuários</span>
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Administre todos os usuários e acessos da plataforma.
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Novo Usuário</span>
                </button>
            </div>

            {/* Filters & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-surface border border-white/5 p-6 rounded-2xl md:col-span-2">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:border-primary outline-none transition text-white"
                        />
                    </div>
                </div>
                <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl flex flex-col justify-center">
                    <span className="text-primary-light text-sm font-medium uppercase tracking-wider">Total de Usuários</span>
                    <span className="text-3xl font-bold text-white">{users.length}</span>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cargo</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Tenant</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cadastro</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6 h-20 bg-white/5"></td>
                                    </tr>
                                ))
                            ) : filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white group-hover:text-primary transition-colors">{u.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center mt-1">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {u.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${u.role === 'superadmin'
                                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                : u.role === 'admin'
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                                            }`}>
                                            <Shield className="w-3 h-3 mr-1" />
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm text-gray-300 flex items-center">
                                            <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                                            {u.tenant?.name || 'Sistema'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => openModal(u)}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/5 rounded-lg transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-in-center">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                {editingUser ? <Edit className="w-5 h-5 mr-3 text-primary" /> : <UserPlus className="w-5 h-5 mr-3 text-primary" />}
                                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            {status && (
                                <div className={`p-4 rounded-xl flex items-center space-x-3 mb-6 ${status.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                    }`}>
                                    {status.type === 'success' ? <Shield className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    <span className="text-sm font-medium">{status.msg}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none text-white transition"
                                        placeholder="Ex: Cezar Dias"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">E-mail</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none text-white transition"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Senha {editingUser && '(Deixe em branco para manter)'}</label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none text-white transition"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Cargo / Permissão</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none text-white transition appearance-none cursor-pointer"
                                    >
                                        <option value="user" className="bg-[#121214]">Usuário Comum</option>
                                        <option value="admin" className="bg-[#121214]">Administrador</option>
                                        <option value="superadmin" className="bg-[#121214]">Super Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 border border-white/10 rounded-xl text-white font-bold hover:bg-white/5 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-primary hover:bg-primary-dark rounded-xl text-white font-bold transition flex items-center justify-center space-x-2"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>Salvar</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
