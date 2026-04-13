'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Loader2,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Facebook,
    Shield,
    ExternalLink,
    Search,
    MessageSquare,
    Phone,
    Copy,
    ChevronRight,
    ArrowLeft,
    Plus,
    X
} from 'lucide-react';

export default function MetaApiPage() {
    const { token, user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [creds, setCreds] = useState({
        META_ACCESS_TOKEN: '',
        META_WABA_ID: '',
        META_PHONE_NUMBER_ID: ''
    });

    const [profile, setProfile] = useState<any>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'phones'>('config');

    // Template Creation State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateData, setTemplateData] = useState({
        name: '',
        category: 'MARKETING',
        language: 'pt_BR',
        bodyText: ''
    });

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch credentials
            const credRes = await fetch('/api/integrations/credentials', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (credRes.ok) {
                const data = await credRes.json();
                const metaCreds = {
                    META_ACCESS_TOKEN: data.find((c: any) => c.key_name === 'META_ACCESS_TOKEN')?.key_value || '',
                    META_WABA_ID: data.find((c: any) => c.key_name === 'META_WABA_ID')?.key_value || '',
                    META_PHONE_NUMBER_ID: data.find((c: any) => c.key_name === 'META_PHONE_NUMBER_ID')?.key_value || ''
                };
                setCreds(metaCreds);
            }

            // If we have WABA_ID, fetch remaining data
            const wabaId = await fetchWabaIdFromCreds();
            if (wabaId) {
                fetchMetaDetails();
            }
        } catch (e: any) {
            setError('Falha ao carregar dados: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchWabaIdFromCreds = async () => {
        const res = await fetch('/api/integrations/credentials', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        return data.find((c: any) => c.key_name === 'META_WABA_ID')?.key_value;
    };

    const fetchMetaDetails = async () => {
        try {
            const [profRes, tempRes, phoneRes] = await Promise.all([
                fetch('/api/integrations/meta/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/integrations/meta/templates', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/integrations/meta/phone-numbers', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (profRes.ok) setProfile(await profRes.json());
            if (tempRes.ok) {
                const tempData = await tempRes.json();
                setTemplates(tempData.data || []);
            }
            if (phoneRes.ok) {
                const phoneData = await phoneRes.json();
                setPhoneNumbers(phoneData.data || []);
            }
        } catch (e) {
            console.error('Meta details fetch error', e);
        }
    };

    const handleSaveCreds = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            for (const [key, value] of Object.entries(creds)) {
                if (!value) continue;
                const res = await fetch('/api/integrations/credentials', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: key, value })
                });
                if (!res.ok) throw new Error(`Falha ao salvar ${key}`);
            }
            setSuccess('Credenciais salvas com sucesso!');
            fetchMetaDetails();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch('/api/integrations/meta/test', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Conexão estabelecida com sucesso!');
                fetchMetaDetails();
            } else {
                setError('Erro na conexão: ' + (data.error?.message || JSON.stringify(data.error)));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setTesting(false);
        }
    };

    const handleRegisterNumber = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const pin = prompt('Se você tem Verificação em Duas Etapas, digite o PIN de 6 dígitos. Se não tem, deixe em branco e clique em OK.');
            const res = await fetch('/api/integrations/meta/register', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pin: pin || '000000' })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess('Número ativado com sucesso! Ele deve ficar On-line em instantes.');
                fetchMetaDetails();
            } else {
                setError('Falha na ativação: ' + (data.message || 'Erro desconhecido'));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!templateData.name || !templateData.bodyText) {
            setError('Nome e Texto são obrigatórios');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/integrations/meta/templates', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(templateData)
            });

            if (res.ok) {
                setSuccess('Modelo enviado para aprovação com sucesso!');
                setIsModalOpen(false);
                setTemplateData({ name: '', category: 'MARKETING', language: 'pt_BR', bodyText: '' });
                fetchMetaDetails();
            } else {
                const data = await res.json();
                setError('Falha ao criar modelo: ' + (data.message || 'Erro desconhecido'));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSuccess('ID copiado!');
        setTimeout(() => setSuccess(null), 2000);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 text-white max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center space-x-4">
                    <button onClick={() => router.push('/dashboard/integrations')} className="p-2 hover:bg-white/10 rounded-xl transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight flex items-center space-x-3">
                            <Facebook className="w-8 h-8 text-primary" />
                            <span>Integração Meta API</span>
                        </h1>
                        <p className="text-gray-400 mt-1">Conecte sua conta do WhatsApp Business Oficial</p>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={fetchData}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleRegisterNumber}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition shadow-lg shadow-green-500/20"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>Ativar Número (Ficar On-line)</span>
                    </button>
                    <button
                        onClick={handleTestConnection}
                        disabled={testing}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition shadow-lg shadow-primary/20"
                    >
                        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        <span>Testar Conexão</span>
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Side - Vertical Tabs */}
                <div className="lg:col-span-3 space-y-2">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition font-bold text-sm ${activeTab === 'config' ? 'bg-primary text-white' : 'bg-surface border border-white/5 text-gray-400 hover:border-white/20'}`}
                    >
                        <Shield className="w-5 h-5" />
                        <span>Configurações</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition font-bold text-sm ${activeTab === 'templates' ? 'bg-primary text-white' : 'bg-surface border border-white/5 text-gray-400 hover:border-white/20'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <MessageSquare className="w-5 h-5" />
                            <span>Templates (BBM)</span>
                        </div>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{templates.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('phones')}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition font-bold text-sm ${activeTab === 'phones' ? 'bg-primary text-white' : 'bg-surface border border-white/5 text-gray-400 hover:border-white/20'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5" />
                            <span>Números de Telefone</span>
                        </div>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{phoneNumbers.length}</span>
                    </button>

                    <div className="pt-6">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                            <h3 className="text-blue-400 font-bold text-sm mb-2 flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>Precisa de Ajuda?</span>
                            </h3>
                            <p className="text-xs text-blue-400/80 leading-relaxed mb-4">
                                Para integrar, você precisa criar um App na plataforma Meta for Developers e configurar o WhatsApp.
                            </p>
                            <a
                                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                                target="_blank"
                                className="text-xs font-bold text-blue-400 flex items-center space-x-1 hover:underline"
                            >
                                <span>Ver documentação</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right Side - Content Area */}
                <div className="lg:col-span-9 space-y-6">

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm flex items-center space-x-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden">
                            <div className="p-8 border-b border-white/5 bg-white/2">
                                <h2 className="text-xl font-bold flex items-center space-x-2">
                                    <Shield className="w-6 h-6 text-primary" />
                                    <span>Segurança e Credenciais</span>
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">Insira suas chaves de acesso da Nuvem do WhatsApp (Meta Cloud API)</p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Access Token (Permanente)</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={creds.META_ACCESS_TOKEN}
                                            onChange={(e) => setCreds({ ...creds, META_ACCESS_TOKEN: e.target.value })}
                                            placeholder="EAAB..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500">Crie um Token de Acesso permanente no seu Gerenciador de Negócios.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">WABA ID (Business Account)</label>
                                        <input
                                            type="text"
                                            value={creds.META_WABA_ID}
                                            onChange={(e) => setCreds({ ...creds, META_WABA_ID: e.target.value })}
                                            placeholder="Ex: 1029384756..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Phone Number ID</label>
                                        <input
                                            type="text"
                                            value={creds.META_PHONE_NUMBER_ID}
                                            onChange={(e) => setCreds({ ...creds, META_PHONE_NUMBER_ID: e.target.value })}
                                            placeholder="Ex: 987654321..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition"
                                        />
                                    </div>
                                </div>

                                {profile && (
                                    <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-primary/20 rounded-xl">
                                                <Facebook className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{profile.name}</p>
                                                <p className="text-xs text-primary/70 uppercase font-black tracking-widest">Status: Conectado</p>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-gray-500">
                                            <p>Moeda: {profile.currency}</p>
                                            <p>Zona: {profile.timezone_id}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-white/2 border-t border-white/5 flex justify-end">
                                <button
                                    onClick={handleSaveCreds}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-2xl font-black flex items-center space-x-3 transition shadow-xl shadow-primary/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    <span>Salvar Integracao</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="space-y-4">
                            <div className="bg-surface border border-white/5 rounded-3xl p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold">Templates de Mensagem (BBM)</h2>
                                        <p className="text-sm text-gray-400">Templates aprovados em sua conta Meta</p>
                                    </div>
                                    <div className="flex items-center space-x-3 w-full md:w-auto">
                                        <div className="relative flex-1 md:w-64">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder="Buscar template..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2 text-sm outline-none focus:border-primary transition"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl transition shadow-lg flex items-center space-x-2"
                                            title="Criar Novo Modelo"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">Novo Modelo</span>
                                        </button>
                                    </div>
                                </div>

                                {templates.length === 0 ? (
                                    <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                                        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p className="text-gray-500 font-bold">Nenhum template encontrado</p>
                                        <p className="text-xs text-gray-600 mt-2">Verifique a conexão ou crie templates no Meta Business Suite</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {templates.map((temp: any) => (
                                            <div key={temp.id} className="bg-white/2 border border-white/5 hover:border-primary/30 rounded-2xl p-5 transition group cursor-pointer">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${temp.status === 'APPROVED' ? 'bg-green-500/20 text-green-500' :
                                                            temp.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                                                        }`}>
                                                        {temp.status}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-bold">ID: {temp.id.slice(0, 8)}...</span>
                                                </div>
                                                <h3 className="font-bold text-sm mb-1 truncate">{temp.name}</h3>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{temp.category} • {temp.language}</p>

                                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition">
                                                    <span className="text-[10px] text-primary font-bold">Ver detalhes</span>
                                                    <ChevronRight className="w-4 h-4 text-primary" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'phones' && (
                        <div className="bg-surface border border-white/5 rounded-3xl p-8">
                            <h2 className="text-xl font-bold mb-6">Números de Telefone Registrados</h2>

                            {phoneNumbers.length === 0 ? (
                                <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                                    <Phone className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-gray-500 font-bold">Nenhum número encontrado</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {phoneNumbers.map((phone: any) => (
                                        <div key={phone.id} className="bg-white/2 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                                            <div className="flex items-center space-x-6">
                                                <div className="p-4 bg-primary/10 rounded-2xl">
                                                    <Phone className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black">{phone.verified_name}</h3>
                                                    <p className="text-sm text-gray-400 font-medium">+{phone.display_phone_number}</p>
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase">{phone.quality_rating} Quality</span>
                                                        <span className="text-[10px] font-black text-gray-500 bg-white/5 px-2 py-0.5 rounded uppercase">Tier: {phone.tier}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                                <button
                                                    onClick={() => copyToClipboard(phone.id)}
                                                    className="flex items-center space-x-2 text-[10px] font-black uppercase text-gray-500 hover:text-white transition"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    <span>COPIAR PHONE ID</span>
                                                </button>
                                                <p className="text-[10px] text-gray-600 font-bold">ID: {phone.id}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Create Template Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 bg-white/2 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">Criar Novo Modelo (BBM)</h2>
                                <p className="text-xs text-gray-400 mt-1">Este modelo será enviado para aprovação da Meta.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Nome do Modelo</label>
                                <input
                                    type="text"
                                    value={templateData.name}
                                    onChange={(e) => setTemplateData({ ...templateData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                    placeholder="ex: promocao_verao_2024"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition"
                                />
                                <p className="text-[10px] text-gray-500">Apenas letras minúsculas, números e sublinhados.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Categoria</label>
                                    <select
                                        value={templateData.category}
                                        onChange={(e) => setTemplateData({ ...templateData, category: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition appearance-none"
                                    >
                                        <option value="MARKETING">Marketing</option>
                                        <option value="UTILITY">Utilidade</option>
                                        <option value="AUTHENTICATION">Autenticação</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Idioma</label>
                                    <select
                                        value={templateData.language}
                                        onChange={(e) => setTemplateData({ ...templateData, language: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition appearance-none"
                                    >
                                        <option value="pt_BR">Português (BR)</option>
                                        <option value="en_US">Inglês (US)</option>
                                        <option value="es_ES">Espanhol (ES)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Texto do Corpo (Body)</label>
                                <textarea
                                    value={templateData.bodyText}
                                    onChange={(e) => setTemplateData({ ...templateData, bodyText: e.target.value })}
                                    placeholder="Olá! Temos uma oferta especial para você..."
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-white/2 border-t border-white/5 flex gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateTemplate}
                                disabled={saving}
                                className="flex-[2] bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition shadow-xl shadow-primary/20"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                <span>Criar Modelo</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
