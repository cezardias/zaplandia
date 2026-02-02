'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, User } from 'lucide-react';

export default function NewContactPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        externalId: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/crm/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert('Contato criado com sucesso!');
                router.push('/dashboard/crm');
            } else {
                alert('Erro ao criar contato.');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-500 hover:text-white transition mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
            </button>

            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <User className="w-8 h-8 text-primary" />
                <span>Novo Contato</span>
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">Nome Completo</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary"
                        placeholder="Ex: João da Silva"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">WhatsApp (com DDI)</label>
                    <input
                        type="text"
                        required
                        value={formData.phoneNumber}
                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary"
                        placeholder="Ex: 5511999999999"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">Email (Opcional)</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary"
                        placeholder="Ex: joao@email.com"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">ID Externo / CPF (Opcional)</label>
                    <input
                        type="text"
                        value={formData.externalId}
                        onChange={e => setFormData({ ...formData, externalId: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary"
                        placeholder="Ex: 123456"
                    />
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold transition flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>Salvar Contato</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
