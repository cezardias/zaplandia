'use client';

import React, { useState } from 'react';
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
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewCampaignPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        channels: [] as string[],
        audience: 'existing' as 'existing' | 'json',
        jsonLeads: null as any,
        message: ''
    });

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
                    messageTemplate: formData.message,
                    useExistingContacts: formData.audience === 'existing',
                    leads: formData.audience === 'json' ? formData.jsonLeads : undefined
                })
            });

            if (res.ok) {
                router.push('/dashboard/crm/campaigns');
            }
        } catch (err) {
            console.error('Erro ao criar campanha:', err);
        } finally {
            setIsLoading(false);
        }
    };

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
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Envie para todos os contatos já cadastrados no seu CRM Omnichannel.</p>
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
                        <h2 className="text-xl font-bold">Qual a mensagem principal?</h2>
                        <div className="bg-surface border border-white/10 rounded-3xl p-6">
                            <textarea
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                className="w-full bg-transparent border-none outline-none text-gray-200 min-h-[200px] resize-none text-lg"
                                placeholder="Olá {{name}}, temos uma oferta especial para você..."
                            />
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
                            (step === 2 && formData.channels.length === 0) ||
                            (step === 3 && formData.audience === 'json' && !formData.jsonLeads)
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
        </div>
    );
}
