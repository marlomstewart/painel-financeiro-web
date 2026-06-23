import { useState, useEffect } from 'react';

/**
 * Hook Customizado: useTheme
 * Gerencia o estado e a persistência do tema (Claro/Escuro) no ecossistema da aplicação.
 * Salva a escolha do usuário no LocalStorage do navegador para evitar perda de estado entre reloads.
 */
export function useTheme() {
    const [theme, setTheme] = useState(localStorage.getItem('theme-painel') || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme-painel', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return { theme, toggleTheme };
}