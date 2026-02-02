'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    ArrowLeft,
    ArrowRight,
    Zap,
    Instagram,
    Facebook,
    ShoppingBag,
    Store,
    Youtube,
    CheckCircle2,
    Users,
    FileJson,
    Save,
    Loader2,
    QrCode,
    Database
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewCampaignPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [availableIntegrations, setAvailableIntegrations] = useState<any[]>([]);
    const [availableFunnels, setAvailableFunnels] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        channels: [] as string[],
        integrationId: '',
        audience: 'existing' as 'existing' | 'json' | 'remarketing' | 'saved_funnel',
        jsonLeads: null as any,
        message: '',
        variations: [] as string[]
    });

    useEffect(() => {
        if (token) {
            fetchIntegrations();
            fetchFunnels();
        }
    }, [token]);

    const fetchIntegrations = async () => {
        try {
            const res = await fetch('/api/integrations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAvailableIntegrations(data);
            }
        } catch (err) {
            console.error('Erro ao buscar integrações:', err);
        }
    };

    const fetchFunnels = async () => {
        try {
            const res = await fetch('/api/campaigns/funnels', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAvailableFunnels(data);
            }
        } catch (err) {
            console.error('Erro ao buscar funis:', err);
        }
    };

    const channels_list = [
        { id: 'whatsapp', name: 'WhatsApp', icon: <Zap className="w-5 h-5 text-green-500" /> },
        { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-5 h-5 text-pink-500" /> },
        { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-5 h-5 text-blue-600" /> },
        { id: 'mercadolivre', name: 'Mercado Livre', icon: <ShoppingBag className="w-5 h-5 text-yellow-500" /> },
        { id: 'olx', name: 'OLX', icon: <Store className="w-5 h-5 text-orange-600" /> },
        { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-5 h-5 text-red-600" /> },
    ];

    const toggleChannel = (id: string) => {
        setFormData(prev => ({
            ...prev,
            channels: prev.channels.includes(id)
                ? prev.channels.filter(c => c !== id)
                : [...prev.channels, id]
        }));
    };

    const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    setFormData(prev => ({ ...prev, jsonLeads: json }));
                } catch (err) {
                    alert('Arquivo JSON inválido.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    channels: formData.channels,
                    integrationId: formData.integrationId,
                    messageTemplate: formData.message,
                    useExistingContacts: formData.audience === 'existing' || formData.audience === 'remarketing',
                    filters: formData.audience === 'remarketing' ? { stage: 'NOT_INTERESTED' } : {},
                    leads: formData.audience === 'json' ? formData.jsonLeads : undefined,
                    variations: formData.variations // Send variations to backend
                })
            });

            if (res.ok) {
                alert('Campanha criada com sucesso!');
                router.push('/dashboard/crm/campaigns');
            } else {
                const errorData = await res.json();
                alert(`Erro ao criar campanha: ${errorData.message || 'Erro desconhecido'}`);
            }
        } catch (err) {
            console.error('Erro ao criar campanha:', err);
            alert('Falha na conexão com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    // AI Logic
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [aiResults, setAiResults] = useState<string[] | null>(null);

    const handleGenerateAi = async () => {
        setIsGeneratingAi(true);
        try {
            const res = await fetch('/api/ai/generate-variations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    baseMessage: formData.message || "Olá, gostaria de apresentar nossa oferta.",
                    prompt: aiPrompt,
                    count: 10
                })
            });
            if (res.ok) {
                const data = await res.json();
                setAiResults(data);
            } else {
                alert('Erro ao gerar com IA.');
            }
        } catch (err) {
            alert('Erro de conexão AI.');
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const waIntegrations = availableIntegrations.filter(i => i.provider === 'whatsapp' || i.provider === 'evolution');

    return (
        <div className="p-8 max-w-3xl mx-auto pb-20">
            <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-500 hover:text-white transition mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
            </button>

            <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-black">Nova Campanha</h1>
                    <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        Passo {step} de 4
                    </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }}></div>
                </div>
            </div>

            {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Dê um nome à sua campanha</h2>
                        <p className="text-sm text-gray-500">Este nome é apenas para seu controle interno.</p>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => {
                                const val = e.target.value;
                                setFormData(prev => ({ ...prev, name: val }));
                            }}
                            placeholder="Ex: Lançamento de Inverno 2026"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg focus:border-primary outline-none transition mt-4"
                        />
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Onde você quer transmitir?</h2>
                        <p className="text-sm text-gray-500">Selecione um ou mais canais para o disparo.</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {channels_list.map(ch => (
                            <button
                                key={ch.id}
                                onClick={() => toggleChannel(ch.id)}
                                className={`p-6 rounded-3xl border transition-all flex flex-col items-center justify-center space-y-4 ${formData.channels.includes(ch.id)
                                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5'
                                    : 'bg-surface border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className={`p-3 rounded-2xl ${formData.channels.includes(ch.id) ? 'bg-primary/20' : 'bg-white/5'}`}>
                                    {ch.icon}
                                </div>
                                <span className={`font-bold ${formData.channels.includes(ch.id) ? 'text-primary' : 'text-gray-400'}`}>
                                    {ch.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    {formData.channels.includes('whatsapp') && (
                        <div className="mt-10 space-y-4 pt-10 border-t border-white/10">
                            <h3 className="text-lg font-bold flex items-center space-x-2">
                                <Zap className="w-5 h-5 text-green-500" />
                                <span>Canal WhatsApp: Selecione a Instância</span>
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {waIntegrations.length > 0 ? (
                                    waIntegrations.map((integration: any) => (
                                        <button
                                            key={integration.id}
                                            onClick={() => setFormData({ ...formData, integrationId: integration.id })}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.integrationId === integration.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5'}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                {integration.provider === 'evolution' ? <QrCode className="w-4 h-4 text-primary" /> : <Zap className="w-4 h-4 text-green-500" />}
                                                <div>
                                                    <p className="font-bold text-sm">
                                                        {integration.provider === 'evolution' ? 'Unofficial (EvolutionAPI)' : 'Official (Meta)'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                                                        ID: {integration.id.substring(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                            {formData.integrationId === integration.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl text-center">
                                        <p className="text-sm text-red-500">Nenhuma instância de WhatsApp conectada. Conecte uma primeiro em Integrações.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Quem deve receber?</h2>
                        <p className="text-sm text-gray-500">Escolha o público-alvo da sua campanha.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={() => setFormData({ ...formData, audience: 'existing' })}
                            className={`p-8 rounded-3xl border transition-all text-left space-y-4 ${formData.audience === 'existing'
                                ? 'bg-primary/10 border-primary'
                                : 'bg-surface border-white/5 hover:border-white/20'
                                }`}
                        >
                            <Users className={`w-8 h-8 ${formData.audience === 'existing' ? 'text-primary' : 'text-gray-500'}`} />
                            <div>
                                <h3 className="font-bold text-lg">Contatos Existentes</h3>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Envie para todos os contatos já cadastrados no seu CRM Omnichannel.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setFormData({ ...formData, audience: 'remarketing' })}
                            className={`p-8 rounded-3xl border transition-all text-left space-y-4 ${formData.audience === 'remarketing'
                                ? 'bg-indigo-500/10 border-indigo-500'
                                : 'bg-surface border-white/5 hover:border-white/20'
                                }`}
                        >
                            <div className={`p-3 rounded-2xl w-fit ${formData.audience === 'remarketing' ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                                <Users className={`w-6 h-6 ${formData.audience === 'remarketing' ? 'text-indigo-400' : 'text-gray-500'}`} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-indigo-400">Remarketing (Recuperação)</h3>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Filtra apenas leads marcados como <b>"Não Interessado"</b> para campanhas de recuperação.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setFormData({ ...formData, audience: 'saved_funnel' })}
                            className={`p-8 rounded-3xl border transition-all text-left space-y-4 ${formData.audience === 'saved_funnel'
                                ? 'bg-primary/10 border-primary'
                                : 'bg-surface border-white/5 hover:border-white/20'
                                }`}
                        >
                            <Database className={`w-8 h-8 ${formData.audience === 'saved_funnel' ? 'text-primary' : 'text-gray-500'}`} />
                            <div>
                                <h3 className="font-bold text-lg">Funil Salvo</h3>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Use uma lista de contatos que você já subiu anteriormente.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setFormData({ ...formData, audience: 'json' })}
                            className={`p-8 rounded-3xl border transition-all text-left space-y-4 ${formData.audience === 'json'
                                ? 'bg-primary/10 border-primary'
                                : 'bg-surface border-white/5 hover:border-white/20'
                                }`}
                        >
                            <FileJson className={`w-8 h-8 ${formData.audience === 'json' ? 'text-primary' : 'text-gray-500'}`} />
                            <div>
                                <h3 className="font-bold text-lg">Lista via JSON</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Importe leads externos através de um arquivo JSON (Disponível para WhatsApp).</p>
                            </div>
                        </button>
                    </div>

                    {formData.audience === 'saved_funnel' && (
                        <div className="mt-8 space-y-4">
                            <h3 className="text-lg font-bold">Selecione o Funil</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableFunnels.map(funnel => (
                                    <button
                                        key={funnel.id}
                                        onClick={() => setFormData(prev => ({ ...prev, jsonLeads: funnel.contacts }))}
                                        className={`p-4 rounded-2xl border text-left transition-all ${JSON.stringify(formData.jsonLeads) === JSON.stringify(funnel.contacts)
                                            ? 'bg-primary/10 border-primary'
                                            : 'bg-white/5 border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3 mb-2">
                                            <Database className="w-5 h-5 text-primary" />
                                            <span className="font-bold">{funnel.name}</span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {funnel.contacts?.length || 0} contatos
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            Criado em: {new Date(funnel.createdAt).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))}
                                {availableFunnels.length === 0 && (
                                    <div className="col-span-3 p-8 text-center border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-gray-500">Nenhum funil salvo encontrado.</p>
                                        <button
                                            onClick={() => router.push('/dashboard/crm/funnels/new')}
                                            className="text-primary text-sm font-bold mt-2 hover:underline"
                                        >
                                            Criar Novo Funil
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {formData.audience === 'json' && (
                        <div className="p-8 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleJsonUpload}
                                className="hidden"
                                id="json-upload"
                            />
                            <label htmlFor="json-upload" className="cursor-pointer">
                                <FileJson className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                                <p className="text-sm font-bold">Clique para selecionar seu arquivo JSON</p>
                                <p className="text-xs text-gray-500 mt-2">{'Formato: [{"name": "...", "externalId": "..."}]'}</p>
                            </label>
                            {formData.jsonLeads && (
                                <div className="mt-4 p-2 bg-green-500/10 text-green-500 rounded-lg text-xs flex items-center justify-center space-x-2">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{formData.jsonLeads.length} leads carregados com sucesso!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {step === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Qual a mensagem principal?</h2>
                            <button
                                onClick={() => setAiModalOpen(true)}
                                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-bold transition shadow-lg shadow-purple-500/20"
                            >
                                <Zap className="w-4 h-4" />
                                <span>Gerar com IA</span>
                            </button>
                        </div>
                        <div className="bg-surface border border-white/10 rounded-3xl p-6">
                            <textarea
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                className="w-full bg-transparent border-none outline-none text-gray-200 min-h-[200px] resize-none text-lg"
                                placeholder="Olá {{name}}, temos uma oferta especial para você..."
                            />
                        </div>
                        {formData.variations.length > 0 && (
                            <div className="bg-surface border border-white/10 rounded-3xl p-6">
                                <h3 className="font-bold mb-4 flex items-center space-x-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span>Variações Anti-Ban Ativas ({formData.variations.length})</span>
                                </h3>
                                <div className="space-y-2">
                                    {formData.variations.map((v: string, i: number) => (
                                        <div key={i} className="p-3 bg-white/5 rounded-xl text-xs text-gray-400 border border-white/5">
                                            {v}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-3xl flex items-start space-x-4">
                            <div className="p-2 bg-yellow-500/20 rounded-xl">
                                <Zap className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-yellow-500 text-lg">Modo de Segurança Anti-Bloqueio Ativo</h3>
                                <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                                    Para proteger seu chip, o sistema limitará o envio a <b>40 mensagens por dia</b> (aproximadamente 1 mensagem a cada 20 minutos).
                                    Isso garante que sua campanha rode de forma segura e contínua.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-12 flex justify-between">
                <button
                    disabled={step === 1}
                    onClick={() => setStep(step - 1)}
                    className="flex items-center space-x-2 px-8 py-3 rounded-2xl border border-white/10 hover:bg-white/5 transition disabled:opacity-20 font-bold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Anterior</span>
                </button>

                {step < 4 ? (
                    <button
                        disabled={
                            (step === 1 && !formData.name) ||
                            (step === 2 && (formData.channels.length === 0 || (formData.channels.includes('whatsapp') && !formData.integrationId))) ||
                            (step === 3 && (formData.audience === 'json' || formData.audience === 'saved_funnel') && !formData.jsonLeads)
                        }
                        onClick={() => setStep(step + 1)}
                        className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-2xl flex items-center space-x-2 transition shadow-lg shadow-primary/20 disabled:opacity-50 font-black"
                    >
                        <span>Próximo Passo</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleCreate}
                        disabled={isLoading || !formData.message}
                        className="bg-primary hover:bg-primary-dark text-white px-10 py-3 rounded-2xl flex items-center space-x-2 transition shadow-lg shadow-primary/20 disabled:opacity-50 font-black"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>Finalizar e Criar</span>
                    </button>
                )}
            </div>

            {/* AI Modal */}
            {aiModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-surface border border-white/10 rounded-3xl p-8 max-w-2xl w-full">
                        <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                            <Zap className="w-6 h-6 text-purple-500" />
                            <span>Gerador de Variações IA</span>
                        </h2>

                        {!aiResults ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Mensagem Base (Opcional)</label>
                                    <textarea
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded-xl p-4 text-sm"
                                        rows={3}
                                        placeholder="Ex: Olá, gostaria de saber mais sobre..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Prompt / Instrução</label>
                                    <input
                                        type="text"
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                        className="w-full bg-background border border-white/10 rounded-xl p-4 text-sm"
                                        placeholder="Ex: Crie variações mais informais e curtas."
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button onClick={() => setAiModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                                    <button
                                        onClick={handleGenerateAi}
                                        disabled={isGeneratingAi}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-bold flex items-center space-x-2"
                                    >
                                        {isGeneratingAi && <Loader2 className="w-4 h-4 animate-spin" />}
                                        <span>Gerar Variações</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-green-500 font-bold">Variações Geradas!</p>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {aiResults.map((res: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setFormData({ ...formData, message: res });
                                                // Also add to variations list?
                                            }}
                                            className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 rounded-xl transition text-sm text-gray-300"
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                                    <button onClick={() => setAiResults(null)} className="px-4 py-2 text-gray-400">Voltar</button>
                                    <button
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, variations: aiResults }));
                                            setAiModalOpen(false);
                                            setAiResults(null);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold"
                                    >
                                        Usar Todas (Anti-Ban)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
