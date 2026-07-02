import React, { useState } from 'react';

export function MetasCategorias({ categorias, addCategoria, metasRenda = [], addMetaRenda, editarSetup, removerSetup, modal }) {
    const [nomeCategoria, setNomeCategoria] = useState('');
    const [metaCategoria, setMetaCategoria] = useState('');
    const [tipoCategoria, setTipoCategoria] = useState('despesa');

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (tipoCategoria === 'renda') {
            if (addMetaRenda) {
                await addMetaRenda(e);
            } else {
                await modal.alert('A função de adicionar metas de renda ainda não foi ligada no App.jsx. Aguarde a injeção do próximo ficheiro.', '⚠️ Aviso de Transição');
            }
        } else {
            await addCategoria(e);
        }

        setNomeCategoria('');
        setMetaCategoria('');
        setTipoCategoria('despesa');
    };

    const handleEditarCategoria = async (c) => {
        const nNome = await modal.prompt(`1️⃣ Novo NOME da Categoria?`, c.nome, '✏️ Editar Categoria', { confirmLabel: 'Próximo' }); if (nNome === null) return;
        const nMeta = await modal.prompt(`2️⃣ Novo Teto / Meta (R$)?`, String(c.meta), '✏️ Editar Categoria', { inputType: 'number', confirmLabel: 'Próximo' }); if (nMeta === null) return;
        const nTipo = await modal.options(`3️⃣ Qual o Comportamento?`, [
            { value: 'despesa', icon: '🔻', label: 'Despesa (Teto)' },
            { value: 'investimento', icon: '📈', label: 'Investimento (Alvo)' }
        ], '✏️ Editar Categoria'); if (!nTipo) return;

        await editarSetup('categorias', c.id, { nome: nNome, meta: Number(nMeta), tipo: nTipo });
    };

    const handleEditarMetaRenda = async (m) => {
        const nNome = await modal.prompt(`1️⃣ Novo NOME da Expectativa de Renda?`, m.nome, '✏️ Editar Receita', { confirmLabel: 'Próximo' }); if (nNome === null) return;
        const nValor = await modal.prompt(`2️⃣ Novo Alvo Mensal (R$)?`, String(m.valor), '✏️ Editar Receita', { inputType: 'number', confirmLabel: 'Salvar' }); if (nValor === null) return;

        await editarSetup('metasRenda', m.id, { nome: nNome, valor: Number(nValor) });
    };

    const handleExcluir = async (id, contexto) => {
        const ok = await modal.confirm('Deseja excluir este registo estrutural? Não afetará os lançamentos já efetuados no livro-razão.', '🗑️ Excluir Registo');
        if (!ok) return;
        await removerSetup(contexto, id);
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-24 relative">

            {/* CABEÇALHO FIXO COM VIDRO FOSCO */}
            <div className="sticky top-0 z-40 pt-4 md:pt-8 pb-4 -mt-4 md:-mt-8 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md mb-6">
                <header className="border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">🎯 Metas & Categorias</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Defina os tetos de gastos, alvos de investimento e expectativas de receita.</p>
                </header>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm sticky top-32">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Nova Meta Estratégica</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Nome da Categoria/Meta</label>
                                <input
                                    type="text" name="nome" required
                                    value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)}
                                    placeholder="Ex: Supermercado, Salário, Dividendos..."
                                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Valor Alvo (R$)</label>
                                <input
                                    type="number" name="meta" step="0.01" required
                                    value={metaCategoria} onChange={(e) => setMetaCategoria(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Tipo de Meta</label>
                                <select
                                    name="tipo"
                                    value={tipoCategoria} onChange={(e) => setTipoCategoria(e.target.value)}
                                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors cursor-pointer"
                                >
                                    <option value="despesa">🔻 Teto de Despesa</option>
                                    <option value="investimento">📈 Alvo de Investimento</option>
                                    <option value="renda">💰 Expectativa de Receita</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md mt-2">
                                Adicionar Meta
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Entradas / Receitas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {metasRenda.length === 0 ? (
                                <div className="col-span-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhuma expectativa de renda configurada.</p>
                                </div>
                            ) : metasRenda.map(m => (
                                <div key={m.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center group hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{m.nome}</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase mt-0.5">Meta de Renda</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right font-black text-emerald-600 dark:text-emerald-400">
                                            {formatarMoeda(m.valor)}
                                        </div>
                                        <div className="flex flex-col gap-1 border-l border-slate-100 dark:border-slate-700 pl-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => handleEditarMetaRenda(m)} className="text-[10px] text-blue-500 hover:text-blue-700 cursor-pointer">✏️</button>
                                            <button type="button" onClick={() => handleExcluir(m.id, 'metasRenda')} className="text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Saídas (Despesas e Investimentos)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categorias.length === 0 ? (
                                <div className="col-span-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhuma categoria de saída configurada.</p>
                                </div>
                            ) : categorias.map(c => (
                                <div key={c.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center group transition-colors ${c.tipo === 'despesa' ? 'hover:border-amber-300 dark:hover:border-amber-700' : 'hover:border-blue-300 dark:hover:border-blue-700'}`}>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{c.nome}</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase mt-0.5">{c.tipo === 'despesa' ? 'Teto Máximo' : 'Alvo Mensal'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`text-right font-black ${c.tipo === 'despesa' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {formatarMoeda(c.meta)}
                                        </div>
                                        <div className="flex flex-col gap-1 border-l border-slate-100 dark:border-slate-700 pl-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => handleEditarCategoria(c)} className="text-[10px] text-blue-500 hover:text-blue-700 cursor-pointer">✏️</button>
                                            <button type="button" onClick={() => handleExcluir(c.id, 'categorias')} className="text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}