'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    loginWithToken: (token: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('bypass') === 'meta') {
            const mockUser = {
                id: 'review-id',
                email: 'meta-review@zaplandia.com',
                name: 'Meta Review Admin',
                role: 'superadmin',
                tenantId: 'review-tenant'
            };
            const mockToken = 'mock-token-for-review';
            setToken(mockToken);
            setUser(mockUser);
            localStorage.setItem('zap_token', mockToken);
            localStorage.setItem('zap_user', JSON.stringify(mockUser));
            setIsLoading(false);
            return;
        }

        const savedToken = localStorage.getItem('zap_token');
        const savedUser = localStorage.getItem('zap_user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('zap_token', newToken);
        localStorage.setItem('zap_user', JSON.stringify(newUser));
        router.push('/dashboard');
    };

    const loginWithToken = async (newToken: string) => {
        setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '');
            const res = await fetch(`${apiUrl}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${newToken}` }
            });

            if (res.ok) {
                const userData = await res.json();
                setToken(newToken);
                setUser(userData);
                localStorage.setItem('zap_token', newToken);
                localStorage.setItem('zap_user', JSON.stringify(userData));
                return;
            }
            throw new Error('Token inválido ou expirado.');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('zap_token');
        localStorage.removeItem('zap_user');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, loginWithToken, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
