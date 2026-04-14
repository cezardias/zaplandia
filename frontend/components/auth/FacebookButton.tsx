'use client';

import React from 'react';
import { Facebook } from 'lucide-react';

export default function FacebookButton({ label = 'Continuar com Facebook' }: { label?: string }) {
    const handleFacebookLogin = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        // Redireciona para o backend que inicia o fluxo OAuth2 com Meta
        window.location.href = `${apiUrl}/api/auth/facebook`;
    };

    return (
        <button
            onClick={handleFacebookLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white border border-transparent rounded-xl px-4 py-3 font-bold hover:bg-[#166fe5] transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>{label}</span>
        </button>
    );
}
