'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
    LifeBuoy, 
    Search, 
    Filter, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    User, 
    ArrowRightLeft,
    ChevronRight,
    Loader2,
    MoreVertical,
    MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSupportPage() {
    const { token } = useAuth();
    const { lang } = useLanguage();
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [filter, setFilter] = useState('all');

    const t: any = {
        pt_BR: {
            title: 'Gestão de Chamados',
            subtitle: 'Visualize e gerencie todos os pedidos de suporte da plataforma.',
            search: 'Buscar chamados...',
            status: {
                open: 'Aberto',
                in_progress: 'Em Atendimento',
                resolved: 'Resolvido',
                cancelled: 'Cancelado'
            },
            priority: {
                low: 'Baixa',
                medium: 'Média',
                high: 'Alta',
                urgent: 'Urgente'
            },
            transfer: 'Transferir Chamado',
            details: 'Detalhes do Chamado',
            requester: 'Solicitante',
            assignee: 'Responsável',
            category: 'Categoria',
            noTickets: 'Nenhum chamado encontrado.'
        }
    };

    const tl = t[lang] || t.pt_BR;

    useEffect(() => {
        if (token) fetchTickets();
    }, [token]);

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/support/tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setTickets(await res.json());
            }
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/support/tickets/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchTickets();
                if (selectedTicket?.id === id) {
                    setSelectedTicket({ ...selectedTicket, status });
                }
            }
        } catch (err) {
            console.error('Error updating ticket:', err);
        }
    };

    const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter);

    return (
        <div className="p-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white flex items-center space-x-3">
                        <LifeBuoy className="text-primary" size={36} />
                        <span>{tl.title}</span>
                    </h1>
                    <p className="text-gray-400 mt-2">{tl.subtitle}</p>
                </div>

                <div className="flex items-center space-x-2 bg-black/20 p-1 rounded-2xl border border-white/5">
                    {['all', 'open', 'in_progress', 'resolved'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            {s === 'all' ? 'Todos' : tl.status[s]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Tickets List */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input 
                            type="text" 
                            placeholder={tl.search}
                            className="w-full bg-surface border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary/40 transition"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-4">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-gray-500 animate-pulse">Carregando chamados...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="text-center p-20 bg-surface border border-white/5 rounded-3xl">
                            <LifeBuoy size={48} className="mx-auto text-gray-700 mb-4" />
                            <p className="text-gray-500 font-bold">{tl.noTickets}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTickets.map((ticket) => (
                                <motion.div
                                    key={ticket.id}
                                    layoutId={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`group p-6 bg-surface border rounded-2xl transition cursor-pointer hover:shadow-xl ${selectedTicket?.id === ticket.id ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-lg ${
                                                ticket.status === 'open' ? 'bg-red-500/10 text-red-500' :
                                                ticket.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-500' :
                                                'bg-green-500/10 text-green-500'
                                            }`}>
                                                {ticket.status === 'open' ? <AlertCircle size={20} /> :
                                                 ticket.status === 'in_progress' ? <Clock size={20} /> :
                                                 <CheckCircle2 size={20} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white group-hover:text-primary transition">{ticket.subject}</h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{ticket.category}</span>
                                                    <span className="text-gray-700">•</span>
                                                    <span className="text-[10px] text-gray-500">{new Date(ticket.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-[10px] font-black px-2 py-1 rounded uppercase ${
                                            ticket.priority === 'high' || ticket.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'
                                        }`}>
                                            {tl.priority[ticket.priority]}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                {ticket.requester?.name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-xs text-gray-400">{ticket.requester?.name || 'Usuário'}</span>
                                        </div>
                                        <ChevronRight size={16} className={`text-gray-700 transition ${selectedTicket?.id === ticket.id ? 'translate-x-1 text-primary' : ''}`} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ticket Details Panel */}
                <div className="lg:col-span-4">
                    <AnimatePresence mode="wait">
                        {selectedTicket ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="sticky top-8 bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/5 rounded-xl transition">
                                        <MoreVertical size={20} className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="mb-8">
                                    <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase mb-4 ${
                                        selectedTicket.status === 'open' ? 'bg-red-500/10 text-red-500' :
                                        selectedTicket.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-500' :
                                        'bg-green-500/10 text-green-500'
                                    }`}>
                                        {tl.status[selectedTicket.status]}
                                    </div>
                                    <h2 className="text-2xl font-black text-white leading-tight">{selectedTicket.subject}</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Descrição</h4>
                                        <p className="text-sm text-gray-300 leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5">
                                            {selectedTicket.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-2xl">
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{tl.requester}</h4>
                                            <div className="flex items-center space-x-2">
                                                <User size={14} className="text-primary" />
                                                <span className="text-xs text-white font-bold">{selectedTicket.requester?.name}</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl">
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{tl.assignee}</h4>
                                            <div className="flex items-center space-x-2">
                                                <ArrowRightLeft size={14} className="text-primary" />
                                                <span className="text-xs text-white font-bold">{selectedTicket.assignee?.name || 'Não atribuído'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 space-y-3">
                                        {selectedTicket.status === 'open' && (
                                            <button 
                                                onClick={() => updateStatus(selectedTicket.id, 'in_progress')}
                                                className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary-dark transition"
                                            >
                                                Assumir Chamado
                                            </button>
                                        )}
                                        {selectedTicket.status === 'in_progress' && (
                                            <button 
                                                onClick={() => updateStatus(selectedTicket.id, 'resolved')}
                                                className="w-full py-4 bg-green-500 text-white rounded-2xl font-black shadow-lg shadow-green-500/20 hover:bg-green-600 transition"
                                            >
                                                Finalizar Chamado
                                            </button>
                                        )}
                                        <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-gray-300 hover:bg-white/10 transition">
                                            {tl.transfer}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-[500px] bg-white/2 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                                <div className="p-4 bg-white/5 rounded-full mb-4">
                                    <MessageSquare size={32} className="text-gray-700" />
                                </div>
                                <h3 className="text-gray-500 font-bold">Selecione um chamado para ver os detalhes</h3>
                                <p className="text-[10px] text-gray-700 mt-2 uppercase tracking-widest font-black">Central de Atendimento Zaplandia</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
