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
    Trash2,
    Plus,
    X,
    Settings,
    Music,
    MapPin,
    Users,
    ChevronRight,
    ChevronLeft,
    Calendar,
    EyeOff
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
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [postImageUrl, setPostImageUrl] = useState('');
    const [postCaption, setPostCaption] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [postAltText, setPostAltText] = useState('');
    const [postLocation, setPostLocation] = useState('');
    const [postTags, setPostTags] = useState('');
    const [commentsEnabled, setCommentsEnabled] = useState(true);
    const [hideLikes, setHideLikes] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledTime, setScheduledTime] = useState('');
    const [publishStep, setPublishStep] = useState(1);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mediaType, setMediaType] = useState<'FEED' | 'REELS'>('FEED');
    const [isLoading, setIsLoading] = useState(false);

    const t: any = {
        pt_BR: {
            title: 'Gestão do Instagram',
            subtitle: 'Gerencie publicações, responda comentários e acesse os insights.',
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
            noInsights: 'Insights ainda não disponíveis.',
            deleteBtn: 'Excluir',
            deleteConfirm: 'Excluir este comentário/resposta?',
            createPost: 'Criar Post',
            postCaptionLabel: 'Legenda',
            imageUrlLabel: 'URL da Imagem',
            publishBtn: 'Publicar Agora',
            publishing: 'Publicando...',
            publishSuccess: 'Post publicado com sucesso!',
            publishError: 'Erro ao publicar.',
            errorReply: 'Erro ao responder:'
        },
        en_US: {
            title: 'Instagram Management',
            subtitle: 'Manage posts, reply to comments, and access insights.',
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
            noInsights: 'No insights available.',
            deleteBtn: 'Delete',
            deleteConfirm: 'Delete this comment/reply?',
            createPost: 'Create Post',
            postCaptionLabel: 'Caption',
            imageUrlLabel: 'Image URL',
            publishBtn: 'Publish Now',
            publishing: 'Publishing...',
            publishSuccess: 'Post published successfully!',
            publishError: 'Error publishing post.',
            errorReply: 'Error replying:'
        },
        pt_PT: {
            title: 'Gestão do Instagram',
            subtitle: 'Gira publicações, responda a comentários e aceda aos insights.',
            tabFeed: 'Feed & Comentários',
            tabInsights: 'Insights',
            errorLoad: 'Erro ao carregar dados do Instagram',
            errorDetail: 'Verifique se as permissões (instagram_business_basic) estão aprovadas ou se a conta está no modo de desenvolvimento com testadores válidos.',
            posts: 'Publicações',
            noPosts: 'Nenhuma publicação encontrada.',
            noCaption: 'Sem legenda',
            postComments: 'Comentários da Publicação',
            viewOriginal: 'Ver post original no Instagram',
            noComments: 'Nenhum comentário encontrado para esta publicação.',
            replyingTo: 'A responder',
            replyBtn: 'Responder',
            us: 'Nós',
            selectPost: 'Selecione uma publicação para ver e gerir os comentários',
            metrics: 'Métricas de Interação',
            noInsights: 'Insights ainda não disponíveis.',
            deleteBtn: 'Eliminar',
            deleteConfirm: 'Eliminar este comentário/resposta?',
            createPost: 'Criar Post',
            postCaptionLabel: 'Legenda',
            imageUrlLabel: 'URL da Imagem',
            publishBtn: 'Publicar Agora',
            publishing: 'A publicar...',
            publishSuccess: 'Post publicado com sucesso!',
            publishError: 'Erro ao publicar.',
            errorReply: 'Erro ao responder:'
        },
        it_IT: {
            title: 'Gestione Instagram',
            subtitle: 'Gestisci i post, rispondi ai commenti e accedi agli approfondimenti.',
            tabFeed: 'Feed e Commenti',
            tabInsights: 'Approfondimenti',
            errorLoad: 'Errore nel caricamento dei dati di Instagram',
            errorDetail: 'Verifica se le autorizzazioni (instagram_business_basic) sono approvate o se l\'account è in modalità di sviluppo con tester validi.',
            posts: 'Post',
            noPosts: 'Nessun post trovato.',
            noCaption: 'Senza didascalia',
            postComments: 'Commenti del Post',
            viewOriginal: 'Visualizza il post originale su Instagram',
            noComments: 'Nessun commento trovato per questo post.',
            replyingTo: 'Rispondendo a',
            replyBtn: 'Rispondi',
            us: 'Noi',
            selectPost: 'Seleziona un post per visualizzare e gestire i commenti',
            metrics: 'Metriche di Coinvolgimento',
            noInsights: 'Approfondimenti non ancora disponibili.',
            deleteBtn: 'Elimina',
            deleteConfirm: 'Eliminare questo commento/risposta?',
            createPost: 'Crea Post',
            postCaptionLabel: 'Didascalia',
            imageUrlLabel: 'URL dell\'immagine',
            publishBtn: 'Pubblica Ora',
            publishing: 'Pubblicazione in corso...',
            publishSuccess: 'Post pubblicato con successo!',
            publishError: 'Errore durante la pubblicazione.',
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
        if (!confirm(txt.deleteConfirm)) return;
        
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
                // In a real scenario, we'd upload this to S3 and set the public URL
                setPostImageUrl(reader.result as string); 
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePublishPost = async () => {
        if (!postImageUrl.trim()) return;
        setIsPublishing(true);
        try {
            const payload: any = {
                imageUrl: postImageUrl.startsWith('data:') ? 'https://zaplandia.com/temp-image.jpg' : postImageUrl, // Fallback for demo
                caption: postCaption,
                mediaType: mediaType,
                altText: postAltText,
                commentsEnabled: commentsEnabled
            };

            if (isScheduled && scheduledTime) {
                payload.scheduledPublishTime = Math.floor(new Date(scheduledTime).getTime() / 1000);
            }

            const res = await fetch('/api/integrations/instagram/publish', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert(txt.publishSuccess);
                setIsPublishModalOpen(false);
                setPostImageUrl('');
                setPostCaption('');
                setFilePreview(null);
                setPublishStep(1);
                fetchMedia();
            } else {
                const err = await res.json();
                alert(`${txt.publishError}: ${err.message || ''}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`${txt.publishError}: ${e.message || ''}`);
        } finally {
            setIsPublishing(false);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center justify-between flex-1">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl shadow-lg shadow-pink-500/20">
                            <Instagram className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {txt.title}
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">{txt.subtitle}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsPublishModalOpen(true)}
                        className="bg-primary hover:bg-primary-dark px-6 py-2.5 rounded-xl font-bold transition flex items-center shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {txt.createPost}
                    </button>
                </div>
                
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
                                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col shadow-sm">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-bold text-sm text-slate-900">@{comment.username}</span>
                                                            <span className="text-[10px] text-slate-500 font-medium">{new Date(comment.timestamp).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-800 font-medium leading-relaxed">{comment.text}</p>
                                                        
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
                                                                <div key={reply.id} className="bg-red-50 border border-red-100 p-3 rounded-xl flex flex-col shadow-sm">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="font-bold text-xs text-slate-700">@{reply.username} ({txt.us})</span>
                                                                        <div className="flex items-center space-x-3">
                                                                            <span className="text-[10px] text-slate-500 font-medium">{new Date(reply.timestamp).toLocaleString()}</span>
                                                                            <button 
                                                                                onClick={() => handleDeleteComment(reply.id)}
                                                                                className="text-[10px] text-red-500/70 hover:text-red-600 transition"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm text-slate-800 font-medium">{reply.text}</p>
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

            {/* Publish Modal */}
            {isPublishModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsPublishModalOpen(false)}></div>
                    <div className="bg-surface border border-white/10 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col lg:flex-row">
                        
                        {/* Preview Area (Left) */}
                        <div className="lg:w-1/2 bg-black flex items-center justify-center border-r border-white/10 relative">
                            {filePreview ? (
                                <img src={filePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                            ) : (
                                <div className="text-center p-12">
                                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                                    <p className="text-gray-500 mb-6">{lang === 'en_US' ? 'Choose a vertical photo (4:5)' : 'Escolha uma foto vertical (4:5)'}</p>
                                    <label className="bg-primary hover:bg-primary-dark px-6 py-2 rounded-xl font-bold cursor-pointer transition">
                                        {lang === 'en_US' ? 'Select from Device' : 'Selecionar do Dispositivo'}
                                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                            )}
                            {filePreview && (
                                <button onClick={() => setFilePreview(null)} className="absolute top-4 left-4 bg-black/50 p-2 rounded-full hover:bg-black transition">
                                    <Trash2 className="w-4 h-4 text-white" />
                                </button>
                            )}
                        </div>

                        {/* Config Area (Right) */}
                        <div className="lg:w-1/2 bg-surface flex flex-col">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center">
                                    {publishStep > 1 && (
                                        <button onClick={() => setPublishStep(1)} className="mr-3 text-gray-400 hover:text-white">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    )}
                                    <h3 className="font-bold">{publishStep === 1 ? txt.createPost : (lang === 'en_US' ? 'Advanced Settings' : 'Configurações Avançadas')}</h3>
                                </div>
                                <button onClick={() => setIsPublishModalOpen(false)} className="text-gray-400 hover:text-white transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {publishStep === 1 ? (
                                    <>
                                        <div>
                                            <div className="flex items-center mb-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center mr-2">
                                                    <Instagram className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-bold">zaplandia_oficial</span>
                                             </div>

                                             {/* Carousel Tip */}
                                             <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-start">
                                                 <AlertCircle className="w-4 h-4 text-primary mr-2 flex-shrink-0 mt-0.5" />
                                                 <p className="text-[10px] text-gray-300 leading-relaxed">
                                                     <strong className="text-primary">{lang === 'en_US' ? 'Carousel Tip (2026):' : 'Dica de Carrossel (2026):'}</strong> {lang === 'en_US' ? 'Use up to 10 slides in vertical format (4:5) for maximum engagement.' : 'O ideal é usar até 10 slides, garantindo que o formato seja consistente (preferencialmente vertical 4:5).'}
                                                 </p>
                                            </div>

                                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-6">
                                                <button
                                                    onClick={() => setMediaType('FEED')}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${mediaType === 'FEED' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    Feed Post
                                                </button>
                                                <button
                                                    onClick={() => setMediaType('REELS')}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${mediaType === 'REELS' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    Reels
                                                </button>
                                            </div>

                                            <textarea 
                                                value={postCaption}
                                                onChange={(e) => setPostCaption(e.target.value)}
                                                placeholder={lang === 'en_US' ? 'Write a caption or add hashtags...' : 'Escreva uma legenda ou adicione hashtags...'}
                                                rows={6}
                                                className="w-full bg-transparent text-sm outline-none resize-none"
                                            />
                                        </div>

                                        <div className="space-y-4 border-t border-white/10 pt-4">
                                            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setPublishStep(2)}>
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <Users className="w-4 h-4 mr-3" />
                                                    {lang === 'en_US' ? 'Tag People' : 'Marcar Pessoas'}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                                            </div>
                                            <div className="flex items-center justify-between group cursor-pointer">
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <MapPin className="w-4 h-4 mr-3" />
                                                    {lang === 'en_US' ? 'Add Location' : 'Adicionar Localização'}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                                            </div>
                                            <div className="flex items-center justify-between group cursor-pointer">
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <Music className="w-4 h-4 mr-3" />
                                                    {lang === 'en_US' ? 'Add Music' : 'Adicionar Música'}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                                            </div>
                                            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setPublishStep(2)}>
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <Settings className="w-4 h-4 mr-3" />
                                                    {lang === 'en_US' ? 'Advanced Settings' : 'Configurações Avançadas'}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase">{lang === 'en_US' ? 'Accessibility' : 'Acessibilidade'}</h4>
                                            <textarea 
                                                value={postAltText}
                                                onChange={(e) => setPostAltText(e.target.value)}
                                                placeholder={lang === 'en_US' ? 'Write alt text...' : 'Escreva o texto alternativo...'}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase">{lang === 'en_US' ? 'Post Settings' : 'Configurações do Post'}</h4>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{lang === 'en_US' ? 'Hide Like and View Counts' : 'Ocultar Curtidas e Visualizações'}</span>
                                                <button 
                                                    onClick={() => setHideLikes(!hideLikes)}
                                                    className={`w-10 h-5 rounded-full transition relative ${hideLikes ? 'bg-primary' : 'bg-gray-700'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${hideLikes ? 'right-1' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{lang === 'en_US' ? 'Turn Off Commenting' : 'Desativar Comentários'}</span>
                                                <button 
                                                    onClick={() => setCommentsEnabled(!commentsEnabled)}
                                                    className={`w-10 h-5 rounded-full transition relative ${!commentsEnabled ? 'bg-primary' : 'bg-gray-700'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${!commentsEnabled ? 'right-1' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/10">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="w-4 h-4 mr-3" />
                                                    {lang === 'en_US' ? 'Schedule Publication' : 'Programar Publicação'}
                                                </div>
                                                <button 
                                                    onClick={() => setIsScheduled(!isScheduled)}
                                                    className={`w-10 h-5 rounded-full transition relative ${isScheduled ? 'bg-primary' : 'bg-gray-700'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isScheduled ? 'right-1' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                            {isScheduled && (
                                                <input 
                                                    type="datetime-local"
                                                    value={scheduledTime}
                                                    onChange={(e) => setScheduledTime(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                                                />
                                            )}
                                        </div>

                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                            <p className="text-[10px] text-yellow-500 leading-tight">
                                                {lang === 'en_US' 
                                                    ? 'Note: Meta API does not yet support publishing directly to Stories (History) via third-party apps.' 
                                                    : 'Nota: A API da Meta ainda não permite a publicação direta em Stories (Históricos) através de aplicativos de terceiros.'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-white/10 bg-white/5">
                                <button 
                                    onClick={handlePublishPost}
                                    disabled={isPublishing || !filePreview}
                                    className="w-full bg-primary hover:bg-primary-dark py-3 rounded-xl font-bold transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                                >
                                    {isPublishing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            {txt.publishing}
                                        </>
                                    ) : (
                                        <>
                                            {isScheduled ? <Calendar className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                                            {isScheduled ? (lang === 'en_US' ? 'Schedule' : 'Programar') : txt.publishBtn}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
