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
    Unlink
} from 'lucide-react';

interface WhatsAppInstance {
    instanceName: string;
    status?: string;
    connectionStatus?: string;
    profileName?: string;
    profilePicture?: string;
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

    useEffect(() => {
        if (token) {
            fetchInstances();
        }
    }, [token]);

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

                // Handle "EvolutionAPI not configured" specifically
                if (errorMessage.includes('EvolutionAPI não configurada') || res.status === 500) {
                    setError('A EvolutionAPI ainda não foi configurada no sistema.');
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
                // If QR code was returned, show it
                if (data.qrcode?.base64) {
                    const instanceName = data.instance?.instanceName || `tenant_${user?.tenantId}_${sanitizedName}`;
                    setSelectedInstance(instanceName);
                    setQrCode(data.qrcode.base64);
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
                        <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                            <Phone className="w-5 h-5 text-primary" />
                            <span>Suas Instâncias ({instances.length})</span>
                        </h2>

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
                                {instances.map((instance) => {
                                    const instanceName = instance.instance?.instanceName || instance.instanceName;
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
                                                        <p className="text-xs text-gray-500 font-mono">{instanceName}</p>
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
                                                {isConnected && (
                                                    <button
                                                        onClick={() => router.push(`/dashboard/crm/campaigns?instance=${instanceName}`)}
                                                        className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-bold transition border border-white/10"
                                                    >
                                                        <Link2 className="w-4 h-4" />
                                                        <span>Associar a Campanha</span>
                                                    </button>
                                                )}
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
                            ) : selectedInstance ? (
                                <div className="text-center space-y-4">
                                    <div className="p-4 bg-green-500/20 rounded-full inline-block">
                                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-green-500 font-bold text-lg">Conectado!</p>
                                        <p className="text-gray-400 text-sm">Esta instância já está ativa</p>
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
            </div>
        </div>
    );
}
