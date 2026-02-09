'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Sparkles, Save, RotateCcw, Play, Copy
} from 'lucide-react';

export default function AiAssistantPage() {
    const { user, token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState('gemini-2.5-flash');
    const [prompt, setPrompt] = useState(`# 📌 Tarefa: Gerar Plano de Abordagem Personalizado

Você é um **copywriter de vendas experiente**, especialista em criar mensagens de prospecção para **WhatsApp**.
Sua missão é analisar uma lista de leads e, para cada um, gerar uma mensagem **curta, personalizada e de alto impacto**, junto com os dados necessários para a automação.`);
    const [promptName, setPromptName] = useState('');
    const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
    const [generatedPlans, setGeneratedPlans] = useState<any[]>([]);

    useEffect(() => {
        if (token) fetchPrompts();
    }, [token]);

    const fetchPrompts = async () => {
        try {
            const res = await fetch('/api/ai/prompts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSavedPrompts(data);
            }
        } catch (err) {
            console.error('Failed to fetch prompts', err);
        }
    };

    const handleSavePrompt = async () => {
        if (!promptName.trim()) return alert('Digite um nome para o prompt.');
        try {
            const res = await fetch('/api/ai/prompts/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: promptName, content: prompt })
            });
            if (res.ok) {
                alert('Prompt salvo com sucesso!');
                setPromptName('');
                fetchPrompts();
            }
        } catch (err) {
            alert('Erro ao salvar prompt.');
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        // Simulation of generation for now, connecting to backend later
        setTimeout(() => {
            setIsLoading(false);
            alert('Funcionalidade de geração em massa será conectada ao backend em breve.');
        }, 2000);
    };

    return (
        <div className="flex h-full">
            {/* Sidebar for Saved Prompts */}
            <div className="w-64 border-r border-white/10 p-4 overflow-y-auto hidden md:block">
                <h3 className="font-bold text-gray-400 mb-4 text-xs uppercase tracking-widest">Prompts Salvos</h3>
                <div className="space-y-2">
                    {savedPrompts.length === 0 && <p className="text-gray-500 text-sm">Nenhum prompt salvo.</p>}
                    {savedPrompts.map(p => (
                        <button
                            key={p.id}
                            onClick={() => {
                                setPrompt(p.content);
                                setPromptName(p.name);
                            }}
                            className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition truncate border border-white/5"
                        >
                            <p className="font-medium text-white">{p.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{new Date(p.createdAt).toLocaleDateString()}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-8 space-y-6 text-white h-full overflow-y-auto w-full max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center space-x-3 mb-6">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">Assistente de Vendas IA</h1>
                        <p className="text-gray-400">Gere uma abordagem de vendas para até 50 leads com status 'Novo'. A IA irá analisá-los e salvar um plano de ação, movendo-os para 'Em Pesquisa'.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-surface border border-white/10 rounded-t-2xl flex overflow-hidden">
                    <button className="flex-1 py-4 text-center font-bold bg-white/5 text-primary border-b-2 border-primary">
                        Geração & Edição
                    </button>
                    <button className="flex-1 py-4 text-center font-bold text-gray-400 hover:bg-white/5">
                        Histórico de Gerações
                    </button>
                </div>

                {/* Main Content */}
                <div className="bg-surface border border-white/10 border-t-0 rounded-b-2xl p-6 space-y-6">

                    {/* Model Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Modelo de IA</label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
                        >
                            <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                            <option value="gemini-pro">gemini-pro</option>
                        </select>
                    </div>

                    {/* Prompt Editor */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-400">Nome do Prompt (para salvar)</label>
                        </div>
                        <input
                            type="text"
                            value={promptName}
                            onChange={(e) => setPromptName(e.target.value)}
                            placeholder="Ex: Abordagem Fria - WhatsApp"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition mb-4 text-sm"
                        />

                        <label className="block text-sm font-bold text-gray-400 mb-2">Conteúdo do Prompt</label>
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-64 bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-300 focus:outline-none focus:border-primary transition resize-none"
                            />
                            <div className="absolute top-2 right-2 text-xs text-gray-500">markdown supported</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={handleSavePrompt}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-lg transition text-sm font-bold"
                        >
                            <Save className="w-4 h-4" />
                            <span>Salvar Prompt</span>
                        </button>
                        <button
                            onClick={() => setPrompt('')}
                            className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-sm font-bold"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Novo / Limpar</span>
                        </button>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full py-4 bg-primary hover:bg-primary-dark transition rounded-xl font-bold text-lg flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>Gerar Abordagens (Teste)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
