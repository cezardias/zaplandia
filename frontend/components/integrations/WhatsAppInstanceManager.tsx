'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, QrCode, Trash2, CheckCircle2, RefreshCw, Plus, Smartphone, XCircle, X, Bot, Terminal } from 'lucide-react';

interface WhatsAppInstance {
    instanceName: string;
    status?: string;
    profileName?: string;
    profilePicture?: string;
}

interface WhatsAppInstanceManagerProps {
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function WhatsAppInstanceManager({ token, onClose, onSuccess }: WhatsAppInstanceManagerProps) {
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newInstanceName, setNewInstanceName] = useState('');
    const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [hasN8nWebhook, setHasN8nWebhook] = useState(false);
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInstances();
        fetchIntegrationsAndCredentials();
    }, []);

    const fetchIntegrationsAndCredentials = async () => {
        try {
            const [intRes, credRes] = await Promise.all([
                fetch('/api/integrations', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/integrations/credentials', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (intRes.ok) {
                const data = await intRes.json();
                setIntegrations(data);
            }

            if (credRes.ok) {
                const creds = await credRes.json();
                const hasUrl = creds.some((c: any) => c.key_name === 'N8N_WEBHOOK_URL' && c.key_value);
                setHasN8nWebhook(hasUrl);
            }
        } catch (err) {
            console.error('Erro ao buscar dados complementares:', err);
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
            } else {
                const errData = await res.json();
                setError(errData.message || 'Erro ao carregar instâncias');
            }
        } catch (err: any) {
            setError(err.message || 'Erro de conexão');
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
        try {
            const res = await fetch('/api/integrations/evolution/instance', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ instanceName: newInstanceName.trim().replace(/\s+/g, '_') })
            });
            if (res.ok) {
                const data = await res.json();
                setNewInstanceName('');
                await fetchInstances();
                // If QR code was returned, show it
                if (data.qrcode?.base64) {
                    setSelectedInstance(data.instance?.instanceName || newInstanceName);
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
                    // Already connected
                    setError('Instância já está conectada!');
                    setQrCode(null);
                    await fetchInstances();
                }
            } else {
                setError('Erro ao buscar QR Code');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setQrLoading(false);
        }
    };

    const deleteInstance = async (instanceName: string) => {
        if (!confirm(`Tem certeza que deseja excluir a instância "${instanceName}"?`)) return;
        try {
            const res = await fetch(`/api/integrations/evolution/instance/${encodeURIComponent(instanceName)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchInstances();
                if (selectedInstance === instanceName) {
                    setSelectedInstance(null);
                    setQrCode(null);
                }
            } else {
                setError('Erro ao excluir instância');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const toggleAutomation = async (instanceName: string, type: 'ai' | 'n8n', currentState: boolean) => {
        if (type === 'n8n' && !hasN8nWebhook) {
            if (confirm('Webhook do n8n não configurado. Deseja ir para as configurações agora?')) {
                window.location.href = '/dashboard/settings/api';
            }
            return;
        }

        setIsToggling(instanceName + type);
        try {
            const integration = integrations.find(i =>
                i.provider === 'evolution' &&
                (i.credentials?.instanceName === instanceName || i.settings?.instanceName === instanceName)
            );

            if (!integration) throw new Error('Integração não encontrada no banco de dados.');

            const res = await fetch(`/api/ai/integration/${integration.id}/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    enabled: type === 'ai' ? !currentState : false,
                    n8nEnabled: type === 'n8n' ? !currentState : false
                })
            });

            if (res.ok) {
                await fetchIntegrationsAndCredentials();
            } else {
                setError('Erro ao alternar automação');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsToggling(null);
        }
    };

    const getStatusBadge = (instance: WhatsAppInstance) => {
        const status = instance.status || 'unknown';
        if (status === 'open' || status === 'connected') {
            return (
                <span className="flex items-center space-x-1 text-green-500 text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Conectado</span>
                </span>
            );
        } else if (status === 'close' || status === 'disconnected') {
            return (
                <span className="flex items-center space-x-1 text-red-500 text-xs">
                    <XCircle className="w-3 h-3" />
                    <span>Desconectado</span>
                </span>
            );
        }
        return (
            <span className="flex items-center space-x-1 text-yellow-500 text-xs">
                <RefreshCw className="w-3 h-3" />
                <span>Aguardando</span>
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-surface border border-white/10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-primary/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-white/5 rounded-2xl">
                            <Smartphone className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Gerenciar Instâncias WhatsApp</h2>
                            <p className="text-gray-400 text-sm">Crie e conecte suas instâncias via QR Code</p>
                        </div>
                    </div>
                    <button title="Fechar" onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Create New Instance */}
                    <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <h3 className="font-bold mb-3 text-sm">Nova Instância</h3>
                        <div className="flex space-x-3">
                            <input
                                type="text"
                                value={newInstanceName}
                                onChange={(e) => setNewInstanceName(e.target.value)}
                                placeholder="Nome da instância (ex: vendas, suporte)"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                            />
                            <button
                                onClick={createInstance}
                                disabled={isCreating}
                                className="bg-primary hover:bg-primary-dark px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 transition"
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                <span>Criar</span>
                            </button>
                        </div>
                    </div>

                    {/* Instances List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left: Instance List */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-sm text-gray-400">Suas Instâncias</h3>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : instances.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    Nenhuma instância criada ainda.<br />
                                    Crie uma acima para começar!
                                </div>
                            ) : (
                                instances.map((instance) => (
                                    <div
                                        key={instance.instanceName}
                                        className={`p-4 border rounded-xl transition cursor-pointer ${selectedInstance === instance.instanceName
                                            ? 'border-primary bg-primary/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                            }`}
                                        onClick={() => fetchQrCode(instance.instanceName)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-bold text-sm">{instance.instanceName.split('_').slice(2).join('_') || instance.instanceName}</p>
                                                {getStatusBadge(instance)}
                                            </div>
                                            <button
                                                title="Excluir Instância"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteInstance(instance.instanceName);
                                                }}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Automation Controls */}
                                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                                            {(() => {
                                                const integration = integrations.find(i =>
                                                    i.provider === 'evolution' &&
                                                    (i.credentials?.instanceName === instance.instanceName || i.settings?.instanceName === instance.instanceName)
                                                );

                                                if (!integration) return null;

                                                const aiActive = integration.aiEnabled;
                                                const n8nActive = integration.n8nEnabled;

                                                return (
                                                    <div className="flex w-full justify-between items-center bg-black/20 rounded-lg p-2">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                title={aiActive ? "Desativar IA" : "Ativar IA"}
                                                                disabled={isToggling !== null}
                                                                onClick={() => toggleAutomation(instance.instanceName, 'ai', aiActive)}
                                                                className={`p-1.5 rounded-md transition-all flex items-center space-x-1 ${aiActive ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-gray-500 opacity-60'}`}
                                                            >
                                                                <Bot className="w-3 h-3" />
                                                                <span className="text-[9px] font-bold">IA</span>
                                                            </button>
                                                            <button
                                                                title={n8nActive ? "Desativar n8n" : "Ativar n8n"}
                                                                disabled={isToggling !== null}
                                                                onClick={() => toggleAutomation(instance.instanceName, 'n8n', n8nActive)}
                                                                className={`p-1.5 rounded-md transition-all flex items-center space-x-1 ${n8nActive ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-white/5 text-gray-500 opacity-60'}`}
                                                            >
                                                                <Terminal className="w-3 h-3" />
                                                                <span className="text-[9px] font-bold">n8n</span>
                                                            </button>
                                                        </div>
                                                        <div className="text-[9px] text-gray-500 italic">
                                                            {isToggling === instance.instanceName + 'ai' || isToggling === instance.instanceName + 'n8n' ? 'Processando...' : (aiActive ? 'Agente OK' : n8nActive ? 'Fluxo OK' : 'Manual')}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Right: QR Code Display */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
                            {qrLoading ? (
                                <div className="text-center space-y-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                                    <p className="text-gray-400 text-sm">Gerando QR Code...</p>
                                </div>
                            ) : qrCode ? (
                                <div className="text-center space-y-4">
                                    <div className="bg-white p-3 rounded-2xl inline-block">
                                        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Escaneie o código</p>
                                        <p className="text-gray-400 text-xs">WhatsApp {'>'} Aparelhos Conectados</p>
                                    </div>
                                    <button
                                        title="Atualizar QR Code"
                                        onClick={() => selectedInstance && fetchQrCode(selectedInstance)}
                                        className="text-primary text-sm flex items-center space-x-1 mx-auto hover:underline"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>Atualizar QR Code</span>
                                    </button>
                                </div>
                            ) : selectedInstance ? (
                                <div className="text-center space-y-3">
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                                    <p className="text-green-500 font-bold">Instância Conectada!</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-3 text-gray-500">
                                    <QrCode className="w-12 h-12 mx-auto opacity-50" />
                                    <p className="text-sm">Selecione uma instância<br />para gerar o QR Code</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/5 shrink-0 flex justify-between">
                    <button
                        title="Atualizar Lista de Instâncias"
                        onClick={fetchInstances}
                        className="px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition flex items-center space-x-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Atualizar Lista</span>
                    </button>
                    <button
                        onClick={() => { onSuccess(); onClose(); }}
                        className="px-8 py-3 rounded-xl bg-primary hover:bg-primary-dark font-bold transition"
                    >
                        Concluir
                    </button>
                </div>
            </div>
        </div>
    );
}
