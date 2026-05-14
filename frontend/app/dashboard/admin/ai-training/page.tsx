'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Brain, Save, Sparkles, Loader2, Info } from 'lucide-react';

export default function AiTrainingPage() {
    const { token } = useAuth();
    const { lang } = useLanguage();
    const [lisaPrompt, setLisaPrompt] = useState('');
    const [lisaProvider, setLisaProvider] = useState<'gemini' | 'openrouter'>('gemini');
    const [lisaModel, setLisaModel] = useState('gemini-1.5-flash');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const t: any = {
        pt_BR: {
            title: 'Treinamento da Lisa (IA)',
            subtitle: 'Configure a personalidade e o conhecimento da assistente oficial da Zaplandia.',
            promptLabel: 'Cérebro da Lisa (System Prompt)',
            placeholder: 'Digite aqui as instruções de como a Lisa deve se comportar...',
            save: 'Salvar Configuração',
            saving: 'Salvando...',
            success: 'Cérebro da Lisa atualizado com sucesso!',
            error: 'Erro ao salvar configurações.',
            tip: 'Dica: Defina o tom de voz (amigável/objetiva) e as principais dúvidas que ela deve saber responder sobre o CRM.',
            providerLabel: 'Provedor de IA',
            modelLabel: 'Modelo da Lisa'
        }
    };

    const tl = t[lang] || t.pt_BR;

    useEffect(() => {
        if (token) fetchLisaPrompt();
    }, [token]);

    const fetchLisaPrompt = async () => {
        try {
            const res = await fetch('/api/ai/lisa/prompt', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLisaPrompt(data.content);
                if (data.provider) setLisaProvider(data.provider);
                if (data.model) setLisaModel(data.model);
            }
        } catch (err) {
            console.error('Error fetching Lisa prompt:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/ai/lisa/prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    content: lisaPrompt,
                    provider: lisaProvider,
                    model: lisaModel
                })
            });
            if (res.ok) {
                alert(tl.success);
            } else {
                alert(tl.error);
            }
        } catch (err) {
            alert(tl.error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 bg-primary/10 rounded-3xl text-primary border border-primary/20">
                    <Brain size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-white">{tl.title}</h1>
                    <p className="text-gray-400">{tl.subtitle}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Model Config Section */}
                    <div className="bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{tl.providerLabel}</label>
                                <select
                                    value={lisaProvider}
                                    onChange={(e: any) => setLisaProvider(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-primary outline-none transition"
                                >
                                    <option value="gemini">Google Gemini</option>
                                    <option value="openrouter">OpenRouter (Claude, GPT, etc)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{tl.modelLabel}</label>
                                <input
                                    type="text"
                                    value={lisaModel}
                                    onChange={(e) => setLisaModel(e.target.value)}
                                    placeholder="Ex: gemini-1.5-pro ou anthropic/claude-3-opus"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-primary outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-white/5 rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">{tl.promptLabel}</label>
                            <Sparkles className="text-primary animate-pulse" size={20} />
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center h-[400px]">
                                <Loader2 className="animate-spin text-primary" size={40} />
                            </div>
                        ) : (
                            <textarea
                                value={lisaPrompt}
                                onChange={(e) => setLisaPrompt(e.target.value)}
                                placeholder={tl.placeholder}
                                className="w-full h-[400px] bg-black/40 border border-white/10 rounded-2xl p-6 text-gray-200 focus:outline-none focus:border-primary/50 transition resize-none font-mono text-sm leading-relaxed"
                            />
                        )}

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="flex items-center space-x-3 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 transition disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                <span>{isSaving ? tl.saving : tl.save}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6">
                        <div className="flex items-center space-x-3 mb-4 text-primary">
                            <Info size={20} />
                            <h3 className="font-bold">Diretrizes Sugeridas</h3>
                        </div>
                        <ul className="text-sm text-gray-400 space-y-4">
                            <li>• <b>Nome:</b> Lisa</li>
                            <li>• <b>Tom:</b> Profissional, mas acolhedor.</li>
                            <li>• <b>Conhecimento:</b> Explique como configurar webhooks, conectar canais e criar campanhas.</li>
                            <li>• <b>Limitações:</b> Deixe claro que ela é focada na plataforma Zaplandia.</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                        <h3 className="font-bold text-white mb-2">Exemplo de Prompt</h3>
                        <p className="text-[10px] text-gray-500 font-mono leading-relaxed italic">
                            "Você é a Lisa, assistente técnica da Zaplandia. Seu objetivo é ajudar usuários com dificuldades no CRM. Se perguntarem sobre o n8n, explique que é uma ferramenta de automação integrada. Se falarem sobre o Omni Inbox, diga que é onde todas as mensagens se encontram..."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
