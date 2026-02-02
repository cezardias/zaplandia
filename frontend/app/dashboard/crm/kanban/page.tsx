'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Loader2, MoreHorizontal, MessageSquare, Plus } from 'lucide-react';

const STAGES = {
    'LEAD': 'Novos Leads',
    'CONTACTED': 'Contatados',
    'INTERESTED': 'Interessados',
    'PROPOSAL': 'Em Proposta',
    'WON': 'Ganho',
    'LOST': 'Perdido',
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

    const fetchContacts = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/crm/contacts', {
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
        fetchContacts();
    }, [token]);

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
            <h1 className="text-3xl font-bold mb-8">Pipeline de Vendas</h1>

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
