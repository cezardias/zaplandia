'use client';

import React from 'react';
import { Key } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import ApiSettingsFields from '@/components/ApiSettingsFields';

export default function ApiSettingsPage() {
    const { token, user } = useAuth();
    const { lang } = useLanguage();

    const t: any = {
        pt_BR: {
            title: 'Configurações de API',
            desc: 'Gerencie suas chaves e integrações para automação e mensagens.',
            loading: 'Carregando autenticação...',
            securityTitle: 'Segurança das Chaves',
            securityDesc: 'Suas chaves de API são armazenadas de forma segura e criptografada. Nunca compartilhe seu App Secret ou API Keys com terceiros não confiáveis.'
        },
        en_US: {
            title: 'API Settings',
            desc: 'Manage your keys and integrations for automation and messaging.',
            loading: 'Loading authentication...',
            securityTitle: 'Key Security',
            securityDesc: 'Your API keys are stored securely and encrypted. Never share your App Secret or API Keys with untrusted third parties.'
        },
        pt_PT: {
            title: 'Configurações de API',
            desc: 'Gira as suas chaves e integrações para automação e mensagens.',
            loading: 'A carregar autenticação...',
            securityTitle: 'Segurança das Chaves',
            securityDesc: 'As suas chaves de API são armazenadas de forma segura e criptografada. Nunca partilhe o seu App Secret ou API Keys com terceiros não confiáveis.'
        },
        it_IT: {
            title: 'Impostazioni API',
            desc: 'Gestisci le tue chiavi e integrazioni per l\'automazione e i messaggi.',
            loading: 'Caricamento autenticazione...',
            securityTitle: 'Sicurezza delle Chiavi',
            securityDesc: 'Le tue chiavi API sono memorizzate in modo sicuro e criptato. Non condividere mai il tuo App Secret o le API Key con terze parti non affidabili.'
        }
    };

    const txt = t[lang] || t['pt_BR'];

    return (
        <div className="p-8 max-w-4xl mx-auto text-white pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center space-x-3">
                        <Key className="w-8 h-8 text-primary" />
                        <span>{txt.title}</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm">
                        {txt.desc}
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
                        {txt.loading}
                    </div>
                )}
            </div>


            <div className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-2xl">
                <h3 className="font-bold text-primary-light mb-2 flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    {txt.securityTitle}
                </h3>
                <p className="text-sm text-gray-400">
                    {txt.securityDesc}
                </p>
            </div>
        </div>
    );
}
