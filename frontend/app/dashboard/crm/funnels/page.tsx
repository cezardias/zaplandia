'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Database, Trash2, Plus, Users, Calendar, Search, Loader2 } from 'lucide-react';

export default function FunnelsListPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [funnels, setFunnels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (token) {
            fetchFunnels();
        }
    }, [token]);

    const fetchFunnels = async () => {
        try {
            const res = await fetch('/api/campaigns/funnels', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFunnels(data);
            }
        } catch (err) {
            console.error('Erro ao buscar funis:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o funil "${name}"?`)) return;
        try {
            const res = await fetch(`/api/campaigns/funnels/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setFunnels(prev => prev.filter(f => f.id !== id));
            } else {
                alert('Erro ao excluir funil.');
            }
        } catch (err) {
            alert('Erro de conexão.');
        }
    };

    const filteredFunnels = funnels.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/crm')}
                        className="flex items-center space-x-2 text-gray-500 hover:text-white transition mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar para CRM</span>
                    </button>
                    <h1 className="text-3xl font-black flex items-center gap-3">
                        <Database className="w-8 h-8 text-primary" />
                        <span>Meus Funis de Contatos</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Gerencie suas listas de contatos salvas.</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/crm/funnels/new')}
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition flex items-center space-x-2 shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Novo Funil</span>
                </button>
            </div>

            {/* Search */}
            <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar funil por nome..."
                    className="w-full bg-surface border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 outline-none focus:border-primary transition"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredFunnels.length === 0 ? (
                <div className="text-center py-20 bg-surface border border-dashed border-white/5 rounded-3xl">
                    <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-300">Nenhum funil encontrado</h3>
                    <p className="text-gray-500 mt-2 mb-6">Você ainda não salvou nenhuma lista de contatos.</p>
                    <button
                        onClick={() => router.push('/dashboard/crm/funnels/new')}
                        className="text-primary font-bold hover:underline"
                    >
                        Criar meu primeiro funil
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFunnels.map(funnel => (
                        <div key={funnel.id} className="bg-surface border border-white/5 rounded-3xl p-6 hover:border-white/10 transition group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Database className="w-6 h-6 text-primary" />
                                </div>
                                <button
                                    onClick={() => handleDelete(funnel.id, funnel.name)}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                    title="Excluir Funil"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <button
                                onClick={() => router.push(`/dashboard/crm/funnels/${funnel.id}`)}
                                className="mb-2 text-left hover:text-primary transition"
                            >
                                <h3 className="text-xl font-bold truncate">{funnel.name}</h3>
                            </button>

                            <div className="space-y-3 mt-4">
                                <div className="flex items-center text-sm text-gray-400">
                                    <Users className="w-4 h-4 mr-2" />
                                    <span>{funnel.contacts?.length || 0} contatos</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>{new Date(funnel.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/dashboard/crm/campaigns/new?funnelId=${funnel.id}`)}
                                className="mt-6 w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold transition"
                            >
                                Usar em Campanha
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
