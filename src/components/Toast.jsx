import React from 'react';

/**
 * @file src/components/Toast.jsx
 * @description Componente de Notificação Flutuante (Toast) para feedbacks visuais.
 * Substitui animações agressivas por um design moderno flutuante no centro-inferior (Mobile) 
 * ou canto direito (Desktop), garantindo que mensagens de erro/sucesso não passem despercebidas.
 */
export function Toast({ toast }) {
    if (!toast) return null;

    const isError = toast.type === 'error';
    const bgClass = isError ? 'bg-rose-600 border-rose-500' : 'bg-emerald-600 border-emerald-500';
    const icon = isError ? '❌' : '✅';

    return (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:bottom-6 md:right-6 md:max-w-md flex items-center gap-3 md:gap-4 ${bgClass} text-white px-5 md:px-6 py-4 md:py-3.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border z-[9999] transition-all animate-fade-in-up backdrop-blur-md`}>
            <span className="text-2xl md:text-xl shrink-0 drop-shadow-md">{icon}</span>
            <p className="text-sm font-bold tracking-wide leading-tight drop-shadow-sm">{toast.message}</p>
        </div>
    );
}