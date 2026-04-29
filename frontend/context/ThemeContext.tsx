'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'dark' | 'light-red';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>('dark');
    const { token, user } = useAuth();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Fetch theme from backend globally on load
    useEffect(() => {
        const fetchGlobalTheme = async () => {
            try {
                const res = await fetch(`${API_URL}/config`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.theme === 'light-red' || data.theme === 'dark') {
                        setTheme(data.theme);
                    }
                }
            } catch (err) {
                console.error('Error fetching global theme:', err);
                // Fallback to local storage if API fails
                const saved = localStorage.getItem('zaplandia_theme') as Theme;
                if (saved) setTheme(saved);
            }
        };
        fetchGlobalTheme();
    }, []);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('zaplandia_theme', theme);
        
        if (theme === 'light-red') {
            document.documentElement.classList.add('theme-light-red');
        } else {
            document.documentElement.classList.remove('theme-light-red');
        }
    }, [theme]);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light-red' : 'dark';
        setTheme(newTheme);

        // If superadmin, save it globally for all users
        if (user?.email === 'cezar.dias@gmail.com' && token) {
            try {
                await fetch(`${API_URL}/admin/credentials/global`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name: 'GLOBAL_THEME', value: newTheme })
                });
            } catch (err) {
                console.error('Failed to save global theme:', err);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
