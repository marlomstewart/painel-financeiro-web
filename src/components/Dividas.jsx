import React, { useState } from 'react';

/**
 * @file src/components/Dividas.jsx
 * @description Módulo de gestão de passivos longo prazo (Empréstimos, Consórcios, Financiamentos).
 * Controla os pagamentos efetuados e permite isolar dívidas contraídas para terceiros (nome sujo).
 */
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

            const fakeEvent = { preventDefault: () => { }, target: { reset: () => { } } };
            await addDivida(fakeEvent, novaDivida);
            cancelarEdicao();
        }
    };

    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta dívida? Os lançamentos passados no extrato não serão afetados.', '🗑️ Excluir Dívida', { confirmLabel: 'Sim, Excluir', confirmColor: 'bg-rose-600 hover:bg-rose-700' });
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

    // UI Constantes (Mobile-First)
    const inputCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors shadow-sm";
    const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 md:mb-1 tracking-wide";

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 animate-fade-in relative">

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        📉 Dívidas e Financiamentos
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Controle empréstimos, consórcios e compras parceladas longo prazo.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-xl shadow-sm transition-colors">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-5 border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-wrap items-center gap-2">
                        {editandoId ? '✏️ Editar Dívida' : 'Registrar Nova Dívida'}
                        {isCredito && <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-2.5 py-1 rounded-md ml-auto shadow-sm">Modo Cartão de Crédito</span>}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={labelCls}>Descrição / Motivo</label>
                                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} required className={inputCls} placeholder="Ex: Financiamento Carro" />
                            </div>
                            <div>
                                <label className={labelCls}>Valor Total (R$)</label>
                                <input type="text" inputMode="numeric" value={valorTotal} onChange={handleValorTotal} onBlur={calcularParcelas} required className={`${inputCls} font-bold text-blue-600 dark:text-blue-400`} placeholder="0,00" />
                            </div>
                            <div>
                                <label className={labelCls}>Valor da Parcela (R$)</label>
                                <input type="text" inputMode="numeric" value={valorParcela} onChange={handleValorParcela} onBlur={calcularParcelas} required className={`${inputCls} font-bold text-rose-600 dark:text-rose-400`} placeholder="0,00" />
                            </div>
                            <div>
                                <label className={labelCls}>Qtd. de Parcelas</label>
                                <input type="number" min="1" value={qtdParcelas} onChange={e => setQtdParcelas(e.target.value)} required className={inputCls} placeholder="Ex: 48" />
                            </div>
                            <div>
                                <label className={labelCls}>Quantas já foram pagas?</label>
                                <input type="number" min="0" value={parcelasPagasIniciais} onChange={e => setParcelasPagasIniciais(e.target.value)} className={inputCls} placeholder="Ex: 0" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div>
                                <label className={labelCls}>Forma de Pagamento</label>
                                <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className={inputCls}>
                                    <option value="pix">PIX / Dinheiro</option>
                                    <option value="debito">Débito</option>
                                    {cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <label className={`block text-xs font-semibold mb-1.5 md:mb-1 transition-colors tracking-wide ${isCredito ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {isCredito ? 'Dia da Compra (Cobrança)' : 'Dia de Vencimento'}
                                </label>
                                <input type="number" min="1" max="31" value={diaVencimento} onChange={e => setDiaVencimento(e.target.value)} required className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition-colors shadow-sm ${isCredito ? 'border-indigo-300 dark:border-indigo-700/50 focus:border-indigo-500' : 'border-slate-200 dark:border-slate-800 focus:border-blue-500'}`} placeholder="Ex: 10" />
                                {isCredito && (
                                    <p className="text-[10px] text-indigo-500 mt-1.5 leading-tight absolute w-full font-medium">
                                        O sistema avaliará a data de fechamento do cartão para lançar na fatura do mês correto.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="flex items-center gap-3 cursor-pointer w-fit mb-3 py-1">
                                <input type="checkbox" checked={paraTerceiros} onChange={e => setParaTerceiros(e.target.checked)} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dívida feita para terceiros (Nome Sujo)</span>
                            </label>
                            {paraTerceiros && (
                                <div className="animate-fade-in-down mt-2 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-800/30">
                                    <label className="block text-xs font-semibold text-amber-700 dark:text-amber-500 mb-1.5 tracking-wide">Nome da Pessoa</label>
                                    <input type="text" value={nomeTerceiro} onChange={e => setNomeTerceiro(e.target.value)} required className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700/50 rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 shadow-sm" placeholder="Ex: João da Silva" />
                                </div>
                            )}
                        </div>

                        <div className={`pt-4 ${isCredito ? 'mt-8' : 'mt-2'}`}>
                            {editandoId ? (
                                <div className="flex gap-3">
                                    <button type="button" onClick={cancelarEdicao} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 md:py-3 rounded-lg text-sm transition-colors cursor-pointer active:scale-[0.98]">Cancelar</button>
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 md:py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md active:scale-[0.98]">Salvar Edição</button>
                                </div>
                            ) : (
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 md:py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md active:scale-[0.98]">Registrar Dívida</button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div className="pt-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 pl-1">Acompanhamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {dividas.length === 0 ? (
                        <div className="md:col-span-2 lg:col-span-3 text-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30">
                            <span className="text-3xl opacity-50 block mb-3">📉</span>
                            <span className="font-semibold text-sm">Nenhuma dívida registrada.</span>
                        </div>
                    ) : (
                        dividas.map(divida => {
                            const progresso = getProgresso(divida);
                            const concluida = progresso.pagas >= progresso.total;
                            const dividaIsCredito = (divida.forma_pagamento)?.startsWith('credito_');

                            return (
                                <div key={divida.id} className={`bg-white dark:bg-slate-900 border rounded-xl shadow-sm relative group overflow-hidden transition-all flex flex-col hover:shadow-md ${editandoId === divida.id ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'} ${concluida ? 'opacity-70' : ''}`}>
                                    <div className="p-4 md:p-5 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4 gap-2">
                                            <div className="min-w-0 pr-2">
                                                <h4 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 flex items-start gap-1.5 leading-tight truncate">
                                                    {concluida ? <span className="text-emerald-500 shrink-0">✅</span> : <span className="text-amber-500 shrink-0">⏳</span>}
                                                    <span className="truncate">{divida.descricao}</span>
                                                </h4>
                                                {divida.para_terceiros === 1 && (
                                                    <span className="inline-block mt-2 bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border border-rose-200 dark:border-rose-800/50 shadow-sm truncate max-w-full">
                                                        🤝 P/ Terceiro: {divida.nome_terceiro}
                                                    </span>
                                                )}
                                            </div>

                                            {/* 🔥 MOBILE FIX: Pílula de ações explícita e elegante */}
                                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0 shadow-sm">
                                                <button onClick={() => handleEditar(divida)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Editar">✏️</button>
                                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-600"></div>
                                                <button onClick={() => handleExcluir(divida.id)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Excluir">🗑️</button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-3.5 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 mb-5 mt-auto">
                                            <div>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Total</p>
                                                <p className="text-sm font-black text-slate-700 dark:text-slate-300 truncate">R$ {Number(divida.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Parcela / Forma</p>
                                                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate">R$ {Number(divida.valor_parcela).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <p className={`text-[9px] font-black uppercase mt-0.5 truncate max-w-[120px] ml-auto ${dividaIsCredito ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {obterNomePagamento(divida.forma_pagamento)}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-1.5 text-[10px] font-black uppercase tracking-wider">
                                                <span className="text-slate-500 dark:text-slate-400">Progresso</span>
                                                <span className={concluida ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}>
                                                    {progresso.pagas} / {progresso.total} <span className="opacity-60 ml-1">({progresso.percentual}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-300 dark:border-slate-700">
                                                <div className={`h-full rounded-full transition-all duration-700 ease-out ${concluida ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progresso.percentual}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-100/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 py-2.5 px-4 text-center mt-auto">
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {dividaIsCredito ? 'Compra dia' : 'Vence dia'} <strong className="text-slate-800 dark:text-slate-200">{divida.dia_vencimento}</strong>
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