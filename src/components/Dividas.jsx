import React, { useState } from 'react';

export function Dividas({ dividas, transacoes, cartoes = [], addDivida, editarSetup, removerSetup, modal }) {
    const [editandoId, setEditandoId] = useState(null);
    const [descricao, setDescricao] = useState('');
    const [valorTotal, setValorTotal] = useState('');
    const [valorParcela, setValorParcela] = useState('');
    const [qtdParcelas, setQtdParcelas] = useState('');
    const [parcelasPagasIniciais, setParcelasPagasIniciais] = useState('0');
    const [diaVencimento, setDiaVencimento] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('pix');
    const [paraTerceiros, setParaTerceiros] = useState(false);
    const [nomeTerceiro, setNomeTerceiro] = useState('');

    const isCredito = formaPagamento.startsWith('credito_');

    const formatCurrencyInput = (value) => {
        let v = value.replace(/\D/g, '');
        if (v === '') v = '0';
        const num = parseInt(v, 10);
        if (isNaN(num)) return '';
        const str = num.toString().padStart(3, '0');
        const intPart = str.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        const centPart = str.slice(-2);
        return `${intPart},${centPart}`;
    };

    const handleValorTotal = (e) => setValorTotal(formatCurrencyInput(e.target.value));
    const handleValorParcela = (e) => setValorParcela(formatCurrencyInput(e.target.value));

    const parseCurrency = (val) => Number(String(val).replace(/\./g, '').replace(',', '.'));

    const calcularParcelas = () => {
        const total = parseCurrency(valorTotal);
        const parcela = parseCurrency(valorParcela);
        if (total > 0 && parcela > 0) {
            const qtd = Math.ceil(total / parcela);
            setQtdParcelas(qtd.toString());
        }
    };

    const handleEditar = (divida) => {
        setEditandoId(divida.id);
        setDescricao(divida.descricao);
        setValorTotal(Number(divida.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setValorParcela(Number(divida.valor_parcela).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setQtdParcelas(String(divida.qtd_parcelas));
        setParcelasPagasIniciais(String(divida.parcelas_pagas_iniciais || 0));
        setDiaVencimento(String(divida.dia_vencimento));
        setFormaPagamento(divida.forma_pagamento || 'pix');
        setParaTerceiros(divida.para_terceiros === 1);
        setNomeTerceiro(divida.nome_terceiro || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelarEdicao = () => {
        setEditandoId(null);
        setDescricao('');
        setValorTotal('');
        setValorParcela('');
        setQtdParcelas('');
        setParcelasPagasIniciais('0');
        setDiaVencimento('');
        setFormaPagamento('pix');
        setParaTerceiros(false);
        setNomeTerceiro('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editandoId) {
            const sucesso = await editarSetup('dividas', editandoId, {
                descricao,
                valor_total: parseCurrency(valorTotal),
                valor_parcela: parseCurrency(valorParcela),
                qtd_parcelas: Number(qtdParcelas),
                parcelas_pagas_iniciais: Number(parcelasPagasIniciais),
                dia_vencimento: Number(diaVencimento),
                forma_pagamento: formaPagamento,
                para_terceiros: paraTerceiros ? 1 : 0,
                nome_terceiro: paraTerceiros ? nomeTerceiro : null
            });
            if (sucesso) {
                cancelarEdicao();
                modal.alert('Dívida atualizada com sucesso!', '✅ Editado');
            }
        } else {
            const novaDivida = {
                descricao,
                valor_total: parseCurrency(valorTotal),
                valor_parcela: parseCurrency(valorParcela),
                qtd_parcelas: Number(qtdParcelas),
                parcelas_pagas_iniciais: Number(parcelasPagasIniciais),
                dia_vencimento: Number(diaVencimento),
                forma_pagamento: formaPagamento,
                para_terceiros: paraTerceiros ? 1 : 0,
                nome_terceiro: paraTerceiros ? nomeTerceiro : null
            };

            // Simula o evento para o addDivida mantendo compatibilidade
            const fakeEvent = { preventDefault: () => { }, target: { reset: () => { } } };
            await addDivida(fakeEvent, novaDivida);
            cancelarEdicao();
        }
    };

    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta dívida? Os lançamentos passados no extrato não serão afetados.', '🗑️ Excluir Dívida', { confirmLabel: 'Sim, Excluir', confirmColor: 'bg-red-600 hover:bg-red-700' });
        if (ok) removerSetup('dividas', id);
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

    const getProgresso = (divida) => {
        const historicoPagamentos = transacoes.filter(t =>
            t.grupo_id === `divida_${divida.id}` &&
            t.status === 'pago' &&
            t.tipo === 'saida'
        ).length;
        const totalPago = (divida.parcelas_pagas_iniciais || 0) + historicoPagamentos;
        const total = divida.qtd_parcelas;
        return { pagas: totalPago, total, percentual: total === 0 ? 0 : Math.min(100, Math.round((totalPago / total) * 100)) };
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-24 animate-fade-in relative">
            <div className="sticky top-0 z-40 pt-4 md:pt-6 pb-2 -mt-4 md:-mt-6 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md mb-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">📉 Dívidas e Financiamentos</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Controle empréstimos, consórcios e compras parceladas longo prazo.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm transition-colors">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    {editandoId ? '✏️ Editar Dívida' : 'Registrar Nova Dívida'}
                    {isCredito && <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-2 py-0.5 rounded ml-auto">Modo Cartão de Crédito</span>}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descrição / Motivo</label>
                            <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: Financiamento Carro" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor Total (R$)</label>
                            <input type="text" inputMode="numeric" value={valorTotal} onChange={handleValorTotal} onBlur={calcularParcelas} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="0,00" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor da Parcela (R$)</label>
                            <input type="text" inputMode="numeric" value={valorParcela} onChange={handleValorParcela} onBlur={calcularParcelas} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="0,00" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Qtd. de Parcelas</label>
                            <input type="number" min="1" value={qtdParcelas} onChange={e => setQtdParcelas(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: 48" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Quantas já foram pagas?</label>
                            <input type="number" min="0" value={parcelasPagasIniciais} onChange={e => setParcelasPagasIniciais(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: 0" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Forma de Pagamento</label>
                            <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors">
                                <option value="pix">PIX / Dinheiro</option>
                                <option value="debito">Débito</option>
                                {cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <label className={`block text-xs font-semibold mb-1 transition-colors ${isCredito ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                {isCredito ? 'Dia da Compra (Cobrança)' : 'Dia de Vencimento'}
                            </label>
                            <input type="number" min="1" max="31" value={diaVencimento} onChange={e => setDiaVencimento(e.target.value)} required className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition-colors ${isCredito ? 'border-indigo-300 dark:border-indigo-700/50 focus:border-indigo-500' : 'border-slate-200 dark:border-slate-800 focus:border-blue-500'}`} placeholder="Ex: 10" />
                            {isCredito && (
                                <p className="text-[10px] text-indigo-500 mt-1 leading-tight absolute w-full">
                                    O sistema avaliará a data de fechamento do cartão para lançar na fatura do mês correto.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer w-fit mb-3">
                            <input type="checkbox" checked={paraTerceiros} onChange={e => setParaTerceiros(e.target.checked)} className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dívida feita para terceiros (Nome Sujo)</span>
                        </label>
                        {paraTerceiros && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome da Pessoa</label>
                                <input type="text" value={nomeTerceiro} onChange={e => setNomeTerceiro(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: João da Silva" />
                            </div>
                        )}
                    </div>

                    <div className={`pt-4 ${isCredito ? 'mt-6' : 'mt-2'}`}>
                        {editandoId ? (
                            <div className="flex gap-2">
                                <button type="button" onClick={cancelarEdicao} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">Salvar Edição</button>
                            </div>
                        ) : (
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">Registrar Dívida</button>
                        )}
                    </div>
                </form>
            </div>

            <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 pl-1">Acompanhamento</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {dividas.length === 0 ? (
                        <div className="lg:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
                            Nenhuma dívida registrada.
                        </div>
                    ) : (
                        dividas.map(divida => {
                            const progresso = getProgresso(divida);
                            const concluida = progresso.pagas >= progresso.total;
                            const dividaIsCredito = (divida.forma_pagamento)?.startsWith('credito_');

                            return (
                                <div key={divida.id} className={`bg-white dark:bg-slate-900 border rounded-xl shadow-sm relative group overflow-hidden transition-colors flex flex-col ${editandoId === divida.id ? 'border-blue-400' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'} ${concluida ? 'opacity-70' : ''}`}>
                                    <div className="p-4 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                                    {concluida ? <span className="text-emerald-500">✅</span> : <span className="text-amber-500">⏳</span>}
                                                    {divida.descricao}
                                                </h4>
                                                {divida.para_terceiros === 1 && (
                                                    <span className="inline-block mt-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded">Para Terceiro: {divida.nome_terceiro}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 pl-2">
                                                <button onClick={() => handleEditar(divida)} className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-xs" title="Editar">✏️</button>
                                                <button onClick={() => handleExcluir(divida.id)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-xs" title="Excluir">🗑️</button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 mb-4 mt-auto">
                                            <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Total da Dívida</p>
                                                <p className="text-sm font-black text-slate-700 dark:text-slate-300">R$ {Number(divida.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Parcela / Forma</p>
                                                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">R$ {Number(divida.valor_parcela).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <p className={`text-[9px] font-black uppercase mt-0.5 truncate ${dividaIsCredito ? 'text-indigo-500' : 'text-slate-500'}`}>
                                                    {obterNomePagamento(divida.forma_pagamento)}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-1 text-[10px] font-bold uppercase tracking-wider">
                                                <span className="text-slate-500 dark:text-slate-400">Progresso</span>
                                                <span className={concluida ? 'text-emerald-500' : 'text-blue-500'}>{progresso.pagas} / {progresso.total} ({progresso.percentual}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-1.5 rounded-full transition-all duration-500 ${concluida ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progresso.percentual}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-100/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 py-2 px-4 text-center">
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {dividaIsCredito ? 'Compra dia' : 'Vence dia'} <strong className="text-slate-700 dark:text-slate-300">{divida.dia_vencimento}</strong>
                                        </span>
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