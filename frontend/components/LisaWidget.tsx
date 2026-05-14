'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Smartphone, Zap, Sparkles, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LisaWidget() {
    const { token, user } = useAuth();
    const { lang } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: 'Olá! Eu sou a Lisa, sua assistente da Zaplandia. Como posso te ajudar hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const t: any = {
        pt_BR: {
            title: 'Fale com a Lisa',
            status: 'Online agora',
            placeholder: 'Digite sua dúvida...',
            support: 'Abrir Chamado'
        },
        en_US: {
            title: 'Talk to Lisa',
            status: 'Online now',
            placeholder: 'Type your question...',
            support: 'Open Ticket'
        }
    };

    const tl = t[lang] || t.pt_BR;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (customMessage?: string) => {
        const msgText = customMessage || input;
        if (!msgText.trim() || isLoading) return;

        const userMsg = { role: 'user', content: msgText };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/lisa/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: msgText, history: messages.slice(-5) })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema ao processar sua pergunta. Pode tentar novamente?' }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tente novamente em instantes.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center z-[9999] hover:scale-110 active:scale-95 transition-all group overflow-hidden border-2 border-white/20"
            >
                {isOpen ? <X size={28} /> : (
                    <div className="relative w-full h-full">
                        <img 
                            src="/lisa-mascot.jpg" 
                            alt="Lisa" 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 border-2 border-primary rounded-full animate-pulse" />
                    </div>
                )}
                
                {/* Tooltip */}
                {!isOpen && (
                    <div className="absolute right-16 bg-surface border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                        Precisa de ajuda? Fale com a Lisa!
                    </div>
                )}
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-[360px] max-w-[90vw] h-[520px] max-h-[80vh] bg-white border border-gray-200 shadow-2xl z-[9999] flex flex-col overflow-hidden rounded-3xl"
                    >
                        {/* Header */}
                        <div className="p-4 bg-primary/10 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-primary/20">
                                    <img 
                                        src="/lisa-mascot.jpg" 
                                        alt="Lisa" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-800">{tl.title}</h3>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-gray-500 font-bold">{tl.status}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition text-gray-500 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-primary text-white shadow-primary/10' 
                                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 p-3 rounded-2xl flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 py-2 flex space-x-2">
                             <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-gray-400 transition flex items-center justify-center space-x-1">
                                <HelpCircle size={12} />
                                <span>FAQs</span>
                             </button>
                             <button 
                                onClick={() => handleSend('Gostaria de abrir um chamado')}
                                className="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/10 rounded-lg text-[10px] font-bold text-primary transition flex items-center justify-center space-x-1"
                             >
                                <Smartphone size={12} />
                                <span>{tl.support}</span>
                             </button>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/5 bg-black/20">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={tl.placeholder}
                                    className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 pr-12 text-sm text-gray-800 focus:outline-none focus:border-primary/50 transition shadow-inner placeholder:text-gray-500"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:scale-110 transition disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
