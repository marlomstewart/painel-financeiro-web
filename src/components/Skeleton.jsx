import React from 'react';

/**
 * Componente: DashboardSkeleton
 * Exibe uma maquete abstrata e pulsante da interface principal do sistema.
 * Substitui telas brancas vazias enquanto as chamadas assíncronas de API estão em trânsito.
 */
export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 animate-pulse transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Topbar/Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-48"></div>
                    <div className="flex gap-3">
                        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-24"></div>
                        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-24"></div>
                    </div>
                </div>

                {/* Cards Analíticos Superiores Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-sm"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-sm"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-sm"></div>
                </div>

                {/* Grid de Seções Inferiores Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="lg:col-span-1 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-sm"></div>
                    <div className="lg:col-span-2 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-sm"></div>
                </div>

            </div>
        </div>
    );
}