'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-gray-300 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Zap className="text-primary w-8 h-8 fill-primary" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              ZAPLANDIA
            </span>
          </div>
          <Link href="/" className="flex items-center text-primary hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o início
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-white mb-8">Política de Privacidade</h1>
        
        <div className="space-y-6 text-lg leading-relaxed">
          <p>
            Esta Política de Privacidade descreve como a Zaplandia, operada por <strong>CEZAR AUGUSTO SOARES DIAS (CNPJ: 00.589.372.181)</strong>, 
            coleta, usa e protege suas informações ao utilizar nossa plataforma.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Coleta de Informações</h2>
            <p>
              Coletamos informações necessárias para a prestação de nossos serviços de automação e CRM, 
              incluindo dados de contato, mensagens enviadas através de integrações (WhatsApp, Meta) 
              e dados de utilização da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Uso dos Dados</h2>
            <p>
              Os dados coletados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Prestação dos serviços contratados;</li>
              <li>Melhoria da experiência do usuário e treinamento de modelos de IA locais;</li>
              <li>Suporte técnico e comunicações administrativas;</li>
              <li>Cumprimento de obrigações legais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Segurança</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra 
              acesso não autorizado, perda ou alteração. Seus dados de integração são criptografados 
              em repouso e em trânsito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Compartilhamento</h2>
            <p>
              Não vendemos seus dados para terceiros. O compartilhamento ocorre apenas com provedores 
              de infraestrutura (como AWS/Google Cloud) necessários para o funcionamento da plataforma 
              ou quando exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Contato</h2>
            <p>
              Para dúvidas sobre esta política, entre em contato através do e-mail: <strong>suporte@zaplandia.com.br</strong>
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-white/10 text-sm text-gray-500">
          Última atualização: 07 de Abril de 2026
          <br />
          CEZAR AUGUSTO SOARES DIAS | CNPJ: 00.589.372.181
        </footer>
      </div>
    </div>
  );
}
