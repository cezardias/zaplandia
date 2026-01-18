'use client';

import React, { useState } from 'react';
import { Save, Key, Shield, Info, AlertCircle, Zap } from 'lucide-react';

export default function ApiSettingsPage() {
    const [keys, setKeys] = useState({
        fb_app_id: '',
        fb_app_secret: '',
        whatsapp_token: '',
        google_client_id: '',
        google_secret: '',
        tg_bot_token: '',
    });

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center space-x-2">
                    <Key className="w-8 h-8 text-primary" />
                    <span>Configurações de API</span>
                </h1>
                <p className="text-gray-400 mt-2">Configure suas próprias chaves de API para maior controle e limites personalizados.</p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-xl flex items-start space-x-3 mb-8">
                <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0" />
                <p className="text-sm text-yellow-200">
                    <strong>Atenção:</strong> Se você não configurar suas próprias chaves, o Zaplandia usará as chaves globais da plataforma (sujeito a limites compartilhados).
                </p>
            </div>

            <div className="space-y-8">
                {/* Meta Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span>Meta (Facebook & Instagram)</span>
                    </h2>
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Meta App ID</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition"
                                placeholder="Ex: 123456789012345"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">App Secret</label>
                            <input
                                type="password"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition"
                                placeholder="••••••••••••••••"
                            />
                        </div>
                    </div>
                </section>

                {/* WhatsApp Section */}
                <section className="bg-surface border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-green-500" />
                        <span>WhatsApp Business API</span>
                    </h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Permanent Access Token</label>
                        <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition h-24"
                            placeholder="Cole seu token de acesso permanente aqui..."
                        />
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button className="flex items-center space-x-2 bg-primary hover:bg-primary-dark px-8 py-4 rounded-xl font-bold transition">
                        <Save className="w-5 h-5" />
                        <span>Salvar Chaves de Integração</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
