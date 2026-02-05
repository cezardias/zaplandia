'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    Shield,
    Zap,
    Loader2,
    Send,
    Youtube,
    Linkedin,
    ShoppingBag,
    Store,
    AlertCircle
} from 'lucide-react';

interface ApiSettingsFieldsProps {
    token: string;
    tenantId?: string | null;
    isAdminMode?: boolean;
    userRole?: string;
}

export default function ApiSettingsFields({ token, tenantId = null, isAdminMode = false, userRole = 'user' }: ApiSettingsFieldsProps) {
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

    useEffect(() => {
        if (token) fetchExistingKeys();
    }, [token, tenantId]);

    const fetchExistingKeys = async () => {
        setIsLoading(true);
        try {
            if (isAdminMode && !tenantId) {
                console.warn('ApiSettingsFields: Modos admin ativo mas sem tenantId');
                return;
            }

            const url = isAdminMode
                ? `/api/admin/tenants/${tenantId}/credentials`
                : '/api/integrations/credentials';

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                mapToState(data);
            }
        } catch (err) {
            console.error('Erro ao carregar chaves:', err);
            setStatus({ type: 'error', msg: 'Erro ao carregar chaves existentes.' });
        } finally {
            setIsLoading(false);
        }
    };

    const mapToState = (data: any[]) => {
        const next = { ...keys };
        data.forEach((item: any) => {
            if (item.key_name === 'META_APP_CONFIG') {
                try {
                    const parsed = JSON.parse(item.key_value);
                    next.fb_app_id = parsed.appId || '';
                    next.fb_app_secret = parsed.secret || '';
                    next.meta_page_access_token = parsed.pageAccessToken || '';
                    next.meta_instagram_business_id = parsed.instagramBusinessId || '';
                    next.meta_verify_token = parsed.verifyToken || '';
                    next.whatsapp_phone_number_id = parsed.whatsappPhoneNumberId || '';
                    next.whatsapp_business_account_id = parsed.whatsappBusinessAccountId || '';
                } catch (e) { }
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
        setKeys(next);
    };

    const handleSave = async (name: string, value: string) => {
        setIsLoading(true);
        setStatus(null);
        try {
            if (isAdminMode && !tenantId) {
                throw new Error('Impossível salvar em modo admin sem um ID de Tenant.');
            }

            const url = isAdminMode
                ? `/api/admin/tenants/${tenantId}/credentials`
                : '/api/integrations/credentials';

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, value })
            });

            if (!res.ok) throw new Error('Falha ao salvar no servidor.');
            setStatus({ type: 'success', msg: `${name} salvo com sucesso!` });

            // Re-fetch to confirm persistence and update UI
            setTimeout(fetchExistingKeys, 500);
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {status && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 sticky top-0 z-10 ${status.type === 'success' ? 'bg-green-500/10 border border-green-500/50 text-green-200' : 'bg-red-500/10 border border-red-500/50 text-red-200'}`}>
                    {status.type === 'success' ? <Zap className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                    <span className="text-sm font-medium">{status.msg}</span>
                </div>
            )}

            {/* Meta Section (Official WhatsApp Cloud API) */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span>Meta (Facebook, Instagram, WhatsApp Cloud API)</span>
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={keys.fb_app_id}
                            onChange={(e) => setKeys({ ...keys, fb_app_id: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="App ID"
                        />
                        <input
                            type="password"
                            value={keys.fb_app_secret}
                            onChange={(e) => setKeys({ ...keys, fb_app_secret: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="App Secret"
                        />
                    </div>
                    <textarea
                        value={keys.meta_page_access_token}
                        onChange={(e) => setKeys({ ...keys, meta_page_access_token: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary h-20"
                        placeholder="Page Access Token"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={keys.whatsapp_phone_number_id}
                            onChange={(e) => setKeys({ ...keys, whatsapp_phone_number_id: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="WhatsApp Phone ID"
                        />
                        <input
                            type="text"
                            value={keys.whatsapp_business_account_id}
                            onChange={(e) => setKeys({ ...keys, whatsapp_business_account_id: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="WABA ID"
                        />
                    </div>

                    {/* WhatsApp Permanent Token - inside Meta section */}
                    <div className="pt-4 border-t border-white/10">
                        <label className="text-sm text-white/60 mb-2 block">Token Permanente do System User (EAAW...)</label>
                        <textarea
                            value={keys.whatsapp_token}
                            onChange={(e) => setKeys({ ...keys, whatsapp_token: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary h-20"
                            placeholder="Token permanente gerado no Meta Business Suite"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
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
                            className="bg-primary hover:bg-primary-dark py-2 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Config Meta</span>
                        </button>
                        <button
                            onClick={() => handleSave('WHATSAPP_TOKEN', keys.whatsapp_token)}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Token WA</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* AI Section (Gemini) */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-purple-500" />
                    <span>Google Gemini AI</span>
                </h2>
                <div className="space-y-4">
                    <input
                        type="password"
                        value={keys.gemini_key}
                        onChange={(e) => setKeys({ ...keys, gemini_key: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                        placeholder="Gemini API Key"
                    />
                    <button
                        onClick={() => handleSave('GEMINI_API_KEY', keys.gemini_key)}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark py-2 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Salvar Gemini</span>
                    </button>
                </div>
            </section>

            {/* EvolutionAPI Section - SuperAdmin Only */}
            {userRole === 'superadmin' && (
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                        <Zap className="w-5 h-5 text-green-500" />
                        <span>EvolutionAPI (Configuração Global)</span>
                    </h2>
                    <p className="text-xs text-gray-400 mb-4">Esta configuração será usada por todos os usuários para criar suas instâncias WhatsApp.</p>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={keys.evolution_api_url}
                            onChange={(e) => setKeys({ ...keys, evolution_api_url: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="Instance URL (ex: https://evolution.seudominio.com)"
                        />
                        <input
                            type="password"
                            value={keys.evolution_api_key}
                            onChange={(e) => setKeys({ ...keys, evolution_api_key: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="API Key / Global Token"
                        />
                        <button
                            onClick={async () => {
                                await handleSave('EVOLUTION_API_URL', keys.evolution_api_url);
                                await handleSave('EVOLUTION_API_KEY', keys.evolution_api_key);
                            }}
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-dark py-2 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar EvolutionAPI (Global)</span>
                        </button>
                    </div>
                </section>
            )}

            {/* n8n Automation Section */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <span>Automação n8n</span>
                </h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={keys.n8n_webhook_url}
                        onChange={(e) => setKeys({ ...keys, n8n_webhook_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                        placeholder="n8n Webhook URL"
                    />
                    <button
                        onClick={() => handleSave('N8N_WEBHOOK_URL', keys.n8n_webhook_url)}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark py-2 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Salvar n8n</span>
                    </button>
                </div>
            </section>

            {/* Telegram Section */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <Send className="w-5 h-5 text-blue-400" />
                    <span>Telegram Bot</span>
                </h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={keys.telegram_token}
                        onChange={(e) => setKeys({ ...keys, telegram_token: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                        placeholder="Bot Token (123456:ABC-DEF...)"
                    />
                    <button
                        onClick={() => handleSave('TELEGRAM_TOKEN', keys.telegram_token)}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark py-2 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Salvar Telegram</span>
                    </button>
                </div>
            </section>

            {/* YouTube Section */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <Youtube className="w-5 h-5 text-red-600" />
                    <span>YouTube API</span>
                </h2>
                <div className="space-y-4">
                    <input
                        type="password"
                        value={keys.youtube_api_key}
                        onChange={(e) => setKeys({ ...keys, youtube_api_key: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                        placeholder="Google Cloud API Key"
                    />
                    <button
                        onClick={() => handleSave('YOUTUBE_API_KEY', keys.youtube_api_key)}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark py-2 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Salvar YouTube</span>
                    </button>
                </div>
            </section>

            {/* LinkedIn Section */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <Linkedin className="w-5 h-5 text-blue-700" />
                    <span>LinkedIn API</span>
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={keys.linkedin_client_id}
                            onChange={(e) => setKeys({ ...keys, linkedin_client_id: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="Client ID"
                        />
                        <input
                            type="password"
                            value={keys.linkedin_client_secret}
                            onChange={(e) => setKeys({ ...keys, linkedin_client_secret: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="Client Secret"
                        />
                    </div>
                    <button
                        onClick={() => handleSave('LINKEDIN_CONFIG', JSON.stringify({ clientId: keys.linkedin_client_id, secret: keys.linkedin_client_secret }))}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark py-2 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Salvar LinkedIn</span>
                    </button>
                </div>
            </section>

            {/* Mercado Livre Section */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <ShoppingBag className="w-5 h-5 text-yellow-500" />
                    <span>Mercado Livre API</span>
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={keys.ml_client_id}
                            onChange={(e) => setKeys({ ...keys, ml_client_id: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="Application ID"
                        />
                        <input
                            type="password"
                            value={keys.ml_client_secret}
                            onChange={(e) => setKeys({ ...keys, ml_client_secret: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="Client Secret"
                        />
                    </div>
                    <button
                        onClick={() => handleSave('MERCADO_LIVRE_CONFIG', JSON.stringify({ clientId: keys.ml_client_id, secret: keys.ml_client_secret }))}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark py-2 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Salvar Mercado Livre</span>
                    </button>
                </div>
            </section>

            {/* OLX Section */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <Store className="w-5 h-5 text-orange-600" />
                    <span>OLX API</span>
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={keys.olx_app_id}
                            onChange={(e) => setKeys({ ...keys, olx_app_id: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="App ID"
                        />
                        <input
                            type="password"
                            value={keys.olx_app_secret}
                            onChange={(e) => setKeys({ ...keys, olx_app_secret: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="App Secret"
                        />
                    </div>
                    <button
                        onClick={() => handleSave('OLX_CONFIG', JSON.stringify({ appId: keys.olx_app_id, secret: keys.olx_app_secret }))}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark py-2 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Salvar OLX</span>
                    </button>
                </div>
            </section>
        </div>
    );
}
