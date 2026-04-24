'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Shield, Lock, Eye, Scale, UserCheck } from 'lucide-react';

export default function TermsPage() {
    const [lang, setLang] = useState('pt_BR');

    useEffect(() => {
        const saved = localStorage.getItem('zap_lang');
        if (saved) setLang(saved);
        
        const handleLangChange = () => {
            const current = localStorage.getItem('zap_lang');
            if (current) setLang(current);
        };
        window.addEventListener('languageChange', handleLangChange);
        return () => window.removeEventListener('languageChange', handleLangChange);
    }, []);

    const t: any = {
        pt_BR: {
            title: 'Termos de Uso e Privacidade',
            subtitle: 'Conformidade com a LGPD e Transparência',
            lastUpdate: 'Última atualização: 24 de Abril de 2026',
            intro: 'Bem-vindo ao Zaplândia. Ao utilizar nossa plataforma, você concorda com os termos abaixo, elaborados em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).',
            sections: [
                {
                    title: '1. Coleta de Dados e Finalidade',
                    content: 'Coletamos apenas os dados estritamente necessários para a prestação de nossos serviços de automação e CRM, como nome, e-mail e dados de contas vinculadas (WhatsApp/Meta). A finalidade é única e exclusiva para a operação contratada.'
                },
                {
                    title: '2. Tratamento e Segurança',
                    content: 'Todos os dados são criptografados e armazenados em servidores seguros. Implementamos medidas técnicas e administrativas para proteger seus dados contra acessos não autorizados ou situações acidentais.'
                },
                {
                    title: '3. Direitos do Titular',
                    content: 'Conforme a LGPD, você tem o direito de confirmar a existência de tratamento, acessar seus dados, corrigir dados incompletos ou solicitar a exclusão de dados desnecessários a qualquer momento.'
                },
                {
                    title: '4. Integrações com Terceiros (Meta)',
                    content: 'Ao vincular sua conta Meta (WhatsApp/Instagram), você autoriza o Zaplândia a processar mensagens e gerenciar ativos conforme as permissões concedidas no fluxo de login oficial da Meta.'
                }
            ],
            footer: 'Para dúvidas sobre privacidade, entre em contato com nosso DPO em suporte@zaplandia.com.br'
        },
        en_US: {
            title: 'Terms of Use & Privacy',
            subtitle: 'LGPD Compliance & Transparency',
            lastUpdate: 'Last update: April 24, 2026',
            intro: 'Welcome to Zaplândia. By using our platform, you agree to the terms below, prepared in full compliance with the General Data Protection Law (LGPD).',
            sections: [
                {
                    title: '1. Data Collection and Purpose',
                    content: 'We only collect data strictly necessary for providing our automation and CRM services, such as name, email, and linked account data (WhatsApp/Meta). The purpose is unique and exclusive to the contracted operation.'
                },
                {
                    title: '2. Processing and Security',
                    content: 'All data is encrypted and stored on secure servers. We implement technical and administrative measures to protect your data against unauthorized access or accidental situations.'
                },
                {
                    title: '3. Data Subject Rights',
                    content: 'According to LGPD, you have the right to confirm the existence of processing, access your data, correct incomplete data, or request the deletion of unnecessary data at any time.'
                },
                {
                    title: '4. Third-Party Integrations (Meta)',
                    content: 'By linking your Meta account (WhatsApp/Instagram), you authorize Zaplândia to process messages and manage assets according to the permissions granted in Meta\'s official login flow.'
                }
            ],
            footer: 'For privacy questions, contact our DPO at support@zaplandia.com.br'
        }
    };

    const content = t[lang] || t['pt_BR'];

    return (
        <div className="p-8 max-w-5xl mx-auto pb-20">
            <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-4 bg-primary/20 rounded-3xl">
                        <Scale className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">{content.title}</h1>
                        <p className="text-gray-400 font-medium">{content.subtitle}</p>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{content.lastUpdate}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface p-8 rounded-3xl border border-white/5 shadow-xl">
                        <p className="text-gray-300 leading-relaxed mb-8 italic">
                            "{content.intro}"
                        </p>

                        <div className="space-y-10">
                            {content.sections.map((section: any, idx: number) => (
                                <section key={idx} className="space-y-3">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                                        {section.title}
                                    </h3>
                                    <p className="text-gray-400 leading-relaxed font-light pl-4">
                                        {section.content}
                                    </p>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-primary/20 to-transparent p-8 rounded-3xl border border-primary/20">
                        <Shield className="w-12 h-12 text-primary mb-6" />
                        <h3 className="text-xl font-bold mb-4">LGPD Ready</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Nossa plataforma foi construída com o conceito de "Privacy by Design", garantindo que a segurança dos seus dados seja prioridade desde a concepção de cada funcionalidade.
                        </p>
                    </div>

                    <div className="bg-surface p-8 rounded-3xl border border-white/5 space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Lock className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Criptografia Ponta-a-Ponta</h4>
                                <p className="text-xs text-gray-500 mt-1">Dados protegidos em repouso e em trânsito.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Eye className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Transparência Total</h4>
                                <p className="text-xs text-gray-500 mt-1">Saiba exatamente quais dados estamos processando.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <UserCheck className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Controle do Usuário</h4>
                                <p className="text-xs text-gray-500 mt-1">Você é o dono dos seus dados, sempre.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="mt-12 p-8 bg-white/2 border border-white/5 rounded-3xl text-center">
                <p className="text-sm text-gray-500 font-medium">
                    {content.footer}
                </p>
            </footer>
        </div>
    );
}
