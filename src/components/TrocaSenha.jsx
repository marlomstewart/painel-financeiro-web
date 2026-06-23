/* eslint-disable react/prop-types */
import React from 'react';

export function TrocaSenha({ enviarNovaSenha, novaSenha, setNovaSenha, confirmarSenha, setConfirmarSenha, erroTrocaSenha, fazerLogout }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-sm border border-transparent dark:border-slate-700 transition-colors duration-300">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors">Segurança</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Atualização de Senha Obrigatória</p>
                </div>

                <form onSubmit={enviarNovaSenha} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase transition-colors">Nova Senha</label>
                        <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            required
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase transition-colors">Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            required
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                        />
                    </div>

                    {erroTrocaSenha && (
                        <p className="text-red-500 dark:text-red-400 text-xs font-bold text-center bg-red-50 dark:bg-red-900/30 p-2 rounded border border-red-100 dark:border-red-800 transition-colors">
                            {erroTrocaSenha}
                        </p>
                    )}

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={fazerLogout}
                            className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-md cursor-pointer"
                        >
                            Atualizar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}