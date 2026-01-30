import React, { useState, useEffect } from 'react';
import { Loader2, QrCode, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

interface EvolutionApiConfigProps {
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EvolutionApiConfig({ token, onClose, onSuccess }: EvolutionApiConfigProps) {
    const [status, setStatus] = useState<'idle' | 'creating' | 'qrcode' | 'connected' | 'error'>('idle');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const createInstance = async () => {
        setStatus('creating');
        setError(null);
        try {
            const res = await fetch('/api/integrations/evolution/instance', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.instance?.status === 'open') {
                    setStatus('connected');
                    setTimeout(onSuccess, 2000);
                } else {
                    fetchQrCode();
                }
            } else {
                throw new Error('Falha ao criar instância');
            }
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
        }
    };

    const fetchQrCode = async () => {
        setStatus('qrcode');
        try {
            const res = await fetch('/api/integrations/evolution/qrcode', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.code) {
                    setQrCode(data.code);
                    // Polling logic would go here to check connection status
                } else if (data.status === 'open') {
                    setStatus('connected');
                    setTimeout(onSuccess, 2000);
                }
            }
        } catch (err) {
            console.error('Erro ao buscar QR Code:', err);
        }
    };

    const deleteInstance = async () => {
        if (!confirm('Tem certeza que deseja deletar esta instância?')) return;
        try {
            const res = await fetch('/api/integrations/evolution/instance', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setStatus('idle');
                setQrCode(null);
            }
        } catch (err) {
            console.error('Erro ao deletar instância:', err);
        }
    };

    useEffect(() => {
        let interval: any;
        if (status === 'qrcode') {
            interval = setInterval(fetchQrCode, 5000); // Poll every 5 seconds
        }
        return () => clearInterval(interval);
    }, [status]);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-surface border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-white/5 bg-primary/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black">WhatsApp Não Oficial</h2>
                        <p className="text-gray-400 text-sm">Integração via EvolutionAPI</p>
                    </div>
                </div>

                <div className="p-8 flex flex-col items-center justify-center space-y-6">
                    {status === 'idle' && (
                        <div className="text-center space-y-6">
                            <div className="p-6 bg-white/5 rounded-full inline-block">
                                <QrCode className="w-12 h-12 text-primary" />
                            </div>
                            <p className="text-gray-400 max-w-xs mx-auto text-sm">
                                Crie uma instância para gerar o QR Code e conectar seu WhatsApp sem burocracia.
                            </p>
                            <button
                                onClick={createInstance}
                                className="w-full bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 transition"
                            >
                                Criar Instância Agora
                            </button>
                        </div>
                    )}

                    {status === 'creating' && (
                        <div className="text-center py-10 space-y-4">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                            <p className="text-gray-400 font-bold animate-pulse">Iniciando instância...</p>
                        </div>
                    )}

                    {status === 'qrcode' && qrCode && (
                        <div className="text-center space-y-6">
                            <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl">
                                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-black text-lg">Escaneie o QR Code</p>
                                <p className="text-sm text-gray-400">Abra o WhatsApp {'>'} Configurações {'>'} Aparelhos Conectados</p>
                            </div>
                            <div className="flex space-x-3 w-full">
                                <button
                                    onClick={fetchQrCode}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition font-bold flex items-center justify-center space-x-2 border border-white/10"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Atualizar</span>
                                </button>
                                <button
                                    onClick={deleteInstance}
                                    className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl transition border border-red-500/20"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'connected' && (
                        <div className="text-center py-10 space-y-4">
                            <div className="p-4 bg-green-500/20 rounded-full inline-block">
                                <CheckCircle2 className="w-16 h-16 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-black text-green-500">Conectado com Sucesso!</h3>
                            <p className="text-gray-400">Sua instância está ativa e pronta para uso.</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center py-10 space-y-6">
                            <div className="p-4 bg-red-500/20 rounded-full inline-block text-red-500">
                                <Trash2 className="w-16 h-16" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-red-500">Erro na Integração</h3>
                                <p className="text-gray-400 text-sm">{error || 'Não foi possível completar a ação.'}</p>
                            </div>
                            <button
                                onClick={createInstance}
                                className="w-full bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black border border-white/10 transition"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-white/5">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition"
                    >
                        Fechar Janela
                    </button>
                </div>
            </div>
        </div>
    );
}
