'use client';

import React, { useState, useEffect } from 'react';
import { Save, Key, Shield, Info, AlertCircle, Zap, Loader2, Send, Youtube, Linkedin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ApiSettingsPage() {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const [keys, setKeys] = useState({
        fb_app_id: '',
        fb_app_secret: '',
        whatsapp_token: '',
        gemini_key: '',
        telegram_token: '',
        youtube_api_key: '',
        linkedin_client_id: '',
        linkedin_client_secret: '',
    });

    // Fetch existing keys on load
    useEffect(() => {
        if (token) {
            fetchExistingKeys();
        }
    }, [token]);

    const fetchExistingKeys = async () => {
        try {
            const res = await fetch('/api/integrations/credentials', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const newKeys = { ...keys };
                data.forEach((item: any) => {
                    if (item.key_name === 'META_APP_CONFIG') {
                        try {
                            const parsed = JSON.parse(item.key_value);
                            newKeys.fb_app_id = parsed.appId || '';
                            newKeys.fb_app_secret = parsed.secret || '';
                        } catch (e) { }
                    }
                    if (item.key_name === 'WHATSAPP_TOKEN') newKeys.whatsapp_token = item.key_value;
                    if (item.key_name === 'GEMINI_API_KEY') newKeys.gemini_key = item.key_value;
                    if (item.key_name === 'TELEGRAM_TOKEN') newKeys.telegram_token = item.key_value;
                    if (item.key_name === 'YOUTUBE_API_KEY') newKeys.youtube_api_key = item.key_value;
                    if (item.key_name === 'LINKEDIN_CONFIG') {
                        try {
                            const parsed = JSON.parse(item.key_value);
                            newKeys.linkedin_client_id = parsed.clientId || '';
                            newKeys.linkedin_client_secret = parsed.secret || '';
                        } catch (e) { }
                    }
                });
                setKeys(newKeys);
            }
        } catch (err) {
            console.error('Erro ao carregar chaves:', err);
        }
    };

    const handleSave = async (name: string, value: string) => {
        if (!value.trim()) {
            setStatus({ type: 'error', msg: 'O valor não pode estar vazio.' });
            return;
        }

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

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Falha ao salvar credencial');
            }

            setStatus({ type: 'success', msg: `Configuração ${name} salva com sucesso!` });

            // Re-fetch to confirm
            fetchExistingKeys();
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto text-white pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center space-x-3">
                    <Key className="w-8 h-8 text-primary" />
                    <span>Configurações de API</span>
                </h1>
                <p className="text-gray-400 mt-2 text-sm lg:text-base">
                    Centralize suas chaves de API. Seus clientes usarão estas chaves para as integrações deles, ou poderão cadastrar as próprias chaves.
                </p>
            </div>

            {status && (
                <div className={`p-4 rounded-xl mb-6 flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-500/10 border border-green-500/50 text-green-200' : 'bg-red-500/10 border border-red-500/50 text-red-200'
                    }`}>
                    {status.type === 'success' ? <Zap className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                    <span>{status.msg}</span>
                </div>
            )}

            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-start space-x-3 mb-8 shadow-inner">
                <Info className="w-6 h-6 text-primary shrink-0" />
                <p className="text-sm">
                    <strong>Dica:</strong> Como Super Admin, as chaves que você salvar sem selecionar um tenant serão usadas como <strong>Globais</strong> (Fallback) para todo o sistema.
                </p>
            </div>

            <div className="space-y-8">
                {/* Meta Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                        <Shield className="w-6 h-6 text-blue-500" />
                        <span>Meta (Facebook, Instagram & WhatsApp)</span>
                    </h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Meta App ID</label>
                                <input
                                    type="text"
                                    value={keys.fb_app_id}
                                    onChange={(e) => setKeys({ ...keys, fb_app_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="Ex: 1234567890"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">App Secret</label>
                                <input
                                    type="password"
                                    value={keys.fb_app_secret}
                                    onChange={(e) => setKeys({ ...keys, fb_app_secret: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => handleSave('META_APP_CONFIG', JSON.stringify({ appId: keys.fb_app_id, secret: keys.fb_app_secret }))}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-fit ml-auto shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Configuração Meta</span>
                        </button>

                        <div className="pt-4 border-t border-white/5">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">WhatsApp Permanent Token</label>
                            <textarea
                                value={keys.whatsapp_token}
                                onChange={(e) => setKeys({ ...keys, whatsapp_token: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition h-20 text-sm text-white"
                                placeholder="EAAW..."
                            />
                            <button
                                onClick={() => handleSave('WHATSAPP_TOKEN', keys.whatsapp_token)}
                                disabled={isLoading}
                                className="mt-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-6 py-2 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-fit ml-auto"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>Salvar Token WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* AI Section (Gemini) */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                        <Zap className="w-6 h-6 text-purple-500 animate-pulse" />
                        <span>Google Gemini AI</span>
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Gemini API Key</label>
                            <input
                                type="password"
                                value={keys.gemini_key}
                                onChange={(e) => setKeys({ ...keys, gemini_key: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                placeholder="AIza..."
                            />
                        </div>
                        <button
                            onClick={() => handleSave('GEMINI_API_KEY', keys.gemini_key)}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-fit ml-auto shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Chave Gemini</span>
                        </button>
                    </div>
                </section>

                {/* Telegram Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                        <Send className="w-6 h-6 text-blue-400" />
                        <span>Telegram Bot</span>
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Bot Token</label>
                            <input
                                type="text"
                                value={keys.telegram_token}
                                onChange={(e) => setKeys({ ...keys, telegram_token: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                placeholder="123456:ABC-DEF..."
                            />
                        </div>
                        <button
                            onClick={() => handleSave('TELEGRAM_TOKEN', keys.telegram_token)}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-fit ml-auto shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Token Telegram</span>
                        </button>
                    </div>
                </section>

                {/* YouTube Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                        <Youtube className="w-6 h-6 text-red-600" />
                        <span>YouTube API</span>
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Google Cloud API Key</label>
                            <input
                                type="password"
                                value={keys.youtube_api_key}
                                onChange={(e) => setKeys({ ...keys, youtube_api_key: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                placeholder="AIza..."
                            />
                        </div>
                        <button
                            onClick={() => handleSave('YOUTUBE_API_KEY', keys.youtube_api_key)}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-fit ml-auto shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar API Key YouTube</span>
                        </button>
                    </div>
                </section>

                {/* LinkedIn Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                        <Linkedin className="w-6 h-6 text-blue-700" />
                        <span>LinkedIn API</span>
                    </h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Client ID</label>
                                <input
                                    type="text"
                                    value={keys.linkedin_client_id}
                                    onChange={(e) => setKeys({ ...keys, linkedin_client_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Client Secret</label>
                                <input
                                    type="password"
                                    value={keys.linkedin_client_secret}
                                    onChange={(e) => setKeys({ ...keys, linkedin_client_secret: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => handleSave('LINKEDIN_CONFIG', JSON.stringify({ clientId: keys.linkedin_client_id, secret: keys.linkedin_client_secret }))}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-fit ml-auto shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Configuração LinkedIn</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
