'use client';

import React, { useState } from 'react';
import { Save, Key, Shield, Info, AlertCircle, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ApiSettingsPage() {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const [keys, setKeys] = useState({
        fb_app_id: '',
        fb_app_secret: '',
        whatsapp_token: '',
    });

    const handleSave = async (name: string, value: string) => {
        setIsLoading(true);
        setStatus(null);
        try {
            const res = await fetch('/api/integrations/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, value })
            });

            if (!res.ok) throw new Error('Falha ao salvar credencial');

            setStatus({ type: 'success', msg: `Configuração ${name} salva com sucesso!` });
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center space-x-2">
                    <Key className="w-8 h-8 text-primary" />
                    <span>Configurações de API</span>
                </h1>
                <p className="text-gray-400 mt-2">Configure suas próprias chaves de API para maior controle e limites personalizados.</p>
            </div>

            {status && (
                <div className={`p-4 rounded-xl mb-6 flex items-center space-x-3 ${status.type === 'success' ? 'bg-green-500/10 border border-green-500/50 text-green-200' : 'bg-red-500/10 border border-red-500/50 text-red-200'
                    }`}>
                    {status.type === 'success' ? <Zap className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                    <span>{status.msg}</span>
                </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-xl flex items-start space-x-3 mb-8 text-white">
                <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0" />
                <p className="text-sm text-yellow-200">
                    <strong>Atenção:</strong> Se você não configurar suas próprias chaves, o Zaplandia usará as chaves globais da plataforma (sujeito a limites compartilhados).
                </p>
            </div>

            <div className="space-y-8">
                {/* Meta Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span>Meta (Facebook & Instagram)</span>
                    </h2>
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Meta App ID</label>
                            <input
                                type="text"
                                value={keys.fb_app_id}
                                onChange={(e) => setKeys({ ...keys, fb_app_id: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-white"
                                placeholder="Ex: 123456789012345"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">App Secret</label>
                            <input
                                type="password"
                                value={keys.fb_app_secret}
                                onChange={(e) => setKeys({ ...keys, fb_app_secret: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-white"
                                placeholder="••••••••••••••••"
                            />
                        </div>
                        <button
                            onClick={() => handleSave('meta_config', JSON.stringify({ appId: keys.fb_app_id, secret: keys.fb_app_secret }))}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2 rounded-lg font-bold transition flex items-center justify-center space-x-2 w-fit ml-auto"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Meta Config</span>
                        </button>
                    </div>
                </section>

                {/* WhatsApp Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-green-500" />
                        <span>WhatsApp Business API</span>
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Permanent Access Token</label>
                            <textarea
                                value={keys.whatsapp_token}
                                onChange={(e) => setKeys({ ...keys, whatsapp_token: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition h-24 text-white"
                                placeholder="Cole seu token de acesso permanente aqui..."
                            />
                        </div>
                        <button
                            onClick={() => handleSave('whatsapp_token', keys.whatsapp_token)}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2 rounded-lg font-bold transition flex items-center justify-center space-x-2 w-fit ml-auto"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Token WhatsApp</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
