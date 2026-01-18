'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Zap,
  Users,
  Bot,
  BarChart3,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const platforms = [
    { icon: <Facebook className="w-6 h-6" />, name: 'Meta' },
    { icon: <Instagram className="w-6 h-6" />, name: 'Instagram' },
    { icon: <Zap className="w-6 h-6" />, name: 'WhatsApp' },
    { icon: <MessageSquare className="w-6 h-6" />, name: 'Telegram' },
    { icon: <Youtube className="w-6 h-6" />, name: 'YouTube' },
    { icon: <Bot className="w-6 h-6" />, name: 'TikTok' },
    { icon: <Linkedin className="w-6 h-6" />, name: 'LinkedIn' },
    { icon: <Globe className="w-6 h-6" />, name: 'Google' },
  ];

  const features = [
    {
      title: "CRM Omnichannel",
      description: "Gerencie todas as suas conversas de Facebook, Instagram e WhatsApp em uma única caixa de entrada inteligente.",
      icon: <Users className="text-primary w-10 h-10" />
    },
    {
      title: "Agentes de IA Especialistas",
      description: "Agentes treinados para cada nicho que resolvem dúvidas e fecham vendas automaticamente 24/7.",
      icon: <Bot className="text-accent w-10 h-10" />
    },
    {
      title: "Automação Completa",
      description: "Agendamento de posts, criação de legendas com IA e fluxos de automação de e-mail e mensagens.",
      icon: <Zap className="text-yellow-400 w-10 h-10" />
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Zap className="text-primary w-8 h-8 fill-primary" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                ZAPLANDIA
              </span>
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#features" className="text-gray-300 hover:text-white transition">Funcionalidades</a>
              <a href="#integrations" className="text-gray-300 hover:text-white transition">Integrações</a>
              <Link href="/auth/login" className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full font-medium transition">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <motion.div {...fadeIn}>
                <span className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6 inline-block">
                  A evolução do GoHighLevel chegou
                </span>
                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6">
                  Automatize seu nicho com <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-gradient">
                    Inteligência Artificial Real
                  </span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                  Integre todas as suas redes sociais em um CRM único com agentes de IA prontos para escalar sua operação. Task scheduling, automação de posts e gestão completa.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/auth/signup" className="bg-primary hover:bg-primary-dark text-white text-lg px-8 py-4 rounded-xl font-bold transition flex items-center justify-center">
                    Começar 15 dias grátis <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg px-8 py-4 rounded-xl font-bold transition">
                    Ver demonstração
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        </section>

        {/* Platforms */}
        <section id="integrations" className="py-16 bg-white/5 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 font-medium mb-12 uppercase tracking-widest text-sm">Integração nativa com tudo que você usa</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center justify-center opacity-60">
              {platforms.map((p, i) => (
                <div key={i} className="flex flex-col items-center space-y-2 grayscale hover:grayscale-0 transition cursor-default">
                  {p.icon}
                  <span className="text-xs">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold mb-4">Tudo em um só Dashboard</h2>
              <p className="text-gray-400">Desenvolvido para perfomance e assertividade.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="p-8 rounded-3xl bg-surface border border-white/5 hover:border-primary/50 transition duration-500"
                >
                  <div className="mb-6">{f.icon}</div>
                  <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{f.description}</p>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" /> Integração API oficial
                    </li>
                    <li className="flex items-center text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" /> Setup em 2 minutos
                    </li>
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>© 2026 Zaplandia. Todos os direitos reservados. www.zaplandia.com.br</p>
        </div>
      </footer>
    </div>
  );
}
