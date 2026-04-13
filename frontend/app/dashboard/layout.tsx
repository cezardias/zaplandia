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
    Terminal
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

    // Close mobile menu when pathname changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, isLoading, router]);

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Omni Inbox', icon: <MessageSquare size={20} />, path: '/dashboard/inbox', roles: ['superadmin', 'admin', 'user', 'agent'] },
        { name: 'Assistente IA', icon: <Zap size={20} />, path: '/dashboard/ai-assistant', roles: ['superadmin', 'admin', 'user'] },
        { name: 'WhatsApp Manager', icon: <Smartphone size={20} />, path: '/dashboard/integrations/whatsapp', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Meta API', icon: <Facebook size={20} />, path: '/dashboard/integrations/meta', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Governança Meta', icon: <ShieldCheck size={20} />, path: '/dashboard/governance', roles: ['superadmin', 'admin', 'user'] },
        { name: 'CRM Contatos', icon: <Users size={20} />, path: '/dashboard/crm', roles: ['superadmin', 'admin', 'user', 'agent'] },
        { name: 'Equipes', icon: <Users size={20} />, path: '/dashboard/teams', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Pipeline', icon: <BarChart3 size={20} />, path: '/dashboard/crm/kanban', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Integrações', icon: <Settings size={20} />, path: '/dashboard/integrations', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Desenvolvedor', icon: <Terminal size={20} />, path: '/dashboard/developer', roles: ['superadmin', 'admin', 'user'] },
        { name: 'Central de Ajuda', icon: <HelpCircle size={20} />, path: '/dashboard/support', roles: ['superadmin', 'admin', 'user', 'agent'] },
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
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 hover:bg-white/5 rounded-xl transition"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
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
            <main className="flex-1 overflow-y-auto bg-background/50 pt-16 md:pt-0">
                {children}
            </main>
        </div>
    );
}
