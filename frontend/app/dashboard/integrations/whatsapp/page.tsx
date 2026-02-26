'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Loader2,
    QrCode,
    Trash2,
    CheckCircle2,
    RefreshCw,
    Plus,
    Smartphone,
    XCircle,
    ArrowLeft,
    Phone,
    Link2,
    Bot,
    Save,
    X
} from 'lucide-react';
import AiModelSelector from '@/components/AiModelSelector';

interface WhatsAppInstance {
    instanceName: string;
    name?: string;
    status?: string;
    connectionStatus?: string;
    profileName?: string;
    profilePicture?: string;
    tenantId?: string;
    instance?: {
        instanceName?: string;
        state?: string;
    };
}

export default function WhatsAppInstancesPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newInstanceName, setNewInstanceName] = useState('');
    const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');

    // AI Configuration
    const [aiModalInstance, setAiModalInstance] = useState<string | null>(null);
    const [aiConfig, setAiConfig] = useState({ enabled: false, promptId: '', aiModel: 'gemini-1.5-flash' });
    const [isSavingAI, setIsSavingAI] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
    const [dbIntegrations, setDbIntegrations] = useState<any[]>([]); // DB integrations for AI config

    useEffect(() => {
        if (token) {
            fetchInstances();
            fetchPrompts();
            fetchDbIntegrations();
        }
    }, [token]);

    const fetchPrompts = async () => {
        try {
            const res = await fetch('/api/ai/prompts', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setSavedPrompts(data);
            }
        } catch (e) { console.error('Failed to fetch prompts', e); }
    };

    const fetchDbIntegrations = async () => {
        try {
            const res = await fetch('/api/integrations', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setDbIntegrations(data.filter((i: any) => i.provider === 'evolution'));
            }
        } catch (e) { console.error('Failed to fetch db integrations', e); }
    };

    const openAiModal = (instanceName: string) => {
        const dbInt = dbIntegrations.find((i: any) =>
            i.credentials?.instanceName === instanceName ||
            i.settings?.instanceName === instanceName ||
            i.instanceName === instanceName
        );
        setAiModalInstance(instanceName);
        setAiConfig({
            enabled: dbInt?.aiEnabled || false,
            promptId: dbInt?.aiPromptId || '',
            aiModel: dbInt?.aiModel || 'gemini-1.5-flash'
        });
    };

    const handleSaveAI = async () => {
        if (!aiModalInstance) return;
        setIsSavingAI(true);
        try {
            // Find DB integration for this instance to get the integration ID
            const dbInt = dbIntegrations.find((i: any) =>
                i.credentials?.instanceName === aiModalInstance ||
                i.settings?.instanceName === aiModalInstance ||
                i.instanceName === aiModalInstance
            );

            // Use the integration ID if found, otherwise use the instanceName (controller will create one)
            const integrationId = dbInt?.id || aiModalInstance;

            const res = await fetch(`/api/ai/integration/${integrationId}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    enabled: aiConfig.enabled,
                    promptId: aiConfig.promptId || undefined,
                    aiModel: aiConfig.aiModel
                })
            });

            if (res.ok) {
                setSuccessMessage(`IA ${aiConfig.enabled ? 'ativada' : 'desativada'} com sucesso para esta instância!`);
                setAiModalInstance(null);
                await fetchDbIntegrations(); // Refresh to show updated state
            } else {
                const err = await res.json();
                setError(`Erro ao salvar IA: ${err.message || JSON.stringify(err)}`);
            }
        } catch (e: any) {
            setError(`Erro ao salvar IA: ${e.message}`);
        } finally {
            setIsSavingAI(false);
        }
    };

    const fetchInstances = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/integrations/evolution/instances', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInstances(data);
            } else if (res.status === 401) {
                router.push('/auth/login');
            } else {
                const errData = await res.json();
                const errorMessage = errData.message || 'Erro ao carregar instâncias';

                // Handle "EvolutionAPI not configured" vs Server Error
                if (errorMessage.includes('EvolutionAPI não configurada')) {
                    setError('A EvolutionAPI ainda não foi configurada no sistema.');
                } else if (res.status === 500) {
                    setError('Erro no Servidor Evolution: O servidor retornou erro 500. Verifique se a URL e a Chave estão corretas ou se o servidor Evolution está instável.');
                } else {
                    setError(errorMessage);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Erro de conexão com o servidor');
        } finally {
            setIsLoading(false);
        }
    };

    const createInstance = async () => {
        if (!newInstanceName.trim()) {
            setError('Digite um nome para a instância');
            return;
        }
        setIsCreating(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const sanitizedName = newInstanceName.trim().replace(/\s+/g, '_').toLowerCase();
            const res = await fetch('/api/integrations/evolution/instance', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ instanceName: sanitizedName })
            });
            if (res.ok) {
                const data = await res.json();
                setNewInstanceName('');
                setSuccessMessage('Instância criada com sucesso!');
                await fetchInstances();
                await fetchInstances();
                // If QR code was returned, show it
                if (data.qrcode?.base64 || data.base64 || data.qrcode) {
                    const instanceName = data.instance?.instanceName || data.instanceName || `tenant_${user?.tenantId}_${sanitizedName}`;
                    setSelectedInstance(instanceName);
                    // Check if qrcode is object or string
                    const qr = data.qrcode?.base64 || data.base64 || (typeof data.qrcode === 'string' ? data.qrcode : null);
                    if (qr) setQrCode(qr);
                } else {
                    // Automatically try to fetch QR code if not returned (triggering backend auto-retry)
                    const instanceName = data.instance?.instanceName || data.instanceName || `tenant_${user?.tenantId}_${sanitizedName}`;
                    console.log("Auto-fetching QR code for:", instanceName);
                    setSelectedInstance(instanceName);
                    fetchQrCode(instanceName);
                }
            } else {
                const errData = await res.json();
                setError(errData.message || 'Erro ao criar instância');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao criar instância');
        } finally {
            setIsCreating(false);
        }
    };

    // Polling for status update when QR code is active
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (selectedInstance && qrCode) {
            interval = setInterval(async () => {
                try {
                    // Check specific instance status
                    const res = await fetch(`/api/integrations/evolution/status/${selectedInstance}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const statusData = await res.json();
                        // Evolution return like { instance: { state: 'open' } } or just { state: 'open' }
                        const state = statusData?.instance?.state || statusData?.state || 'unknown';

                        if (state === 'open' || state === 'connected') {
                            setQrCode(null); // Hide QR code
                            setSuccessMessage('WhatsApp conectado com sucesso!');
                            await fetchInstances(); // Refresh main list
                        }
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000); // Check every 3 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [selectedInstance, qrCode, token]);

    const fetchQrCode = async (instanceName: string) => {
        setQrLoading(true);
        setSelectedInstance(instanceName);
        setQrCode(null);
        setError(null);
        try {
            const res = await fetch(`/api/integrations/evolution/qrcode/${encodeURIComponent(instanceName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.base64) {
                    setQrCode(data.base64);
                } else if (data.state === 'open' || data.status === 'open') {
                    setSuccessMessage('Esta instância já está conectada!');
                    setQrCode(null);
                    await fetchInstances();
                } else if (data.code) {
                    // Some versions return code instead of base64
                    setQrCode(data.code);
                }
            } else {
                const errData = await res.json();
                setError(errData.message || 'Erro ao buscar QR Code');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setQrLoading(false);
        }
    };

    const deleteInstance = async (instanceName: string) => {
        if (!confirm(`Tem certeza que deseja excluir a instância "${getDisplayName(instanceName)}"?\n\nIsso irá desconectar o WhatsApp e remover todos os dados.`)) return;
        setError(null);
        try {
            const res = await fetch(`/api/integrations/evolution/instance/${encodeURIComponent(instanceName)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSuccessMessage('Instância excluída com sucesso!');
                await fetchInstances();
                if (selectedInstance === instanceName) {
                    setSelectedInstance(null);
                    setQrCode(null);
                }
            } else {
                const errData = await res.json();
                setError(errData.message || 'Erro ao excluir instância');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getDisplayName = (instanceName: string) => {
        // Remove tenant prefix: tenant_<uuid>_<name> -> <name>
        const parts = instanceName.split('_');
        if (parts.length >= 3) {
            return parts.slice(2).join('_');
        }
        return instanceName;
    };

    const getStatus = (instance: WhatsAppInstance) => {
        const state = instance.instance?.state || instance.connectionStatus || instance.status || 'unknown';
        return state.toLowerCase();
    };

    const getStatusBadge = (instance: WhatsAppInstance) => {
        const status = getStatus(instance);
        if (status === 'open' || status === 'connected') {
            return (
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conectado</span>
                </span>
            );
        } else if (status === 'close' || status === 'disconnected' || status === 'closed') {
            return (
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Desconectado</span>
                </span>
            );
        }
        return (
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Aguardando Conexão</span>
            </span>
        );
    };

    return (
        <div className="p-8 text-white pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.push('/dashboard/integrations')}
                        className="p-2 hover:bg-white/10 rounded-xl transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight flex items-center space-x-3">
                            <Smartphone className="w-8 h-8 text-primary" />
                            <span>Instâncias WhatsApp</span>
                        </h1>
                        <p className="text-gray-400 mt-1">Gerencie seus números conectados via EvolutionAPI</p>
                    </div>
                </div>
                <button
                    onClick={fetchInstances}
                    className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition font-bold text-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Atualizar</span>
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span>{error}</span>
                        {error.includes('configurada') && (
                            <button
                                onClick={() => router.push('/dashboard/settings/api')}
                                className="underline font-bold hover:text-red-300 ml-2"
                            >
                                Configurar Agora
                            </button>
                        )}
                    </div>
                    <button onClick={() => setError(null)} className="hover:text-red-300">✕</button>
                </div>
            )}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="hover:text-green-300">✕</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Create & List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Create New Instance */}
                    <div className="bg-surface border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                            <Plus className="w-5 h-5 text-primary" />
                            <span>Nova Instância</span>
                        </h2>
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <input
                                type="text"
                                value={newInstanceName}
                                onChange={(e) => setNewInstanceName(e.target.value)}
                                placeholder="Nome da instância (ex: vendas, suporte, marketing)"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                                onKeyDown={(e) => e.key === 'Enter' && createInstance()}
                            />
                            <button
                                onClick={createInstance}
                                disabled={isCreating}
                                className="bg-primary hover:bg-primary-dark px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition whitespace-nowrap"
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                <span>Criar Instância</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Cada instância representa um número de WhatsApp diferente que será conectado via QR Code.
                        </p>
                    </div>

                    {/* Instances List */}
                    <div className="bg-surface border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold flex items-center space-x-2">
                                <Phone className="w-5 h-5 text-primary" />
                                <span>Suas Instâncias ({instances.filter(inst => {
                                    if (user?.role !== 'superadmin' || selectedTenantFilter === 'all') return true;
                                    return inst.tenantId === selectedTenantFilter;
                                }).length})</span>
                            </h2>

                            {/* SuperAdmin Filter */}
                            {user?.role === 'superadmin' && instances.length > 0 && (() => {
                                // Get unique tenants from instances
                                const tenants = Array.from(new Set(instances.map(i => i.tenantId).filter(Boolean)));

                                if (tenants.length > 0) {
                                    return (
                                        <select
                                            value={selectedTenantFilter}
                                            onChange={(e) => setSelectedTenantFilter(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition"
                                        >
                                            <option value="all">Todos os Usuários ({instances.length})</option>
                                            {tenants.map(tenantId => {
                                                const count = instances.filter(i => i.tenantId === tenantId).length;
                                                return (
                                                    <option key={tenantId} value={tenantId || ''}>
                                                        Tenant: {tenantId?.substring(0, 8)}... ({count})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : instances.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-bold">Nenhuma instância criada</p>
                                <p className="text-sm mt-2">Crie uma instância acima para conectar seu WhatsApp</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {instances.map((instance: any) => {
                                    const instanceName = instance.name || instance.instance?.instanceName || instance.instanceName;
                                    const isSelected = selectedInstance === instanceName;
                                    const status = getStatus(instance);
                                    const isConnected = status === 'open' || status === 'connected';

                                    return (
                                        <div
                                            key={instanceName}
                                            className={`p-4 border rounded-xl transition ${isSelected
                                                ? 'border-primary bg-primary/10'
                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-3 rounded-xl ${isConnected ? 'bg-green-500/20' : 'bg-white/5'}`}>
                                                        <Smartphone className={`w-6 h-6 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg">{getDisplayName(instanceName)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    {getStatusBadge(instance)}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                                                {!isConnected && (
                                                    <button
                                                        onClick={() => fetchQrCode(instanceName)}
                                                        className="flex items-center space-x-2 bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-bold transition"
                                                    >
                                                        <QrCode className="w-4 h-4" />
                                                        <span>Conectar (QR Code)</span>
                                                    </button>
                                                )}
                                                {isConnected && (() => {
                                                    const dbInt = dbIntegrations.find((i: any) =>
                                                        i.credentials?.instanceName === instanceName ||
                                                        i.settings?.instanceName === instanceName ||
                                                        i.instanceName === instanceName
                                                    );
                                                    const aiIsActive = dbInt?.aiEnabled;
                                                    return (
                                                        <>
                                                            <button
                                                                onClick={() => router.push(`/dashboard/crm/campaigns?instance=${instanceName}`)}
                                                                className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-bold transition border border-white/10"
                                                            >
                                                                <Link2 className="w-4 h-4" />
                                                                <span>Associar a Campanha</span>
                                                            </button>
                                                            <button
                                                                onClick={() => openAiModal(instanceName)}
                                                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition border ${aiIsActive
                                                                    ? 'bg-primary/20 border-primary/40 text-primary'
                                                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                                                    }`}
                                                            >
                                                                <Bot className="w-4 h-4" />
                                                                <span>{aiIsActive ? 'IA Ativa ✓' : 'Configurar IA'}</span>
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                                <button
                                                    onClick={() => deleteInstance(instanceName)}
                                                    className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm font-bold transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Excluir</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - QR Code */}
                <div className="lg:col-span-1">
                    <div className="bg-surface border border-white/10 rounded-2xl p-6 sticky top-8">
                        <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                            <QrCode className="w-5 h-5 text-primary" />
                            <span>QR Code</span>
                        </h2>

                        <div className="flex flex-col items-center justify-center min-h-[350px]">
                            {qrLoading ? (
                                <div className="text-center space-y-3">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                                    <p className="text-gray-400 text-sm">Gerando QR Code...</p>
                                </div>
                            ) : qrCode ? (
                                <div className="text-center space-y-4">
                                    <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
                                        <img src={qrCode} alt="QR Code" className="w-56 h-56" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold">Escaneie com seu WhatsApp</p>
                                        <p className="text-gray-400 text-xs">
                                            WhatsApp {'>'} Menu {'>'} Aparelhos Conectados
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => selectedInstance && fetchQrCode(selectedInstance)}
                                        className="text-primary text-sm flex items-center space-x-1 mx-auto hover:underline"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>Atualizar QR Code</span>
                                    </button>
                                    <p className="text-gray-500 text-xs">
                                        Instância: {selectedInstance && getDisplayName(selectedInstance)}
                                    </p>
                                </div>
                            ) : selectedInstance && instances.find(i => (i.instance?.instanceName || i.instanceName || i.name) === selectedInstance && (getStatus(i) === 'open' || getStatus(i) === 'connected')) ? (
                                <div className="text-center space-y-4">
                                    <div className="p-4 bg-green-500/20 rounded-full inline-block">
                                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-green-500 font-bold text-lg">Conectado!</p>
                                        <p className="text-gray-400 text-sm">Esta instância já está ativa</p>
                                    </div>
                                </div>
                            ) : selectedInstance ? (
                                <div className="text-center space-y-4 text-gray-500">
                                    <XCircle className="w-12 h-12 mx-auto opacity-30 text-red-400" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-red-400">Não foi possível carregar o QR Code</p>
                                        <p className="text-xs">A API não retornou um código válido.</p>
                                        <button
                                            onClick={() => selectedInstance && fetchQrCode(selectedInstance)}
                                            className="text-primary text-sm flex items-center space-x-1 mx-auto hover:underline mt-2"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            <span>Tentar Novamente</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4 text-gray-500">
                                    <QrCode className="w-16 h-16 mx-auto opacity-30" />
                                    <div className="space-y-1">
                                        <p className="font-bold">Conecte seu WhatsApp</p>
                                        <p className="text-sm">Clique em "Conectar (QR Code)" em uma instância ao lado</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Configuration Modal */}
                {aiModalInstance && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-surface border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 bg-primary/5 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <div className="p-3 bg-white/5 rounded-2xl">
                                        <Bot className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">Agente de IA</h2>
                                        <p className="text-gray-400 text-xs">{getDisplayName(aiModalInstance)}</p>
                                    </div>
                                </div>
                                <button onClick={() => setAiModalInstance(null)} className="p-2 hover:bg-white/10 rounded-xl transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">
                                {/* Toggle */}
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div>
                                        <p className="font-bold">Ativar Automação de IA</p>
                                        <p className="text-xs text-gray-400">O robô responderá automaticamente às mensagens</p>
                                    </div>
                                    <button
                                        onClick={() => setAiConfig({ ...aiConfig, enabled: !aiConfig.enabled })}
                                        className={`w-14 h-8 rounded-full transition-all relative ${aiConfig.enabled ? 'bg-primary' : 'bg-gray-600'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${aiConfig.enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {/* Prompt Selector */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Prompt do Agente</label>
                                    {savedPrompts.length === 0 ? (
                                        <p className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                                            Nenhum prompt salvo. Crie prompts em <strong>Configurações &gt; Agentes de IA</strong> primeiro.
                                        </p>
                                    ) : (
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl text-sm px-4 py-3 text-white outline-none focus:border-primary transition"
                                            value={aiConfig.promptId}
                                            onChange={(e) => setAiConfig({ ...aiConfig, promptId: e.target.value })}
                                        >
                                            <option value="">Selecione um prompt...</option>
                                            {savedPrompts.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    )}
                                    {aiConfig.promptId && (() => {
                                        const p = savedPrompts.find(x => x.id === aiConfig.promptId);
                                        return p ? (
                                            <p className="text-xs text-gray-400 bg-white/5 border border-white/10 rounded-xl p-3 line-clamp-3">{p.content}</p>
                                        ) : null;
                                    })()}
                                </div>

                                {/* Gemini Model Selector */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Modelo de IA</label>
                                    <AiModelSelector
                                        value={aiConfig.aiModel}
                                        token={token || ''}
                                        className="w-full"
                                        onChange={(newModel) => setAiConfig({ ...aiConfig, aiModel: newModel })}
                                    />
                                    <p className="text-[10px] text-gray-500">Escolha o modelo de IA (Gemini ou OpenRouter).</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-white/5 flex space-x-3">
                                <button
                                    onClick={() => setAiModalInstance(null)}
                                    className="flex-1 px-4 py-3 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveAI}
                                    disabled={isSavingAI || (aiConfig.enabled && !aiConfig.promptId)}
                                    className="flex-[2] bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isSavingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span>Salvar Configuração</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
