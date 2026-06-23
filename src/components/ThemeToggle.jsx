import React from 'react';

/**
 * Componente: ThemeToggle
 * Renderiza um botão flutuante de alto contraste para alternar o tema do sistema.
 * @param {string} props.theme - Tema atual ('light' ou 'dark')
 * @param {Function} props.toggleTheme - Função disparadora de troca de estado
 */
export function ThemeToggle({ theme, toggleTheme }) {
    return (
        <button
            onClick={toggleTheme}
            className="fixed bottom-6 left-6 p-3 rounded-full shadow-2xl z-9000 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer bg-slate-800 border border-slate-700 hover:bg-slate-700 dark:bg-white dark:border-slate-200 dark:hover:bg-slate-100"
            title={theme === 'light' ? "Mudar para Tema Escuro" : "Mudar para Tema Claro"}
        >
            <span className="text-xl leading-none block select-none">
                {theme === 'light' ? '🌙' : '☀️'}
            </span>
        </button>
    );
}