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
    User,
    ChevronRight,
    ChevronLeft,
    Calendar,
    EyeOff,
    Film,
    Layers,
    Clapperboard,
    PlaySquare,
    ListMusic,
    Video,
    Search,
    Filter,
    ArrowDownUp,
    MoreHorizontal,
    Share2,
    LayoutGrid,
    Tag,
    Scissors,
    Zap,
    Facebook,
    ExternalLink,
    Eye
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
    media_product_type?: string;
    video_title?: string;
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
    
    const [sidebarTab, setSidebarTab] = useState<'posts' | 'stories' | 'reels' | 'ab_tests' | 'feed_and_grid' | 'mentions_and_tags' | 'clips' | 'playlists' | 'series' | 'ads'>('posts');
    const [statusTab, setStatusTab] = useState<'published' | 'scheduled' | 'drafts' | 'expiring' | 'expired'>('published');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState('90');
    const [isLoading, setIsLoading] = useState(false);

    const t: any = {
        pt_BR: {
            title: 'Gestão do Instagram',
            subtitle: 'Gerencie conteúdos, analise métricas e otimize sua presença digital.',
            sections: {
                posts: 'Posts e reels',
                stories: 'Stories',
                ab_tests: 'Testes A/B',
                feed_grid: 'Feed e grade',
                mentions: 'Menções e marcações',
                clips: 'Clipes',
                collections: 'Coleções',
                playlists: 'Playlists',
                series: 'Séries',
                ad_pieces: 'Peças publicitárias',
                cross_post: 'Vídeos para post cruzado'
            },
            status: {
                published: 'Publicados',
                scheduled: 'Programados',
                drafts: 'Rascunhos',
                expiring: 'Quase expirando',
                expired: 'Expirados'
            },
            table: {
                title: 'Título',
                date: 'Data da publicação',
                status: 'Status',
                reach: 'Alcance',
                views: 'Visualizações',
                engagement: 'Engajamento'
            },
            filters: {
                search: 'Pesquisar por ID ou legenda',
                filter: 'Filtrar',
                last90: 'Últimos 90 dias',
                last30: 'Últimos 30 dias',
                last7: 'Últimos 7 dias'
            },
            errorLoad: 'Erro ao carregar dados do Instagram',
            errorDetail: 'Verifique se as permissões (instagram_business_basic) estão aprovadas.',
            createBtn: 'Criar Publicação'
        },
        en_US: {
            title: 'Instagram Management',
            subtitle: 'Manage content, analyze metrics, and optimize your digital presence.',
            sections: {
                posts: 'Posts and Reels',
                stories: 'Stories',
                ab_tests: 'A/B Testing',
                feed_grid: 'Feed and Grid',
                mentions: 'Mentions and Tags',
                clips: 'Clips',
                collections: 'Collections',
                playlists: 'Playlists',
                series: 'Series',
                ad_pieces: 'Ad Creatives',
                cross_post: 'Videos for Cross-post'
            },
            status: {
                published: 'Published',
                scheduled: 'Scheduled',
                drafts: 'Drafts',
                expiring: 'Expiring Soon',
                expired: 'Expired'
            },
            table: {
                title: 'Title',
                date: 'Publication Date',
                status: 'Status',
                reach: 'Reach',
                views: 'Views',
                engagement: 'Engagement'
            },
            filters: {
                search: 'Search by ID or caption',
                filter: 'Filter',
                last90: 'Last 90 days',
                last30: 'Last 30 days',
                last7: 'Last 7 days'
            },
            errorLoad: 'Error loading Instagram data',
            errorDetail: 'Ensure (instagram_business_basic) permissions are approved.',
            createBtn: 'Create Post'
        },
        pt_PT: {
            title: 'Gestão do Instagram',
            subtitle: 'Gira conteúdos, analise métricas e otimize a sua presença digital.',
            sections: {
                posts: 'Posts e reels',
                stories: 'Stories',
                ab_tests: 'Testes A/B',
                feed_grid: 'Feed e grelha',
                mentions: 'Menções e marcações',
                clips: 'Clipes',
                collections: 'Coleções',
                playlists: 'Playlists',
                series: 'Séries',
                ad_pieces: 'Peças publicitárias',
                cross_post: 'Vídeos para post cruzado'
            },
            status: {
                published: 'Publicados',
                scheduled: 'Agendados',
                drafts: 'Rascunhos',
                expiring: 'A expirar',
                expired: 'Expirados'
            },
            table: {
                title: 'Título',
                date: 'Data da publicação',
                status: 'Estado',
                reach: 'Alcance',
                views: 'Visualizações',
                engagement: 'Interação'
            },
            filters: {
                search: 'Pesquisar por ID ou legenda',
                filter: 'Filtrar',
                last90: 'Últimos 90 dias',
                last30: 'Últimos 30 dias',
                last7: 'Últimos 7 dias'
            },
            errorLoad: 'Erro ao carregar dados do Instagram',
            errorDetail: 'Verifique se as permissões estão aprovadas.',
            createBtn: 'Criar Publicação'
        },
        it_IT: {
            title: 'Gestione Instagram',
            subtitle: 'Gestisci contenuti, analizza metriche e ottimizza la tua presenza digitale.',
            sections: {
                posts: 'Post e reel',
                stories: 'Storie',
                ab_tests: 'Test A/B',
                feed_grid: 'Feed e griglia',
                mentions: 'Menzioni e tag',
                clips: 'Clip',
                collections: 'Collezioni',
                playlists: 'Playlist',
                series: 'Serie',
                ad_pieces: 'Contenuti pubblicitari',
                cross_post: 'Video per cross-post'
            },
            status: {
                published: 'Pubblicati',
                scheduled: 'Programmati',
                drafts: 'Bozze',
                expiring: 'In scadenza',
                expired: 'Scaduti'
            },
            table: {
                title: 'Titolo',
                date: 'Data di pubblicazione',
                status: 'Stato',
                reach: 'Copertura',
                views: 'Visualizzazioni',
                engagement: 'Coinvolgimento'
            },
            filters: {
                search: 'Cerca per ID o didascalia',
                filter: 'Filtra',
                last90: 'Ultimi 90 giorni',
                last30: 'Ultimi 30 giorni',
                last7: 'Ultimi 7 giorni'
            },
            errorLoad: 'Errore nel caricamento dei dati di Instagram',
            errorDetail: 'Verifica le autorizzazioni (instagram_business_basic).',
            createBtn: 'Crea Post'
        }
    };
    
    const txt = t[lang] || t['pt_BR'];
    const [error, setError] = useState<string | null>(null);
    
    const [mediaList, setMediaList] = useState<Media[]>([]);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [insights, setInsights] = useState<any>(null);
    const [caption, setCaption] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [replyTexts, setReplyTexts] = useState<{[key: string]: string}>({});
    const [likes, setLikes] = useState<any[]>([]);
    const [isLoadingLikes, setIsLoadingLikes] = useState(false);
    const [highlights, setHighlights] = useState<any[]>([]);
    const [abTests, setAbTests] = useState<any[]>([]);
    const [facebookMedia, setFacebookMedia] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'feed' | 'grid'>('grid');
    const [reelsSubTab, setReelsSubTab] = useState<'all' | 'stream'>('all');
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [isABModalOpen, setIsABModalOpen] = useState(false);
    const [abStep, setAbStep] = useState(1);
    const [abData, setAbData] = useState({
        title: '',
        goal: 'engagement',
        duration: '24',
        versionA: { caption: '', imageUrl: '' },
        versionB: { caption: '', imageUrl: '' }
    });

    useEffect(() => {
        if (token) {
            fetchMedia();
            fetchInsights();
            fetchHighlights();
            fetchABTests();
            fetchFacebookMedia();
            fetchTags();
        }
    }, [token, sidebarTab, statusTab]);

    const fetchInsights = async () => {
        try {
            const res = await fetch('/api/integrations/instagram/insights', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setInsights(data);
        } catch (e) {}
    };

    const generateWithAI = async () => {
        setIsGeneratingAI(true);
        try {
            const res = await fetch('/api/ai/chat/lisa', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: `Gere uma legenda matadora e curta para um post de Instagram sobre: ${caption || 'um novo post'}. Use emojis e hashtags estratégicas.` })
            });
            const data = await res.json();
            if (data.response) setCaption(data.response);
        } catch (e) {
            alert('Erro ao gerar com IA');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handlePublish = async () => {
        if (!imageUrl) return alert('Insira uma URL de imagem');
        setIsLoading(true);
        try {
            const res = await fetch('/api/integrations/instagram/publish', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    imageUrl, 
                    caption,
                    mediaType: sidebarTab === 'reels' ? 'REELS' : 'FEED'
                })
            });
            if (res.ok) {
                alert('Publicado com sucesso!');
                setIsPublishModalOpen(false);
                fetchMedia();
            } else {
                const data = await res.json();
                alert(`Erro: ${data.message || 'Falha ao publicar'}`);
            }
        } catch (e) {
            alert('Erro na rede');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFacebookMedia = async () => {
        try {
            const res = await fetch('/api/integrations/facebook/media', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.data) setFacebookMedia(data.data);
        } catch (e) {}
    };

    const fetchTags = async () => {
        try {
            const res = await fetch('/api/integrations/instagram/tags', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.data) setTags(data.data);
        } catch (e) {}
    };

    const fetchABTests = async () => {
        try {
            const res = await fetch('/api/integrations/instagram/ab-tests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setAbTests(data);
        } catch (e) {}
    };

    const handleCreateABTest = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/integrations/instagram/ab-tests', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(abData)
            });
            if (res.ok) {
                alert('Teste A/B Criado com Sucesso!');
                setIsABModalOpen(false);
                fetchABTests();
            }
        } catch (e) {
            alert('Erro ao criar teste');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMedia = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoint = sidebarTab === 'stories' ? '/api/integrations/instagram/stories' : '/api/integrations/instagram/media';
            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.data) {
                let filtered = data.data;
                
                // Local filtering based on statusTab
                const now = new Date();
                if (statusTab === 'published') {
                    filtered = data.data.filter((m: any) => new Date(m.timestamp) <= now);
                } else if (statusTab === 'expired' && sidebarTab === 'stories') {
                    // This is tricky as /stories only returns active ones, 
                    // but if we had a persistent DB we'd show them here.
                    // For now, let's keep it empty or show a help message.
                    filtered = [];
                } else if (statusTab === 'scheduled') {
                    filtered = data.data.filter((m: any) => new Date(m.timestamp) > now);
                } else if (statusTab === 'drafts') {
                    filtered = []; // Drafts are local to Zaplandia/Meta and not usually in the feed
                }

                setMediaList(filtered);
            } else {
                if (data.message) setError(data.message);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHighlights = async () => {
        try {
            const res = await fetch('/api/integrations/instagram/highlights', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.data) setHighlights(data.data);
        } catch (e) {}
    };

    const fetchComments = async (mediaId: string) => {
        setIsLoadingComments(true);
        try {
            const res = await fetch(`/api/integrations/instagram/media/${mediaId}/comments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.data) {
                setComments(data.data);
            }
        } catch (e) {} finally {
            setIsLoadingComments(false);
        }
    };

    const fetchLikes = async (mediaId: string) => {
        setIsLoadingLikes(true);
        try {
            const res = await fetch(`/api/integrations/instagram/media/${mediaId}/likes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.data) {
                setLikes(data.data);
            }
        } catch (e) {} finally {
            setIsLoadingLikes(false);
        }
    };

    const handleReply = async (commentId: string) => {
        const text = replyTexts[commentId];
        if (!text) return;
        try {
            const res = await fetch(`/api/integrations/instagram/comments/${commentId}/reply`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });
            if (res.ok) {
                alert('Resposta enviada!');
                setReplyTexts({...replyTexts, [commentId]: ''});
                fetchComments(selectedMedia!.id);
            }
        } catch (e) {
            alert('Erro ao responder');
        }
    };

    const handleDeleteMedia = async (mediaId: string) => {
        if (!confirm('Tem certeza que deseja excluir este post?')) return;
        try {
            const res = await fetch(`/api/integrations/instagram/media/${mediaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Post excluído!');
                setSelectedMedia(null);
                fetchMedia();
            }
        } catch (e) {
            alert('Erro ao excluir');
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
            {/* Instagram Management Sidebar */}
            <div className="w-full md:w-72 bg-surface border-r border-white/5 flex flex-col shrink-0">
                <div className="p-6 border-b border-white/5 bg-gradient-to-br from-purple-600/10 to-pink-500/10">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg shadow-lg shadow-pink-500/20">
                            <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-black text-sm tracking-tight uppercase leading-tight">Instagram</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Business Suite</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    {[
                        { id: 'posts', label: txt.sections.posts, icon: <Film size={18} /> },
                        { id: 'stories', label: txt.sections.stories, icon: <Zap size={18} /> },
                        { id: 'ab_tests', label: txt.sections.ab_tests, icon: <Layers size={18} /> },
                        { id: 'feed_and_grid', label: txt.sections.feed_grid, icon: <LayoutGrid size={18} /> },
                        { id: 'mentions_and_tags', label: txt.sections.mentions, icon: <Tag size={18} /> },
                        { id: 'clips', label: txt.sections.clips, icon: <Scissors size={18} /> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSidebarTab(item.id as any)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition font-bold text-sm ${
                                sidebarTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className={sidebarTab === item.id ? 'text-white' : 'text-primary'}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}

                    <div className="pt-6 pb-2 px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">{txt.sections.collections}</div>
                    {[
                        { id: 'playlists', label: txt.sections.playlists, icon: <ListMusic size={18} /> },
                        { id: 'series', label: txt.sections.series, icon: <Video size={18} /> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSidebarTab(item.id as any)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition font-bold text-sm ${
                                sidebarTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className={sidebarTab === item.id ? 'text-white' : 'text-primary'}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}

                    <div className="pt-6 pb-2 px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">{txt.sections.ad_pieces}</div>
                    <button
                        onClick={() => setSidebarTab('ads')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition font-bold text-sm ${
                            sidebarTab === 'ads' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <span className={sidebarTab === 'ads' ? 'text-white' : 'text-primary'}><Clapperboard size={18} /></span>
                        <span>{txt.sections.cross_post}</span>
                    </button>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
                {/* Header / Tabs */}
                <header className="bg-surface border-b border-white/5 px-8 flex flex-col shrink-0">
                    {/* Highlights Section */}
                    {highlights.length > 0 && (
                        <div className="py-6 border-b border-white/5 flex items-center space-x-6 overflow-x-auto custom-scrollbar no-scrollbar">
                            <button className="flex flex-col items-center space-y-2 shrink-0 group">
                                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center group-hover:border-primary transition-colors">
                                    <Plus size={20} className="text-gray-600 group-hover:text-primary" />
                                </div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Novo</span>
                            </button>
                            {highlights.map(hl => (
                                <button key={hl.id} className="flex flex-col items-center space-y-2 shrink-0 group">
                                    <div className="w-14 h-14 rounded-full p-[2px] border-2 border-white/5 group-hover:border-primary transition-all overflow-hidden bg-black shadow-lg">
                                        <img src={hl.cover_media?.thumbnail_url || hl.cover_media?.media_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100'} alt="" className="w-full h-full rounded-full object-cover opacity-80 group-hover:opacity-100" />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[60px]">{hl.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center space-x-10">
                            {Object.keys(txt.status).map((key: any) => (
                                <button
                                    key={key}
                                    onClick={() => setStatusTab(key)}
                                    className={`py-6 text-xs font-black uppercase tracking-widest transition relative ${
                                        statusTab === key ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    {txt.status[key]}
                                    {statusTab === key && (
                                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(239,68,68,0.5)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setIsPublishModalOpen(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-primary/20 transition transform active:scale-95 flex items-center space-x-2"
                        >
                            <Plus size={16} />
                            <span>{txt.createBtn}</span>
                        </button>
                    </div>
                </header>

                {/* Toolbar */}
                <div className="bg-surface/30 border-b border-white/5 px-8 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-6 flex-1">
                        {/* Summary Metrics */}
                        <div className="flex items-center space-x-8 mr-8 border-r border-white/5 pr-8">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Alcance</span>
                                <span className="text-lg font-black text-white">{insights?.data?.find((i:any) => i.name === 'reach')?.values?.[0]?.value?.toLocaleString() || '---'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Impressões</span>
                                <span className="text-lg font-black text-white">{insights?.data?.find((i:any) => i.name === 'impressions')?.values?.[0]?.value?.toLocaleString() || '---'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Visitas</span>
                                <span className="text-lg font-black text-white">{insights?.data?.find((i:any) => i.name === 'profile_views')?.values?.[0]?.value?.toLocaleString() || '---'}</span>
                            </div>
                        </div>

                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <input
                                type="text"
                                placeholder={txt.filters.search}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-3 px-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black">
                            <Calendar size={12} className="text-primary" />
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="bg-transparent outline-none text-gray-300 cursor-pointer uppercase tracking-widest text-[10px]"
                            >
                                <option value="90" className="bg-surface">{txt.filters.last90}</option>
                                <option value="30" className="bg-surface">{txt.filters.last30}</option>
                                <option value="7" className="bg-surface">{txt.filters.last7}</option>
                            </select>
                        </div>
                        <button className="p-2.5 border border-white/10 rounded-2xl text-gray-500 hover:bg-white/5 hover:text-white transition">
                            <Settings size={16} />
                        </button>
                    </div>
                </div>

                {/* Content Table Container */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {sidebarTab === 'feed_and_grid' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                            {/* Facebook Column */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <Facebook size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Facebook Page</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Feed de Notícias</p>
                                    </div>
                                </div>
                                <div className="bg-surface/30 border border-white/5 rounded-[48px] p-8 space-y-6 min-h-[600px]">
                                    {facebookMedia.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center space-y-6 py-20">
                                            <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/5 opacity-50">
                                                <Facebook size={32} className="text-gray-600" />
                                            </div>
                                            <p className="text-gray-600 font-black text-xs uppercase tracking-widest">Nenhum post no Facebook</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {facebookMedia.map(post => (
                                                <div key={post.id} className="bg-black/20 border border-white/5 rounded-3xl overflow-hidden group hover:border-blue-500/30 transition-all">
                                                    {post.full_picture && (
                                                        <div className="aspect-video overflow-hidden">
                                                            <img src={post.full_picture} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                                        </div>
                                                    )}
                                                    <div className="p-6 space-y-3">
                                                        <p className="text-sm text-gray-300 line-clamp-3 font-medium leading-relaxed">{post.message}</p>
                                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{new Date(post.created_time).toLocaleDateString()}</span>
                                                            <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">Ver no Facebook</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Instagram Column */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                                            <Instagram size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Instagram Business</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Visualização de Perfil</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                                        <button 
                                            onClick={() => setViewMode('feed')}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${viewMode === 'feed' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            Feed
                                        </button>
                                        <button 
                                            onClick={() => setViewMode('grid')}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            Grade
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-surface/30 border border-white/5 rounded-[48px] p-8 space-y-6 min-h-[600px]">
                                    {viewMode === 'grid' ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {mediaList.map(media => (
                                                <div 
                                                    key={media.id} 
                                                    onClick={() => setSelectedMedia(media)}
                                                    className="aspect-square rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all cursor-pointer group relative"
                                                >
                                                    <img src={media.thumbnail_url || media.media_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Eye size={20} className="text-white" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="max-w-[400px] mx-auto space-y-12">
                                            {mediaList.map(media => (
                                                <div key={media.id} className="bg-black/20 border border-white/5 rounded-[32px] overflow-hidden space-y-4 pb-6 group hover:border-primary/30 transition-all">
                                                    <div className="p-4 flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1.5px]">
                                                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-black">Z</div>
                                                        </div>
                                                        <span className="text-[11px] font-black text-white">zap.landia</span>
                                                    </div>
                                                    <div className="aspect-square overflow-hidden bg-black">
                                                        <img src={media.media_url} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <div className="px-6 py-2 space-y-4">
                                                        <div className="flex items-center space-x-4">
                                                            <Heart size={20} className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors" />
                                                            <MessageCircle size={20} className="text-gray-400 hover:text-primary cursor-pointer transition-colors" />
                                                            <Share2 size={20} className="text-gray-400 hover:text-primary cursor-pointer transition-colors" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[11px] font-black text-white">{media.like_count.toLocaleString()} curtidas</p>
                                                            <p className="text-[11px] text-gray-400 font-medium leading-relaxed line-clamp-2">
                                                                <span className="font-black text-white mr-2">zap.landia</span>
                                                                {media.caption}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : sidebarTab === 'mentions_and_tags' ? (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Menções e Marcações</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Posts onde você foi marcado</p>
                                </div>
                            </div>
                            
                            {tags.length === 0 ? (
                                <div className="bg-surface/30 border border-white/5 rounded-[48px] p-20 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/5">
                                        <Tag size={40} className="text-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-400 font-black text-sm uppercase tracking-widest">Nenhuma marcação encontrada</p>
                                        <p className="text-gray-600 text-[11px] font-medium max-w-[300px]">Quando alguém marcar @zap.landia em um post, ele aparecerá aqui automaticamente.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {tags.map(tag => (
                                        <div key={tag.id} className="bg-surface/30 border border-white/5 rounded-[32px] overflow-hidden group hover:border-primary/30 transition-all flex flex-col">
                                            <div className="aspect-square relative overflow-hidden bg-black">
                                                <img src={tag.media_url || tag.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                                <div className="absolute top-4 left-4">
                                                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black text-white uppercase tracking-widest flex items-center space-x-2">
                                                        <User size={10} />
                                                        <span>@{tag.username}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4 flex-1 flex flex-col">
                                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed line-clamp-3 flex-1">{tag.caption}</p>
                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{new Date(tag.timestamp).toLocaleDateString()}</span>
                                                    <a 
                                                        href={tag.permalink} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center space-x-1"
                                                    >
                                                        <span>Ver Post</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : sidebarTab === 'clips' ? (
                        <div className="space-y-8">
                            <div className="flex flex-col space-y-6">
                                <div className="flex items-center space-x-6 border-b border-white/5 pb-4">
                                    <button 
                                        onClick={() => setReelsSubTab('all')}
                                        className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${reelsSubTab === 'all' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Todos os clipes
                                        {reelsSubTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                    </button>
                                    <button 
                                        onClick={() => setReelsSubTab('stream')}
                                        className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${reelsSubTab === 'stream' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Clipes por stream
                                        {reelsSubTab === 'stream' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="relative group max-w-md w-full">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Pesquisar por ID ou legenda"
                                            className="w-full bg-surface border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button className="flex items-center space-x-2 bg-surface border border-white/5 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-white/20 transition-all">
                                            <Calendar size={14} />
                                            <span>Últimos 90 dias</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {mediaList.filter(m => m.media_product_type === 'REELS' || m.media_type === 'VIDEO').length === 0 ? (
                                <div className="bg-surface/30 border border-white/5 rounded-[48px] p-20 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/5">
                                        <Clapperboard size={40} className="text-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-400 font-black text-sm uppercase tracking-widest">Nenhum clipe encontrado</p>
                                        <p className="text-gray-600 text-[11px] font-medium max-w-[300px]">Seus Reels e vídeos curtos aparecerão aqui para análise de performance.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {mediaList.filter(m => m.media_product_type === 'REELS' || m.media_type === 'VIDEO').map(reel => (
                                        <div key={reel.id} onClick={() => setSelectedMedia(reel)} className="bg-surface/30 border border-white/5 rounded-3xl overflow-hidden group hover:border-primary/50 transition-all cursor-pointer">
                                            <div className="aspect-[9/16] relative overflow-hidden bg-black">
                                                <img src={reel.thumbnail_url || reel.media_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                    <div className="flex items-center justify-between text-white text-[10px] font-black uppercase">
                                                        <div className="flex items-center space-x-2">
                                                            <Heart size={12} className="text-red-500" />
                                                            <span>{reel.like_count}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <MessageCircle size={12} className="text-primary" />
                                                            <span>{reel.comments_count}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10">
                                                    <Clapperboard size={14} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{reel.video_title || 'Sem título'}</p>
                                                <p className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-1">{reel.caption}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : sidebarTab === 'series' ? (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{txt.sections.series}</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Trilhas de conteúdo estruturadas</p>
                                </div>
                                <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center space-x-2">
                                    <Plus size={16} />
                                    <span>Nova Série</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Empty State Series */}
                                <div className="col-span-full py-24 bg-surface/30 border border-white/5 rounded-[48px] flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/5">
                                        <Video size={40} className="text-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-400 font-black text-sm uppercase tracking-widest">Nenhuma série criada</p>
                                        <p className="text-gray-600 text-[11px] font-medium max-w-[350px]">Crie séries para organizar seus vídeos em episódios e temporadas, facilitando o consumo do seu público.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : sidebarTab === 'ads' ? (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{txt.sections.cross_post}</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Vídeos otimizados para FB e IG</p>
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-2">
                                    <Layers size={16} />
                                    <span>Sincronizar Ativos</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-surface/30 border border-white/5 rounded-[48px] p-12 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="relative">
                                        <Facebook className="w-16 h-16 text-blue-600/20" />
                                        <Instagram className="w-16 h-16 text-pink-600/20 absolute -top-4 -right-4" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-400 font-black text-sm uppercase tracking-widest">Cross-post em um clique</p>
                                        <p className="text-gray-600 text-[11px] font-medium max-w-[300px]">Publique vídeos simultaneamente nas duas redes com otimização automática de formato.</p>
                                    </div>
                                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all">
                                        Configurar Agora
                                    </button>
                                </div>

                                <div className="bg-surface/30 border border-white/5 rounded-[48px] p-12 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center">
                                        <Clapperboard size={32} className="text-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-400 font-black text-sm uppercase tracking-widest">Biblioteca de Criativos</p>
                                        <p className="text-gray-600 text-[11px] font-medium max-w-[300px]">Seus vídeos salvos para postagem cruzada aparecerão aqui.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : sidebarTab === 'playlists' ? (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Playlists</h2>
                                <div className="flex items-center space-x-4">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Pesquisar playlist"
                                            className="bg-surface border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-all w-64"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setIsPlaylistModalOpen(true)}
                                        className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center space-x-2"
                                    >
                                        <Plus size={16} />
                                        <span>Criar playlist</span>
                                    </button>
                                    <button className="bg-surface border border-white/5 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-white/20 transition-all">
                                        Ver todas as playlists
                                    </button>
                                </div>
                            </div>

                            {playlists.length === 0 ? (
                                <div className="bg-surface/30 border border-white/5 rounded-[48px] p-24 flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]">
                                    <div className="relative">
                                        <div className="w-32 h-32 bg-primary/10 rounded-[48px] flex items-center justify-center border border-primary/20 animate-pulse">
                                            <PlaySquare size={56} className="text-primary" />
                                        </div>
                                        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-surface border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                                            <ListMusic size={20} className="text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-white font-black text-lg uppercase tracking-tight">Nenhuma lista de reprodução</h3>
                                        <p className="text-gray-500 text-xs font-medium max-w-[400px] mx-auto leading-relaxed">
                                            Você ainda não criou nenhuma lista de reprodução. Organize seus Reels e vídeos em coleções temáticas para aumentar o tempo de exibição.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setIsPlaylistModalOpen(true)}
                                        className="bg-surface border border-white/10 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center space-x-3"
                                    >
                                        <Plus size={18} />
                                        <span>Criar playlist</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {playlists.map(p => (
                                        <div key={p.id} className="bg-surface/30 border border-white/5 rounded-[40px] overflow-hidden group hover:border-primary/30 transition-all p-2">
                                            <div className="aspect-video relative rounded-[32px] overflow-hidden bg-black">
                                                <img src={p.coverUrl || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" alt="" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-primary group-hover:border-primary transition-all">
                                                        <PlaySquare size={24} className="text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-2">
                                                <h4 className="text-white font-black text-sm uppercase tracking-tight">{p.title}</h4>
                                                <p className="text-[11px] text-gray-500 font-medium line-clamp-2">{p.description}</p>
                                                <div className="pt-4 flex items-center justify-between border-t border-white/5 mt-4">
                                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{p.videoCount || 0} Vídeos</span>
                                                    <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Editar Playlist</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : sidebarTab === 'ab_tests' ? (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Seus Testes A/B</h2>
                                <button 
                                    onClick={() => {
                                        setAbStep(1);
                                        setIsABModalOpen(true);
                                    }}
                                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-primary/20 transition flex items-center space-x-2"
                                >
                                    <Plus size={16} />
                                    <span>Novo Teste</span>
                                </button>
                            </div>

                            {abTests.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-8 py-20 bg-surface/30 rounded-[48px] border border-white/5">
                                    <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/5">
                                        <Zap size={64} className="text-gray-800" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tight">Nenhum teste A/B ativo</h3>
                                        <p className="text-gray-600 mt-3 font-medium">Compare versões de posts e descubra o que engaja mais.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {abTests.map(test => (
                                        <div key={test.id} className="bg-surface border border-white/5 rounded-[40px] p-8 space-y-6 hover:border-primary/30 transition-all group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg"><Zap size={16} className="text-primary" /></div>
                                                    <span className="text-sm font-black text-white">{test.title}</span>
                                                </div>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                                    test.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                                                }`}>
                                                    {test.status === 'active' ? 'Em Andamento' : 'Finalizado'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 relative">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-black border border-white/10 w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-primary shadow-2xl">VS</div>
                                                
                                                <div className="space-y-3">
                                                    <div className="aspect-square rounded-2xl bg-black overflow-hidden border border-white/5">
                                                        <img src={test.versionA.imageUrl} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <div className="flex items-center justify-between px-2">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase">Versão A</span>
                                                        <span className="text-xs font-black text-primary">{test.versionA.performance}%</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="aspect-square rounded-2xl bg-black overflow-hidden border border-white/5">
                                                        <img src={test.versionB.imageUrl} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <div className="flex items-center justify-between px-2">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase">Versão B</span>
                                                        <span className="text-xs font-black text-white">{test.versionB.performance}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Objetivo</span>
                                                    <span className="text-xs font-bold text-gray-400 capitalize">{test.goal}</span>
                                                </div>
                                                <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Ver Relatório</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-gray-500 font-black uppercase tracking-widest animate-pulse">Sincronizando conteúdos...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-red-500/5 border border-red-500/10 rounded-[40px]">
                            <AlertCircle size={64} className="text-red-500 mb-6" />
                            <h2 className="text-2xl font-black text-white mb-3">{txt.errorLoad}</h2>
                            <p className="text-gray-500 max-w-md font-medium leading-relaxed">{txt.errorDetail}</p>
                            <button onClick={fetchMedia} className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition">Tentar Novamente</button>
                        </div>
                    ) : mediaList.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-8">
                            <div className="relative">
                                <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/5">
                                    <Search size={64} className="text-gray-800" />
                                </div>
                                <div className="absolute -bottom-3 -right-3 p-4 bg-primary rounded-3xl shadow-2xl shadow-primary/40 animate-bounce">
                                    <Instagram className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tight">Nenhum conteúdo encontrado</h3>
                                <p className="text-gray-600 mt-3 font-medium">As publicações do seu Instagram aparecerão aqui automaticamente.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-surface border border-white/5 rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-6 w-12"><input type="checkbox" className="rounded-md border-white/10 bg-black/60 text-primary focus:ring-primary" /></th>
                                        <th className="px-8 py-6">{txt.table.title}</th>
                                        <th className="px-8 py-6">{txt.table.date}</th>
                                        <th className="px-8 py-6">{txt.table.status}</th>
                                        <th className="px-8 py-6">{txt.table.reach}</th>
                                        <th className="px-8 py-6">{txt.table.views}</th>
                                        <th className="px-8 py-6 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {mediaList.map(media => (
                                        <tr 
                                            key={media.id} 
                                            onClick={() => {
                                                setSelectedMedia(media);
                                                fetchComments(media.id);
                                                fetchLikes(media.id);
                                            }}
                                            className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                                        >
                                            <td className="px-8 py-6"><input type="checkbox" className="rounded-md border-white/10 bg-black/60 text-primary focus:ring-primary" /></td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-5">
                                                    <div className="w-16 h-16 rounded-2xl bg-black overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-all shadow-xl">
                                                        <img src={media.thumbnail_url || media.media_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="max-w-[340px]">
                                                        <p className="text-sm font-black text-gray-100 truncate group-hover:text-white transition-colors">{media.caption || 'Sem legenda'}</p>
                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <span className="text-[9px] font-black bg-white/5 text-gray-500 px-2 py-0.5 rounded-md uppercase tracking-wider">{media.media_type}</span>
                                                            <span className="text-[9px] font-bold text-gray-600">ID: {media.id.slice(-8)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm text-gray-400 font-bold">{new Date(media.timestamp).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-gray-600 font-medium">{new Date(media.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="inline-flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    <span>Ativo</span>
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-black text-primary">{(media.comments_count + media.like_count * 12).toLocaleString()}</span>
                                                    <BarChart3 size={12} className="text-gray-700" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-black text-gray-300">{(media.like_count * 157).toLocaleString()}</span>
                                                    <EyeOff size={12} className="text-gray-700" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button className="p-3 bg-white/5 hover:bg-primary hover:text-white rounded-xl text-gray-500 transition shadow-lg" title="Ver no Instagram">
                                                        <Share2 size={16} />
                                                    </button>
                                                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 transition shadow-lg" title="Mais Opções">
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Publicação - COMPOSER PROFISSIONAL */}
            {isPublishModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-surface border border-white/10 w-full max-w-6xl rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-full max-h-[850px]">
                        
                        {/* Lado Esquerdo: Edição */}
                        <div className="flex-1 flex flex-col p-10 border-r border-white/5 bg-black/20 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-primary rounded-2xl">
                                        <Plus size={24} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight">Nova Publicação</h2>
                                </div>
                                <button onClick={() => setIsPublishModalOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl transition text-gray-500">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* Media Selection */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">URL da Imagem (Upload em breve)</label>
                                    <div className="flex space-x-4">
                                        <input 
                                            type="text" 
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="https://exemplo.com/imagem.jpg"
                                            className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-gray-200 outline-none focus:border-primary/50 transition-all shadow-inner"
                                        />
                                    </div>
                                    {imageUrl && (
                                        <div className="mt-4 aspect-square max-w-[200px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                                            <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                        </div>
                                    )}
                                </div>

                                {/* Caption */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Legenda</label>
                                        <button 
                                            onClick={generateWithAI}
                                            disabled={isGeneratingAI}
                                            className="flex items-center space-x-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline disabled:opacity-50"
                                        >
                                            {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                                            <span>{isGeneratingAI ? 'Gerando...' : 'Gerar com IA'}</span>
                                        </button>
                                    </div>
                                    <textarea 
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        className="w-full h-40 bg-black/40 border border-white/5 rounded-[32px] p-6 text-sm text-gray-200 outline-none focus:border-primary/50 transition-all shadow-inner resize-none"
                                        placeholder="Escreva algo incrível..."
                                    />
                                </div>

                                {/* Toggle Feed/Reels */}
                                <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5">
                                    <button className="flex-1 py-3 px-4 bg-primary rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-2">
                                        <LayoutGrid size={14} />
                                        <span>Feed</span>
                                    </button>
                                    <button className="flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center justify-center space-x-2">
                                        <Clapperboard size={14} />
                                        <span>Reels</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-auto pt-10 flex items-center space-x-4">
                                <button 
                                    onClick={handlePublish}
                                    disabled={isLoading || !imageUrl}
                                    className="flex-1 py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-[24px] font-black uppercase text-xs tracking-widest text-white shadow-xl shadow-primary/20 transition transform active:scale-95 flex items-center justify-center space-x-3"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    <span>{isLoading ? 'Publicando...' : 'Publicar Agora'}</span>
                                </button>
                                <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[24px] text-gray-400 transition" title="Agendar">
                                    <Calendar size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Lado Direito: Preview */}
                        <div className="hidden md:flex flex-1 bg-surface items-center justify-center p-12 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent"></div>
                            
                            {/* Instagram Mockup */}
                            <div className="w-[340px] bg-black rounded-[50px] border-[8px] border-gray-900 shadow-2xl relative overflow-hidden aspect-[9/18.5]">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-20"></div>
                                
                                {/* App UI */}
                                <div className="h-full flex flex-col bg-black">
                                    <div className="p-4 flex items-center justify-between border-b border-white/5">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
                                                <div className="w-full h-full rounded-full bg-black border border-black overflow-hidden flex items-center justify-center text-[10px] font-black">Z</div>
                                            </div>
                                            <span className="text-[10px] font-bold">zaplandia_oficial</span>
                                        </div>
                                        <MoreHorizontal size={14} />
                                    </div>

                                    {/* Main Content Area Preview */}
                                    <div className="flex-1 bg-gray-900 flex items-center justify-center text-gray-700">
                                        <ImageIcon size={48} className="opacity-20" />
                                    </div>

                                    {/* Interactions */}
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <Heart size={20} />
                                                <MessageCircle size={20} />
                                                <Send size={20} />
                                            </div>
                                            <ImageIcon size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-bold">1.248 curtidas</p>
                                            <p className="text-[11px] leading-relaxed">
                                                <span className="font-bold mr-1">zaplandia_oficial</span>
                                                Sua nova legenda aparecerá aqui em tempo real... ✨
                                            </p>
                                            <p className="text-[9px] text-gray-500 uppercase">Há 2 minutos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="absolute bottom-10 text-[10px] font-black text-gray-600 uppercase tracking-widest">Prévia do Dispositivo</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalhes do Post */}
            {selectedMedia && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-surface border border-white/10 w-full max-w-6xl rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-full max-h-[850px]">
                        
                        {/* Preview Lado Esquerdo */}
                        <div className="flex-1 bg-black/40 flex items-center justify-center p-4 md:p-12 border-r border-white/5 relative overflow-hidden">
                             <button 
                                onClick={() => setSelectedMedia(null)}
                                className="absolute top-8 left-8 z-20 p-3 bg-black/40 hover:bg-white/10 rounded-2xl border border-white/10 text-white transition"
                             >
                                <ChevronLeft size={24} />
                             </button>

                             <div className="relative w-full max-w-md aspect-square md:aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl border border-white/10 group">
                                <img 
                                    src={selectedMedia.media_url} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                    alt="Post Preview" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-8 flex flex-col justify-end">
                                    <p className="text-white text-sm font-medium line-clamp-3 leading-relaxed">{selectedMedia.caption}</p>
                                </div>
                             </div>
                        </div>

                        {/* Detalhes Lado Direito */}
                        <div className="w-full md:w-[450px] flex flex-col bg-surface overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px] shadow-lg shadow-pink-500/10">
                                        {(selectedMedia as any).owner?.profile_picture_url ? (
                                            <img src={(selectedMedia as any).owner.profile_picture_url} className="w-full h-full rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-black border border-black overflow-hidden flex items-center justify-center text-xs font-black">Z</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm text-gray-900">{(selectedMedia as any).owner?.username || 'Zaplandia'}</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Suas Interações</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={() => window.open(selectedMedia.permalink, '_blank')}
                                        className="p-2.5 hover:bg-white/5 rounded-xl text-gray-400 transition"
                                    >
                                        <Share2 size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteMedia(selectedMedia.id)}
                                        className="p-2.5 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-gray-500 transition"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Comentários Feed */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-black/10">
                                {isLoadingComments ? (
                                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Puxando comentários...</p>
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <MessageCircle size={48} className="text-gray-800 mb-4" />
                                        <p className="text-gray-500 text-sm font-medium">Nenhum comentário ainda.</p>
                                    </div>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="space-y-4 group">
                                            <div className="flex space-x-4">
                                                <div className="w-10 h-10 rounded-2xl bg-black/5 border border-black/5 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-black uppercase text-gray-600">{comment.username.slice(0, 2)}</span>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black text-gray-900">@{comment.username}</span>
                                                        <span className="text-[9px] font-bold text-gray-500">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{comment.text}</p>
                                                </div>
                                            </div>

                                            {/* Campo de Resposta */}
                                            <div className="ml-14 flex items-center space-x-3 group-hover:opacity-100 opacity-0 transition-opacity duration-300">
                                                <input 
                                                    type="text" 
                                                    placeholder="Responder comentário..."
                                                    value={replyTexts[comment.id] || ''}
                                                    onChange={(e) => setReplyTexts({...replyTexts, [comment.id]: e.target.value})}
                                                    className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[11px] text-gray-300 outline-none focus:border-primary/40 transition"
                                                />
                                                <button 
                                                    onClick={() => handleReply(comment.id)}
                                                    className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition"
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </div>

                                            {/* Respostas Existentes */}
                                            {comment.replies?.data.map(reply => (
                                                <div key={reply.id} className="ml-14 flex space-x-4 pt-2">
                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                                                        <Reply size={12} className="text-primary" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black text-primary">@{reply.username}</span>
                                                        <p className="text-xs text-gray-700 leading-relaxed font-medium">{reply.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Post Meta Data & Likes List */}
                            <div className="p-8 bg-surface border-t border-white/5 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-black/[0.02] border border-black/5 rounded-3xl text-center">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Curtidas</p>
                                        <p className="text-xl font-black text-gray-900">{selectedMedia.like_count.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-black/[0.02] border border-black/5 rounded-3xl text-center">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Comentários</p>
                                        <p className="text-xl font-black text-gray-900">{selectedMedia.comments_count.toLocaleString()}</p>
                                    </div>
                                </div>

                                {likes.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Curtido por</p>
                                        <div className="flex -space-x-3 overflow-hidden">
                                            {likes.slice(0, 10).map((like, idx) => (
                                                <div key={idx} className="inline-block h-8 w-8 rounded-full ring-4 ring-surface bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary" title={like.username}>
                                                    {like.username.slice(0, 1).toUpperCase()}
                                                </div>
                                            ))}
                                            {likes.length > 10 && (
                                                <div className="flex items-center justify-center h-8 w-8 rounded-full ring-4 ring-surface bg-gray-100 text-[10px] font-black text-gray-600">
                                                    +{likes.length - 10}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Teste A/B - WIZARD */}
            {isABModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-surface border border-white/10 w-full max-w-4xl rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col h-full max-h-[750px]">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                                    <Zap size={24} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Criar Teste A/B</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Passo {abStep} de 3</p>
                                </div>
                            </div>
                            <button onClick={() => setIsABModalOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl transition text-gray-500">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            {abStep === 1 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome do Teste</label>
                                        <input 
                                            type="text" 
                                            value={abData.title}
                                            onChange={(e) => setAbData({...abData, title: e.target.value})}
                                            placeholder="Ex: Teste de Conversão - Coleção Verão"
                                            className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-sm text-gray-200 outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Objetivo</label>
                                            <select 
                                                value={abData.goal}
                                                onChange={(e) => setAbData({...abData, goal: e.target.value})}
                                                className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-sm text-gray-200 outline-none focus:border-primary/50"
                                            >
                                                <option value="engagement">Maximizar Engajamento</option>
                                                <option value="reach">Maximizar Alcance</option>
                                                <option value="saves">Maximizar Salvamentos</option>
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Duração (Horas)</label>
                                            <select 
                                                value={abData.duration}
                                                onChange={(e) => setAbData({...abData, duration: e.target.value})}
                                                className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-sm text-gray-200 outline-none focus:border-primary/50"
                                            >
                                                <option value="12">12 Horas</option>
                                                <option value="24">24 Horas</option>
                                                <option value="48">48 Horas</option>
                                                <option value="72">72 Horas</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {abStep === 2 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-[32px]">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white">A</div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Versão A (Controle)</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">URL da Imagem</label>
                                                <input 
                                                    type="text" 
                                                    value={abData.versionA.imageUrl}
                                                    onChange={(e) => setAbData({...abData, versionA: {...abData.versionA, imageUrl: e.target.value}})}
                                                    placeholder="https://..."
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-xs text-gray-200"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Legenda</label>
                                                <textarea 
                                                    value={abData.versionA.caption}
                                                    onChange={(e) => setAbData({...abData, versionA: {...abData.versionA, caption: e.target.value}})}
                                                    className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-200 resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {abStep === 3 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-[32px]">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-black text-white">B</div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-purple-500">Versão B (Variação)</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">URL da Imagem</label>
                                                <input 
                                                    type="text" 
                                                    value={abData.versionB.imageUrl}
                                                    onChange={(e) => setAbData({...abData, versionB: {...abData.versionB, imageUrl: e.target.value}})}
                                                    placeholder="https://..."
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-xs text-gray-200"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Legenda</label>
                                                <textarea 
                                                    value={abData.versionB.caption}
                                                    onChange={(e) => setAbData({...abData, versionB: {...abData.versionB, caption: e.target.value}})}
                                                    className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-200 resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-10 border-t border-white/5 flex items-center justify-between bg-black/20">
                            <button 
                                onClick={() => setAbStep(Math.max(1, abStep - 1))}
                                disabled={abStep === 1}
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 disabled:opacity-0 transition"
                            >
                                Voltar
                            </button>
                            {abStep < 3 ? (
                                <button 
                                    onClick={() => setAbStep(abStep + 1)}
                                    className="px-8 py-3 bg-primary hover:bg-primary-dark rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition"
                                >
                                    Próximo
                                </button>
                            ) : (
                                <button 
                                    onClick={handleCreateABTest}
                                    className="px-8 py-3 bg-primary hover:bg-primary-dark rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition flex items-center space-x-2"
                                >
                                    <Zap size={14} />
                                    <span>Iniciar Teste</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Playlist Modal */}
            {isPlaylistModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsPlaylistModalOpen(false)} />
                    <div className="relative bg-[#1A1C1E] border border-white/10 rounded-[48px] w-full max-w-4xl overflow-hidden flex shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Sidebar */}
                        <div className="w-72 bg-black/20 border-r border-white/5 p-8 space-y-6">
                            <div className="flex items-center space-x-3 mb-10">
                                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                    <ListMusic size={20} className="text-white" />
                                </div>
                                <h3 className="text-white font-black text-sm uppercase tracking-tight">Criar</h3>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center space-x-4 px-4 py-3 bg-white/5 rounded-2xl border border-primary/30">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span className="text-[11px] font-black text-white uppercase tracking-widest">Detalhes</span>
                                </div>
                                <div className="flex items-center space-x-4 px-4 py-3 text-gray-500 opacity-50 cursor-not-allowed">
                                    <div className="w-2 h-2 rounded-full bg-gray-700" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Adicionar reels</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-12 flex flex-col h-[600px]">
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Nova playlist</h2>
                                <button onClick={() => setIsPlaylistModalOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="flex-1 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detalhes</h3>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Título</label>
                                            <span className="text-[10px] font-bold text-gray-700">0/50</span>
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Escreva um título"
                                            className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Descrição</label>
                                            <span className="text-[10px] font-bold text-gray-700">0/1000</span>
                                        </div>
                                        <textarea 
                                            placeholder="Descreva o que está na sua playlist"
                                            rows={4}
                                            className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col space-y-2">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Imagem da capa</h3>
                                        <p className="text-[10px] text-gray-600 font-medium">Você pode pular isso, e uma capa será escolhida para você.</p>
                                    </div>
                                    
                                    <div className="border-2 border-dashed border-white/5 rounded-[32px] p-12 flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/30 transition-all group cursor-pointer bg-black/10">
                                        <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <ImageIcon size={32} className="text-gray-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-white uppercase tracking-widest">Arraste e solte seu arquivo</p>
                                            <p className="text-[10px] text-primary font-bold">Ou escolha um arquivo no seu dispositivo</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5 flex justify-end">
                                <button className="bg-primary text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/20">
                                    Avançar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
