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
    AlertCircle,
    Coins,
    Smartphone,
    Instagram,
    MessageCircle,
    Eye,
    EyeOff,
    CheckCircle2
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';


interface ApiSettingsFieldsProps {
    token: string;
    tenantId?: string | null;
    isAdminMode?: boolean;
    userRole?: string;
}

export default function ApiSettingsFields({ token, tenantId = null, isAdminMode = false, userRole = 'user' }: ApiSettingsFieldsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { lang } = useLanguage();

    const t: any = {
        pt_BR: {
            save_success: 'Chave salva com sucesso!',
            save_error: 'Erro ao salvar chave.',
            load_error: 'Erro ao carregar chaves existentes.',
            n8n_title: 'Automação n8n',
            n8n_fallback: 'Webhook Padrão (Fallback)',
            n8n_provider_title: 'Webhooks por Provedor (Avançado)',
            n8n_save: 'Salvar Configuração n8n',
            instagram_inbox: 'INSTAGRAM INBOX',
            instagram_comments: 'INSTAGRAM COMMENTS',
            evolution: 'EVOLUTION',
            telegram: 'TELEGRAM',
            mercadolivre: 'MERCADOLIVRE',
            whatsapp: 'WHATSAPP'
        },
        en_US: {
            save_success: 'Key saved successfully!',
            save_error: 'Error saving key.',
            load_error: 'Error loading existing keys.',
            n8n_title: 'n8n Automation',
            n8n_fallback: 'Default Webhook (Fallback)',
            n8n_provider_title: 'Webhooks per Provider (Advanced)',
            n8n_save: 'Save n8n Configuration',
            instagram_inbox: 'INSTAGRAM INBOX',
            instagram_comments: 'INSTAGRAM COMMENTS',
            evolution: 'EVOLUTION',
            telegram: 'TELEGRAM',
            mercadolivre: 'MERCADOLIVRE',
            whatsapp: 'WHATSAPP'
        },
        pt_PT: {
            save_success: 'Chave guardada com sucesso!',
            save_error: 'Erro ao guardar a chave.',
            load_error: 'Erro ao carregar chaves existentes.',
            n8n_title: 'Automação n8n',
            n8n_fallback: 'Webhook Padrão (Fallback)',
            n8n_provider_title: 'Webhooks por Fornecedor (Avançado)',
            n8n_save: 'Guardar Configuração n8n',
            instagram_inbox: 'INSTAGRAM INBOX',
            instagram_comments: 'INSTAGRAM COMMENTS',
            evolution: 'EVOLUTION',
            telegram: 'TELEGRAM',
            mercadolivre: 'MERCADOLIVRE',
            whatsapp: 'WHATSAPP'
        },
        it_IT: {
            save_success: 'Chiave salvata con successo!',
            save_error: 'Errore durante il salvataggio della chiave.',
            load_error: 'Errore durante il caricamento delle chiavi esistenti.',
            n8n_title: 'Automazione n8n',
            n8n_fallback: 'Webhook Predefinito (Fallback)',
            n8n_provider_title: 'Webhook per Provider (Avanzato)',
            n8n_save: 'Salva Configurazione n8n',
            instagram_inbox: 'INSTAGRAM INBOX',
            instagram_comments: 'INSTAGRAM COMMENTS',
            evolution: 'EVOLUTION',
            telegram: 'TELEGRAM',
            mercadolivre: 'MERCADOLIVRE',
            whatsapp: 'WHATSAPP'
        }
    };

    const txt = t[lang] || t['pt_BR'];

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
        instagram_app_id: '',
        instagram_app_secret: '',
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
        erp_zaplandia_key: '',
        openrouter_key: '',
        rifa_api_key: '',
        rifa_api_url: '',
        n8n_provider_config: '',
        instagram_token: '',
    });

    const [openrouterCredits, setOpenrouterCredits] = useState<{ total_credits: number, total_usage: number } | null>(null);
    const [showKeys, setShowKeys] = useState({ gemini: false, openrouter: false });

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
            setStatus({ type: 'error', msg: txt.load_error });
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
                    if (parsed.appId) next.fb_app_id = parsed.appId;
                    if (parsed.secret) next.fb_app_secret = parsed.secret;
                    if (parsed.pageAccessToken) next.meta_page_access_token = parsed.pageAccessToken;
                    if (parsed.instagramBusinessId) next.meta_instagram_business_id = parsed.instagramBusinessId;
                    if (parsed.instagramAppId) next.instagram_app_id = parsed.instagramAppId;
                    if (parsed.instagramAppSecret) next.instagram_app_secret = parsed.instagramAppSecret;
                    if (parsed.instagramAccessToken) next.instagram_token = parsed.instagramAccessToken;
                    if (parsed.verifyToken) next.meta_verify_token = parsed.verifyToken;
                    if (parsed.whatsappPhoneNumberId) next.whatsapp_phone_number_id = parsed.whatsappPhoneNumberId;
                    if (parsed.whatsappBusinessAccountId) next.whatsapp_business_account_id = parsed.whatsappBusinessAccountId;
                } catch (e) { }
            }
            if (item.key_name === 'WHATSAPP_TOKEN' || item.key_name === 'META_ACCESS_TOKEN') {
                if (!next.whatsapp_token) next.whatsapp_token = item.key_value;
                if (!next.meta_page_access_token) next.meta_page_access_token = item.key_value;
            }
            if (item.key_name === 'META_WABA_ID' && !next.whatsapp_business_account_id) {
                next.whatsapp_business_account_id = item.key_value;
            }
            if (item.key_name === 'META_PHONE_NUMBER_ID' && !next.whatsapp_phone_number_id) {
                next.whatsapp_phone_number_id = item.key_value;
            }
            if (item.key_name === 'INSTAGRAM_PAGE_ID' && !next.meta_instagram_business_id) {
                next.meta_instagram_business_id = item.key_value;
            }
            
            if (item.key_name === 'GEMINI_API_KEY') next.gemini_key = item.key_value;
            if (item.key_name === 'TELEGRAM_TOKEN') next.telegram_token = item.key_value;
            if (item.key_name === 'YOUTUBE_API_KEY') next.youtube_api_key = item.key_value;
            if (item.key_name === 'N8N_WEBHOOK_URL') next.n8n_webhook_url = item.key_value;
            if (item.key_name === 'N8N_PROVIDER_CONFIG') next.n8n_provider_config = item.key_value;

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
            if (item.key_name === 'ERP_ZAPLANDIA_KEY') next.erp_zaplandia_key = item.key_value;
            if (item.key_name === 'OPENROUTER_API_KEY') next.openrouter_key = item.key_value;
            if (item.key_name === 'RIFA_API_KEY') next.rifa_api_key = item.key_value;
            if (item.key_name === 'RIFA_API_URL') next.rifa_api_url = item.key_value;
        });
        setKeys(next);

        // If OpenRouter key exists, fetch credits
        const orKey = data.find((i: any) => i.key_name === 'OPENROUTER_API_KEY')?.key_value;
        if (orKey) fetchOpenRouterCredits();
    };

    const fetchOpenRouterCredits = async () => {
        try {
            const res = await fetch('/api/ai/openrouter/credits', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOpenrouterCredits(data);
            }
        } catch (e) {
            console.error('Erro ao buscar créditos OpenRouter:', e);
        }
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
            setStatus({ type: 'success', msg: `${name} ${txt.save_success || 'saved successfully!'}` });

            // Re-fetch to confirm persistence and update UI
            setTimeout(fetchExistingKeys, 500);
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.message || txt.save_error });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {status && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 sticky top-0 z-20 backdrop-blur-md shadow-xl animate-in slide-in-from-top duration-300 ${status.type === 'success' ? 'bg-green-500/20 border border-green-500/50 text-green-200' : 'bg-red-500/20 border border-red-500/50 text-red-200'}`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                    <span className="text-sm font-bold">{status.msg}</span>
                </div>
            )}

            {/* --- AI SECTION (PRIORITY) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Section (Gemini) */}
                <section className="bg-gradient-to-br from-purple-900/20 to-black/40 border border-purple-500/20 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-500">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 blur-[60px] group-hover:bg-purple-500/20 transition-all duration-500"></div>
                    
                    <h2 className="text-xl font-black mb-8 flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-xl">
                            <Zap className="w-5 h-5 text-purple-500" />
                        </div>
                        <span>Google Gemini AI</span>
                    </h2>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Chave de API do Gemini</label>
                            <div className="relative">
                                <input
                                    type={showKeys.gemini ? "text" : "password"}
                                    value={keys.gemini_key}
                                    onChange={(e) => setKeys({ ...keys, gemini_key: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all font-mono"
                                    placeholder="Insira sua chave AI aqui..."
                                />
                                <button 
                                    onClick={() => setShowKeys({...showKeys, gemini: !showKeys.gemini})}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition text-gray-500"
                                >
                                    {showKeys.gemini ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleSave('GEMINI_API_KEY', keys.gemini_key)}
                                disabled={isLoading}
                                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center space-x-2 shadow-lg shadow-purple-900/20"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                <span>Salvar Gemini</span>
                            </button>
                            <button
                                onClick={() => handleTestKey('gemini')}
                                disabled={isLoading || !keys.gemini_key}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center space-x-2"
                            >
                                <Zap className="w-5 h-5 text-yellow-500" />
                                <span>Testar</span>
                            </button>
                        </div>
                        
                        <p className="text-[10px] text-gray-500 text-center font-bold uppercase tracking-tighter">
                            A Lisa IA e as automações usam esta chave para processamento.
                        </p>
                    </div>
                </section>

                {/* AI Section (OpenRouter) */}
                <section className="bg-gradient-to-br from-cyan-900/20 to-black/40 border border-cyan-500/20 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-500">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 blur-[60px] group-hover:bg-cyan-500/20 transition-all duration-500"></div>

                    <h2 className="text-xl font-black mb-8 flex items-center space-x-3">
                        <div className="p-2 bg-cyan-500/20 rounded-xl">
                            <Zap className="w-5 h-5 text-cyan-500" />
                        </div>
                        <span>OpenRouter AI</span>
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Chave de API OpenRouter</label>
                            <div className="relative">
                                <input
                                    type={showKeys.openrouter ? "text" : "password"}
                                    value={keys.openrouter_key}
                                    onChange={(e) => setKeys({ ...keys, openrouter_key: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                                    placeholder="sk-or-v1-..."
                                />
                                <button 
                                    onClick={() => setShowKeys({...showKeys, openrouter: !showKeys.openrouter})}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition text-gray-500"
                                >
                                    {showKeys.openrouter ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {openrouterCredits && (
                            <div className="flex items-center space-x-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                                <Coins className="w-5 h-5 text-cyan-400" />
                                <div>
                                    <p className="text-[10px] text-cyan-300 uppercase font-black tracking-widest">Saldo Disponível</p>
                                    <p className="text-lg font-black text-white">
                                        ${(openrouterCredits.total_credits - openrouterCredits.total_usage).toFixed(4)} USD
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleSave('OPENROUTER_API_KEY', keys.openrouter_key)}
                                disabled={isLoading}
                                className="bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/20"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                <span>Salvar OpenRouter</span>
                            </button>
                            <button
                                onClick={() => window.open('https://openrouter.ai/keys', '_blank')}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center space-x-2"
                            >
                                <Globe size={18} className="text-gray-400" />
                                <span>Gerar Chave</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="h-px bg-white/5 my-8"></div>

            {/* Meta Section (Official WhatsApp Cloud API) */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span>Meta (Facebook, Instagram, WhatsApp Cloud API)</span>
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase font-black ml-1">App ID</label>
                            <input
                                type="text"
                                value={keys.fb_app_id}
                                onChange={(e) => setKeys({ ...keys, fb_app_id: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition"
                                placeholder="App ID"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase font-black ml-1">App Secret</label>
                            <input
                                type="password"
                                value={keys.fb_app_secret}
                                onChange={(e) => setKeys({ ...keys, fb_app_secret: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition"
                                placeholder="App Secret"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] text-white/40 uppercase font-black ml-1">Page Access Token</label>
                        <textarea
                            value={keys.meta_page_access_token}
                            onChange={(e) => setKeys({ ...keys, meta_page_access_token: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary h-20 transition"
                            placeholder="Page Access Token (EAA...)"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase font-black ml-1">WhatsApp Phone ID</label>
                            <input
                                type="text"
                                value={keys.whatsapp_phone_number_id}
                                onChange={(e) => setKeys({ ...keys, whatsapp_phone_number_id: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition"
                                placeholder="WhatsApp Phone ID"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase font-black ml-1">WABA ID</label>
                            <input
                                type="text"
                                value={keys.whatsapp_business_account_id}
                                onChange={(e) => setKeys({ ...keys, whatsapp_business_account_id: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition"
                                placeholder="WABA ID"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase font-black ml-1">
                                {lang === 'en_US' ? 'Instagram Business ID' : 'Instagram Business ID'}
                            </label>
                            <input
                                type="text"
                                value={keys.meta_instagram_business_id}
                                onChange={(e) => setKeys({ ...keys, meta_instagram_business_id: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition"
                                placeholder={lang === 'en_US' ? 'Numeric Page ID' : 'ID Numérico da Página'}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase font-black ml-1">
                                {lang === 'en_US' ? 'Instagram Access Token' : 'Token Instagram'}
                            </label>
                            <input
                                type="password"
                                value={keys.instagram_token}
                                onChange={(e) => setKeys({ ...keys, instagram_token: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition"
                                placeholder="EAAK..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 mt-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase font-black ml-1">Token Permanente do System User</label>
                            <textarea
                                value={keys.whatsapp_token}
                                onChange={(e) => setKeys({ ...keys, whatsapp_token: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary h-20 transition"
                                placeholder="EAAW... (Token de longa duração)"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                            onClick={() => handleSave('META_APP_CONFIG', JSON.stringify({
                                appId: keys.fb_app_id,
                                secret: keys.fb_app_secret,
                                pageAccessToken: keys.meta_page_access_token,
                                instagramBusinessId: keys.meta_instagram_business_id,
                                instagramAccessToken: keys.instagram_token,
                                instagramAppId: keys.instagram_app_id,
                                instagramAppSecret: keys.instagram_app_secret,
                                verifyToken: keys.meta_verify_token,
                                whatsappPhoneNumberId: keys.whatsapp_phone_number_id,
                                whatsappBusinessAccountId: keys.whatsapp_business_account_id
                            }))}
                            disabled={isLoading}
                            className="bg-primary/20 border border-primary/30 hover:bg-primary/30 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 text-primary"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar Meta</span>
                        </button>
                        <button
                            onClick={() => handleSave('WHATSAPP_TOKEN', keys.whatsapp_token)}
                            disabled={isLoading}
                            className="bg-green-600/20 border border-green-600/30 hover:bg-green-600/30 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 text-green-500"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Salvar WhatsApp</span>
                        </button>
                    </div>
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
                    <span>{txt.n8n_title}</span>
                </h2>
                <div className="space-y-4">
                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-4">
                        <p className="text-sm text-orange-300 font-bold mb-2">{txt.n8n_fallback}</p>
                        <input
                            type="text"
                            value={keys.n8n_webhook_url}
                            onChange={(e) => setKeys({ ...keys, n8n_webhook_url: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                            placeholder="URL Global n8n"
                        />
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <p className="text-xs text-white/60 font-bold mb-3 uppercase tracking-wider">{txt.n8n_provider_title}</p>
                        <div className="space-y-3">
                            {['whatsapp', 'instagram_inbox', 'instagram_comments', 'evolution', 'telegram', 'mercadolivre'].map(provider => (
                                <div key={provider} className="flex flex-col space-y-1">
                                    <label className="text-[10px] text-white/40 font-bold uppercase ml-1">{txt[provider] || provider}</label>
                                    <input
                                        type="text"
                                        value={(() => {
                                            try {
                                                const config = JSON.parse(keys.n8n_provider_config || '{}');
                                                return config[provider] || '';
                                            } catch(e) { return ''; }
                                        })()}
                                        onChange={(e) => {
                                            const currentConfig = (() => {
                                                try { return JSON.parse(keys.n8n_provider_config || '{}'); } catch(e) { return {}; }
                                            })();
                                            const newConfig = { ...currentConfig, [provider]: e.target.value };
                                            setKeys({ ...keys, n8n_provider_config: JSON.stringify(newConfig) });
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-orange-500"
                                        placeholder={`URL n8n for ${provider}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            await handleSave('N8N_WEBHOOK_URL', keys.n8n_webhook_url);
                            await handleSave('N8N_PROVIDER_CONFIG', keys.n8n_provider_config);
                        }}
                        disabled={isLoading}
                        className="w-full bg-orange-600 hover:bg-orange-700 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{txt.n8n_save}</span>
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

            {/* ERP Zaplandia Section */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    <span>ERP Zaplandia</span>
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-white/60 mb-2 block uppercase tracking-widest font-black">Chave da API (X-API-Key)</label>
                        <input
                            type="password"
                            value={keys.erp_zaplandia_key}
                            onChange={(e) => setKeys({ ...keys, erp_zaplandia_key: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition"
                            placeholder="Insira a API Key gerada no ERP"
                        />
                    </div>
                    <button
                        onClick={() => handleSave('ERP_ZAPLANDIA_KEY', keys.erp_zaplandia_key)}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark py-3 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Salvar ERP Zaplandia</span>
                    </button>
                    <p className="text-[10px] text-gray-500 text-center">Acesse Sistema &gt; API Keys no seu ERP para gerar esta chave.</p>
                </div>
            </section>

            {/* Rifa API Section */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-indigo-500" />
                    <span>Rifa API Integration</span>
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-white/60 mb-2 block uppercase tracking-widest font-black">URL da API (Ex: https://rifas.meudominio.com)</label>
                        <input
                            type="text"
                            value={keys.rifa_api_url}
                            onChange={(e) => setKeys({ ...keys, rifa_api_url: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition mb-4"
                            placeholder="https://rifas.zaplandia.com.br"
                        />
                        <label className="text-xs text-white/60 mb-2 block uppercase tracking-widest font-black">Chave da API (X-API-Key)</label>
                        <input
                            type="password"
                            value={keys.rifa_api_key}
                            onChange={(e) => setKeys({ ...keys, rifa_api_key: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition"
                            placeholder="Insira a sua chave da Rifa API"
                        />
                    </div>
                    <button
                        onClick={async () => {
                            await handleSave('RIFA_API_URL', keys.rifa_api_url);
                            await handleSave('RIFA_API_KEY', keys.rifa_api_key);
                        }}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark py-3 rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Salvar Rifa API</span>
                    </button>
                    <p className="text-[10px] text-gray-500 text-center">Utilize a chave gerada no painel de rifas para esta integração.</p>
                </div>
            </section>
        </div>
    );
}
