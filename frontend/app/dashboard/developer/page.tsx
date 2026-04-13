'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
    Terminal, 
    Copy, 
    RefreshCw, 
    Check, 
    ExternalLink, 
    Code2, 
    Key, 
    Server,
    ShieldAlert
} from 'lucide-react';

export default function DeveloperPage() {
    const { user, token: authContextToken } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRotating, setIsRotating] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = authContextToken || localStorage.getItem('zap_token');
            const keyRes = await fetch('/api/integrations/api-key', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const keyData = await keyRes.json();
            setApiKey(keyData.apiKey);
        } catch (error) {
            console.error('Erro ao buscar dados do desenvolvedor:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const rotateApiKey = async () => {
        if (!confirm('Isso irá invalidar sua chave atual. Deseja continuar?')) return;
        
        setIsRotating(true);
        try {
            const token = authContextToken || localStorage.getItem('zap_token');
            const res = await fetch('/api/integrations/api-key/rotate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setApiKey(data.apiKey);
        } catch (error) {
            console.error('Erro ao rotacionar chave:', error);
        } finally {
            setIsRotating(false);
        }
    };

    const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'https://www.zaplandia.com.br';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        <Terminal className="text-primary w-8 h-8" />
                        Aba de Desenvolvedor
                    </h1>
                    <p className="text-gray-400">Gerencie suas chaves de acesso e integrações externas via API.</p>
                </div>
            </div>

            {/* API Identity Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Server size={64} />
                    </div>
                    <p className="text-sm text-gray-400 mb-1">Seu ID de Usuário (Tenant ID)</p>
                    <div className="flex items-center gap-2">
                        <code className="text-lg font-mono text-primary font-bold">{user?.tenantId}</code>
                    </div>
                </div>

                <div className="md:col-span-2 bg-surface border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-400">Sua Chave de API (Secret Key)</p>
                            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20">Uso no n8n / Externo</span>
                        </div>
                        <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                            <Key className="text-primary shrink-0" size={20} />
                            <input 
                                type="password" 
                                readOnly 
                                value={apiKey} 
                                className="bg-transparent border-none outline-none text-gray-300 font-mono flex-1 text-sm tracking-widest"
                            />
                            <button 
                                onClick={() => copyToClipboard(apiKey, setCopiedKey)}
                                className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400"
                            >
                                {copiedKey ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-[11px] text-gray-500 max-w-[70%]">
                            <ShieldAlert size={12} className="inline mr-1 text-yellow-500" />
                            Nunca compartilhe sua chave de API. Ela dá acesso total às suas automações.
                        </p>
                        <button 
                            onClick={rotateApiKey}
                            disabled={isRotating}
                            className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1.5"
                        >
                            <RefreshCw size={14} className={isRotating ? 'animate-spin' : ''} />
                            {isRotating ? 'Gerando...' : 'Rotacionar Chave'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Documentation Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Code2 className="text-primary" />
                    Guia rápido: Conectando no n8n
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* HTTP Request Step */}
                    <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[12px]">1</span>
                                Nó HTTP Request (n8n)
                            </h3>
                            <span className="text-xs text-primary font-mono uppercase tracking-widest">Transferência</span>
                        </div>
                        <div className="p-6 space-y-4 flex-1">
                            <p className="text-sm text-gray-400">Use este nó para mandar um contato para uma equipe específica e desativar a IA.</p>
                            
                            <div className="space-y-3">
                                <div className="p-3 bg-black/40 rounded-xl space-y-2 border border-white/5">
                                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">URL do Endpoint</p>
                                    <div className="flex items-center justify-between">
                                        <code className="text-[12px] text-primary">{baseUrl}/api/teams/transfer</code>
                                        <button onClick={() => copyToClipboard(`${baseUrl}/api/teams/transfer`, setCopiedUrl)} className="text-gray-500 hover:text-white transition">
                                            {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-black/40 rounded-xl space-y-1 border border-white/5">
                                        <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Método</p>
                                        <p className="text-sm font-bold">POST</p>
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-xl space-y-1 border border-white/5">
                                        <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Autenticação</p>
                                        <p className="text-sm font-bold">Header (Manual)</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-black/40 rounded-xl space-y-2 border border-white/5">
                                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Headers Exigidos</p>
                                    <code className="text-[11px] block bg-white/5 p-2 rounded text-blue-300">
                                        Content-Type: application/json<br />
                                        x-api-key: [SUA_CHAVE_DE_API]
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* JSON Payload Step */}
                    <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[12px]">2</span>
                                Corpo da Requisição (JSON)
                            </h3>
                        </div>
                        <div className="p-6 space-y-4 flex-1">
                            <p className="text-sm text-gray-400">Copie o JSON abaixo e cole no campo "Body Parameters" ou "Raw JSON" do n8n.</p>
                            
                            <pre className="p-4 bg-black/40 rounded-xl text-[12px] font-mono leading-relaxed border border-white/5 text-purple-300 overflow-x-auto">
{`{
  "contactId": "{{$node.contactId}}",
  "teamId": "id-da-equipe-alvo",
  "userId": "id-usuario-opcional"
}`}
                            </pre>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                                    <p className="text-xs text-gray-300 italic">
                                        O campo <strong className="text-white">teamId</strong> você encontra na aba "Equipes". Ao transferir, a automação (IA/n8n) desse contato será pausada para o humano assumir.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Evolution API Webhook */}
                    <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[12px]">3</span>
                                Evolution API (Webhook)
                            </h3>
                        </div>
                        <div className="p-6 space-y-4 flex-1">
                            <p className="text-sm text-gray-400">Cole esta URL no painel da sua Evolution API (Webhook > Global).</p>
                            
                            <div className="p-3 bg-black/40 rounded-xl space-y-2 border border-white/5">
                                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">URL do Webhook</p>
                                <div className="flex items-center justify-between">
                                    <code className="text-[11px] text-green-400">{baseUrl}/api/webhooks/evolution</code>
                                    <button onClick={() => copyToClipboard(`${baseUrl}/api/webhooks/evolution`, setCopiedUrl)} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400">
                                        {copiedUrl ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/20">
                                    <p className="text-[11px] text-yellow-500 font-bold mb-1 uppercase tracking-tighter">⚠️ Regra Crítica da Instância</p>
                                    <p className="text-xs text-gray-400">
                                        O nome da sua instância deve começar com: <br/>
                                        <code className="text-white font-mono bg-black/40 px-1 rounded">tenant_{user?.tenantId}_</code>
                                    </p>
                                </div>
                                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                                    Isso garante que as mensagens cheguem na sua conta corretamente.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support Link */}
            <div className="flex justify-center pt-8">
                <a 
                    href="/dashboard/support" 
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition"
                >
                    Precisa de ajuda com a integração? Clique aqui
                    <ExternalLink size={14} />
                </a>
            </div>
        </div>
    );
}
