'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Loader2, MoreHorizontal, MessageSquare, Plus, Trash2, Pencil, Check, X, Target, Info } from 'lucide-react';

interface Stage {
    id: string;
    name: string;
    key: string;
    order: number;
    color?: string;
    qualificationCriteria?: string;
}

export default function KanbanPage() {
    const { token } = useAuth();
    const { lang } = useLanguage();
    const [stages, setStages] = useState<Stage[]>([]);
    const [columns, setColumns] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isStagesLoading, setIsStagesLoading] = useState(true);


    const t: any = {
        pt_BR: {
            title: 'Pipeline de Vendas',
            subtitle: 'Gerencie seus leads e estágios de conversão',
            addColumn: 'Adicionar Coluna',
            campaign: 'Campanha:',
            allCampaigns: 'Todas as Campanhas',
            rename: 'Renomear',
            delete: 'Excluir',
            newColumn: 'Nova Coluna',
            newColumnPrompt: 'Nome da nova coluna:',
            deleteConfirm: 'Deseja excluir esta coluna? Os contatos nela serão mantidos, mas você precisará movê-los manualmente ou eles aparecerão na primeira coluna.',
            noName: 'Sem nome',
            leads: 'leads',
            errorFetchingStages: '[KANBAN] Erro ao buscar estágios:',
            errorFetchingContacts: '[KANBAN] Erro ao buscar contatos:',
            errorLoadingCampaigns: '[KANBAN] Erro ao carregar campanhas:',
            failedUpdateStage: 'Falha ao atualizar estágio',
            failedAddStage: 'Falha ao adicionar estágio',
            failedDeleteStage: 'Falha ao excluir estágio',
            qualificationPrompt: 'Defina os critérios de qualificação para este estágio:',
            qualificationTitle: 'Qualificação'
        },
        en_US: {
            title: 'Sales Pipeline',
            subtitle: 'Manage your leads and conversion stages',
            addColumn: 'Add Column',
            campaign: 'Campaign:',
            allCampaigns: 'All Campaigns',
            rename: 'Rename',
            delete: 'Delete',
            newColumn: 'New Column',
            newColumnPrompt: 'Name of the new column:',
            deleteConfirm: 'Do you want to delete this column? The contacts in it will be kept, but you will need to move them manually or they will appear in the first column.',
            noName: 'No name',
            leads: 'leads',
            errorFetchingStages: '[KANBAN] Error fetching stages:',
            errorFetchingContacts: '[KANBAN] Error fetching contacts:',
            errorLoadingCampaigns: '[KANBAN] Error loading campaigns:',
            failedUpdateStage: 'Failed to update stage',
            failedAddStage: 'Failed to add stage',
            failedDeleteStage: 'Failed to delete stage',
            qualificationPrompt: 'Define the qualification criteria for this stage:',
            qualificationTitle: 'Qualification'
        },
        pt_PT: {
            title: 'Pipeline de Vendas',
            subtitle: 'Gerencie os seus leads e estágios de conversão',
            addColumn: 'Adicionar Coluna',
            campaign: 'Campanha:',
            allCampaigns: 'Todas as Campanhas',
            rename: 'Renomear',
            delete: 'Eliminar',
            newColumn: 'Nova Coluna',
            newColumnPrompt: 'Nome da nova coluna:',
            deleteConfirm: 'Deseja eliminar esta coluna? Os contactos nela serão mantidos, mas precisará de os mover manualmente ou eles aparecerão na primeira coluna.',
            noName: 'Sem nome',
            leads: 'leads',
            errorFetchingStages: '[KANBAN] Erro ao procurar estágios:',
            errorFetchingContacts: '[KANBAN] Erro ao procurar contactos:',
            errorLoadingCampaigns: '[KANBAN] Erro ao carregar campanhas:',
            failedUpdateStage: 'Falha ao atualizar estágio',
            failedAddStage: 'Falha ao adicionar estágio',
            failedDeleteStage: 'Falha ao eliminar estágio',
            qualificationPrompt: 'Defina os critérios de qualificação para este estágio:',
            qualificationTitle: 'Qualificação'
        },
        it_IT: {
            title: 'Pipeline di Vendita',
            subtitle: 'Gestisci i tuoi lead e le fasi di conversione',
            addColumn: 'Aggiungi Colonna',
            campaign: 'Campagna:',
            allCampaigns: 'Tutte le Campagne',
            rename: 'Rinomina',
            delete: 'Elimina',
            newColumn: 'Nuova Colonna',
            newColumnPrompt: 'Nome della nuova colonna:',
            deleteConfirm: 'Vuoi eliminare questa colonna? I contatti al suo interno saranno mantenuti, ma dovrai spostarli manualmente o appariranno nella prima colonna.',
            noName: 'Senza nome',
            leads: 'lead',
            errorFetchingStages: '[KANBAN] Errore nel recupero delle fasi:',
            errorFetchingContacts: '[KANBAN] Errore nel recupero dei contatti:',
            errorLoadingCampaigns: '[KANBAN] Errore nel caricamento delle campagne:',
            failedUpdateStage: 'Aggiornamento fase fallito',
            failedAddStage: 'Aggiunta fase fallita',
            failedDeleteStage: 'Eliminazione fase fallita',
            qualificationPrompt: 'Definisci i criteri di qualificazione per questa fase:',
            qualificationTitle: 'Qualificazione'
        }
    };

    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

    const [editingStageId, setEditingStageId] = useState<string | null>(null);
    const [editingStageName, setEditingStageName] = useState('');

    const fetchStages = async () => {
        if (!token) return;
        setIsStagesLoading(true);
        try {
            const res = await fetch('/api/crm/stages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStages(data);
            }
        } catch (err) {
            console.error(t[lang].errorFetchingStages, err);
        } finally {
            setIsStagesLoading(false);
        }
    };

    const fetchContacts = async (campaignId?: string) => {
        if (!token || isStagesLoading) return;
        setIsLoading(true);
        try {
            const campaignToUse = campaignId !== undefined ? campaignId : selectedCampaignId;
            let url = `/api/crm/contacts`;
            const params = new URLSearchParams();
            if (campaignToUse && campaignToUse !== '') {
                params.append('campaignId', campaignToUse);
            }
            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                organizeKanban(data, stages);
            }
        } catch (err) {
            console.error(t[lang].errorFetchingContacts, err);
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
            }
        } catch (e) {
            console.error(t[lang].errorLoadingCampaigns, e);
        }
    };

    const organizeKanban = (contacts: any[], currentStages: Stage[]) => {
        const cols: any = {};
        currentStages.forEach(stage => {
            cols[stage.key] = {
                id: stage.key,
                title: stage.name,
                items: contacts.filter(c => (c.stage || 'LEAD') === stage.key)
            };
        });
        setColumns(cols);
    };

    // Language sync handled by useLanguage()


    useEffect(() => {
        if (token) {
            fetchStages();
            fetchCampaigns();
        }
    }, [token]);

    useEffect(() => {
        if (token && !isStagesLoading) {
            fetchContacts(selectedCampaignId);
        }
    }, [selectedCampaignId, token, isStagesLoading]);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;
        const { source, destination } = result;

        if (source.droppableId !== destination.droppableId) {
            const sourceCol = columns[source.droppableId];
            const destCol = columns[destination.droppableId];
            const sourceItems = [...sourceCol.items];
            const destItems = [...destCol.items];
            const [removed] = sourceItems.splice(source.index, 1);

            destItems.splice(destination.index, 0, removed);
            setColumns({
                ...columns,
                [source.droppableId]: { ...sourceCol, items: sourceItems },
                [destination.droppableId]: { ...destCol, items: destItems }
            });

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
                console.error(t[lang].failedUpdateStage, err);
            }
        }
    };

    const handleAddColumn = async () => {
        const name = prompt(t[lang].newColumnPrompt);
        if (!name) return;

        try {
            const res = await fetch('/api/crm/stages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, order: stages.length + 1 })
            });
            if (res.ok) {
                fetchStages();
            }
        } catch (err) {
            console.error(t[lang].failedAddStage, err);
        }
    };

    const handleUpdateStage = async (id: string, name: string) => {
        try {
            const res = await fetch(`/api/crm/stages/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                setEditingStageId(null);
                fetchStages();
            }
        } catch (err) {
            console.error(t[lang].failedUpdateStage, err);
        }
    };

    const handleDeleteStage = async (id: string) => {
        if (!confirm(t[lang].deleteConfirm)) return;

        try {
            const res = await fetch(`/api/crm/stages/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchStages();
            }
        } catch (err) {
            console.error(t[lang].failedDeleteStage, err);
        }
    };

    const handleUpdateQualification = async (stage: Stage) => {
        const criteria = prompt(t[lang].qualificationPrompt, stage.qualificationCriteria || '');
        if (criteria === null) return;

        try {
            const res = await fetch(`/api/crm/stages/${stage.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ qualificationCriteria: criteria })
            });
            if (res.ok) {
                fetchStages();
            }
        } catch (err) {
            console.error(t[lang].failedUpdateStage, err);
        }
    };

    if (isLoading || isStagesLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="p-8 h-[calc(100vh-80px)] overflow-x-auto">
            <div className="px-4 sm:px-6 lg:px-8 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">{t[lang].title}</h1>
                        <p className="mt-2 text-sm text-gray-400">{t[lang].subtitle}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAddColumn}
                            className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t[lang].addColumn}</span>
                        </button>

                        <div className="h-8 w-[1px] bg-white/10 mx-2" />

                        <label className="text-sm text-gray-400">{t[lang].campaign}</label>
                        <select
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition min-w-[200px]"
                        >
                            <option value="">{t[lang].allCampaigns}</option>
                            {campaigns.map((campaign) => {
                                const leadCount = Object.values(columns).reduce((acc: number, col: any) => {
                                    return acc + col.items.filter((item: any) => item.campaignId === campaign.id).length;
                                }, 0);
                                return (
                                    <option key={campaign.id} value={campaign.id}>
                                        {campaign.name} ({leadCount} {t[lang].leads})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex space-x-6 min-w-max h-full pb-8">
                    {stages.map((stage) => {
                        const column = columns[stage.key];
                        return (
                            <div key={stage.key} className="w-80 bg-surface/50 border border-white/5 rounded-2xl flex flex-col h-full max-h-full shadow-lg">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-2xl">
                                    <div className="flex-1">
                                        {editingStageId === stage.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    title="Nome do estágio"
                                                    value={editingStageName}
                                                    onChange={(e) => setEditingStageName(e.target.value)}
                                                    className="bg-background border border-primary/50 rounded px-2 py-1 text-sm outline-none w-full"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateStage(stage.id, editingStageName);
                                                        if (e.key === 'Escape') setEditingStageId(null);
                                                    }}
                                                />
                                                <button title="Salvar" onClick={() => handleUpdateStage(stage.id, editingStageName)} className="text-green-500 hover:text-green-400"><Check className="w-4 h-4" /></button>
                                                <button title="Cancelar" onClick={() => setEditingStageId(null)} className="text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <h2 className="font-bold flex items-center space-x-2">
                                                <span className="truncate max-w-[150px]">{stage.name}</span>
                                                <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-gray-400">
                                                    {column?.items?.length || 0}
                                                </span>
                                            </h2>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 group/menu relative">
                                        <button className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <div className="hidden group-hover/menu:block absolute top-full right-0 mt-1 w-40 bg-surface border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                            <button
                                                onClick={() => {
                                                    setEditingStageId(stage.id);
                                                    setEditingStageName(stage.name);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition text-left"
                                            >
                                                <Pencil className="w-4 h-4 text-primary" />
                                                <span>{t[lang].rename}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStage(stage.id)}
                                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition text-left"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>{t[lang].delete}</span>
                                            </button>
                                            <div className="h-[1px] bg-white/5 my-1" />
                                            <button
                                                onClick={() => handleUpdateQualification(stage)}
                                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-400 hover:bg-green-500/10 transition text-left"
                                            >
                                                <Target className="w-4 h-4" />
                                                <span>{t[lang].qualificationTitle}</span>
                                            </button>
                                        </div>
                                    </div>
                                 </div>

                                {stage.qualificationCriteria && (
                                    <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20">
                                        <div className="flex items-start gap-2">
                                            <Info className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                                            <p className="text-[10px] text-green-300 italic leading-tight">
                                                {stage.qualificationCriteria}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <Droppable droppableId={stage.key}>
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[100px] scrollbar-thin scrollbar-thumb-white/10"
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
                                                                <h3 className="font-bold text-sm truncate">{item.name || t[lang].noName}</h3>
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

                    {/* Add Column Placeholder at the end */}
                    <button
                        onClick={handleAddColumn}
                        className="w-80 min-w-[20rem] h-[100px] border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white hover:border-primary/50 hover:bg-white/5 transition gap-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition" />
                        <span className="font-bold">{t[lang].newColumn}</span>
                    </button>
                </div>
            </DragDropContext>
        </div>
    );
}
