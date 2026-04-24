'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type LanguageCode = 'pt_BR' | 'en_US' | 'pt_PT' | 'it_IT';

interface LanguageContextType {
    lang: LanguageCode;
    setLang: (code: LanguageCode) => void;
    languages: { code: LanguageCode; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<LanguageCode>('pt_BR');

    const languages: { code: LanguageCode; name: string }[] = [
        { code: 'pt_BR', name: '🇧🇷 PT-BR' },
        { code: 'en_US', name: '🇺🇸 EN-US' },
        { code: 'pt_PT', name: '🇵🇹 PT-PT' },
        { code: 'it_IT', name: '🇮🇹 IT-IT' }
    ];

    useEffect(() => {
        const saved = localStorage.getItem('zap_lang') as LanguageCode;
        if (saved && languages.find(l => l.code === saved)) {
            setLangState(saved);
        }
    }, []);

    const setLang = (code: LanguageCode) => {
        setLangState(code);
        localStorage.setItem('zap_lang', code);
        window.dispatchEvent(new Event('languageChange'));
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, languages }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
