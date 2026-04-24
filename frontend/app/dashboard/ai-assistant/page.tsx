'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
    Sparkles, Save, RotateCcw, Play, Copy
} from 'lucide-react';

export default function AiAssistantPage() {
    const { user, token } = useAuth();
    const { lang } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);


    const t: any = {
        pt_BR: {
            title: 'Assistente de Vendas IA',
            subtitle: "Gere uma abordagem de vendas para até 50 leads com status 'Novo'. A IA irá analisá-los e salvar um plano de ação, movendo-os para 'Em Pesquisa'.",
            savedPrompts: 'Prompts Salvos',
            noSavedPrompts: 'Nenhum prompt salvo.',
            savePrompt: 'Salvar Prompt',
            newClear: 'Novo / Limpar',
            generateApproaches: 'Gerar Abordagens (Teste)',
            modelLabel: 'Modelo de IA',
            promptNameLabel: 'Nome do Prompt (para salvar)',
            promptNamePlaceholder: 'Ex: Abordagem Fria - WhatsApp',
            promptContentLabel: 'Conteúdo do Prompt',
            markdownSupport: 'markdown suportado',
            genEditTab: 'Geração & Edição',
            historyTab: 'Histórico de Gerações',
            enterPromptName: 'Digite um nome para o prompt.',
            promptSaveSuccess: 'Prompt salvo com sucesso!',
            promptSaveError: 'Erro ao salvar prompt.',
            genSoon: 'Funcionalidade de geração em massa será conectada ao backend em breve.',
            defaultPrompt: `# 📌 Tarefa: Gerar Plano de Abordagem Personalizado\n\nVocê é um **copywriter de vendas experiente**, especialista em criar mensagens de prospecção para **WhatsApp**.\nSua missão é analisar uma lista de leads e, para cada um, gerar uma mensagem **curta, personalizada e de alto impacto**, junto com os dados necessários para a automação.`
        },
        en_US: {
            title: 'AI Sales Assistant',
            subtitle: "Generate a sales approach for up to 50 leads with 'New' status. The AI will analyze them and save an action plan, moving them to 'In Research'.",
            savedPrompts: 'Saved Prompts',
            noSavedPrompts: 'No saved prompts.',
            savePrompt: 'Save Prompt',
            newClear: 'New / Clear',
            generateApproaches: 'Generate Approaches (Test)',
            modelLabel: 'AI Model',
            promptNameLabel: 'Prompt Name (to save)',
            promptNamePlaceholder: 'Ex: Cold Approach - WhatsApp',
            promptContentLabel: 'Prompt Content',
            markdownSupport: 'markdown supported',
            genEditTab: 'Generation & Editing',
            historyTab: 'Generation History',
            enterPromptName: 'Enter a name for the prompt.',
            promptSaveSuccess: 'Prompt saved successfully!',
            promptSaveError: 'Error saving prompt.',
            genSoon: 'Bulk generation feature will be connected to the backend soon.',
            defaultPrompt: `# 📌 Task: Generate Personalized Approach Plan\n\nYou are an **experienced sales copywriter**, specialist in creating prospecting messages for **WhatsApp**.\nYour mission is to analyze a list of leads and, for each one, generate a **short, personalized and high impact** message, along with the data necessary for automation.`
        },
        pt_PT: {
            title: 'Assistente de Vendas IA',
            subtitle: "Gere uma abordagem de vendas para até 50 leads com status 'Novo'. A IA irá analisá-los e salvar um plano de ação, movendo-os para 'Em Pesquisa'.",
            savedPrompts: 'Prompts Guardados',
            noSavedPrompts: 'Nenhum prompt guardado.',
            savePrompt: 'Guardar Prompt',
            newClear: 'Novo / Limpar',
            generateApproaches: 'Gerar Abordagens (Teste)',
            modelLabel: 'Modelo de IA',
            promptNameLabel: 'Nome do Prompt (para guardar)',
            promptNamePlaceholder: 'Ex: Abordagem Fria - WhatsApp',
            promptContentLabel: 'Conteúdo do Prompt',
            markdownSupport: 'markdown suportado',
            genEditTab: 'Geração & Edição',
            historyTab: 'Histórico de Gerações',
            enterPromptName: 'Digite um nome para o prompt.',
            promptSaveSuccess: 'Prompt guardado com sucesso!',
            promptSaveError: 'Erro ao guardar prompt.',
            genSoon: 'Funcionalidade de geração em massa será ligada ao backend em breve.',
            defaultPrompt: `# 📌 Tarefa: Gerar Plano de Abordagem Personalizado\n\nÉ um **copywriter de vendas experiente**, especialista em criar mensagens de prospeção para **WhatsApp**.\nA sua missão é analisar uma lista de leads e, para cada um, gerar uma mensagem **curta, personalizada e de alto impacto**, juntamente com os dados necessários para a automação.`
        },
        it_IT: {
            title: 'Assistente Vendite IA',
            subtitle: "Genera un approccio di vendita per un massimo di 50 lead con stato 'Nuovo'. L'IA li analizzerà e salverà un piano d'azione, spostandoli in 'In Ricerca'.",
            savedPrompts: 'Prompt Salvati',
            noSavedPrompts: 'Nessun prompt salvato.',
            savePrompt: 'Salva Prompt',
            newClear: 'Nuovo / Pulisci',
            generateApproaches: 'Genera Approcci (Test)',
            modelLabel: 'Modello IA',
            promptNameLabel: 'Nome del Prompt (da salvare)',
            promptNamePlaceholder: 'Es: Approccio a Freddo - WhatsApp',
            promptContentLabel: 'Contenuto del Prompt',
            markdownSupport: 'markdown supportato',
            genEditTab: 'Generazione & Editing',
            historyTab: 'Cronologia Generazioni',
            enterPromptName: 'Inserisci un nome per il prompt.',
            promptSaveSuccess: 'Prompt salvato con successo!',
            promptSaveError: 'Errore durante il salvataggio del prompt.',
            genSoon: 'La funzionalità di generazione massiva sarà collegata al backend a breve.',
            defaultPrompt: `# 📌 Compito: Generare un Piano di Approccio Personalizzato\n\nSei un **copywriter di vendita esperto**, specialista nel creare messaggi di prospezione per **WhatsApp**.\nLa tua missione è analizzare una lista di lead e, per ciascuno, generare un messaggio **breve, personalizzato e di alto impatto**, insieme ai dati necessari per l'automazione.`
        }
    };

    const [model, setModel] = useState('gemini-2.5-flash');
    const [prompt, setPrompt] = useState(t[lang].defaultPrompt);
    const [promptName, setPromptName] = useState('');
    const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
    const [generatedPlans, setGeneratedPlans] = useState<any[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('zap_lang');
        if (saved) setLang(saved as any);

        const handleLangChange = () => {
            const current = localStorage.getItem('zap_lang');
            if (current) setLang(current as any);
        };
        window.addEventListener('languageChange', handleLangChange);
        return () => window.removeEventListener('languageChange', handleLangChange);
    }, []);

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
        if (!promptName.trim()) return alert(t[lang].enterPromptName);
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
                alert(t[lang].promptSaveSuccess);
                setPromptName('');
                fetchPrompts();
            }
        } catch (err) {
            alert(t[lang].promptSaveError);
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        // Simulation of generation for now, connecting to backend later
        setTimeout(() => {
            setIsLoading(false);
            alert(t[lang].genSoon);
        }, 2000);
    };

    return (
        <div className="flex h-full">
            {/* Sidebar for Saved Prompts */}
            <div className="w-64 border-r border-white/10 p-4 overflow-y-auto hidden md:block">
                <h3 className="font-bold text-gray-400 mb-4 text-xs uppercase tracking-widest">{t[lang].savedPrompts}</h3>
                <div className="space-y-2">
                    {savedPrompts.length === 0 && <p className="text-gray-500 text-sm">{t[lang].noSavedPrompts}</p>}
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
                        <h1 className="text-2xl font-bold">{t[lang].title}</h1>
                        <p className="text-gray-400">{t[lang].subtitle}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-surface border border-white/10 rounded-t-2xl flex overflow-hidden">
                    <button className="flex-1 py-4 text-center font-bold bg-white/5 text-primary border-b-2 border-primary">
                        {t[lang].genEditTab}
                    </button>
                    <button className="flex-1 py-4 text-center font-bold text-gray-400 hover:bg-white/5">
                        {t[lang].historyTab}
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
                            <label className="block text-sm font-bold text-gray-400">{t[lang].promptNameLabel}</label>
                        </div>
                        <input
                            type="text"
                            value={promptName}
                            onChange={(e) => setPromptName(e.target.value)}
                            placeholder={t[lang].promptNamePlaceholder}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition mb-4 text-sm"
                        />

                        <label className="block text-sm font-bold text-gray-400 mb-2">{t[lang].promptContentLabel}</label>
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-64 bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-300 focus:outline-none focus:border-primary transition resize-none"
                            />
                            <div className="absolute top-2 right-2 text-xs text-gray-500">{t[lang].markdownSupport}</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={handleSavePrompt}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-lg transition text-sm font-bold"
                        >
                            <Save className="w-4 h-4" />
                            <span>{t[lang].savePrompt}</span>
                        </button>
                        <button
                            onClick={() => setPrompt('')}
                            className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-sm font-bold"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>{t[lang].newClear}</span>
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
                                <span>{t[lang].generateApproaches}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
