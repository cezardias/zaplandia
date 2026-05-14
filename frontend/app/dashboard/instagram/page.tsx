'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
    Instagram,
    MessageCircle,
    Image as ImageIcon,
    BarChart3,
    Loader2,
    Send,
    Reply,
    Heart,
    Clock,
    AlertCircle,
    Trash2
} from 'lucide-react';
import Image from 'next/image';

interface Media {
    id: string;
    caption: string;
    media_type: string;
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
    comments_count: number;
    like_count: number;
}

interface Comment {
    id: string;
    text: string;
    timestamp: string;
    username: string;
    replies?: {
        data: { id: string; text: string; timestamp: string; username: string }[];
    };
}

export default function InstagramManagementPage() {
    const { token } = useAuth();
    const { lang } = useLanguage();
    
    const [activeTab, setActiveTab] = useState<'feed' | 'insights'>('feed');
    const [isLoading, setIsLoading] = useState(false);

    const t: any = {
        pt_BR: {
            title: 'Gestão do Instagram',
            desc: 'Gerencie publicações, responda comentários e acesse os insights da sua conta profissional do Instagram.',
            tabFeed: 'Feed & Comentários',
            tabInsights: 'Insights',
            errorLoad: 'Erro ao carregar dados do Instagram',
            errorDetail: 'Verifique se as permissões (instagram_business_basic) estão aprovadas ou se a conta está no modo desenvolvimento com testadores válidos.',
            posts: 'Publicações',
            noPosts: 'Nenhuma publicação encontrada.',
            noCaption: 'Sem legenda',
            postComments: 'Comentários da Publicação',
            viewOriginal: 'Ver post original no Instagram',
            noComments: 'Nenhum comentário encontrado para esta publicação.',
            replyingTo: 'Respondendo',
            replyBtn: 'Responder',
            us: 'Nós',
            selectPost: 'Selecione uma publicação para ver e gerenciar os comentários',
            metrics: 'Métricas de Engajamento',
            noInsights: 'Insights ainda não disponíveis ou falta de permissão (instagram_business_manage_insights).',
            errorReply: 'Erro ao responder:'
        },
        en_US: {
            title: 'Instagram Management',
            desc: 'Manage posts, reply to comments, and access insights for your professional Instagram account.',
            tabFeed: 'Feed & Comments',
            tabInsights: 'Insights',
            errorLoad: 'Error loading Instagram data',
            errorDetail: 'Check if permissions (instagram_business_basic) are approved or if the account is in development mode with valid testers.',
            posts: 'Posts',
            noPosts: 'No posts found.',
            noCaption: 'No caption',
            postComments: 'Post Comments',
            viewOriginal: 'View original post on Instagram',
            noComments: 'No comments found for this post.',
            replyingTo: 'Replying to',
            replyBtn: 'Reply',
            us: 'Us',
            selectPost: 'Select a post to view and manage comments',
            metrics: 'Engagement Metrics',
            noInsights: 'Insights not yet available or missing permission (instagram_business_manage_insights).',
            errorReply: 'Error replying:'
        },
        pt_PT: {
            title: 'Gestão do Instagram',
            desc: 'Gira publicações, responda a comentários e aceda aos insights da sua conta profissional do Instagram.',
            tabFeed: 'Feed & Comentários',
            tabInsights: 'Insights',
            errorLoad: 'Erro ao carregar dados do Instagram',
            errorDetail: 'Verifique se as permissões (instagram_business_basic) estão aprovadas ou se a conta está no modo desenvolvimento com testadores válidos.',
            posts: 'Publicações',
            noPosts: 'Nenhuma publicação encontrada.',
            noCaption: 'Sem legenda',
            postComments: 'Comentários da Publicação',
            viewOriginal: 'Ver post original no Instagram',
            noComments: 'Nenhum comentário encontrado para esta publicação.',
            replyingTo: 'A responder a',
            replyBtn: 'Responder',
            us: 'Nós',
            selectPost: 'Selecione uma publicação para ver e gerir os comentários',
            metrics: 'Métricas de Envolvimento',
            noInsights: 'Insights ainda não disponíveis ou falta de permissão (instagram_business_manage_insights).',
            errorReply: 'Erro ao responder:'
        },
        it_IT: {
            title: 'Gestione Instagram',
            desc: 'Gestisci post, rispondi ai commenti e accedi agli insights del tuo account professionale Instagram.',
            tabFeed: 'Feed & Commenti',
            tabInsights: 'Insights',
            errorLoad: 'Errore nel caricamento dei dati di Instagram',
            errorDetail: 'Verifica se i permessi (instagram_business_basic) sono approvati o se l\'account è in modalità sviluppo con tester validi.',
            posts: 'Post',
            noPosts: 'Nessun post trovato.',
            noCaption: 'Nessuna didascalia',
            postComments: 'Commenti al Post',
            viewOriginal: 'Vedi post originale su Instagram',
            noComments: 'Nessun commento trovato per questo post.',
            replyingTo: 'Rispondendo a',
            replyBtn: 'Rispondi',
            us: 'Noi',
            selectPost: 'Seleziona un post per visualizzare e gestire i commenti',
            metrics: 'Metriche di Coinvolgimento',
            noInsights: 'Insights non ancora disponibili o permessi mancanti (instagram_business_manage_insights).',
            errorReply: 'Errore nella risposta:'
        }
    };
    
    const txt = t[lang] || t['pt_BR'];
    const [error, setError] = useState<string | null>(null);
    
    const [mediaList, setMediaList] = useState<Media[]>([]);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [insights, setInsights] = useState<any[]>([]);

    useEffect(() => {
        if (token) {
            fetchMedia();
            fetchInsights();
        }
    }, [token]);

    const handleShowLikersMessage = () => {
        alert(lang === 'en_US' 
            ? 'Instagram Privacy Policy: Meta only provides the total like count. The list of individual users who liked the post is not available via this API for privacy reasons.' 
            : 'Política de Privacidade do Instagram: A Meta fornece apenas o número total de curtidas. A lista de usuários individuais que curtiram o post não está disponível via API por questões de privacidade.');
    };

    const fetchMedia = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/integrations/instagram/media', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.data) {
                setMediaList(data.data);
            } else {
                if (data.message) setError(data.message);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInsights = async () => {
        try {
            const res = await fetch('/api/integrations/instagram/insights', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.data) {
                setInsights(data.data);
            }
        } catch (e) {
            console.error('Insights fetch error:', e);
        }
    };

    const fetchComments = async (mediaId: string) => {
        setIsCommentsLoading(true);
        try {
            const res = await fetch(`/api/integrations/instagram/media/${mediaId}/comments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.data) {
                setComments(data.data);
            } else {
                setComments([]);
            }
        } catch (e) {
            console.error('Comments fetch error:', e);
        } finally {
            setIsCommentsLoading(false);
        }
    };

    const handleSelectMedia = (media: Media) => {
        setSelectedMedia(media);
        fetchComments(media.id);
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm(lang === 'en_US' ? 'Delete this comment/reply?' : 'Excluir este comentário/resposta?')) return;
        
        try {
            const res = await fetch(`/api/integrations/instagram/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                if (selectedMedia) fetchComments(selectedMedia.id);
            } else {
                alert(lang === 'en_US' ? 'Failed to delete. Make sure you have permission.' : 'Falha ao excluir. Verifique se você tem permissão.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleReply = async (commentId: string) => {
        if (!replyText.trim()) return;
        try {
            const res = await fetch(`/api/integrations/instagram/comments/${commentId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: replyText })
            });
            if (res.ok) {
                setReplyText('');
                setReplyingTo(null);
                // Refresh comments
                if (selectedMedia) fetchComments(selectedMedia.id);
            } else {
                const err = await res.json();
                alert(`${txt.errorReply} ${err.message}`);
            }
        } catch (e: any) {
            alert(`${txt.errorReply} ${e.message}`);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto text-white pb-20 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                            <Instagram className="w-6 h-6 text-white" />
                        </div>
                        <span>{txt.title}</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm max-w-xl">
                        {txt.desc}
                    </p>
                </div>
                
                {/* Tabs */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'feed' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <ImageIcon size={18} />
                        <span>{txt.tabFeed}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('insights')}
                        className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'insights' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <BarChart3 size={18} />
                        <span>{txt.tabInsights}</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start space-x-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div className="text-sm text-red-200">
                        <p className="font-bold">{txt.errorLoad}</p>
                        <p>{error}</p>
                        <p className="mt-2 text-xs">{txt.errorDetail}</p>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {activeTab === 'feed' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Media List */}
                    <div className="lg:col-span-1 bg-surface border border-white/10 rounded-2xl p-4 flex flex-col h-[70vh]">
                        <h2 className="text-lg font-bold mb-4 flex items-center">
                            <ImageIcon className="w-5 h-5 mr-2 text-primary" />
                            {txt.posts}
                        </h2>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                            {isLoading ? (
                                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                            ) : mediaList.length === 0 && !error ? (
                                <p className="text-center text-gray-500 p-8">{txt.noPosts}</p>
                            ) : (
                                mediaList.map((media) => (
                                    <div 
                                        key={media.id}
                                        onClick={() => handleSelectMedia(media)}
                                        className={`flex p-3 rounded-xl cursor-pointer transition border ${selectedMedia?.id === media.id ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="w-16 h-16 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden relative">
                                            {(media.media_type === 'IMAGE' || media.media_type === 'CAROUSEL_ALBUM') ? (
                                                <img src={media.media_url} alt="Post" className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={media.thumbnail_url || media.media_url} alt="Video" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="ml-3 flex-1 overflow-hidden">
                                            <p className="text-xs text-gray-300 line-clamp-2">{media.caption || txt.noCaption}</p>
                                            <div className="flex items-center space-x-3 mt-2 text-[10px] text-gray-500">
                                                <span className="flex items-center"><Heart className="w-3 h-3 mr-1" /> {media.like_count || 0}</span>
                                                <span className="flex items-center"><MessageCircle className="w-3 h-3 mr-1" /> {media.comments_count || 0}</span>
                                                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(media.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Comments Area */}
                    <div className="lg:col-span-2 bg-surface border border-white/10 rounded-2xl flex flex-col h-[70vh]">
                        {selectedMedia ? (
                            <>
                                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between rounded-t-2xl">
                                    <div>
                                        <h3 className="font-bold">{txt.postComments}</h3>
                                        <a href={selectedMedia.permalink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{txt.viewOriginal}</a>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button 
                                            onClick={handleShowLikersMessage}
                                            className="flex items-center text-sm hover:bg-white/10 px-2 py-1 rounded-lg transition"
                                        >
                                            <Heart className="w-4 h-4 mr-1 text-pink-500" /> {selectedMedia.like_count}
                                        </button>
                                        <span className="flex items-center text-sm"><MessageCircle className="w-4 h-4 mr-1 text-blue-400" /> {selectedMedia.comments_count}</span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                    {isCommentsLoading ? (
                                        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                                    ) : comments.length === 0 ? (
                                        <p className="text-center text-gray-500 mt-10">{txt.noComments}</p>
                                    ) : (
                                        <div className="space-y-6">
                                            {comments.map(comment => (
                                                <div key={comment.id} className="space-y-2">
                                                    {/* Main Comment */}
                                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-bold text-sm text-primary-light">@{comment.username}</span>
                                                            <span className="text-[10px] text-gray-500">{new Date(comment.timestamp).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-200">{comment.text}</p>
                                                        
                                                        <div className="mt-3 flex justify-end space-x-4">
                                                            <button 
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="text-[10px] text-red-400/50 hover:text-red-400 flex items-center transition"
                                                                title={lang === 'en_US' ? 'Delete Comment' : 'Excluir Comentário'}
                                                            >
                                                                <Trash2 className="w-3 h-3 mr-1" /> {lang === 'en_US' ? 'Delete' : 'Excluir'}
                                                            </button>
                                                            <button 
                                                                onClick={() => { setReplyingTo(comment.id); setReplyText(''); }}
                                                                className="text-xs text-gray-400 hover:text-white flex items-center transition"
                                                            >
                                                                <Reply className="w-3 h-3 mr-1" /> {txt.replyBtn}
                                                            </button>
                                                        </div>

                                                        {/* Reply Input Box */}
                                                        {replyingTo === comment.id && (
                                                            <div className="mt-3 flex space-x-2">
                                                                <input
                                                                    type="text"
                                                                    value={replyText}
                                                                    onChange={(e) => setReplyText(e.target.value)}
                                                                    placeholder={`${txt.replyingTo} @${comment.username}...`}
                                                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => handleReply(comment.id)}
                                                                    className="bg-primary hover:bg-primary-dark p-2 rounded-lg transition"
                                                                >
                                                                    <Send className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Replies */}
                                                    {comment.replies && comment.replies.data && comment.replies.data.length > 0 && (
                                                        <div className="ml-8 space-y-2">
                                                            {comment.replies.data.map(reply => (
                                                                <div key={reply.id} className="bg-primary/5 border border-primary/10 p-3 rounded-xl flex flex-col">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="font-bold text-xs text-gray-400">@{reply.username} ({txt.us})</span>
                                                                        <div className="flex items-center space-x-3">
                                                                            <span className="text-[10px] text-gray-500">{new Date(reply.timestamp).toLocaleString()}</span>
                                                                            <button 
                                                                                onClick={() => handleDeleteComment(reply.id)}
                                                                                className="text-gray-500 hover:text-red-400 transition"
                                                                                title={lang === 'en_US' ? 'Delete Reply' : 'Excluir Resposta'}
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm text-gray-300">{reply.text}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                                <p>{txt.selectPost}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'insights' && (
                <div className="bg-surface border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3 text-primary" />
                        {txt.metrics}
                    </h2>
                    
                    {insights.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">{txt.noInsights}</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {insights.map((insight: any) => (
                                <div key={insight.name} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <h3 className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-2">{insight.title || insight.name}</h3>
                                    <p className="text-4xl font-black text-white">{insight.values[0]?.value || 0}</p>
                                    <p className="text-xs text-gray-500 mt-2">{insight.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
