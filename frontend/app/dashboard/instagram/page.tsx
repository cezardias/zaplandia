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
    Zap
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
    
    const [sidebarTab, setSidebarTab] = useState<'posts' | 'stories' | 'reels' | 'ab_tests' | 'feed_grid' | 'mentions' | 'clips' | 'playlists' | 'series' | 'ads'>('posts');
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

    useEffect(() => {
        if (token) {
            fetchMedia();
            fetchInsights();
        }
    }, [token]);

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
                        { id: 'feed_grid', label: txt.sections.feed_grid, icon: <LayoutGrid size={18} /> },
                        { id: 'mentions', label: txt.sections.mentions, icon: <Tag size={18} /> },
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
                    {isLoading ? (
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
                                        <tr key={media.id} className="hover:bg-white/[0.03] transition-colors group cursor-pointer">
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
        </div>
    );
}
