import React from 'react';

/**
 * @file src/components/ThemeToggle.jsx
 * @description Botão flutuante de alto contraste para alternar rapidamente o tema do sistema.
 * @param {string} props.theme - Tema atual ('light' ou 'dark')
 * @param {Function} props.toggleTheme - Função disparadora de troca de estado
 */
export function ThemeToggle({ theme, toggleTheme }) {
    return (
        <button
            onClick={toggleTheme}
            className="fixed bottom-4 left-4 md:bottom-6 md:left-6 p-3.5 md:p-3 rounded-full shadow-2xl z-[9000] hover:scale-110 active:scale-90 transition-all duration-300 cursor-pointer bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 dark:bg-white dark:border-slate-200 dark:hover:bg-slate-100 flex items-center justify-center backdrop-blur-sm"
            title={theme === 'light' ? "Mudar para Tema Escuro" : "Mudar para Tema Claro"}
            aria-label="Alternar Tema"
        >
            <span className="text-2xl md:text-xl leading-none block select-none">
                {theme === 'light' ? '🌙' : '☀️'}
            </span>
        </button>
    );
}