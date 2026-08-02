import React, { useState } from 'react';

export function ContasFixas({ contasFixas, cartoes = [], addContaFixa, editarSetup, removerSetup, modal }) {
    const [editandoId, setEditandoId] = useState(null);
    const [nome, setNome] = useState('');
    const [valorPadrao, setValorPadrao] = useState('0,00');
    const [vencimento, setVencimento] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('pix');

    const isCredito = formaPagamento.startsWith('credito_');

    const handleCurrency = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value === '') value = '0';
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) return;
        const stringValue = numericValue.toString().padStart(3, '0');
        const inteiros = stringValue.slice(0, -2);
        const centavos = stringValue.slice(-2);
        const inteirosFormatados = inteiros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        setValorPadrao(`${inteirosFormatados},${centavos}`);
    };

    const handleEditar = (conta) => {
        setEditandoId(conta.id);
        setNome(conta.nome);
        setValorPadrao(Number(conta.valorPadrao || conta.valorpadrao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setVencimento(conta.vencimento);
        setFormaPagamento(conta.formaPagamento || conta.forma_pagamento || 'pix');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelarEdicao = () => {
        setEditandoId(null);
        setNome('');
        setValorPadrao('0,00');
        setVencimento('');
        setFormaPagamento('pix');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editandoId) {
            const parseCurrency = (val) => Number(String(val).replace(/\./g, '').replace(',', '.'));
            const sucesso = await editarSetup('contas_fixas', editandoId, {
                nome,
                valorPadrao: parseCurrency(valorPadrao),
                vencimento: Number(vencimento),
                forma_pagamento: formaPagamento
            });
            if (sucesso) {
                cancelarEdicao();
                modal.alert('Conta fixa atualizada com sucesso!', '✅ Editado');
            }
        } else {
            await addContaFixa(e);
            cancelarEdicao();
        }
    };

    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta conta fixa? Lançamentos passados não serão afetados.', '🗑️ Excluir Conta', { confirmLabel: 'Sim, Excluir', confirmColor: 'bg-red-600 hover:bg-red-700' });
        if (ok) removerSetup('contas_fixas', id);
    };

    const obterNomePagamento = (forma) => {
        if (!forma || forma === 'pix') return 'PIX / Dinheiro';
        if (forma === 'debito') return 'Débito';
        if (forma.startsWith('credito_')) {
            const cartaoId = forma.split('_')[1];
            const cartao = cartoes.find(c => String(c.id) === String(cartaoId));
            return cartao ? `Crédito ${cartao.nome}` : 'Crédito (Excluído)';
        }
        return forma;
    };

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 relative animate-fade-in">

            {/* 🌟 CABEÇALHO PADRÃO (SÓLIDO E ROLÁVEL) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        🔄 Contas Fixas
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Automatize despesas recorrentes (Internet, Água, Condomínio).
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm transition-colors">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                        {editandoId ? '✏️ Editar Despesa' : 'Nova Despesa'}
                        {isCredito && <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-2 py-0.5 rounded ml-auto">Modo Cartão de Crédito</span>}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
                                <input name="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="Ex: Internet Claro" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor Padrão (R$)</label>
                                <input name="valorPadrao" type="text" inputMode="numeric" value={valorPadrao} onChange={handleCurrency} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="0,00" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Forma Pagamento</label>
                                <select name="forma_pagamento" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors">
                                    <option value="pix">PIX / Dinheiro</option>
                                    <option value="debito">Débito</option>
                                    {cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <label className={`block text-xs font-semibold mb-1 transition-colors ${isCredito ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {isCredito ? 'Dia da Compra (Cobrança)' : 'Dia Vencimento'}
                                </label>
                                <input name="vencimento" type="number" min="1" max="31" value={vencimento} onChange={e => setVencimento(e.target.value)} required className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition-colors ${isCredito ? 'border-indigo-300 dark:border-indigo-700/50 focus:border-indigo-500' : 'border-slate-200 dark:border-slate-800 focus:border-blue-500'}`} placeholder="Ex: 5" />
                                {isCredito && (
                                    <p className="text-[10px] text-indigo-500 mt-1 leading-tight absolute w-full">
                                        O sistema avaliará a data de fechamento do cartão para lançar na fatura do mês correto.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className={`pt-4 ${isCredito ? 'mt-6' : 'mt-2'}`}>
                            {editandoId ? (
                                <div className="flex gap-2">
                                    <button type="button" onClick={cancelarEdicao} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">
                                        Salvar Edição
                                    </button>
                                </div>
                            ) : (
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">
                                    Salvar Conta Fixa
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 pl-1">Despesas Automatizadas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contasFixas.length === 0 ? (
                        <div className="sm:col-span-2 lg:col-span-3 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
                            Nenhuma conta fixa registrada.
                        </div>
                    ) : (
                        contasFixas.map(conta => {
                            const contaIsCredito = (conta.formaPagamento || conta.forma_pagamento)?.startsWith('credito_');

                            return (
                                <div key={conta.id} className={`bg-white dark:bg-slate-900 border p-4 rounded-xl shadow-sm relative group transition-colors ${editandoId === conta.id ? 'border-blue-400' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate pr-2 flex items-center gap-1">
                                            <span className="text-rose-500">🔻</span> {conta.nome}
                                        </h4>
                                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 pl-2">
                                            <button onClick={() => handleEditar(conta)} className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-xs" title="Editar">✏️</button>
                                            <button onClick={() => handleExcluir(conta.id)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-xs" title="Excluir">🗑️</button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Valor Padrão</p>
                                            <p className="text-base font-black text-rose-600 dark:text-rose-400">R$ {Number(conta.valorPadrao || conta.valorpadrao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-0.5">
                                                {contaIsCredito ? 'Dia da Cobrança' : 'Vencimento'}
                                            </p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Dia {conta.vencimento}</p>
                                            <p className={`text-[9px] font-black uppercase mt-0.5 truncate max-w-[100px] ${contaIsCredito ? 'text-indigo-500' : 'text-slate-500'}`}>
                                                {obterNomePagamento(conta.formaPagamento || conta.forma_pagamento)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}