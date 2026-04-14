'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Se o token existe, usamos uma função no AuthContext para salvar o token e puxar os dados do usuário
            loginWithToken(token).then(() => {
                router.push('/dashboard');
            }).catch((err) => {
                console.error('Erro no callback de autenticação:', err);
                router.push('/auth/login?error=auth_failed');
            });
        } else {
            router.push('/auth/login');
        }
    }, [searchParams, router, loginWithToken]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xl font-bold animate-pulse">Finalizando autenticação...</p>
                <p className="text-gray-400 text-sm">Validando sua conta Google com o Zaplandia.</p>
            </div>
        </div>
    );
}
