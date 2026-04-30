'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
    BarChart3,
    MessageSquare,
    Users,
    Zap,
    Settings,
    LogOut,
    LayoutDashboard,
    ShieldCheck,
    HelpCircle,
    Smartphone,
    Facebook,
    Menu,
    X,
    Terminal,
    CreditCard,
    AlertCircle,
    FileText,
    Palette,
    MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout, isLoading } = useAuth();
    const { lang, setLang, languages } = useLanguage();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const ZaplandiaLogo = ({ className = "w-8 h-8" }) => (
        <div className={`${className} rounded-full bg-[#ef4444] flex items-center justify-center shadow-lg border border-white/10`}>
            <div className="relative flex items-center justify-center">
                <MessageCircle size={Math.round(parseInt(className.match(/\d+/)?.[0] || '8') * 0.6)} className="text-white fill-white" />
                <span className="absolute font-black text-[#ef4444] mb-[1px]" style={{ fontSize: `${Math.round(parseInt(className.match(/\d+/)?.[0] || '8') * 0.4)}px` }}>Z</span>
            </div>
        </div>
    );

    const t: any = {
        pt_BR: {
            menu: {
                dashboard: 'Painel',
                inbox: 'Omni Inbox',
                ai: 'Assistente IA',
                whatsapp: 'Gestão WhatsApp',
                meta: 'Integração Meta',
                crm: 'Contatos CRM',
                teams: 'Equipes',
                pipeline: 'Funil (Pipeline)',
                settings: 'Configurações',
                payments: 'Pagamentos',
                developer: 'Desenvolvedor',
                help: 'Central de Ajuda',
                terms: 'Termos de Uso'
            },
            trial: 'Seu período de teste (Trial) está ativo. Aproveite todas as funções!',
            logout: 'Sair',
            choosePlan: 'ESCOLHER PLANO',
            userManagement: 'Gestão de Usuários'
        },
        en_US: {
            menu: {
                dashboard: 'Dashboard',
                inbox: 'Omni Inbox',
                ai: 'AI Assistant',
                whatsapp: 'WhatsApp Manager',
                meta: 'Meta API',
                crm: 'Contacts CRM',
                teams: 'Teams',
                pipeline: 'Pipeline',
                settings: 'Settings',
                payments: 'Payments',
                developer: 'Developer',
                help: 'Help Center',
                terms: 'Terms of Use'
            },
            trial: 'Your trial period is active. Enjoy all features!',
            logout: 'Logout',
            choosePlan: 'CHOOSE PLAN',
            userManagement: 'User Management'
        },
        pt_PT: {
            menu: {
                dashboard: 'Painel',
                inbox: 'Omni Inbox',
                ai: 'Assistente IA',
                whatsapp: 'Gestão WhatsApp',
                meta: 'Integração Meta',
                crm: 'Contactos CRM',
                teams: 'Equipas',
                pipeline: 'Funil (Pipeline)',
                settings: 'Configurações',
                payments: 'Pagamentos',
                developer: 'Programador',
                help: 'Central de Ajuda',
                terms: 'Termos de Uso'
            },
            trial: 'O seu período de teste está ativo. Aproveite todas as funções!',
            logout: 'Sair',
            choosePlan: 'ESCOLHER PLANO',
            userManagement: 'Gestão de Utilizadores'
        },
        it_IT: {
            menu: {
                dashboard: 'Dashboard',
                inbox: 'Omni Inbox',
                ai: 'Assistente IA',
                whatsapp: 'Gestione WhatsApp',
                meta: 'Integrazione Meta',
                crm: 'Contatti CRM',
                teams: 'Squadre',
                pipeline: 'Pipeline',
                settings: 'Impostazioni',
                payments: 'Pagamenti',
                developer: 'Sviluppatore',
                help: 'Centro Assistenza',
                terms: 'Termini di Utilizzo'
            },
            trial: 'Il tuo periodo di prova è attivo. Goditi tutte le funzioni!',
            logout: 'Disconnetti',
            choosePlan: 'SCEGLI PIANO',
            userManagement: 'Gestione Utenti'
        }
    };



    // Close mobile menu when pathname changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
            return;
        }

        // Check License Status (except for superadmin and billing/support pages)
        if (user && user.role !== 'superadmin' && !pathname.includes('/billing') && !pathname.includes('/support')) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:3001');
            fetch(`${apiUrl}/api/billing/status`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('zap_token')}` }
            })
            .then(res => res.json())
            .then(status => {
                if (status.isExpired) {
                    router.push('/dashboard/billing');
                }
            })
            .catch(err => console.error('Erro ao validar licença:', err));
        }
    }, [user, isLoading, router, pathname]);

    const menuItems = [
        { name: t[lang].menu.dashboard, icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['superadmin', 'admin', 'user'] },
        { name: t[lang].menu.inbox, icon: <MessageSquare size={20} />, path: '/dashboard/inbox', roles: ['superadmin', 'admin', 'user', 'agent'] },
        { name: t[lang].menu.ai, icon: <Zap size={20} />, path: '/dashboard/ai-assistant', roles: ['superadmin', 'admin', 'user'] },
        { name: t[lang].menu.whatsapp, icon: <Smartphone size={20} />, path: '/dashboard/integrations/whatsapp', roles: ['superadmin', 'admin', 'user'] },
        { name: t[lang].menu.meta, icon: <Facebook size={20} />, path: '/dashboard/integrations/meta', roles: ['superadmin', 'admin', 'user'] },
        { name: t[lang].menu.crm, icon: <Users size={20} />, path: '/dashboard/crm', roles: ['superadmin', 'admin', 'user', 'agent'] },
        { name: t[lang].menu.teams, icon: <Users size={20} />, path: '/dashboard/teams', roles: ['superadmin', 'admin', 'user'] },
        { name: t[lang].menu.pipeline, icon: <BarChart3 size={20} />, path: '/dashboard/crm/kanban', roles: ['superadmin', 'admin', 'user'] },
        { name: t[lang].menu.settings, icon: <Settings size={20} />, path: '/dashboard/integrations', roles: ['superadmin', 'admin', 'user'] },
        { name: t[lang].menu.payments, icon: <CreditCard size={20} />, path: '/dashboard/admin/payments', roles: ['superadmin'] },
        { name: t[lang].menu.developer, icon: <Terminal size={20} />, path: '/dashboard/developer', roles: ['superadmin', 'admin', 'user'] },
        { name: t[lang].menu.help, icon: <HelpCircle size={20} />, path: '/dashboard/support', roles: ['superadmin', 'admin', 'user', 'agent'] },
        { name: t[lang].menu.terms, icon: <FileText size={20} />, path: '/dashboard/terms', roles: ['superadmin', 'admin', 'user', 'agent'] },
    ];


    const filteredMenuItems = menuItems.filter(item => 
        !item.roles || item.roles.includes(user?.role || '')
    );

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <Zap className="w-12 h-12 text-primary animate-pulse" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex h-screen bg-background overflow-hidden text-white relative">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-white/5 flex items-center justify-between px-6 z-40">
                <div className="flex items-center space-x-2">
                    <ZaplandiaLogo className="w-6 h-6" />
                    <span className="text-lg font-bold tracking-tight">ZAPLANDIA</span>
                </div>
                <div className="flex items-center space-x-3">
                    {user?.email === 'cezar.dias@gmail.com' && (
                        <button onClick={toggleTheme} className="p-2 hover:bg-white/5 rounded-xl transition" title="Alternar Tema">
                            <Palette size={20} className={theme === 'light-red' ? 'text-red-500' : 'text-primary'} />
                        </button>
                    )}
                    <select 
                        value={lang}
                        onChange={(e) => setLang(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-lg text-[10px] px-2 py-1 outline-none text-white font-bold"
                    >
                        {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 hover:bg-white/5 rounded-xl transition"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Backdrop for mobile */}
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 bg-surface border-r border-white/5 flex flex-col h-screen fixed md:relative z-50 
                transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6">
                    <div className="flex items-center space-x-3">
                        <ZaplandiaLogo className="w-8 h-8" />
                        <span className="text-xl font-bold tracking-tight">ZAPLANDIA</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 space-y-1">
                    {filteredMenuItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition font-medium ${pathname === item.path
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    ))}

                    {user?.role === 'superadmin' && (
                        <Link
                            href="/dashboard/admin/users"
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition font-medium ${pathname === '/dashboard/admin/users'
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-yellow-500 hover:bg-yellow-500/10'
                                }`}
                        >
                            <ShieldCheck className="w-5 h-5" />
                            <span>{t[lang].userManagement}</span>
                        </Link>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5 bg-surface">
                    <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.name?.replace('undefined', '').trim() || 'Usuário'}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user?.role || 'User'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition font-medium text-sm"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>{t[lang].logout}</span>
                    </button>

                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-background/50 pt-16 md:pt-0 flex flex-col">
                {/* Dashboard Header / Action Bar (Desktop) */}
                <div className="hidden md:flex bg-surface/50 border-b border-white/5 px-8 py-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500 italic">
                         {t[lang].menu.dashboard} / <span className="capitalize">{pathname.split('/').pop()?.replace('-', ' ')}</span>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user?.email === 'cezar.dias@gmail.com' && (
                            <button onClick={toggleTheme} className="p-2 hover:bg-white/5 rounded-xl transition" title="Alternar Tema">
                                <Palette size={18} className={theme === 'light-red' ? 'text-red-500' : 'text-primary'} />
                            </button>
                        )}
                        <select 
                            value={lang}
                            onChange={(e) => setLang(e.target.value as any)}
                            className="bg-white/5 border border-white/10 rounded-xl text-xs px-3 py-2 outline-none text-white font-bold cursor-pointer hover:bg-white/10 transition"
                        >
                            {languages.map(l => <option key={l.code} value={l.code} className="bg-surface text-white">{l.name}</option>)}
                        </select>
                        <div className="h-4 w-[1px] bg-white/10"></div>
                        <div className="text-xs text-gray-400 font-medium">Zaplandia CRM v1.0</div>
                    </div>
                </div>

                {/* Trial/Subscription Banner */}
                {(() => {
                    if (user?.role === 'superadmin') return null;
                    if (!user?.tenant || user.tenant.planType !== 'trial') return null;

                    const trialEndsAt = user.tenant.trialEndsAt ? new Date(user.tenant.trialEndsAt) : null;
                    if (!trialEndsAt) return null;

                    const now = new Date();
                    const diffTime = trialEndsAt.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // Show only if trial is ending within 16 days
                    if (diffDays > 16) return null;

                    return (
                        <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 flex items-center justify-between animate-in slide-in-from-top duration-500">
                            <div className="flex items-center gap-2 text-xs text-primary font-medium">
                                <AlertCircle size={14} />
                                <span>{t[lang].trial}</span>
                            </div>
                            <Link href="/dashboard/billing" className="text-[10px] bg-primary text-white px-3 py-1 rounded-full hover:bg-primary-dark transition font-bold uppercase tracking-wider">
                                {t[lang].choosePlan}
                            </Link>
                        </div>
                    );
                })()}
                <div className="flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
