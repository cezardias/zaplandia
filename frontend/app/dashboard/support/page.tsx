'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Search,
    HelpCircle,
    Book,
    MessageCircle,
    Zap,
    Shield,
    Settings,
    ChevronRight,
    Loader2,
    X
} from 'lucide-react';

interface Article {
    id: string;
    title: string;
    content: string;
    category: string;
}

export default function SupportPage() {
    const { token } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    const fetchArticles = async (query = '') => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/support/articles?q=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            }
        } catch (err) {
            console.error('Erro ao buscar artigos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchArticles();
    }, [token]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchArticles(search);
    };

    return (
        <div className="p-8 pb-20 max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-black mb-4 tracking-tight">Como podemos ajudar?</h1>
                <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">Pesquise em nossa base de conhecimento ou procure por categorias para dominar o Zaplandia.</p>

                <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Pesquisar por ferramentas, canais, integrações..."
                        className="w-full bg-surface border border-white/10 rounded-3xl pl-14 pr-6 py-5 text-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition shadow-2xl"
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary px-6 py-3 rounded-2xl font-bold text-sm"
                    >
                        Buscar
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? (
                    <div className="col-span-full py-20 flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-gray-500">Buscando conhecimento...</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <HelpCircle className="w-16 h-16 text-gray-500 opacity-20 mx-auto mb-6" />
                        <p className="text-gray-400">Nenhum artigo encontrado para sua busca.</p>
                    </div>
                ) : (
                    articles.map(article => (
                        <button
                            key={article.id}
                            onClick={() => setSelectedArticle(article)}
                            className="bg-surface border border-white/5 rounded-3xl p-8 hover:border-primary/40 transition-all text-left group shadow-xl hover:-translate-y-1 duration-300"
                        >
                            <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-6 group-hover:bg-primary/20 transition">
                                <Book className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 leading-tight group-hover:text-primary transition">{article.title}</h3>
                            <p className="text-sm text-gray-500 mb-6 truncate">{article.category}</p>
                            <div className="flex items-center text-primary text-xs font-black uppercase tracking-widest bg-primary/5 w-fit px-4 py-2 rounded-xl group-hover:bg-primary/10 transition">
                                <span>Ler Procedimento</span>
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Article Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-surface border border-white/10 w-full max-w-4xl h-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-8 border-b border-white/5 bg-background/50 flex justify-between items-center shrink-0">
                            <div>
                                <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">{selectedArticle.category}</p>
                                <h2 className="text-3xl font-black leading-tight">{selectedArticle.title}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="p-4 hover:bg-white/5 rounded-2xl transition"
                            >
                                <X className="w-8 h-8 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-8 md:p-12 overflow-y-auto flex-1 prose prose-invert max-w-none">
                            <div className="text-gray-400 leading-relaxed text-lg whitespace-pre-wrap">
                                {selectedArticle.content}
                            </div>
                        </div>
                        <div className="p-8 border-t border-white/5 bg-background/50 flex justify-center">
                            <p className="text-gray-500 text-sm italic">O conteúdo acima é gerado para auxiliar nos procedimentos do sistema Zaplandia.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
