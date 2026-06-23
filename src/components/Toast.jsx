import React from 'react';

/**
 * Componente de Notificação Flutuante (Toast).
 * Exibe mensagens temporárias de feedback (ex: Erro de Rede) sobrepondo a UI principal.
 * @param {Object} props.toast - Objeto contendo { message, type } injetado pelo Hook.
 */
export function Toast({ toast }) {
    if (!toast) return null;

    const isError = toast.type === 'error';
    const bgClass = isError ? 'bg-rose-600' : 'bg-emerald-600';
    const icon = isError ? '❌' : '✅';

    return (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 ${bgClass} text-white px-5 py-3 rounded-lg shadow-2xl z-9999 transition-all animate-bounce`}>
            <span className="text-xl">{icon}</span>
            <p className="text-sm font-bold tracking-wide">{toast.message}</p>
        </div>
    );
}