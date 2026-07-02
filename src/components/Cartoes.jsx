import React, { useState } from 'react';

/**
 * @file src/components/Cartoes.jsx
 * @description Módulo de gestão de cartões de crédito.
 * Responsável pelo CRUD de cartões, definindo limites e dias de fechamento/vencimento.
 */
export function Cartoes({ cartoes, addCartao, editarSetup, removerSetup, modal }) {
    const [nomeCartao, setNomeCartao] = useState('');
    const [limite, setLimite] = useState('');
    const [diaFechamento, setDiaFechamento] = useState('');
    const [diaVencimento, setDiaVencimento] = useState('');

    // Estado de carregamento para feedback visual e bloqueio de múltiplos cliques
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Intercepta a submissão, ativa o loading e chama a função de persistência.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        await addCartao(e);

        setNomeCartao('');
        setLimite('');
        setDiaFechamento('');
        setDiaVencimento('');

        setIsSubmitting(false);
    };

    /**
     * Aciona prompts sequenciais para a edição dos dados do cartão.
     * CORREÇÃO: Leitura das chaves corretas (melhorDia e vencimento).
     */
    const handleEditar = async (c) => {
        const nNome = await modal.prompt(`1️⃣ Novo NOME do Cartão?`, c.nome, '✏️ Editar Cartão', { confirmLabel: 'Próximo' });
        if (nNome === null) return;

        const nLim = await modal.prompt(`2️⃣ Novo LIMITE (R$)?`, String(c.limite), '✏️ Editar Cartão', { inputType: 'number', confirmLabel: 'Próximo' });
        if (nLim === null) return;

        const nF = await modal.prompt(`3️⃣ Novo Dia de FECHAMENTO?`, String(c.melhorDia || ''), '✏️ Editar Cartão', { inputType: 'number', confirmLabel: 'Próximo' });
        if (nF === null) return;

        const nV = await modal.prompt(`4️⃣ Novo Dia de VENCIMENTO?`, String(c.vencimento || ''), '✏️ Editar Cartão', { inputType: 'number', confirmLabel: 'Salvar' });
        if (nV === null) return;

        const sucesso = await editarSetup('cartoes', c.id, { nome: nNome, limite: Number(nLim), melhorDia: Number(nF), vencimento: Number(nV) });
        if (sucesso) modal.alert('Cartão atualizado com sucesso!', '✅ Editado');
    };

    /**
     * Exige confirmação estrita antes de excluir um cartão de crédito.
     */
    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Atenção: Excluir este cartão pode quebrar faturas vinculadas. Tem certeza?', '🗑️ Excluir', { confirmLabel: 'Excluir', confirmColor: 'bg-red-600 hover:bg-red-700' });
        if (ok) removerSetup('cartoes', id);
    };

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 animate-fade-in">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">💳 Meus Cartões de Crédito</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seus limites e dias de fechamento para faturas inteligentes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm h-fit">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Novo Cartão</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome do Cartão</label>
                            <input name="nome" type="text" value={nomeCartao} onChange={(e) => setNomeCartao(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: Nubank, Itaú" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Limite Total (R$)</label>
                            <input name="limite" type="number" step="0.01" min="0.01" value={limite} onChange={(e) => setLimite(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="0.00" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia Fechamento</label>
                                <input name="melhorDia" type="number" min="1" max="31" value={diaFechamento} onChange={(e) => setDiaFechamento(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia Vencimento</label>
                                <input name="vencimento" type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md flex justify-center items-center gap-2 ${isSubmitting ? 'bg-blue-400 opacity-90 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Cadastrando...
                                </>
                            ) : (
                                'Cadastrar Cartão'
                            )}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
                    {cartoes.length === 0 ? (
                        <div className="md:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">Nenhum cartão cadastrado.</div>
                    ) : (
                        cartoes.map(c => (
                            <div key={c.id} className="bg-gradient-to-tr from-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <h4 className="text-lg font-black tracking-widest uppercase">{c.nome}</h4>

                                    <div className="flex items-center gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditar(c)} className="text-slate-400 hover:text-white transition-colors cursor-pointer" title="Editar">✏️</button>
                                        <button onClick={() => handleExcluir(c.id)} className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer" title="Excluir">🗑️</button>
                                        <span className="text-xl opacity-50 ml-1">💳</span>
                                    </div>
                                </div>
                                <div className="mb-4 relative z-10">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Limite Total</p>
                                    <p className="text-xl font-bold text-emerald-400">{formatarMoeda(c.limite)}</p>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 relative z-10">
                                    {/* CORREÇÃO: Leitura das propriedades 'melhorDia' e 'vencimento' reais */}
                                    <p>Fecha dia <strong className="text-white">{c.melhorDia || '--'}</strong></p>
                                    <p>Vence dia <strong className="text-white">{c.vencimento || '--'}</strong></p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}