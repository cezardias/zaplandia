'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Users,
    Search,
    UserPlus,
    Filter,
    MoreHorizontal,
    Mail,
    Phone,
    MessageSquare,
    Database,
    Loader2,
    Zap,
    Instagram,
    Facebook,
    ShoppingBag,
    Store,
    BarChart2,
    HelpCircle,
    Trello,
    Send
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Contact {
    id: string;
    name: string;
    phoneNumber?: string;
    externalId?: string;
    lastMessage?: string;
    provider: string;
    updatedAt: string;
}

export default function CrmPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, token } = useAuth();
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState('');

    const fetchContacts = async (search = '') => {
        if (!token) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('q', search);

            const res = await fetch(`/api/crm/contacts?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) router.push('/auth/login');
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (err) {
            console.error('Erro ao buscar contatos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [token]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) fetchContacts(searchTerm);
            else fetchContacts();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSeed = async () => {
        if (!confirm('Gerar dados de demonstração no CRM?')) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/seed', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Dados gerados! Recarregando...');
                fetchContacts();
            }
        } catch (err) {
            alert('Erro ao gerar dados.');
        } finally {
            setIsLoading(false);
        }
    };

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'whatsapp': return <Zap className="w-4 h-4 text-green-500" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
            case 'mercadolivre': return <ShoppingBag className="w-4 h-4 text-yellow-500" />;
            case 'olx': return <Store className="w-4 h-4 text-orange-600" />;
            default: return <Users className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold flex items-center space-x-3">
                        <Users className="w-8 h-8 text-primary" />
                        <span>CRM de Contatos</span>
                    </h1>
                    <p className="text-gray-400 mt-2">Gerencie seus contatos de todos os canais em um só lugar.</p>
                </div>

                <div className="flex space-x-3">

                    <button
                        onClick={() => router.push('/dashboard/crm/kanban')}
                        className="flex items-center space-x-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-xl transition font-bold border border-primary/20"
                    >
                        <Trello className="w-4 h-4" />
                        <span>Pipeline</span>
                    </button>

                    <button
                        onClick={() => router.push('/dashboard/crm/funnels')}
                        className="flex items-center space-x-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-xl transition font-bold border border-primary/20"
                    >
                        <Database className="w-4 h-4" />
                        <span>Funis</span>
                    </button>

                    <button
                        onClick={() => router.push('/dashboard/crm/campaigns')}
                        className="flex items-center space-x-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-xl transition font-bold border border-primary/20"
                    >
                        <Send className="w-4 h-4" />
                        <span>Campanhas</span>
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/support')}
                        className="flex items-center space-x-2 bg-surface hover:bg-white/5 text-gray-400 px-4 py-2.5 rounded-xl transition font-bold border border-white/5"
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span>Suporte</span>
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/crm/new')}
                        className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center space-x-2 shadow-lg shadow-primary/20"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Novo Contato</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-surface p-4 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-sm">Total de Contatos</p>
                    <p className="text-2xl font-bold mt-1">{contacts.length}</p>
                </div>
                <div className="bg-surface p-4 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-sm">Contatos Ativos</p>
                    <p className="text-2xl font-bold mt-1 text-green-500">{contacts.filter(c => c.lastMessage).length}</p>
                </div>
                {/* Add more stats here */}
            </div>

            <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 bg-white/5">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome, telefone ou ID..."
                            className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition"
                        />
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="flex items-center space-x-2 bg-background border border-white/10 px-4 py-2 rounded-xl text-sm hover:bg-white/5 transition">
                            <Filter className="w-4 h-4" />
                            <span>Filtros</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nome / Canal</th>
                                <th className="px-6 py-4 font-medium">Última Mensagem</th>
                                <th className="px-6 py-4 font-medium">Data</th>
                                <th className="px-6 py-4 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        <p className="text-gray-500 mt-2">Carregando contatos...</p>
                                    </td>
                                </tr>
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                        <p className="text-gray-500">Nenhum contato encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                contacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-white/5 transition group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                                        {contact.name?.charAt(0) || 'C'}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 bg-surface p-1 rounded-full shadow-lg">
                                                        {getProviderIcon(contact.provider)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold">{contact.name || 'Sem nome'}</p>
                                                    <p className="text-xs text-gray-500">{contact.externalId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-sm text-gray-400 truncate">{contact.lastMessage || 'Nenhuma mensagem'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(contact.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => router.push('/dashboard/inbox')}
                                                    className="p-2 hover:bg-primary/20 text-primary rounded-lg transition"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-white/10 text-gray-400 rounded-lg transition">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
