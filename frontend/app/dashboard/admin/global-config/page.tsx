"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Settings, Server, Key, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface Credential {
    id: string;
    key_name: string;
    key_value: string;
}

export default function GlobalConfigPage() {
    const { token, user } = useAuth();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [evolutionUrl, setEvolutionUrl] = useState('');
    const [evolutionKey, setEvolutionKey] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token && user?.role === 'superadmin') {
            fetchGlobalCredentials();
        }
    }, [token, user]);

    const fetchGlobalCredentials = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/credentials/global', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCredentials(data);

                // Pre-populate form
                const urlCred = data.find((c: Credential) => c.key_name === 'EVOLUTION_API_URL');
                const keyCred = data.find((c: Credential) => c.key_name === 'EVOLUTION_API_KEY');

                if (urlCred) setEvolutionUrl(urlCred.key_value);
                if (keyCred) setEvolutionKey(keyCred.key_value);
            }
        } catch (err) {
            console.error('Error fetching global credentials:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveEvolutionAPI = async () => {
        setStatus(null);
        try {
            // Save URL
            await fetch('/api/admin/credentials/global', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: 'EVOLUTION_API_URL', value: evolutionUrl })
            });

            // Save Key
            await fetch('/api/admin/credentials/global', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: 'EVOLUTION_API_KEY', value: evolutionKey })
            });

            setStatus({ type: 'success', msg: '✅ Configuração global salva com sucesso!' });
            fetchGlobalCredentials();
        } catch (err: any) {
            setStatus({ type: 'error', msg: `❌ Erro: ${err.message}` });
        }
    };

    if (user?.role !== 'superadmin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
                <p className="text-gray-400">Você não tem permissão para acessar esta área.</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white flex items-center space-x-4">
                    <Settings className="w-10 h-10 text-primary" />
                    <span>Configurações Globais</span>
                </h1>
                <p className="text-gray-400 mt-2">
                    Configure credenciais globais que serão herdadas por TODOS os usuários da plataforma.
                </p>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 mb-6 ${status.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{status.msg}</span>
                </div>
            )}

            {/* Evolution API Global Config */}
            <div className="bg-surface border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center space-x-3 mb-6">
                    <Server className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">Evolution API (Configuração Global)</h2>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                    <p className="text-sm text-yellow-200">
                        ⚠️ <strong>IMPORTANTE:</strong> Esta configuração será herdada por TODOS os usuários.
                        <br />
                        Os usuários apenas criarão instâncias WhatsApp, sem precisar configurar URL/Key.
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Evolution API URL
                        </label>
                        <div className="relative">
                            <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="url"
                                placeholder="https://evolution.exemplo.com"
                                value={evolutionUrl}
                                onChange={(e) => setEvolutionUrl(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:border-primary outline-none transition text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Evolution API Key
                        </label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="password"
                                placeholder="••••••••••••••••"
                                value={evolutionKey}
                                onChange={(e) => setEvolutionKey(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:border-primary outline-none transition text-white"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveEvolutionAPI}
                        className="w-full px-6 py-4 bg-primary hover:bg-primary-dark rounded-xl text-white font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
                    >
                        <Save className="w-5 h-5" />
                        <span>Salvar Configuração Global</span>
                    </button>
                </div>

                {credentials.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                            Credenciais Globais Atuais
                        </h3>
                        <div className="space-y-2">
                            {credentials.map((cred) => (
                                <div key={cred.id} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                                    <span className="text-sm text-gray-300 font-mono">{cred.key_name}</span>
                                    <span className="text-xs text-gray-500">••••••••</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
