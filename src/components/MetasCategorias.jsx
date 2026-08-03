import React, { useState } from 'react';

/**
 * @file src/components/MetasCategorias.jsx
 * @description Módulo de gestão de Categorias Orçamentais e Metas Estratégicas.
 * Permite a criação de categorias simples (sem meta) ou categorias rastreáveis no Dashboard (com meta > 0).
 */
export function MetasCategorias({ categorias, addCategoria, editarSetup, removerSetup, modal }) {
    const [nomeCategoria, setNomeCategoria] = useState('');
    const [metaCategoria, setMetaCategoria] = useState('');
    const [tipoCategoria, setTipoCategoria] = useState('despesa');

    /**
     * @function formatarMoeda
     * @description Formata um número para o padrão de moeda brasileiro (BRL).
     * @param {number|string} valor - Valor a ser formatado.
     * @returns {string} String formatada em BRL.
     */
    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    /**
     * @function handleSubmit
     * @description Processa o formulário de nova categoria e envia para a API.
     * @param {Event} e - Evento de submissão do formulário.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Passamos o evento para a função herdada que fará o POST
        await addCategoria(e);

        // Limpa o formulário após salvar
        setNomeCategoria('');
        setMetaCategoria('');
        setTipoCategoria('despesa');
    };

    /**
     * @function handleEditarCategoria
     * @description Abre o fluxo de prompts sequenciais para editar uma categoria existente e corrige o bug de captura de objeto.
     * @param {Object} c - Objeto da categoria selecionada.
     */
    const handleEditarCategoria = async (c) => {
        const nNome = await modal.prompt(`1️⃣ Novo NOME da Categoria?`, c.nome, '✏️ Editar Categoria', { confirmLabel: 'Próximo' });
        if (nNome === null) return;

        const nMeta = await modal.prompt(`2️⃣ Novo Teto / Meta (R$)?\n(Deixe 0 para categoria simples)`, String(c.meta), '✏️ Editar Categoria', { inputType: 'number', confirmLabel: 'Próximo' });
        if (nMeta === null) return;

        const nTipoRes = await modal.options(`3️⃣ Qual o Comportamento?`, [
            { value: 'despesa', icon: '🔻', label: 'Despesa (Saída)' },
            { value: 'investimento', icon: '📈', label: 'Investimento (Alvo)' },
            { value: 'renda', icon: '💰', label: 'Renda (Entrada Livre)' }
        ], '✏️ Editar Categoria');
        if (!nTipoRes) return;

        // 🔥 CORREÇÃO DO BUG DE EDIÇÃO: Extrai o valor caso o Modal retorne o objeto completo em vez da string
        const tipoFinal = typeof nTipoRes === 'object' ? nTipoRes.value : nTipoRes;

        await editarSetup('categorias', c.id, {
            nome: nNome,
            meta: Number(nMeta),
            tipo: tipoFinal
        });
    };

    /**
     * @function handleExcluir
     * @description Confirma e aciona a exclusão de uma categoria.
     * @param {string|number} id - ID da categoria.
     */
    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta categoria? Lançamentos antigos no extrato não serão afetados, mas ficarão "Sem Categoria".', '🗑️ Excluir Registo', { confirmColor: 'bg-rose-600 hover:bg-rose-700', confirmLabel: 'Excluir' });
        if (!ok) return;
        await removerSetup('categorias', id);
    };

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 relative animate-fade-in">

            {/* 🌟 CABEÇALHO PADRÃO (SÓLIDO E ROLÁVEL) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        🏷️ Categorias e Metas
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Cadastre categorias para organizar seus lançamentos ou defina tetos de gastos.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">

                {/* COLUNA ESQUERDA: FORMULÁRIO */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm lg:sticky top-6">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span>➕</span> Nova Categoria
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Nome da Categoria</label>
                                <input
                                    type="text" name="nome" required
                                    value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)}
                                    placeholder="Ex: Lanche, Uber, Gasolina..."
                                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Natureza</label>
                                <select
                                    name="tipo"
                                    value={tipoCategoria} onChange={(e) => setTipoCategoria(e.target.value)}
                                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors cursor-pointer"
                                >
                                    <option value="despesa">🔻 Despesa (Saída)</option>
                                    <option value="investimento">📈 Investimento / Aporte</option>
                                    <option value="renda">💰 Renda / Entrada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Teto ou Alvo Mensal (R$)</label>
                                <input
                                    type="number" name="meta" step="0.01" min="0" required
                                    value={metaCategoria} onChange={(e) => setMetaCategoria(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-700 dark:text-blue-400 font-bold p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors shadow-inner"
                                />
                                {/* 🔥 AVISO DE UX PARA O USUÁRIO */}
                                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-2.5 rounded-lg flex items-start gap-2">
                                    <span className="text-xs">💡</span>
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium leading-tight">
                                        <strong>Opcional:</strong> Deixe o valor em <strong>0,00</strong> se quiser apenas criar uma categoria simples para organizar o extrato, sem rastrear metas no Dashboard.
                                    </p>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md mt-4">
                                Salvar Categoria
                            </button>
                        </form>
                    </div>
                </div>

                {/* COLUNA DIREITA: LISTA DE CATEGORIAS */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                            Categorias Cadastradas
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categorias.length === 0 ? (
                                <div className="col-span-full text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Nenhuma categoria cadastrada no seu livro-razão.</p>
                                </div>
                            ) : categorias.map(c => {
                                const isMeta = Number(c.meta) > 0;

                                // Define estilos baseados no comportamento da categoria
                                let borderColor = 'border-slate-200 dark:border-slate-700 hover:border-slate-400';
                                let icon = '🏷️';
                                let textColor = 'text-slate-500';

                                if (isMeta) {
                                    if (c.tipo === 'despesa') {
                                        borderColor = 'border-amber-200 dark:border-amber-800/50 hover:border-amber-400';
                                        icon = '🔻';
                                        textColor = 'text-amber-600 dark:text-amber-400';
                                    } else if (c.tipo === 'investimento') {
                                        borderColor = 'border-blue-200 dark:border-blue-800/50 hover:border-blue-400';
                                        icon = '📈';
                                        textColor = 'text-blue-600 dark:text-blue-400';
                                    } else {
                                        borderColor = 'border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400';
                                        icon = '💰';
                                        textColor = 'text-emerald-600 dark:text-emerald-400';
                                    }
                                }

                                return (
                                    <div key={c.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-sm flex justify-between items-center group transition-colors ${borderColor}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl bg-slate-100 dark:bg-slate-900 w-10 h-10 flex items-center justify-center rounded-full shadow-inner">{icon}</span>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{c.nome}</h4>
                                                {isMeta ? (
                                                    <p className="text-[10px] font-black uppercase mt-0.5 tracking-wider text-slate-400">
                                                        {c.tipo === 'despesa' ? 'Teto: ' : 'Alvo: '}
                                                        <span className={textColor}>{formatarMoeda(c.meta)}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] font-bold uppercase mt-0.5 tracking-wider text-slate-400">
                                                        Categoria Simples
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 border-l border-slate-100 dark:border-slate-700 pl-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => handleEditarCategoria(c)} className="text-xs bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded transition-colors cursor-pointer" title="Editar">✏️</button>
                                            <button type="button" onClick={() => handleExcluir(c.id)} className="text-xs bg-slate-50 hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded transition-colors cursor-pointer" title="Excluir">🗑️</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}