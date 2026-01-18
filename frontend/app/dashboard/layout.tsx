'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    BarChart3,
    MessageSquare,
    Users,
    Zap,
    Settings,
    LogOut,
    LayoutDashboard,
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Omni Inbox', icon: <MessageSquare size={20} />, path: '/dashboard/inbox' },
        { name: 'CRM Contatos', icon: <Users size={20} />, path: '/dashboard/crm' },
        { name: 'Integrações', icon: <Zap size={20} />, path: '/dashboard/integrations' },
        { name: 'Configurações API', icon: <Settings size={20} />, path: '/dashboard/settings/api' },
    ];

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-surface border-r border-white/5 flex flex-col">
                <div className="p-6">
                    <div className="flex items-center space-x-2">
                        <Zap className="text-primary w-8 h-8 fill-primary" />
                        <span className="text-xl font-bold tracking-tight">ZAPLANDIA</span>
                    </div>
                </div>

                <nav className="flex-grow px-4 space-y-1">
                    {menuItems.map((item) => (
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
                            href="/dashboard/admin"
                            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-yellow-500 hover:bg-yellow-500/10 transition font-medium"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            <span>Painel Super Admin</span>
                        </Link>
                    )}
                </nav>

                <div className="p-4 mt-auto border-t border-white/5">
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
            <main className="flex-1 overflow-y-auto bg-background/50">
                {children}
            </main>
        </div>
    );
}
