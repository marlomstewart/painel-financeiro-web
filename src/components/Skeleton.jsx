import React from 'react';
import { LayoutDashboard, Target, History } from 'lucide-react';

/**
 * @file src/components/Skeleton.jsx
 * @description Exibe uma maquete estrutural pulsante idêntica ao Dashboard.
 * Minimiza o Layout Shift e eleva a performance percebida durante o fetch da API.
 */
export function Skeleton() {
    return (
        <div className="flex-1 h-full overflow-y-auto relative custom-scrollbar flex flex-col p-4 md:p-6 w-full max-w-7xl mx-auto animate-pulse transition-colors duration-300">
            <div className="space-y-6 md:space-y-6 pb-24">

                {/* CABEÇALHO SKELETON */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0">
                            <LayoutDashboard className="w-5 h-5 text-slate-300 dark:text-slate-700" strokeWidth={2} />
                        </div>
                        <div className="space-y-2 flex-1 md:w-48">
                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2"></div>
                        </div>
                    </div>
                    <div className="w-full md:w-48 h-12 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"></div>
                </div>

                {/* CARDS SUPERIORES SKELETON (Espelha os 6 cards do Dashboard) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 md:gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-24">
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2 mb-3"></div>
                            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                        </div>
                    ))}
                </div>

                {/* PROGRESSO ESTRATÉGICO SKELETON */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-5 md:mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 md:pb-4">
                        <div className="flex items-center gap-3 w-full">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0">
                                <Target className="w-4.5 h-4.5 text-slate-300 dark:text-slate-700" strokeWidth={2} />
                            </div>
                            <div className="space-y-2 flex-1">
                                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-48"></div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-64 hidden sm:block"></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                                <div className="flex justify-between items-end mb-3">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-8"></div>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mb-3"></div>
                                <div className="flex justify-between">
                                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-16"></div>
                                    <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-16"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ÚLTIMOS LANÇAMENTOS SKELETON */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-transparent md:border-slate-100 md:dark:border-slate-800 md:pb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0">
                                <History className="w-4.5 h-4.5 text-slate-300 dark:text-slate-700" strokeWidth={2} />
                            </div>
                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-40"></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 max-w-[200px]"></div>
                                    <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2 max-w-[150px]"></div>
                                </div>
                                <div className="flex flex-col items-end space-y-2 shrink-0">
                                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-20"></div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-12"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}