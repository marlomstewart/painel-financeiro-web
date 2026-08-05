import React from 'react';

/**
 * @file src/components/Skeleton.jsx
 * @description Exibe uma maquete abstrata e pulsante da interface principal do sistema.
 * Substitui telas brancas vazias enquanto as chamadas assíncronas de API estão em trânsito.
 */
export function Skeleton() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 animate-pulse transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                {/* Topbar/Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="h-14 w-14 bg-slate-200 dark:bg-slate-800/80 rounded-full shadow-sm"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-6 bg-slate-200 dark:bg-slate-800/80 rounded-md w-48"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800/50 rounded-md w-32"></div>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="h-12 bg-slate-200 dark:bg-slate-800/80 rounded-xl w-full md:w-28 shadow-sm"></div>
                        <div className="h-12 bg-slate-200 dark:bg-slate-800/80 rounded-xl w-full md:w-28 shadow-sm"></div>
                    </div>
                </div>

                {/* Hero / Cards Analíticos Superiores Skeleton */}
                <div className="h-48 md:h-56 bg-slate-200 dark:bg-slate-800/60 rounded-3xl shadow-sm mb-6"></div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="h-32 bg-slate-200 dark:bg-slate-800/80 rounded-2xl shadow-sm"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-800/80 rounded-2xl shadow-sm"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-800/80 rounded-2xl shadow-sm"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-800/80 rounded-2xl shadow-sm"></div>
                </div>

                {/* Grid de Seções Inferiores Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-10 bg-slate-200 dark:bg-slate-800/80 rounded-lg w-64 mb-2"></div>
                        <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl shadow-sm"></div>
                        <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl shadow-sm"></div>
                        <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl shadow-sm"></div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <div className="h-10 bg-slate-200 dark:bg-slate-800/80 rounded-lg w-40 mb-2"></div>
                        <div className="h-[300px] bg-slate-200 dark:bg-slate-800/60 rounded-3xl shadow-sm"></div>
                    </div>
                </div>

            </div>
        </div>
    );
}