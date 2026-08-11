/* eslint-disable react/prop-types */
import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * @file src/components/TrocaSenha.jsx
 * @description Tela de alteração obrigatória de senha (exigida por expiração ou reset admin).
 */
export function TrocaSenha({ enviarNovaSenha, novaSenha, setNovaSenha, confirmarSenha, setConfirmarSenha, erroTrocaSenha, fazerLogout }) {

    // UI Constantes (Mobile-First)
    const inputCls = "w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-3.5 md:p-3 rounded-xl text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all shadow-sm";
    const labelCls = "block text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 md:mb-1 uppercase tracking-wider transition-colors";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300 animate-scale-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner border border-amber-200 dark:border-amber-800/50">
                        <ShieldCheck className="w-7 h-7" strokeWidth={2} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 transition-colors tracking-tight">Segurança</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors font-medium">Atualização de Senha Obrigatória</p>
                </div>

                <form onSubmit={enviarNovaSenha} className="space-y-5">
                    <div>
                        <label className={labelCls}>Nova Senha</label>
                        <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            required
                            placeholder="••••••••"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            required
                            placeholder="••••••••"
                            className={inputCls}
                        />
                    </div>

                    {erroTrocaSenha && (
                        <p className="text-rose-600 dark:text-rose-400 text-xs font-bold text-center bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-200 dark:border-rose-800/50 transition-colors shadow-sm mt-4">
                            {erroTrocaSenha}
                        </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <button
                            type="button"
                            onClick={fazerLogout}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 md:py-3.5 rounded-xl text-sm transition-all cursor-pointer border border-transparent dark:border-slate-700 active:scale-[0.98] order-2 sm:order-1"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white font-bold py-4 md:py-3.5 rounded-xl text-sm transition-all shadow-md cursor-pointer active:scale-[0.98] order-1 sm:order-2"
                        >
                            Atualizar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}