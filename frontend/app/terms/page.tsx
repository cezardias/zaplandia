'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';

export default function TermsOfUse() {
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

        <h1 className="text-4xl font-bold text-white mb-8">Termos de Uso</h1>
        
        <div className="space-y-6 text-lg leading-relaxed">
          <p>
            Bem-vindo ao Zaplandia. Ao utilizar nossos serviços, você concorda com os seguintes termos. 
            A plataforma é operada por <strong>CEZAR AUGUSTO SOARES DIAS (CNPJ: 00.589.372.181)</strong>.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou usar o Zaplandia, você concorda em cumprir e ser regido por estes Termos de Uso 
              e por todas as leis e regulamentações aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Uso da Plataforma</h2>
            <p>
              O Zaplandia fornece ferramentas de CRM, Automação e Inteligência Artificial. Você é responsável 
              por garantir que o uso da plataforma esteja em conformidade com as políticas das redes sociais 
              integradas (como a Meta/WhatsApp Business Solution Policy).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Responsabilidades</h2>
            <p>
              Você é o único responsável pelo conteúdo das mensagens enviadas através da plataforma. 
              O Zaplandia não se responsabiliza por banimentos de números ou contas por uso indevido 
              ou violação de termos de terceiros (SPAM, conteúdo abusivo, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Propriedade Intelectual</h2>
            <p>
              Todo o código, design e algoritmos de IA da plataforma Zaplandia permanecem como 
              propriedade intelectual exclusiva de <strong>CEZAR AUGUSTO SOARES DIAS</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Rescisão</h2>
            <p>
              Reservamos o direito de suspender ou encerrar o acesso à conta que violar estes termos 
              ou demonstrar padrões de uso malicioso que coloquem em risco a estabilidade da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Foro</h2>
            <p>
              Fica eleito o foro da comarca de Brasília/DF para dirimir quaisquer controvérsias 
              oriundas deste contrato.
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
