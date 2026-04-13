'use client';

import React, { useState, useEffect } from 'react';
import { 
    Check, 
    Zap, 
    CreditCard, 
    QrCode, 
    Copy, 
    ArrowRight, 
    Clock, 
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BillingPage() {
    const { token } = useAuth();
    const [status, setStatus] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
    const [method, setMethod] = useState<'pix' | 'credit_card'>('credit_card');
    const [isGenerating, setIsGenerating] = useState(false);
    const [transaction, setTransaction] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${baseUrl}/api/billing/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setStatus(await res.json());
        } catch (error) {
            console.error('Erro ao buscar status:', error);
        }
    };

    const handlePayment = async () => {
        setIsGenerating(true);
        setTransaction(null);
        try {
            const res = await fetch(`${baseUrl}/api/billing/pay`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ plan: selectedPlan, method })
            });

            if (res.ok) {
                const data = await res.json();
                if (method === 'credit_card' && data.checkoutUrl) {
                    window.location.href = data.checkoutUrl;
                } else {
                    setTransaction(data);
                }
            }
        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyPix = () => {
        if (transaction?.pixCopyPaste) {
            navigator.clipboard.writeText(transaction.pixCopyPaste);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight mb-4">Planos & Assinatura</h1>
                <p className="text-gray-400 text-lg">Escalabilidade e inteligência para sua operação de atendimento.</p>
            </div>

            {/* Current Status Card */}
            {status && (
                <div className="bg-surface border border-white/5 rounded-3xl p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${status.isExpired ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                            {status.isExpired ? <Clock size={28} /> : <Zap size={28} />}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">Status Atual</p>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                {status.planType === 'trial' ? 'Acesso Trial (15 Dias)' : `Plano ${status.planType === 'annual' ? 'Anual' : 'Mensal'}`}
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${status.isExpired ? 'border-red-500/50 text-red-500' : 'border-green-500/50 text-green-500'}`}>
                                    {status.status === 'trial' ? `${status.trialRemainingDays} dias restantes` : status.status}
                                </span>
                            </h3>
                        </div>
                    </div>
                    {status.paidUntil && (
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Vencimento</p>
                            <p className="font-bold">{new Date(status.paidUntil).toLocaleDateString()}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pricing Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Monthly */}
                <div 
                    onClick={() => setSelectedPlan('monthly')}
                    className={`relative p-8 rounded-3xl border-2 transition cursor-pointer flex flex-col h-full ${selectedPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-white/5 bg-surface hover:border-white/20'}`}
                >
                    <div className="mb-4">
                        <h3 className="text-xl font-bold">Plano Mensal</h3>
                        <p className="text-sm text-gray-400">Flexibilidade para o seu negócio.</p>
                    </div>
                    <div className="text-4xl font-extrabold mb-8">
                        R$ 300 <span className="text-lg text-gray-500 font-normal">/ mês</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        {['Instâncias Ilimitadas', 'Atendentes Ilimitados', 'Assistente IA Integrado', 'Suporte Prioritário'].map((feat, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                <CheckCircle2 size={16} className="text-primary" /> {feat}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Annual */}
                <div 
                    onClick={() => setSelectedPlan('annual')}
                    className={`relative p-8 rounded-3xl border-2 transition cursor-pointer flex flex-col h-full overflow-hidden ${selectedPlan === 'annual' ? 'border-primary bg-primary/5' : 'border-white/5 bg-surface hover:border-white/20'}`}
                >
                    <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        Recomendado
                    </div>
                    <div className="mb-4">
                        <h3 className="text-xl font-bold">Plano Anual</h3>
                        <p className="text-sm text-gray-400">Maximize seu lucro com economia.</p>
                    </div>
                    <div className="text-4xl font-extrabold mb-8">
                        R$ 2.400 <span className="text-lg text-gray-500 font-normal">/ ano</span>
                    </div>
                    <div className="mb-8 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                        <p className="text-xs text-primary font-bold">🚀 12x de R$ 200,00 no Cartão</p>
                        <p className="text-[10px] text-gray-400 mt-1">* Parcelado com juros via BTG Pactual</p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        {['Tudo do Mensal', 'Desconto de R$ 1.200/ano', 'Prioridade em Atendimento', 'Consultoria de Automação'].map((feat, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                <CheckCircle2 size={16} className="text-primary" /> {feat}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-surface border border-white/5 rounded-3xl p-8 shadow-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CreditCard size={20} className="text-primary" />
                    Método de Pagamento
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={() => setMethod('credit_card')}
                        className={`p-4 rounded-2xl border-2 transition flex items-center gap-3 ${method === 'credit_card' ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-black/40 text-gray-400'}`}
                    >
                        <CreditCard size={20} />
                        <span className="font-bold">Cartão de Crédito</span>
                    </button>
                    <button 
                        onClick={() => setMethod('pix')}
                        className={`p-4 rounded-2xl border-2 transition flex items-center gap-3 ${method === 'pix' ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-black/40 text-gray-400'}`}
                    >
                        <QrCode size={20} />
                        <span className="font-bold">Pix Instantâneo</span>
                    </button>
                </div>

                {!transaction ? (
                    <button 
                        onClick={handlePayment}
                        disabled={isGenerating}
                        className="w-full bg-primary hover:bg-primary-dark text-white py-5 rounded-2xl font-bold text-lg transition flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                    >
                        {isGenerating ? 'Processando...' : `Ativar Plano ${selectedPlan === 'annual' ? 'Anual' : 'Mensal'}`}
                        <ArrowRight size={20} />
                    </button>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex flex-col items-center gap-4 p-8 bg-black/40 border border-white/5 rounded-3xl">
                            {transaction.pixQrCode && (
                                <img src={transaction.pixQrCode} alt="Pix QR Code" className="w-48 h-48 rounded-2xl bg-white p-2" />
                            )}
                            <div className="w-full space-y-2">
                                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest text-center">Pix Copia e Cola</p>
                                <div className="flex items-center gap-2 bg-black/60 p-3 rounded-xl border border-white/10">
                                    <code className="text-xs truncate flex-1 text-gray-400">{transaction.pixCopyPaste}</code>
                                    <button onClick={copyPix} className="p-2 hover:bg-white/10 rounded-lg text-primary transition">
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-300">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>Após o pagamento, sua assinatura será ativada automaticamente em até 2 minutos.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
