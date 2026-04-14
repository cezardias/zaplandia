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
    CheckCircle2,
    Building2,
    UserCircle,
    Mail,
    PhoneCall,
    IdCard,
    X,
    FileText,
    ShieldCheck,
    Lock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BillingPage() {
    const { user, token } = useAuth();
    const [status, setStatus] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
    const [method, setMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'boleto'>('credit_card');
    const [isGenerating, setIsGenerating] = useState(false);
    const [transaction, setTransaction] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    
    // Billing Info Form State
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [billingForm, setBillingForm] = useState({
        cnpj: '',
        razaoSocial: '',
        responsibleName: '',
        responsibleCpf: '',
        responsiblePhone: '',
        responsibleEmail: ''
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    
    // Admin Config State
    const [adminConfig, setAdminConfig] = useState<any>({ btgClientId: '', btgClientSecret: '' });
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [showConfigSuccess, setShowConfigSuccess] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    useEffect(() => {
        fetchStatus();
        if (user?.role === 'superadmin') {
            fetchAdminConfig();
        }
    }, [user]);

    const fetchAdminConfig = async () => {
        try {
            const res = await fetch(`${baseUrl}/api/billing/admin/config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setAdminConfig(await res.json());
        } catch (error) {
            console.error('Erro ao buscar config admin:', error);
        }
    };

    const handleSaveAdminConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingConfig(true);
        try {
            const res = await fetch(`${baseUrl}/api/billing/admin/config`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminConfig)
            });
            if (res.ok) {
                setShowConfigSuccess(true);
                setTimeout(() => setShowConfigSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Erro ao salvar config:', error);
        } finally {
            setIsSavingConfig(false);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${baseUrl}/api/billing/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
                if (data.billingInfo) {
                    setBillingForm({
                        cnpj: data.billingInfo.cnpj || '',
                        razaoSocial: data.billingInfo.razaoSocial || '',
                        responsibleName: data.billingInfo.responsibleName || '',
                        responsibleCpf: data.billingInfo.responsibleCpf || '',
                        responsiblePhone: data.billingInfo.responsiblePhone || '',
                        responsibleEmail: data.billingInfo.responsibleEmail || ''
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao buscar status:', error);
        }
    };

    const validateCPF = (cpf: string) => {
        const cleanCPF = cpf.replace(/\D/g, '');
        if (cleanCPF.length !== 11) return false;
        if (/^(\d)\1+$/.test(cleanCPF)) return false;
        
        let sum = 0;
        let rest;
        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i-1, i)) * (11 - i);
        rest = (sum * 10) % 11;
        if ((rest === 10) || (rest === 11)) rest = 0;
        if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;
        
        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i-1, i)) * (12 - i);
        rest = (sum * 10) % 11;
        if ((rest === 10) || (rest === 11)) rest = 0;
        if (rest !== parseInt(cleanCPF.substring(10, 11))) return false;
        
        return true;
    };

    const validateCNPJ = (cnpj: string) => {
        const cleanCNPJ = cnpj.replace(/\D/g, '');
        if (cleanCNPJ.length !== 14) return false;
        if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
        
        // Strict CNPJ validation logic
        let size = cleanCNPJ.length - 2;
        let numbers = cleanCNPJ.substring(0, size);
        let digits = cleanCNPJ.substring(size);
        let sum = 0;
        let pos = size - 7;
        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(0))) return false;
        
        size = size + 1;
        numbers = cleanCNPJ.substring(0, size);
        sum = 0;
        pos = size - 7;
        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(1))) return false;
        
        return true;
    };

    const handleSaveBillingInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const errors: Record<string, string> = {};
        if (!billingForm.razaoSocial) errors.razaoSocial = 'Razão Social é obrigatória';
        if (!validateCNPJ(billingForm.cnpj)) errors.cnpj = 'CNPJ inválido';
        if (!billingForm.responsibleName) errors.responsibleName = 'Nome do responsável é obrigatório';
        if (!validateCPF(billingForm.responsibleCpf)) errors.responsibleCpf = 'CPF inválido';
        if (!billingForm.responsibleEmail.includes('@')) errors.responsibleEmail = 'E-mail inválido';
        if (billingForm.responsiblePhone.length < 10) errors.responsiblePhone = 'Telefone inválido';
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSavingProfile(true);
        setFormErrors({});
        try {
            const res = await fetch(`${baseUrl}/api/billing/tenant`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(billingForm)
            });
            
            if (res.ok) {
                setShowBillingModal(false);
                await fetchStatus();
                // Proceed with payment after saving info
                handlePaymentAction();
            } else {
                const errorData = await res.json();
                setFormErrors({ server: errorData.message || 'Erro ao salvar os dados no servidor. Verifique se o sistema foi reiniciado.' });
            }
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            setFormErrors({ server: 'Erro de conexão com o servidor.' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePayment = () => {
        if (!status?.isProfileComplete) {
            setShowBillingModal(true);
            return;
        }
        handlePaymentAction();
    };

    const handlePaymentAction = async () => {
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <button 
                        onClick={() => setMethod('credit_card')}
                        className={`p-4 rounded-2xl border-2 transition flex flex-col items-center justify-center gap-3 text-center ${method === 'credit_card' ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-black/40 text-gray-400'}`}
                    >
                        <CreditCard size={24} />
                        <span className="font-bold text-sm">Crédito</span>
                    </button>
                    <button 
                        onClick={() => setMethod('debit_card')}
                        className={`p-4 rounded-2xl border-2 transition flex flex-col items-center justify-center gap-3 text-center ${method === 'debit_card' ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-black/40 text-gray-400'}`}
                    >
                        <CreditCard size={24} className="rotate-180" />
                        <span className="font-bold text-sm">Débito</span>
                    </button>
                    <button 
                        onClick={() => setMethod('pix')}
                        className={`p-4 rounded-2xl border-2 transition flex flex-col items-center justify-center gap-3 text-center ${method === 'pix' ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-black/40 text-gray-400'}`}
                    >
                        <QrCode size={24} />
                        <span className="font-bold text-sm">Pix</span>
                    </button>
                    <button 
                        onClick={() => setMethod('boleto')}
                        className={`p-4 rounded-2xl border-2 transition flex flex-col items-center justify-center gap-3 text-center ${method === 'boleto' ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-black/40 text-gray-400'}`}
                    >
                        <FileText size={24} />
                        <span className="font-bold text-sm">Boleto</span>
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

            {/* Billing Info Modal */}
            {showBillingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 bg-primary/5 flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                    <Building2 size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Dados de Faturamento</h2>
                                    <p className="text-gray-400 text-sm">Preencha as informações para ativar seu plano premium.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBillingModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSaveBillingInfo} className="p-8 space-y-6">
                            {formErrors.server && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm animate-in shake duration-300">
                                    <AlertCircle size={20} />
                                    <span className="font-medium">{formErrors.server}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CNPJ */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 size={12} /> CNPJ da Empresa
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="00.000.000/0000-00"
                                        className={`w-full bg-white/5 border ${formErrors.cnpj ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none transition`}
                                        value={billingForm.cnpj}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').substring(0, 14);
                                            // Apply mask 00.000.000/0000-00
                                            let masked = val;
                                            if (val.length > 2) masked = val.substring(0, 2) + '.' + val.substring(2);
                                            if (val.length > 5) masked = masked.substring(0, 6) + '.' + masked.substring(6);
                                            if (val.length > 8) masked = masked.substring(0, 10) + '/' + masked.substring(10);
                                            if (val.length > 12) masked = masked.substring(0, 15) + '-' + masked.substring(15);
                                            setBillingForm({...billingForm, cnpj: masked});
                                        }}
                                    />
                                    {formErrors.cnpj && <p className="text-[10px] text-red-500 font-bold">{formErrors.cnpj}</p>}
                                </div>

                                {/* Razão Social */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 size={12} /> Razão Social
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Nome Empresarial Completo"
                                        className={`w-full bg-white/5 border ${formErrors.razaoSocial ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none transition`}
                                        value={billingForm.razaoSocial}
                                        onChange={(e) => setBillingForm({...billingForm, razaoSocial: e.target.value})}
                                    />
                                    {formErrors.razaoSocial && <p className="text-[10px] text-red-500 font-bold">{formErrors.razaoSocial}</p>}
                                </div>

                                {/* Nome Responsável */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <UserCircle size={12} /> Nome do Responsável
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Nome Completo"
                                        className={`w-full bg-white/5 border ${formErrors.responsibleName ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none transition`}
                                        value={billingForm.responsibleName}
                                        onChange={(e) => setBillingForm({...billingForm, responsibleName: e.target.value})}
                                    />
                                    {formErrors.responsibleName && <p className="text-[10px] text-red-500 font-bold">{formErrors.responsibleName}</p>}
                                </div>

                                {/* CPF Responsável */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <IdCard size={12} /> CPF do Responsável
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="000.000.000-00"
                                        className={`w-full bg-white/5 border ${formErrors.responsibleCpf ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none transition`}
                                        value={billingForm.responsibleCpf}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').substring(0, 11);
                                            let masked = val;
                                            if (val.length > 3) masked = val.substring(0, 3) + '.' + val.substring(3);
                                            if (val.length > 6) masked = masked.substring(0, 7) + '.' + masked.substring(7);
                                            if (val.length > 9) masked = masked.substring(0, 11) + '-' + masked.substring(11);
                                            setBillingForm({...billingForm, responsibleCpf: masked});
                                        }}
                                    />
                                    {formErrors.responsibleCpf && <p className="text-[10px] text-red-500 font-bold">{formErrors.responsibleCpf}</p>}
                                </div>

                                {/* Email Contato */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Mail size={12} /> E-mail de Contato
                                    </label>
                                    <input 
                                        type="email" 
                                        placeholder="responsavel@empresa.com"
                                        className={`w-full bg-white/5 border ${formErrors.responsibleEmail ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none transition`}
                                        value={billingForm.responsibleEmail}
                                        onChange={(e) => setBillingForm({...billingForm, responsibleEmail: e.target.value})}
                                    />
                                    {formErrors.responsibleEmail && <p className="text-[10px] text-red-500 font-bold">{formErrors.responsibleEmail}</p>}
                                </div>

                                {/* Telefone Contato */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <PhoneCall size={12} /> Telefone (DDI + DDD)
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="+55 11 99999-9999"
                                        className={`w-full bg-white/5 border ${formErrors.responsiblePhone ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none transition`}
                                        value={billingForm.responsiblePhone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            let masked = '+' + val;
                                            if (val.length > 2) masked = '+' + val.substring(0, 2) + ' ' + val.substring(2);
                                            if (val.length > 4) masked = '+' + val.substring(0, 2) + ' ' + val.substring(2, 4) + ' ' + val.substring(4);
                                            if (val.length > 9) masked = '+' + val.substring(0, 2) + ' ' + val.substring(2, 4) + ' ' + val.substring(4, 9) + '-' + val.substring(9);
                                            setBillingForm({...billingForm, responsiblePhone: masked});
                                        }}
                                    />
                                    {formErrors.responsiblePhone && <p className="text-[10px] text-red-500 font-bold">{formErrors.responsiblePhone}</p>}
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSavingProfile}
                                className="w-full bg-primary hover:bg-primary-dark text-white py-5 rounded-2xl font-black text-lg transition flex items-center justify-center gap-3 shadow-xl shadow-primary/40 mt-4 group"
                            >
                                {isSavingProfile ? 'Salvando...' : 'Salvar Dados e Prosseguir'}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Admin Config Section - Only for Superadmins */}
            {user?.role === 'superadmin' && (
                <div className="mt-20 pt-12 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Configurações Gerenciais</h2>
                            <p className="text-gray-400 text-sm italic">Ambiente restrito • BTG Pactual Gateway</p>
                        </div>
                    </div>

                    <div className="bg-surface border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Lock size={120} />
                        </div>
                        
                        <form onSubmit={handleSaveAdminConfig} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">BTG Client ID</label>
                                <input 
                                    type="text"
                                    value={adminConfig.btgClientId}
                                    onChange={(e) => setAdminConfig({...adminConfig, btgClientId: e.target.value})}
                                    placeholder="Ex: 8a7b9c..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-yellow-500/50 outline-none transition"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">BTG Client Secret</label>
                                <input 
                                    type="password"
                                    value={adminConfig.btgClientSecret}
                                    onChange={(e) => setAdminConfig({...adminConfig, btgClientSecret: e.target.value})}
                                    placeholder="••••••••••••••••"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-yellow-500/50 outline-none transition"
                                />
                            </div>
                            
                            <div className="md:col-span-2 flex items-center justify-between">
                                <div className="text-xs text-gray-500 leading-relaxed max-w-md">
                                    Certifique-se de que os escopos necessários (links, pix, webhooks) estejam habilitados no painel do BTG Id.
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isSavingConfig}
                                    className={`px-8 py-4 rounded-2xl font-bold transition flex items-center gap-2 ${showConfigSuccess ? 'bg-green-500 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/20'}`}
                                >
                                    {isSavingConfig ? 'Salvando...' : showConfigSuccess ? <><Check size={20} /> Salvo!</> : 'Atualizar Credenciais BTG'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
