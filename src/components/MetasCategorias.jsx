import React, { useState } from 'react';

/**
 * @file src/components/MetasCategorias.jsx
 * @description Módulo de gestão de Categorias Orçamentais e Metas Estratégicas.
 * Permite a criação de categorias simples (sem meta) ou categorias rastreáveis no Dashboard (com meta > 0).
 */
export function MetasCategorias({ categorias, addCategoria, editarSetup, removerSetup, modal, temGaragem }) {
    const [nomeCategoria, setNomeCategoria] = useState('');
    const [metaCategoria, setMetaCategoria] = useState('');
    const [tipoCategoria, setTipoCategoria] = useState('despesa');
    const [isGaragem, setIsGaragem] = useState(false);

    /**
     * @function formatarMoeda
     * @description Formata um número para o padrão de moeda brasileiro (BRL).
     */
    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    /**
     * @function handleSubmit
     * @description Processa o formulário de nova categoria e envia para a API.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        await addCategoria(e);
        setNomeCategoria('');
        setMetaCategoria('');
        setTipoCategoria('despesa');
        setIsGaragem(false);
    };

    /**
     * @function handleEditarCategoria
     * @description Abre o fluxo de prompts sequenciais (Wizard) para editar uma categoria existente.
     */
    const handleEditarCategoria = async (c) => {
        const nNome = await modal.prompt(`1️⃣ Novo NOME da Categoria?`, c.nome, '✏️ Editar Categoria', { confirmLabel: 'Próximo' });
        if (nNome === null) return;

        const nMeta = await modal.prompt(`2️⃣ Novo Teto / Meta (R$)?\n(Deixe 0 para categoria simples)`, String(c.meta || 0), '✏️ Editar Categoria', { inputType: 'text', confirmLabel: 'Próximo' });
        if (nMeta === null) return;

        const nTipoRes = await modal.options(`3️⃣ Qual a Natureza?`, [
            { value: 'despesa', icon: '🔻', label: 'Despesa (Saída)' },
            { value: 'investimento', icon: '📈', label: 'Investimento / Alvo' },
            { value: 'renda', icon: '💰', label: 'Renda (Entrada)' }
        ], '✏️ Editar Categoria');
        if (!nTipoRes) return;

        let isGaragemFinal = c.is_garagem || 0;

        if (temGaragem) {
            const nGaragemRes = await modal.options(`4️⃣ Atrelar à Garagem?`, [
                { value: 1, icon: '🏍️', label: 'Sim (Pedir KM no Lançamento)' },
                { value: 0, icon: '❌', label: 'Não (Despesa Comum)' }
            ], '✏️ Editar Categoria');
            if (nGaragemRes === null) return;
            isGaragemFinal = typeof nGaragemRes === 'object' ? nGaragemRes.value : Number(nGaragemRes);
        }

        const tipoFinal = typeof nTipoRes === 'object' ? nTipoRes.value : String(nTipoRes);
        const metaStr = String(nMeta).replace(/\./g, '').replace(',', '.');
        const metaFormatada = Number(metaStr) || 0;

        const sucesso = await editarSetup('categorias', c.id, {
            nome: nNome,
            meta: metaFormatada,
            tipo: tipoFinal,
            is_garagem: isGaragemFinal
        });

        if (sucesso) {
            modal.alert('Sua categoria foi atualizada com sucesso no banco de dados!', '✅ Salvo com Sucesso');
        } else {
            modal.alert('Houve um erro ao atualizar a categoria. Verifique o servidor.', '❌ Erro');
        }
    };

    /**
     * @function handleExcluir
     * @description Confirma e aciona a exclusão de uma categoria.
     */
    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta categoria? Lançamentos antigos no extrato não serão afetados, mas ficarão "Sem Categoria".', '🗑️ Excluir Registo', { confirmColor: 'bg-rose-600 hover:bg-rose-700', confirmLabel: 'Excluir' });
        if (!ok) return;

        await removerSetup('categorias', id);
    };

    // UI Constantes (Mobile-First)
    const inputCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors shadow-sm";
    const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 md:mb-1 uppercase tracking-wider";

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pt-2">

                {/* COLUNA ESQUERDA: FORMULÁRIO */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm lg:sticky top-6 transition-colors">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span>➕</span> Nova Categoria
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className={labelCls}>Nome da Categoria</label>
                                <input
                                    type="text" name="nome" required
                                    value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)}
                                    placeholder="Ex: Lanche, Uber, Gasolina..."
                                    className={inputCls}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Natureza</label>
                                <select
                                    name="tipo"
                                    value={tipoCategoria} onChange={(e) => setTipoCategoria(e.target.value)}
                                    className={`${inputCls} cursor-pointer`}
                                >
                                    <option value="despesa">🔻 Despesa (Saída)</option>
                                    <option value="investimento">📈 Investimento / Aporte</option>
                                    <option value="renda">💰 Renda / Entrada</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelCls}>Teto ou Alvo Mensal (R$)</label>
                                <input
                                    type="number" name="meta" step="0.01" min="0" required
                                    value={metaCategoria} onChange={(e) => setMetaCategoria(e.target.value)}
                                    placeholder="0.00"
                                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 md:p-3 text-sm font-bold text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500 transition-colors shadow-sm`}
                                />
                                <div className="mt-2.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-3 rounded-lg flex items-start gap-2 shadow-sm">
                                    <span className="text-xs">💡</span>
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                                        <strong>Opcional:</strong> Deixe em <strong>0,00</strong> se quiser criar apenas uma categoria simples sem rastrear metas no Dashboard.
                                    </p>
                                </div>
                            </div>

                            {temGaragem && (
                                <div className="pt-1">
                                    <label className="flex items-center gap-3 cursor-pointer py-1">
                                        <input
                                            type="checkbox"
                                            checked={isGaragem}
                                            onChange={(e) => setIsGaragem(e.target.checked)}
                                            className="w-5 h-5 accent-indigo-600 cursor-pointer"
                                        />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pedir Veículo/KM no Lançamento</span>
                                    </label>
                                </div>
                            )}

                            <input type="hidden" name="is_garagem" value={temGaragem && isGaragem ? 1 : 0} />

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 md:py-3 rounded-lg text-sm transition-all cursor-pointer shadow-md mt-2 active:scale-[0.98]">
                                Salvar Categoria
                            </button>
                        </form>
                    </div>
                </div>

                {/* COLUNA DIREITA: LISTA DE CATEGORIAS */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 pl-1">
                            Categorias Cadastradas
                        </h3>

                        {/* 🔥 MUDANÇA AQUI: Grid simplificado para 1 coluna até telas super largas (xl) */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
                            {categorias.length === 0 ? (
                                <div className="col-span-full text-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                                    <span className="text-3xl opacity-50 block mb-3">🏷️</span>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Nenhuma categoria cadastrada no seu livro-razão.</p>
                                </div>
                            ) : categorias.map(c => {
                                const isMeta = Number(c.meta) > 0;
                                const isGaragemFlag = Boolean(c.is_garagem);

                                let borderColor = 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600';
                                let icon = '🏷️';
                                let textColor = 'text-slate-500 dark:text-slate-400';

                                if (isMeta) {
                                    if (c.tipo === 'despesa') {
                                        borderColor = 'border-amber-200 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700/50';
                                        icon = '🔻';
                                        textColor = 'text-amber-600 dark:text-amber-400';
                                    } else if (c.tipo === 'investimento') {
                                        borderColor = 'border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700/50';
                                        icon = '📈';
                                        textColor = 'text-blue-600 dark:text-blue-400';
                                    } else {
                                        borderColor = 'border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-700/50';
                                        icon = '💰';
                                        textColor = 'text-emerald-600 dark:text-emerald-400';
                                    }
                                }

                                return (
                                    <div key={c.id} className={`bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border shadow-sm flex justify-between items-center group transition-all hover:shadow-md ${borderColor}`}>
                                        <div className="flex items-center gap-3.5 min-w-0 pr-2 flex-1">
                                            <span className="text-xl bg-slate-50 dark:bg-slate-800 w-12 h-12 flex items-center justify-center rounded-full shadow-inner shrink-0 border border-slate-100 dark:border-slate-700/50">{icon}</span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5 min-w-0">
                                                    <h4 className="font-black text-slate-800 dark:text-slate-100 leading-tight truncate text-sm md:text-base">
                                                        {c.nome}
                                                    </h4>
                                                    {isGaragemFlag && <span className="shrink-0 text-[9px] uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50 shadow-sm">🏍️ Garagem</span>}
                                                </div>
                                                {isMeta ? (
                                                    <p className="text-[10px] font-black uppercase mt-1 tracking-wider text-slate-500 dark:text-slate-400 truncate">
                                                        {c.tipo === 'despesa' ? 'Teto: ' : 'Alvo: '}
                                                        <span className={textColor}>{formatarMoeda(c.meta)}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] font-bold uppercase mt-1 tracking-wider text-slate-400 dark:text-slate-500 truncate">
                                                        Categoria Simples
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0 shadow-sm">
                                            <button onClick={() => handleEditarCategoria(c)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Editar">✏️</button>
                                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-600"></div>
                                            <button onClick={() => handleExcluir(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Excluir">🗑️</button>
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