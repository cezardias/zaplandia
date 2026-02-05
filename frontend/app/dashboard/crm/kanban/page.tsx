'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Loader2, MoreHorizontal, MessageSquare, Plus } from 'lucide-react';

const STAGES = {
    'NOVO': 'Novos Leads',
    'CONTACTED': 'Contatados',
    'NEGOTIATION': 'Em Negociação',
    'INTERESTED': 'Interessados',
    'CONVERTIDO': 'Convertido',
    'NOT_INTERESTED': 'Não Interessado'
};

const STAGE_KEYS = Object.keys(STAGES);

export default function KanbanPage() {
    const { token } = useAuth();
    const [columns, setColumns] = useState<any>(() => {
        const initialCols: any = {};
        STAGE_KEYS.forEach(key => {
            initialCols[key] = {
                id: key,
                title: STAGES[key as keyof typeof STAGES],
                items: []
            };
        });
        return initialCols;
    });
    const [isLoading, setIsLoading] = useState(true);

    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

    const fetchContacts = async (campaignId?: string) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const campaignToUse = campaignId !== undefined ? campaignId : selectedCampaignId;

            let url = `/api/crm/contacts`;
            if (campaignToUse) {
                url += `?campaignId=${campaignToUse}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                organizeKanban(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
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
                if (data.length > 0 && !selectedCampaignId) {
                    setSelectedCampaignId(data[0].id);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    const organizeKanban = (contacts: any[]) => {
        const cols: any = {};
        STAGE_KEYS.forEach(key => {
            cols[key] = {
                id: key,
                title: STAGES[key as keyof typeof STAGES],
                items: contacts.filter(c => (c.stage || 'LEAD') === key)
            };
        });
        setColumns(cols);
    };

    useEffect(() => {
        if (token) {
            fetchCampaigns();
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchContacts(selectedCampaignId);
        }
    }, [selectedCampaignId, token]);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;
        const { source, destination } = result;

        if (source.droppableId !== destination.droppableId) {
            const sourceCol = columns[source.droppableId];
            const destCol = columns[destination.droppableId];
            const sourceItems = [...sourceCol.items];
            const destItems = [...destCol.items];
            const [removed] = sourceItems.splice(source.index, 1);

            // Update local state immediately
            destItems.splice(destination.index, 0, removed);
            setColumns({
                ...columns,
                [source.droppableId]: { ...sourceCol, items: sourceItems },
                [destination.droppableId]: { ...destCol, items: destItems }
            });

            // Update Backend
            try {
                await fetch(`/api/crm/chats/${removed.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ stage: destination.droppableId })
                });
            } catch (err) {
                console.error('Failed to update stage', err);
                // Revert on failure (optional, skipping for brevity)
            }
        } else {
            // Reordering within same column (if needed)
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="p-8 h-[calc(100vh-80px)] overflow-x-auto">
            <div className="px-4 sm:px-6 lg:px-8 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Pipeline de Vendas</h1>
                        <p className="mt-2 text-sm text-gray-400">Gerencie seus leads e estágios de conversão</p>
                    </div>

                    {/* Campaign Selector */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-400">Campanha:</label>
                        <select
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition min-w-[200px]"
                        >
                            <option value="">Todas as Campanhas</option>
                            {campaigns.map((campaign) => {
                                const leadCount = Object.values(columns).reduce((acc: number, col: any) => {
                                    return acc + col.items.filter((item: any) => item.campaignId === campaign.id).length;
                                }, 0);
                                return (
                                    <option key={campaign.id} value={campaign.id}>
                                        {campaign.name} ({leadCount} leads)
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex space-x-6 min-w-max h-full">
                    {STAGE_KEYS.map((key) => {
                        const column = columns[key];
                        return (
                            <div key={key} className="w-80 bg-surface/50 border border-white/5 rounded-2xl flex flex-col h-full max-h-full">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-2xl">
                                    <h2 className="font-bold flex items-center space-x-2">
                                        <span>{column?.title}</span>
                                        <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-gray-400">
                                            {column?.items?.length || 0}
                                        </span>
                                    </h2>
                                    <button className="text-gray-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                                </div>
                                <Droppable droppableId={key}>
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[100px]"
                                        >
                                            {column?.items?.map((item: any, index: number) => (
                                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-surface border border-white/10 p-4 rounded-xl shadow-sm hover:border-primary/50 transition group ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-primary/50' : ''}`}
                                                            style={provided.draggableProps.style}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="font-bold text-sm truncate">{item.name || 'Sem nome'}</h3>
                                                                <span className="text-[10px] text-gray-500 uppercase">{item.provider}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-400 line-clamp-2 mb-3 h-8">
                                                                {item.lastMessage || '...'}
                                                            </p>
                                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                                                <span>{new Date(item.updatedAt || Date.now()).toLocaleDateString()}</span>
                                                                <div className="flex space-x-1">
                                                                    <MessageSquare className="w-3 h-3" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
