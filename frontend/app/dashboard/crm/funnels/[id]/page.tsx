'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Database, FileJson, CheckCircle2, Trash2 } from 'lucide-react';

export default function EditFunnelPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        contacts: null as any
    });

    useEffect(() => {
        if (token && params.id) {
            fetchFunnel();
        }
    }, [token, params.id]);

    const fetchFunnel = async () => {
        try {
            const res = await fetch(`/api/campaigns/funnels?id=${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Note: The list endpoint returns all. Ideally we'd have a single getItem endpoint. 
            // For now, let's filter purely client side if the API doesn't support generic GET /:id details yet 
            // OR reuse the delete endpoint style logic but for GET. 
            // Given previous steps, I only added DELETE. I need to make sure I can GET one.
            // Let's assume the list endpoint is all we have for now and find it there, OR implement GET one.
            // To be safe and quick, I'll fetch all and find. 
            // WAIT - I need to modify the controller to support GET /:id or just filter here.

            if (res.ok) {
                const data = await res.json();
                const funnel = data.find((f: any) => f.id === params.id);
                if (funnel) {
                    setFormData({
                        name: funnel.name,
                        contacts: funnel.contacts
                    });
                } else {
                    alert('Funil não encontrado.');
                    router.push('/dashboard/crm/funnels');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetching(false);
        }
    };

    const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    if (Array.isArray(json)) {
                        setFormData(prev => ({ ...prev, contacts: json }));
                    } else {
                        alert('O arquivo deve conter uma lista (array) de contatos.');
                    }
                } catch (err) {
                    alert('Arquivo JSON inválido.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleUpdate = async () => {
        if (!formData.name || !formData.contacts) return;
        setIsLoading(true);
        try {
            // We need a PATCH endpoint for this. I will look at the controller next.
            // Assuming I will create it.
            const res = await fetch(`/api/campaigns/funnels/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert('Funil atualizado com sucesso!');
                router.push('/dashboard/crm/funnels');
            } else {
                const error = await res.json();
                alert(`Erro ao atualizar funil: ${error.message}`);
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <button
                onClick={() => router.push('/dashboard/crm/funnels')}
                className="flex items-center space-x-2 text-gray-500 hover:text-white transition mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Lista - {params.id}</span>
            </button>

            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Database className="w-8 h-8 text-primary" />
                <span>Editar Funil</span>
            </h1>
            <p className="text-gray-400 mb-8">Atualize o nome ou a lista de contatos deste funil.</p>

            <div className="space-y-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">Nome do Funil</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary text-lg"
                        placeholder="Ex: Lista VIP - Evento SP"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">Lista de Contatos (JSON)</label>
                    <div className={`p-8 bg-white/5 border border-dashed ${formData.contacts ? 'border-green-500/50 bg-green-500/5' : 'border-white/10'} rounded-3xl text-center transition-all`}>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleJsonUpload}
                            className="hidden"
                            id="json-upload-funnel"
                        />
                        <label htmlFor="json-upload-funnel" className="cursor-pointer w-full h-full block">
                            {formData.contacts ? (
                                <div className="flex flex-col items-center">
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                                    <p className="text-lg font-bold text-green-500">{formData.contacts.length} contatos carregados</p>
                                    <p className="text-sm text-gray-400 mt-2">Clique para substituir o arquivo</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <FileJson className="w-12 h-12 text-primary/40 mb-4" />
                                    <p className="text-sm font-bold">Clique para selecionar seu arquivo JSON</p>
                                    <p className="text-xs text-gray-500 mt-2">{'Formato: [{"name": "...", "externalId": "..."}]'}</p>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                <button
                    onClick={handleUpdate}
                    disabled={isLoading || !formData.name || !formData.contacts}
                    className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>Salvar Alterações</span>
                </button>
            </div>
        </div>
    );
}
