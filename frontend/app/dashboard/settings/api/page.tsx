'use client';

import React from 'react';
import { Key } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ApiSettingsFields from '@/components/ApiSettingsFields';

export default function ApiSettingsPage() {
    const { token, user } = useAuth();

    return (
        <div className="p-8 max-w-4xl mx-auto text-white pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center space-x-3">
                        <Key className="w-8 h-8 text-primary" />
                        <span>Configurações de API</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm">
                        Gerencie suas chaves e integrações para automação e mensagens.
                    </p>
                </div>
            </div>

            <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
                {token ? (
                    <ApiSettingsFields
                        token={token}
                        isAdminMode={false}
                        userRole={user?.role || 'user'}
                    />
                ) : (
                    <div className="py-12 text-center text-gray-500">
                        Carregando autenticação...
                    </div>
                )}
            </div>


            <div className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-2xl">
                <h3 className="font-bold text-primary-light mb-2 flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    Segurança das Chaves
                </h3>
                <p className="text-sm text-gray-400">
                    Suas chaves de API são armazenadas de forma segura e criptografada.
                    Nunca compartilhe seu App Secret ou API Keys com terceiros não confiáveis.
                </p>
            </div>
        </div>
    );
}
