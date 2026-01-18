'use client';

import React, { useState } from 'react';
import {
    Instagram,
    Facebook,
    Zap,
    Send,
    Youtube,
    Linkedin,
    Globe,
    Smartphone,
    CheckCircle2,
    XCircle,
    Plus,
    Settings
} from 'lucide-react';

const INTEGRATIONS = [
    { id: 'facebook', name: 'Meta / Facebook', icon: <Facebook className="w-8 h-8 text-blue-600" />, status: 'disconnected' },
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-8 h-8 text-pink-500" />, status: 'connected' },
    { id: 'whatsapp', name: 'WhatsApp API', icon: <Zap className="w-8 h-8 text-green-500" />, status: 'disconnected' },
    { id: 'telegram', name: 'Telegram Bot', icon: <Send className="w-8 h-8 text-blue-400" />, status: 'disconnected' },
    { id: 'tiktok', name: 'TikTok Business', icon: <Smartphone className="w-8 h-8 text-black" />, status: 'disconnected' },
    { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-8 h-8 text-blue-800" />, status: 'disconnected' },
    { id: 'google', name: 'Google Sheets/Drive', icon: <Globe className="w-8 h-8 text-yellow-600" />, status: 'disconnected' },
];

export default function IntegrationsPage() {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Integrações</h1>
                    <p className="text-gray-400">Conecte suas redes sociais e centralize sua comunicação</p>
                </div>
                <button className="flex items-center space-x-2 bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg font-medium transition">
                    <Plus className="w-5 h-5" />
                    <span>Nova Integração</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {INTEGRATIONS.map((app) => (
                    <div key={app.id} className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-primary/50 transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                                {app.icon}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${app.status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                                }`}>
                                {app.status === 'connected' ? 'Conectado' : 'Desconectado'}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold mb-2">{app.name}</h3>
                        <p className="text-sm text-gray-400 mb-6">Sincronize mensagens, comentários e automações diretamente.</p>

                        <div className="flex space-x-2">
                            <button className="flex-1 bg-white/5 hover:bg-white/10 text-sm py-2 rounded-lg transition font-medium">
                                Configurar
                            </button>
                            {app.status === 'disconnected' ? (
                                <button className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary text-sm py-2 rounded-lg transition font-medium">
                                    Conectar
                                </button>
                            ) : (
                                <button className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm py-2 rounded-lg transition font-medium">
                                    Desconectar
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
