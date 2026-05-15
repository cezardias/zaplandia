'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
    Cpu, 
    Sparkles, 
    Plus, 
    Play, 
    Pause, 
    Trash2, 
    ChevronRight, 
    Bot, 
    Send, 
    Terminal, 
    Code, 
    Settings,
    Layers,
    Clock,
    AlertCircle,
    CheckCircle2,
    Zap,
    Loader2,
    Copy,
    ListChecks,
    ArrowRightCircle,
    Workflow as WorkflowIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

interface Workflow {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'paused' | 'draft';
    updatedAt: string;
    nodesCount: number;
}

interface Message {
    id: string;
    role: 'assistant' | 'user';
    content: string;
    type?: 'text' | 'workflow_preview';
    workflowData?: any;
}

export default function AutomationsPage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const { lang } = useLanguage();
    const [activeTab, setActiveTab] = useState<'architect' | 'workflows'>('architect');
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfigured, setIsConfigured] = useState(true); 
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [n8nConfig, setN8nConfig] = useState({ apiUrl: '', apiKey: '' });
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [extractedSteps, setExtractedSteps] = useState<string[]>([]);

    useEffect(() => {
        if (user && user.role !== 'superadmin') {
            router.push('/dashboard');
        }
    }, [user, router]);
    
    // Architect State
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: '1', 
            role: 'assistant', 
            content: 'Olá! Sou o Arquiteto de Automação da Zaplandia. Estou aqui para ajudar você a criar fluxos incríveis integrando o n8n com o seu CRM. O que você gostaria de automatizar hoje?' 
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Extract steps from messages
    useEffect(() => {
        const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
        if (lastAssistantMsg) {
            // Match numbered lists like "1. Webhook", "2. Node Name"
            const stepRegex = /^\d+\.\s+\*\*([^*]+)\*\*|^\d+\.\s+([^\n:]+)/gm;
            const matches = [...lastAssistantMsg.content.matchAll(stepRegex)];
            const steps = matches.map(m => (m[1] || m[2]).trim()).filter(s => s.length > 0 && s.length < 50);
            if (steps.length > 0) {
                setExtractedSteps(steps);
            }
        }
    }, [messages]);

    if (!user || user.role !== 'superadmin') {
        return null;
    }

    const MessageRenderer = ({ content, role }: { content: string, role: string }) => {
        return (
            <div className={`prose prose-sm prose-invert max-w-none ${role === 'user' ? 'text-white' : ''}`}>
                <ReactMarkdown
                    components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                        code: ({ inline, children, ...props }: any) => {
                            if (inline) return <code className="bg-black/30 px-1 rounded text-primary font-bold">{children}</code>;
                            return (
                                <div className="relative group my-4">
                                    <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto text-[10px] border border-white/5 scrollbar-thin scrollbar-thumb-white/10 font-mono">
                                        <code className="text-gray-300">{children}</code>
                                    </pre>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(String(children))}
                                        className="absolute top-2 right-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 transition"
                                        title="Copiar código"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            );
                        },
                        strong: ({ children }) => <strong className="text-primary font-black">{children}</strong>,
                        hr: () => <hr className="border-white/5 my-4" />
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    const t: any = {
        pt_BR: {
            title: 'Gestão de Automações',
            subtitle: 'Crie e gerencie fluxos inteligentes com n8n e IA.',
            architect: 'Arquiteto de Fluxos',
            myWorkflows: 'Meus Fluxos',
            newWorkflow: 'Novo Fluxo',
            active: 'Ativo',
            paused: 'Pausado',
            draft: 'Rascunho',
            placeholder: 'Descreva o que você quer automatizar...',
            deploy: 'Implantar no n8n',
            preview: 'Prévia do Fluxo',
            nodes: 'nós',
            noWorkflows: 'Nenhum fluxo encontrado.',
            architectTip: 'Dica: Você pode pedir para criar um fluxo que responde automaticamente no WhatsApp quando um novo lead chega.',
            setupTitle: 'Conectar ao seu n8n',
            setupSubtitle: 'Insira as credenciais do seu servidor n8n para começar.',
            apiUrl: 'URL da API do n8n',
            apiKey: 'API Key do n8n',
            connect: 'Conectar Agora',
            setupSuccess: 'n8n conectado com sucesso!',
            setupError: 'Erro ao conectar ao n8n. Verifique os dados.',
            notConfigured: 'n8n não configurado. Clique para configurar.',
            cancel: 'Cancelar',
            save: 'Salvar Configurações'
        },
        en_US: {
            title: 'Automation Management',
            subtitle: 'Create and manage smart flows with n8n and AI.',
            architect: 'Flow Architect',
            myWorkflows: 'My Flows',
            newWorkflow: 'New Flow',
            active: 'Active',
            paused: 'Paused',
            draft: 'Draft',
            placeholder: 'Describe what you want to automate...',
            deploy: 'Deploy to n8n',
            preview: 'Flow Preview',
            nodes: 'nodes',
            noWorkflows: 'No flows found.',
            architectTip: 'Tip: You can ask to create a flow that automatically replies on WhatsApp when a new lead arrives.',
            setupTitle: 'Connect to your n8n',
            setupSubtitle: 'Enter your n8n server credentials to get started.',
            apiUrl: 'n8n API URL',
            apiKey: 'n8n API Key',
            connect: 'Connect Now',
            setupSuccess: 'n8n connected successfully!',
            setupError: 'Error connecting to n8n. Check your data.',
            notConfigured: 'n8n not configured. Click to configure.',
            cancel: 'Cancel',
            save: 'Save Settings'
        },
        // ... (other languages will use PT/EN fallback for new keys if not added, but I'll add them)
        pt_PT: {
            title: 'Gestão de Automações',
            subtitle: 'Crie e gira fluxos inteligentes com n8n e IA.',
            architect: 'Arquiteto de Fluxos',
            myWorkflows: 'Meus Fluxos',
            newWorkflow: 'Novo Fluxo',
            active: 'Ativo',
            paused: 'Pausado',
            draft: 'Rascunho',
            placeholder: 'Descreva o que pretende automatizar...',
            deploy: 'Implantar no n8n',
            preview: 'Prévia do Fluxo',
            nodes: 'nós',
            noWorkflows: 'Nenhum fluxo encontrado.',
            architectTip: 'Dica: Pode pedir para criar um fluxo que responde automaticamente no WhatsApp quando um novo lead chega.',
            setupTitle: 'Ligar ao seu n8n',
            setupSubtitle: 'Insira as credenciais do seu servidor n8n para começar.',
            apiUrl: 'URL da API do n8n',
            apiKey: 'API Key do n8n',
            connect: 'Ligar Agora',
            setupSuccess: 'n8n ligado com sucesso!',
            setupError: 'Erro ao ligar ao n8n. Verifique os dados.',
            notConfigured: 'n8n não configurado. Clique para configurar.',
            cancel: 'Cancelar',
            save: 'Guardar Definições'
        },
        it_IT: {
            title: 'Gestione Automazioni',
            subtitle: 'Crea e gestisci flussi intelligenti con n8n e IA.',
            architect: 'Architetto dei Flussi',
            myWorkflows: 'I Miei Flussi',
            newWorkflow: 'Nuovo Flusso',
            active: 'Attivo',
            paused: 'In Pausa',
            draft: 'Bozza',
            placeholder: 'Descrivi cosa vuoi automatizzare...',
            deploy: 'Distribuisci su n8n',
            preview: 'Anteprima Flusso',
            nodes: 'nodi',
            noWorkflows: 'Nessun flusso trovato.',
            architectTip: 'Suggerimento: Puoi chiedere di creare un flusso che risponde automaticamente su WhatsApp quando arriva un nuovo lead.',
            setupTitle: 'Connetti al tuo n8n',
            setupSubtitle: 'Inserisci le credenziali del tuo server n8n per iniziare.',
            apiUrl: 'URL API n8n',
            apiKey: 'API Key n8n',
            connect: 'Connetti Ora',
            setupSuccess: 'n8n connesso con successo!',
            setupError: 'Errore durante la connessione a n8n. Controlla i dati.',
            notConfigured: 'n8n non configurato. Clicca per configurare.',
            cancel: 'Annulla',
            save: 'Salva Impostazioni'
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (token) {
            fetchWorkflows();
            fetchSettings();
        }
    }, [token]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/automations/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.apiUrl && data.apiKey) {
                    setIsConfigured(true);
                    setN8nConfig(data);
                } else {
                    setIsConfigured(false);
                    // Only show setup modal to superadmin
                    if (user?.role === 'superadmin') {
                        setShowSetupModal(true);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    const handleSaveSettings = async () => {
        if (!n8nConfig.apiUrl || !n8nConfig.apiKey) return;
        setIsSavingConfig(true);
        try {
            const res = await fetch('/api/automations/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(n8nConfig)
            });
            if (res.ok) {
                setIsConfigured(true);
                setShowSetupModal(false);
                alert(t[lang].setupSuccess);
            } else {
                alert(t[lang].setupError);
            }
        } catch (err) {
            alert(t[lang].setupError);
        } finally {
            setIsSavingConfig(false);
        }
    };

    const fetchWorkflows = async () => {
        try {
            const res = await fetch('/api/automations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setWorkflows(await res.json());
            }
        } catch (err) {
            console.error('Error fetching workflows:', err);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/automations/architect/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    message: inputValue,
                    history: messages.slice(-10) // Send last 10 messages for context
                })
            });

            if (res.ok) {
                const data = await res.json();
                const botMsg: Message = { 
                    id: Date.now().toString(), 
                    role: 'assistant', 
                    content: data.content 
                };
                setMessages(prev => [...prev, botMsg]);
            } else {
                throw new Error('Falha ao obter resposta do Arquiteto');
            }
        } catch (err: any) {
            const errorMsg: Message = { 
                id: Date.now().toString(), 
                role: 'assistant', 
                content: 'Desculpe, tive um problema de conexão com o meu cérebro de arquiteto. Pode tentar novamente?' 
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-surface/30 backdrop-blur-md">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                            <Cpu className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{t[lang].title}</h1>
                            <p className="text-gray-400 text-sm">{t[lang].subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {user?.role === 'superadmin' && (
                            <button 
                                onClick={() => setShowSetupModal(true)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center space-x-2 border ${
                                    isConfigured 
                                        ? 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10' 
                                        : 'bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse'
                                }`}
                            >
                                <Settings size={14} />
                                <span>{isConfigured ? 'Configurar n8n' : t[lang].notConfigured}</span>
                            </button>
                        )}
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                            <button 
                                onClick={() => setActiveTab('architect')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center space-x-2 ${activeTab === 'architect' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Sparkles size={16} />
                                <span>{t[lang].architect}</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('workflows')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center space-x-2 ${activeTab === 'workflows' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Layers size={16} />
                                <span>{t[lang].myWorkflows}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden max-w-6xl mx-auto w-full flex">
                <AnimatePresence mode="wait">
                    {activeTab === 'architect' ? (
                        <motion.div 
                            key="architect"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-1 overflow-hidden"
                        >
                            {/* Chat Area */}
                            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] flex space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-gray-400'}`}>
                                                    {msg.role === 'user' ? <Terminal size={16} /> : <Bot size={18} />}
                                                </div>
                                                <div className={`p-4 rounded-2xl text-sm shadow-inner ${msg.role === 'user' ? 'bg-primary text-white shadow-primary/20' : 'bg-surface border border-white/5 text-white'}`}>
                                                    <MessageRenderer content={msg.content} role={msg.role} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex space-x-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                </div>
                                                <div className="bg-surface border border-white/5 p-4 rounded-2xl flex space-x-2">
                                                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="mt-6">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder={t[lang].placeholder}
                                            className="w-full bg-surface border border-white/10 rounded-2xl px-6 py-4 pr-14 text-white focus:outline-none focus:border-primary/50 transition shadow-inner shadow-black/40"
                                        />
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={!inputValue.trim() || isLoading}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:grayscale"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                    <p className="mt-3 text-[10px] text-gray-500 text-center uppercase tracking-widest font-bold">
                                        {t[lang].architectTip}
                                    </p>
                                </div>
                            </div>

                            {/* Sidebar Info/Preview */}
                            <div className="w-80 border-l border-white/5 p-6 bg-surface/20 hidden lg:block overflow-y-auto">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center">
                                    <Code size={14} className="mr-2" />
                                    {t[lang].preview}
                                </h3>
                                
                                <div className="bg-black/60 rounded-2xl border border-white/5 p-6 min-h-[300px] flex flex-col overflow-hidden">
                                    {extractedSteps.length > 0 ? (
                                        <div className="space-y-4 w-full">
                                            {extractedSteps.map((step, idx) => (
                                                <motion.div 
                                                    key={idx}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="flex items-center space-x-3 group"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] font-bold text-gray-300 group-hover:border-primary/30 group-hover:text-white transition">
                                                        {step}
                                                    </div>
                                                    {idx < extractedSteps.length - 1 && (
                                                        <div className="absolute left-[39px] h-4 w-px bg-white/10 mt-10" />
                                                    )}
                                                </motion.div>
                                            ))}
                                            <button className="w-full mt-4 py-3 bg-primary/10 text-primary rounded-xl border border-primary/20 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition flex items-center justify-center space-x-2">
                                                <Plus size={14} />
                                                <span>Iniciar Fluxo no n8n</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center h-full py-10">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                <WorkflowIcon className="text-gray-600" size={32} />
                                            </div>
                                            <p className="text-gray-500 text-xs px-4">Os passos do fluxo aparecerão aqui conforme a Lisa os descreve.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 space-y-4">
                                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                                        <div className="flex items-center space-x-2 text-primary mb-2">
                                            <AlertCircle size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Status do n8n</span>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">Conectado ao container local. Pronto para deploy.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="workflows"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 p-8 overflow-y-auto"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {workflows.map((wf) => (
                                    <div key={wf.id} className="group relative bg-surface border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition shadow-lg hover:shadow-primary/5 overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full bg-primary ${wf.status === 'active' ? 'opacity-100' : 'opacity-20'}`} />
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <Zap size={20} />
                                            </div>
                                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                                wf.status === 'active' ? 'bg-green-500/10 text-green-500' : 
                                                wf.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'
                                            }`}>
                                                {wf.status === 'active' && <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />}
                                                <span>{t[lang][wf.status]}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold mb-1">{wf.name}</h3>
                                        <p className="text-gray-500 text-xs mb-6 line-clamp-2">{wf.description || 'Sem descrição.'}</p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center space-x-4 text-[10px] text-gray-500 font-bold uppercase">
                                                <div className="flex items-center space-x-1">
                                                    <Layers size={12} />
                                                    <span>{wf.nodesCount || 0} {t[lang].nodes}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Clock size={12} />
                                                    <span>{new Date(wf.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition" title="Configurações">
                                                    <Settings size={16} />
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        if (confirm('Excluir este fluxo?')) {
                                                            await fetch(`/api/automations/${wf.id}`, {
                                                                method: 'DELETE',
                                                                headers: { 'Authorization': `Bearer ${token}` }
                                                            });
                                                            fetchWorkflows();
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-500/70 transition" title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary transition" title="Play">
                                                    <Play size={16} fill="currentColor" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Create New Card */}
                                <button 
                                    onClick={() => setActiveTab('architect')}
                                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/5 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition group"
                                >
                                    <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:bg-primary/20 transition">
                                        <Plus className="text-gray-500 group-hover:text-primary transition" size={32} />
                                    </div>
                                    <span className="font-bold text-gray-500 group-hover:text-primary transition">{t[lang].newWorkflow}</span>
                                </button>
                            </div>

                            {workflows.length === 0 && (
                                <div className="mt-12 text-center py-20 bg-surface/20 rounded-3xl border border-white/5">
                                    <Layers size={48} className="mx-auto text-gray-700 mb-4" />
                                    <h3 className="text-xl font-bold text-gray-400">{t[lang].noWorkflows}</h3>
                                    <p className="text-gray-600 max-w-sm mx-auto mt-2">Use o Arquiteto de Fluxos para começar a automatizar sua operação agora mesmo.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* n8n Setup Modal */}
            <AnimatePresence>
                {showSetupModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-surface border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 bg-primary/5">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-white/5 rounded-2xl">
                                        <Terminal className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">{t[lang].setupTitle}</h2>
                                        <p className="text-gray-400 text-sm">{t[lang].setupSubtitle}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t[lang].apiUrl}</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: https://n8n.seuservidor.com/api/v1"
                                            value={n8nConfig.apiUrl}
                                            onChange={(e) => setN8nConfig({ ...n8nConfig, apiUrl: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition"
                                        />
                                        <p className="mt-1 text-[10px] text-gray-500 italic">Dica: Se estiver no mesmo servidor Docker, tente http://n8n:5678/api/v1</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t[lang].apiKey}</label>
                                        <input 
                                            type="password" 
                                            placeholder="Suas credenciais de API do n8n"
                                            value={n8nConfig.apiKey}
                                            onChange={(e) => setN8nConfig({ ...n8nConfig, apiKey: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex space-x-4">
                                    <button 
                                        onClick={() => setShowSetupModal(false)}
                                        className="flex-1 py-4 border border-white/10 rounded-2xl font-bold hover:bg-white/5 transition"
                                    >
                                        {t[lang].cancel}
                                    </button>
                                    <button 
                                        onClick={handleSaveSettings}
                                        disabled={isSavingConfig || !n8nConfig.apiUrl || !n8nConfig.apiKey}
                                        className="flex-[2] py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black shadow-lg shadow-primary/20 transition disabled:opacity-50"
                                    >
                                        {isSavingConfig ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t[lang].save || t[lang].connect}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
