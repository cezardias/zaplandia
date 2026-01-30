'use client';

import React, { useState, useEffect } from 'react';
import { Save, Key, Shield, Info, AlertCircle, Zap, Loader2, Send, Youtube, Linkedin, ShoppingBag, Store } from 'lucide-react';
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
        meta_page_access_token: '',
        meta_instagram_business_id: '',
        meta_verify_token: 'zaplandia_verify_token',
        whatsapp_phone_number_id: '',
        whatsapp_business_account_id: '',
        ml_client_id: '',
        ml_client_secret: '',
        olx_app_id: '',
        olx_app_secret: '',
        evolution_api_url: '',
        evolution_api_key: '',
        n8n_webhook_url: '',
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
                console.log('Credentials fetched successfully:', data);
                setKeys(prev => {
                    const next = { ...prev };
                    data.forEach((item: any) => {
                        if (item.key_name === 'META_APP_CONFIG') {
                            console.log('Mapping META_APP_CONFIG');
                            try {
                                const parsed = JSON.parse(item.key_value);
                                next.fb_app_id = parsed.appId || '';
                                next.fb_app_secret = parsed.secret || '';
                                next.meta_page_access_token = parsed.pageAccessToken || '';
                                next.meta_instagram_business_id = parsed.instagramBusinessId || '';
                                next.meta_verify_token = parsed.verifyToken || 'zaplandia_verify_token';
                                next.whatsapp_phone_number_id = parsed.whatsappPhoneNumberId || '';
                                next.whatsapp_business_account_id = parsed.whatsappBusinessAccountId || '';
                            } catch (e) {
                                console.error('Error parsing META_APP_CONFIG:', e);
                            }
                        }
                        if (item.key_name === 'WHATSAPP_TOKEN') next.whatsapp_token = item.key_value;
                        if (item.key_name === 'GEMINI_API_KEY') next.gemini_key = item.key_value;
                        if (item.key_name === 'TELEGRAM_TOKEN') next.telegram_token = item.key_value;
                        if (item.key_name === 'YOUTUBE_API_KEY') next.youtube_api_key = item.key_value;
                        if (item.key_name === 'LINKEDIN_CONFIG') {
                            try {
                                const parsed = JSON.parse(item.key_value);
                                next.linkedin_client_id = parsed.clientId || '';
                                next.linkedin_client_secret = parsed.secret || '';
                            } catch (e) { }
                        }
                        if (item.key_name === 'MERCADO_LIVRE_CONFIG') {
                            try {
                                const parsed = JSON.parse(item.key_value);
                                next.ml_client_id = parsed.clientId || '';
                                next.ml_client_secret = parsed.secret || '';
                            } catch (e) { }
                        }
                        if (item.key_name === 'OLX_CONFIG') {
                            try {
                                const parsed = JSON.parse(item.key_value);
                                next.olx_app_id = parsed.appId || '';
                                next.olx_app_secret = parsed.secret || '';
                            } catch (e) { }
                        }
                        if (item.key_name === 'N8N_WEBHOOK_URL') next.n8n_webhook_url = item.key_value;
                        if (item.key_name === 'EVOLUTION_API_URL') next.evolution_api_url = item.key_value;
                        if (item.key_name === 'EVOLUTION_API_KEY') next.evolution_api_key = item.key_value;
                    });
                    return next;
                });
            } else {
                console.error('Failed to fetch credentials:', res.status);
            }
        } catch (err) {
            console.error('Erro ao carregar chaves:', err);
        }
    };

    const handleSave = async (name: string, value: string, isGlobal = true) => {
        setIsLoading(true);
        setStatus(null);
        console.log(`[SAVE] Attempting to save ${name}, Global: ${isGlobal}`);
        try {
            const res = await fetch('/api/integrations/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, value, isGlobal })
            });

            console.log(`[SAVE] Response status for ${name}:`, res.status);

            if (!res.ok) throw new Error('Falha ao salvar');
            setStatus({ type: 'success', msg: `${name} salvo!` });
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
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, fb_app_id: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="Ex: 1234567890"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">App Secret</label>
                                <input
                                    type="password"
                                    value={keys.fb_app_secret}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, fb_app_secret: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Page Access Token</label>
                            <textarea
                                value={keys.meta_page_access_token}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setKeys(prev => ({ ...prev, meta_page_access_token: val }));
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white h-24"
                                placeholder="EAAB..."
                            />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Instagram Business ID</label>
                                <input
                                    type="text"
                                    value={keys.meta_instagram_business_id}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, meta_instagram_business_id: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="Ex: 17841400..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Webhook Verify Token</label>
                                <input
                                    type="text"
                                    value={keys.meta_verify_token}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, meta_verify_token: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">WhatsApp Phone Number ID</label>
                            <input
                                type="text"
                                value={keys.whatsapp_phone_number_id}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setKeys(prev => ({ ...prev, whatsapp_phone_number_id: val }));
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                placeholder="Ex: 106545123456789"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">WhatsApp Business Account ID</label>
                            <input
                                type="text"
                                value={keys.whatsapp_business_account_id}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setKeys(prev => ({ ...prev, whatsapp_business_account_id: val }));
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                placeholder="Ex: 104545123456789"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <div className="text-xs text-gray-500 max-w-sm">
                            Estas configurações são fundamentais para o funcionamento da API oficial do WhatsApp Cloud e Instagram.
                        </div>
                        <button
                            onClick={() => handleSave('META_APP_CONFIG', JSON.stringify({
                                appId: keys.fb_app_id,
                                secret: keys.fb_app_secret,
                                pageAccessToken: keys.meta_page_access_token,
                                instagramBusinessId: keys.meta_instagram_business_id,
                                verifyToken: keys.meta_verify_token,
                                whatsappPhoneNumberId: keys.whatsapp_phone_number_id,
                                whatsappBusinessAccountId: keys.whatsapp_business_account_id
                            }))}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-fit shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Configuração Meta/Instagram</span>
                        </button>
                    </div>

                    <div className="pt-8 mt-8 border-t border-white/5">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">WhatsApp Permanent Token (System User)</label>
                        <textarea
                            value={keys.whatsapp_token}
                            onChange={(e) => {
                                const val = e.target.value;
                                setKeys(prev => ({ ...prev, whatsapp_token: val }));
                            }}
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
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setKeys(prev => ({ ...prev, gemini_key: val }));
                                }}
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
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setKeys(prev => ({ ...prev, telegram_token: val }));
                                }}
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
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setKeys(prev => ({ ...prev, youtube_api_key: val }));
                                }}
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
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, linkedin_client_id: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Client Secret</label>
                                <input
                                    type="password"
                                    value={keys.linkedin_client_secret}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, linkedin_client_secret: val }));
                                    }}
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

                {/* Mercado Livre Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                        <ShoppingBag className="w-6 h-6 text-yellow-500" />
                        <span>Mercado Livre API</span>
                    </h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Application ID (Client ID)</label>
                                <input
                                    type="text"
                                    value={keys.ml_client_id}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, ml_client_id: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="Ex: 81234567890"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Client Secret</label>
                                <input
                                    type="password"
                                    value={keys.ml_client_secret}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, ml_client_secret: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => handleSave('MERCADO_LIVRE_CONFIG', JSON.stringify({ clientId: keys.ml_client_id, secret: keys.ml_client_secret }))}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-fit ml-auto shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Configuração Mercado Livre</span>
                        </button>
                    </div>
                </section>

                {/* OLX Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                        <Store className="w-6 h-6 text-orange-600" />
                        <span>OLX API</span>
                    </h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">App ID</label>
                                <input
                                    type="text"
                                    value={keys.olx_app_id}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, olx_app_id: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="Ex: olx_app_123"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">App Secret</label>
                                <input
                                    type="password"
                                    value={keys.olx_app_secret}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, olx_app_secret: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => handleSave('OLX_CONFIG', JSON.stringify({ appId: keys.olx_app_id, secret: keys.olx_app_secret }))}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-fit ml-auto shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Configuração OLX</span>
                        </button>
                    </div>
                </section>

                {/* EvolutionAPI Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                        <Zap className="w-6 h-6 text-green-500" />
                        <span>WhatsApp Unofficial (EvolutionAPI)</span>
                    </h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Evolution Instance URL</label>
                                <input
                                    type="text"
                                    value={keys.evolution_api_url}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, evolution_api_url: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="https://evo.seudominio.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Global API Key</label>
                                <input
                                    type="password"
                                    value={keys.evolution_api_key}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setKeys(prev => ({ ...prev, evolution_api_key: val }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <p className="text-xs text-gray-500 max-w-sm">
                                Estas credenciais são usadas para conectar e gerenciar instâncias do WhatsApp via EvolutionAPI globalmente.
                            </p>
                            <div className="flex flex-col md:flex-row gap-2">
                                <button
                                    onClick={() => handleSave('EVOLUTION_API_URL', keys.evolution_api_url)}
                                    disabled={isLoading}
                                    className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-6 py-2 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-auto"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span>Salvar URL</span>
                                </button>
                                <button
                                    onClick={() => handleSave('EVOLUTION_API_KEY', keys.evolution_api_key)}
                                    disabled={isLoading}
                                    className="bg-primary hover:bg-primary-dark px-6 py-2 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-auto shadow-lg shadow-primary/20"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span>Salvar API Key</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* n8n Automation Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                        <Zap className="w-6 h-6 text-orange-500" />
                        <span>Automação n8n (Webhook)</span>
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">n8n Webhook URL</label>
                            <input
                                type="text"
                                value={keys.n8n_webhook_url}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setKeys(prev => ({ ...prev, n8n_webhook_url: val }));
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition text-sm text-white"
                                placeholder="https://n8n.seudominio.com/webhook/..."
                            />
                            <p className="mt-2 text-xs text-gray-400">
                                Novas mensagens recebidas serão enviadas para este webhook para processamento com IA.
                            </p>
                        </div>
                        <button
                            onClick={() => handleSave('N8N_WEBHOOK_URL', keys.n8n_webhook_url)}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 w-full md:w-fit ml-auto shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Webhook n8n</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
