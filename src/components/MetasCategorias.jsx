import React, { useState } from 'react';

export function MetasCategorias({ categorias, addCategoria }) {
    const [nomeCategoria, setNomeCategoria] = useState('');
    const [metaCategoria, setMetaCategoria] = useState('');
    const [tipoCategoria, setTipoCategoria] = useState('despesa');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const sucesso = await addCategoria({ nome: nomeCategoria, meta: metaCategoria, tipo: tipoCategoria });
        if (sucesso) { setNomeCategoria(''); setMetaCategoria(''); setTipoCategoria('despesa'); }
    };

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">🎯 Planejamento e Metas</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Crie tetos de gastos e defina orçamentos para alimentar o motor de inteligência preditiva.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm h-fit">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Nova Categoria</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome da Categoria</label><input type="text" value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: Supermercado, Gasolina" /></div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Teto Mensal / Meta (R$)</label><input type="number" step="0.01" min="0" value={metaCategoria} onChange={(e) => setMetaCategoria(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="0.00" /></div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Comportamento</label><select value={tipoCategoria} onChange={(e) => setTipoCategoria(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"><option value="despesa">Teto de Gasto (Limite)</option><option value="investimento">Meta de Crescimento (Alvo)</option></select></div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">Criar Categoria</button>
                    </form>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
                    {categorias.length === 0 ? (
                        <div className="sm:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">Nenhuma meta configurada.</div>
                    ) : (
                        categorias.map(c => (
                            <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{c.nome}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mt-0.5">{c.tipo === 'despesa' ? 'Teto Máximo' : 'Alvo Mensal'}</p>
                                </div>
                                <div className={`text-right font-black ${c.tipo === 'despesa' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {formatarMoeda(c.meta)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}