"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Rocket, 
  MessageSquare, 
  Bot, 
  Globe2, 
  BarChart3, 
  Users, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  Smartphone,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function PitchDeck() {
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && (!user || user.email !== 'cezar.dias@dias.com')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (!mounted || isLoading || !user || user.email !== 'cezar.dias@dias.com') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f172a]">
        <Zap className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  const features = [
    {
      icon: <MessageSquare className="w-8 h-8 text-primary" />,
      title: "Omnichannel CRM",
      description: "Integração nativa com WhatsApp Cloud API e Instagram Direct. Tudo em um único painel para a equipe de vendas."
    },
    {
      icon: <Bot className="w-8 h-8 text-accent" />,
      title: "Automação com IA & n8n",
      description: "Chatbots inteligentes, fluxos de cadência e integração via Webhook com N8N e Zapier. O Atendimento que não dorme."
    },
    {
      icon: <Globe2 className="w-8 h-8 text-green-400" />,
      title: "Multi-idioma & Multi-tenant",
      description: "Arquitetura SaaS Enterprise. Pronto para escalar globalmente (PT-BR, EN-US, ES-ES) com isolamento total de dados."
    },
    {
      icon: <Rocket className="w-8 h-8 text-purple-400" />,
      title: "Campanhas de Massa",
      description: "Disparos em lote para WhatsApp com alta taxa de entrega e prevenção de bloqueios. Marketing que converte."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-yellow-400" />,
      title: "Analytics em Tempo Real",
      description: "Métricas detalhadas, tempo de resposta, volume de mensagens e performance de atendentes."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-blue-400" />,
      title: "Segurança & Compliance",
      description: "Autenticação OAuth (Google/Meta), roles de acesso granulares e aprovado no rigoroso Meta App Review."
    }
  ];

  const stats = [
    { value: "50%", label: "Redução no Tempo de Resposta" },
    { value: "3x", label: "Aumento na Conversão" },
    { value: "24/7", label: "Atendimento Automatizado" },
    { value: "100%", label: "Controle da Operação" }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden selection:bg-primary/30">
      
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-md bg-[#0f172a]/70 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Zaplandia</span>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
          Acessar App
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            style={{ y }}
            className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-primary/20 blur-[120px]"
          />
          <motion.div 
            style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]) }}
            className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-accent/20 blur-[120px]"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-sm font-medium text-gray-300">Apresentação para Investidores</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-tight">
              O Futuro do <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-purple-500">
                Atendimento Digital
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Uma plataforma all-in-one que unifica WhatsApp, Instagram e IA para escalar vendas e revolucionar o suporte ao cliente.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:shadow-[0_0_60px_rgba(239,68,68,0.6)] transition-all flex items-center gap-2"
                onClick={() => document.getElementById('oportunidade')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Oportunidade <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Problem / Solution */}
      <section className="py-32 px-4 relative bg-black/20" id="oportunidade">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                O Problema: <br/>
                <span className="text-gray-500">Caos Operacional</span>
              </h2>
              <ul className="space-y-6 text-xl text-gray-400">
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 shrink-0" />
                  <p>Empresas perdem vendas por demora no atendimento em múltiplos canais.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 shrink-0" />
                  <p>Dependência de aparelhos físicos e risco de bloqueio no WhatsApp.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 shrink-0" />
                  <p>Falta de métricas claras e automação inteligente.</p>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-surface to-[#0f172a] p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white relative z-10">
                A Solução: <br/>
                <span className="text-primary">Zaplandia</span>
              </h2>
              <p className="text-lg text-gray-300 mb-8 relative z-10">
                Centralizamos a comunicação utilizando as APIs oficiais da Meta. Escalável, seguro e turbinado com Inteligência Artificial.
              </p>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Tecnologia de Ponta</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Desenvolvido com as melhores práticas de engenharia de software para garantir estabilidade e performance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white/[0.02] border border-white/10 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors group"
            >
              <div className="mb-6 p-4 bg-white/5 rounded-2xl inline-block group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Architecture Showcase */}
      <section className="py-32 px-4 relative border-t border-white/10 bg-black/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Pronto para Escalar</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A arquitetura SaaS permite faturar de forma recorrente com infraestrutura robusta.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8">
              <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="text-xl font-bold mb-2">B2B SaaS</h4>
              <p className="text-gray-400">Modelo de receita previsível. Venda assinaturas mensais para empresas de todos os tamanhos.</p>
            </div>
            <div className="p-8">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <Layers className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="text-xl font-bold mb-2">White-Label Ready</h4>
              <p className="text-gray-400">Estrutura preparada para agências revenderem a plataforma com suas próprias marcas.</p>
            </div>
            <div className="p-8">
              <div className="w-16 h-16 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="text-xl font-bold mb-2">Alta Margem</h4>
              <p className="text-gray-400">Custo de infraestrutura diluído. Integração oficial Cloud API da Meta sem custo de setup.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Footer */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-900/20" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-red-600 to-purple-600 p-[1px] rounded-3xl"
          >
            <div className="bg-[#0f172a] p-12 md:p-20 rounded-3xl backdrop-blur-xl">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">Invista no Futuro</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                A Zaplandia está pronta para dominar o mercado de atendimento B2B. Seja um parceiro estratégico nesta jornada.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  href="/dashboard"
                  className="px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-100 transition-colors"
                >
                  Ver Plataforma em Ação
                </Link>
                <button className="px-8 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors">
                  Agendar Reunião
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 text-center text-gray-500 border-t border-white/10 relative z-10">
        <p>© {new Date().getFullYear()} Zaplandia. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
