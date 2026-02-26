'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Search, ChevronDown, Check, Sparkles } from 'lucide-react';

interface AiModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
    token: string;
    className?: string;
}

const NATIVE_MODELS = [
    { id: 'gemini-2.0-flash', name: '⚡ 2.0 Flash (Recomendado)', provider: 'Google' },
    { id: 'gemini-1.5-flash', name: '⚡ 1.5 Flash', provider: 'Google' },
    { id: 'gemini-1.5-pro', name: '🚀 1.5 Pro', provider: 'Google' },
    { id: 'gemini-2.0-flash-exp', name: '🔬 2.0 Flash (Exp)', provider: 'Google' },
];

export default function AiModelSelector({ value, onChange, token, className = "" }: AiModelSelectorProps) {
    const [openRouterModels, setOpenRouterModels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (token) fetchModels();
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const allModels = [
        ...NATIVE_MODELS.map(m => ({ ...m, provider: 'Google Gemini' })),
        ...openRouterModels.map(m => ({ id: m.id, name: m.name, provider: 'OpenRouter' }))
    ];

    const filteredModels = allModels.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase()) ||
        (m.id === value) // Always keep selected item searchable/visible if needed
    );

    const selectedModel = allModels.find(m => m.id === value) || { name: value, id: value };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm flex items-center justify-between text-white hover:bg-white/10 transition outline-none focus:border-primary"
            >
                <div className="flex items-center space-x-2 truncate">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{selectedModel.name}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar modelo (ex: gpt-4, deepseek)..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-primary transition"
                            />
                        </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {isLoading && openRouterModels.length === 0 && (
                            <div className="flex items-center justify-center py-4 space-x-2 text-gray-400 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Carregando OpenRouter...</span>
                            </div>
                        )}

                        {filteredModels.length === 0 && !isLoading && (
                            <div className="text-center py-4 text-gray-500 text-sm">Nenhum modelo encontrado</div>
                        )}

                        {/* Rendering Groups */}
                        {['Google Gemini', 'OpenRouter'].map(provider => {
                            const providerModels = filteredModels.filter(m => m.provider === provider);
                            if (providerModels.length === 0) return null;

                            return (
                                <div key={provider}>
                                    <div className="px-3 py-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
                                        {provider}
                                    </div>
                                    {providerModels.map(model => (
                                        <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(model.id);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between transition ${value === model.id
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                    : 'text-gray-300 hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="truncate">{model.name}</span>
                                            {value === model.id && <Check className="w-4 h-4 shrink-0 shadow-sm" />}
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
