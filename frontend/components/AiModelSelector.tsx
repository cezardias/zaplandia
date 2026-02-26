'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AiModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
    token: string;
    className?: string;
}

export default function AiModelSelector({ value, onChange, token, className = "" }: AiModelSelectorProps) {
    const [openRouterModels, setOpenRouterModels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (token) fetchModels();
    }, [token]);

    const fetchModels = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/ai/openrouter/models', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
                    setOpenRouterModels(sorted);
                }
            }
        } catch (e) {
            console.error('Failed to fetch OpenRouter models', e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <select
            className={`bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition ${className}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            title="Selecione o modelo de IA"
        >
            <optgroup label="Google Gemini (Nativo)">
                <option value="gemini-2.0-flash">⚡ 2.0 Flash (Recomendado)</option>
                <option value="gemini-1.5-flash">⚡ 1.5 Flash</option>
                <option value="gemini-1.5-pro">🚀 1.5 Pro</option>
                <option value="gemini-2.0-flash-exp">🔬 2.0 Flash (Exp)</option>
            </optgroup>

            {openRouterModels.length > 0 && (
                <optgroup label="OpenRouter (DeepSeek, Llama, etc.)">
                    {openRouterModels
                        .filter(m =>
                            m.id.includes('deepseek') ||
                            m.id.includes('llama') ||
                            m.id.includes('gpt-4') ||
                            m.id.includes('claude-3') ||
                            value === m.id
                        )
                        .map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    {/* Add a simplified view, but always show the current one */}
                </optgroup>
            )}

            {isLoading && openRouterModels.length === 0 && (
                <option value="">Carregando modelos...</option>
            )}
        </select>
    );
}
