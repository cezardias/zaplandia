'use client';

import React, { useState } from 'react';
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
    const [generatedPlans, setGeneratedPlans] = useState<any[]>([]);

    const handleGenerate = async () => {
        setIsLoading(true);
        // Simulation of generation for now, connecting to backend later
        setTimeout(() => {
            setIsLoading(false);
            alert('Funcionalidade de geração em massa será conectada ao backend em breve.');
        }, 2000);
    };

    return (
        <div className="p-8 space-y-6 text-white h-full overflow-y-auto w-full max-w-6xl mx-auto">

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
                    Geração
                </button>
                <button className="flex-1 py-4 text-center font-bold text-gray-400 hover:bg-white/5">
                    Output
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
                        <option value="gpt-4">gpt-4 (Coming Soon)</option>
                    </select>
                </div>

                {/* Prompt Editor */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Prompt de Abordagem</label>
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
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-sm font-bold">
                        <Save className="w-4 h-4" />
                        <span>Salvar Prompt</span>
                    </button>
                    <button
                        onClick={() => setPrompt('')}
                        className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-sm font-bold"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Carregar Padrão</span>
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
                            <span>Gerar Abordagens (0)</span>
                        </>
                    )}
                </button>

                <div className="text-center">
                    <button className="text-primary text-sm font-bold hover:underline flex items-center justify-center w-full">
                        Ver Planos Salvos &gt;
                    </button>
                </div>

            </div>
        </div>
    );
}
