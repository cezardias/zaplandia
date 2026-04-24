'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Global Language State
    const [lang, setLang] = useState<'pt_BR' | 'en_US' | 'pt_PT' | 'it_IT'>('pt_BR');

    useEffect(() => {
        const saved = localStorage.getItem('zap_lang');
        if (saved) setLang(saved as any);
    }, []);

    const changeLang = (newLang: any) => {
        setLang(newLang);
        localStorage.setItem('zap_lang', newLang);
        window.dispatchEvent(new Event('languageChange'));
    };

    const languages = [
        { code: 'pt_BR', name: '🇧🇷 PT-BR' },
        { code: 'en_US', name: '🇺🇸 EN-US' },
        { code: 'pt_PT', name: '🇵🇹 PT-PT' },
        { code: 'it_IT', name: '🇮🇹 IT-IT' }
    ];


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
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/billing/status`, {
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
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Omni Inbox', icon: <MessageSquare size={20} />, path: '/dashboard/inbox', roles: ['superadmin', 'admin', 'user', 'agent'] },
        { name: 'AI Assistant', icon: <Zap size={20} />, path: '/dashboard/ai-assistant', roles: ['superadmin', 'admin', 'user'] },
        { name: 'WhatsApp Manager', icon: <Smartphone size={20} />, path: '/dashboard/integrations/whatsapp', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Meta API', icon: <Facebook size={20} />, path: '/dashboard/integrations/meta', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Meta Governance', icon: <ShieldCheck size={20} />, path: '/dashboard/governance', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Contacts CRM', icon: <Users size={20} />, path: '/dashboard/crm', roles: ['superadmin', 'admin', 'user', 'agent'] },
        { name: 'Teams', icon: <Users size={20} />, path: '/dashboard/teams', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Pipeline', icon: <BarChart3 size={20} />, path: '/dashboard/crm/kanban', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Settings', icon: <Settings size={20} />, path: '/dashboard/integrations', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Payments', icon: <CreditCard size={20} />, path: '/dashboard/admin/payments', roles: ['superadmin'] },
        { name: 'Developer', icon: <Terminal size={20} />, path: '/dashboard/developer', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Help Center', icon: <HelpCircle size={20} />, path: '/dashboard/support', roles: ['superadmin', 'admin', 'user', 'agent'] },
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
                    <Zap className="text-primary w-6 h-6 fill-primary" />
                    <span className="text-lg font-bold tracking-tight">ZAPLANDIA</span>
                </div>
                <div className="flex items-center space-x-3">

                    <select 
                        value={lang}
                        onChange={(e) => changeLang(e.target.value)}
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
                    <div className="flex items-center space-x-2">
                        <Zap className="text-primary w-8 h-8 fill-primary" />
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
                            <span>Gestão de Usuários</span>
                        </Link>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5 bg-surface">
                    <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition font-medium text-sm"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sair do sistema</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-background/50 pt-16 md:pt-0 flex flex-col">
                {/* Dashboard Header / Action Bar (Desktop) */}
                <div className="hidden md:flex bg-surface/50 border-b border-white/5 px-8 py-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500 italic">
                         Dashboard / {pathname.split('/').pop()}
                    </div>
                    <div className="flex items-center space-x-4">
                        <select 
                            value={lang}
                            onChange={(e) => changeLang(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl text-xs px-3 py-2 outline-none text-white font-bold cursor-pointer hover:bg-white/10 transition"
                        >
                            {languages.map(l => <option key={l.code} value={l.code} className="bg-surface text-white">{l.name}</option>)}
                        </select>
                        <div className="h-4 w-[1px] bg-white/10"></div>
                        <div className="text-xs text-gray-400 font-medium">Zaplandia CRM v1.0</div>
                    </div>
                </div>

                {/* Trial/Subscription Banner */}
                {user?.role !== 'superadmin' && (

                    <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-primary font-medium">
                            <AlertCircle size={14} />
                            <span>Seu período de teste (Trial) está ativo. Aproveite todas as funções!</span>
                        </div>
                        <Link href="/dashboard/billing" className="text-[10px] bg-primary text-white px-3 py-1 rounded-full hover:bg-primary-dark transition font-bold uppercase tracking-wider">
                            Escolher Plano
                        </Link>
                    </div>
                )}
                <div className="flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
