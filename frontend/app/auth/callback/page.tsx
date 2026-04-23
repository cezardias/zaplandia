'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            console.log('Token received, validating...', token.substring(0, 15) + '...');
            loginWithToken(token).then(() => {
                console.log('Token validated, redirecting to dashboard...');
                router.push('/dashboard');
            }).catch((err) => {
                console.error('Erro no callback de autenticação:', err);
                // Try hard navigation if router.push fails or is caught in a loop
                window.location.href = '/auth/login?error=auth_failed';
            });
        } else {
            console.log('No token in URL, redirecting to login...');
            router.push('/auth/login');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xl font-bold animate-pulse">Finalizando autenticação...</p>
            <p className="text-gray-400 text-sm">Validando configuração na plataforma Zaplandia.</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white p-4">
            <Suspense fallback={
                <div className="text-gray-500 animate-pulse">Carregando segurança...</div>
            }>
                <CallbackHandler />
            </Suspense>
        </div>
    );
}
