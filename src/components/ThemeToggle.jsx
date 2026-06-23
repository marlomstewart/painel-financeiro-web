import React from 'react';

/**
 * Componente: ThemeToggle
 * Renderiza um botão flutuante discreto no canto inferior esquerdo para alternar o tema do sistema.
 * @param {string} props.theme - Tema atual ('light' ou 'dark')
 * @param {Function} props.toggleTheme - Função disparadora de troca de estado
 */
export function ThemeToggle({ theme, toggleTheme }) {
    return (
        <button
            onClick={toggleTheme}
            className="fixed bottom-6 left-6 p-3 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 z-9000 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
            title="Alternar Tema Visual"
        >
            <span className="text-xl leading-none block select-none">
                {theme === 'light' ? '🌙' : '☀️'}
            </span>
        </button>
    );
}