import React, { useState } from 'react';
import { CreditCard, Pencil, Trash2 } from 'lucide-react';

/**
 * @file src/components/Cartoes.jsx
 * @description Módulo de gestão de Cartões de Crédito. 
 * Permite auditar limites disponíveis, separação de gastos (pessoais vs. terceiros) e dias de fechamento.
 */
export function Cartoes({ transacoes = [], cartoes, addCartao, editarSetup, removerSetup, modal }) {
    const [nomeCartao, setNomeCartao] = useState('');
    const [limite, setLimite] = useState('');
    const [diaFechamento, setDiaFechamento] = useState('');
    const [diaVencimento, setDiaVencimento] = useState('');

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
    const handleLimiteChange = (e) => setLimite(formatCurrencyInput(e.target.value));

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addCartao(e);
        setNomeCartao('');
        setLimite('');
        setDiaFechamento('');
        setDiaVencimento('');
    };

    const handleEditar = async (c) => {
        const nNome = await modal.prompt(`Passo 1 de 4 — Novo NOME do Cartão?`, c.nome, 'Editar Cartão', { confirmLabel: 'Próximo' });
        if (!nNome) return;

        const nLim = await modal.prompt(`Passo 2 de 4 — Novo LIMITE (R$)?`, '', 'Editar Cartão', { inputType: 'currency', confirmLabel: 'Próximo' });
        if (!nLim || isNaN(Number(nLim)) || Number(nLim) <= 0) return modal.alert('Valor de limite inválido. Edição cancelada.', 'Erro');

        const nF = await modal.prompt(`Passo 3 de 4 — Novo Dia de FECHAMENTO?`, String(c.melhorDia || ''), 'Editar Cartão', { inputType: 'number', confirmLabel: 'Próximo' });
        if (!nF || isNaN(Number(nF))) return modal.alert('Dia de fechamento inválido. Edição cancelada.', 'Erro');

        const nV = await modal.prompt(`Passo 4 de 4 — Novo Dia de VENCIMENTO?`, String(c.vencimento || ''), 'Editar Cartão', { inputType: 'number', confirmLabel: 'Salvar' });
        if (!nV || isNaN(Number(nV))) return modal.alert('Dia de vencimento inválido. Edição cancelada.', 'Erro');

        const sucesso = await editarSetup('cartoes', c.id, {
            nome: nNome,
            limite: Number(nLim),
            melhorDia: Number(nF),
            vencimento: Number(nV)
        });

        if (sucesso) modal.alert('Cartão atualizado com sucesso!', 'Editado');
    };

    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Atenção: Excluir este cartão pode quebrar faturas vinculadas. Tem certeza?', 'Excluir', { confirmLabel: 'Excluir', confirmColor: 'bg-rose-600 hover:bg-rose-700' });
        if (ok) removerSetup('cartoes', id);
    };

    const formatarMoeda = (valor) => {
        const numero = Number(valor);
        const valorSeguro = isNaN(numero) ? 0 : numero;
        return valorSeguro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // UI Constantes (Mobile-First)
    const inputCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors shadow-sm";
    const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 md:mb-1 tracking-wide";

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 animate-fade-in relative">

            {/* CABEÇALHO PADRÃO (SÓLIDO E ROLÁVEL) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                        <CreditCard className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                            Meus Cartões de Crédito
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Gerencie seus limites, uso em tempo real e dias de faturamento.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* COLUNA ESQUERDA: FORMULÁRIO DE CADASTRO */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-sm h-fit">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">Novo Cartão</h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={labelCls}>Nome do Cartão</label>
                            <input name="nome" type="text" value={nomeCartao} onChange={(e) => setNomeCartao(e.target.value)} required className={inputCls} placeholder="Ex: Nubank, Itaú" />
                        </div>
                        <div>
                            <label className={labelCls}>Limite Total (R$)</label>
                            <input name="limite" type="text" inputMode="numeric" value={limite} onChange={handleLimiteChange} required className={`${inputCls} font-bold text-blue-600 dark:text-blue-400`} placeholder="0,00" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Dia Fechamento</label>
                                <input name="melhorDia" type="number" min="1" max="31" value={diaFechamento} onChange={(e) => setDiaFechamento(e.target.value)} required className={inputCls} placeholder="Ex: 5" />
                            </div>
                            <div>
                                <label className={labelCls}>Dia Vencimento</label>
                                <input name="vencimento" type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} required className={inputCls} placeholder="Ex: 12" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 md:py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md flex justify-center items-center gap-2 active:scale-[0.98] mt-2"
                        >
                            Cadastrar Cartão
                        </button>
                    </form>
                </div>

                {/* COLUNA DIREITA: LISTAGEM DE CARDS DE CRÉDITO */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 h-fit">
                    {cartoes.length === 0 ? (
                        <div className="md:col-span-2 text-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30">
                            <CreditCard className="w-8 h-8 mx-auto mb-3 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                            <span className="font-semibold text-sm">Nenhum cartão cadastrado.</span>
                        </div>
                    ) : (
                        cartoes.map(c => {
                            const transacoesCartao = transacoes.filter(t => t.status === 'pendente' && String(t.formaPagamento) === `credito_${c.id}`);

                            const gastosPessoais = transacoesCartao.filter(t => !t.isThirdParty).reduce((acc, t) => acc + Number(t.valorParcela || t.valor || 0), 0);
                            const gastosTerceiros = transacoesCartao.filter(t => t.isThirdParty).reduce((acc, t) => acc + Number(t.valorParcela || t.valor || 0), 0);

                            const limiteUtilizado = gastosPessoais + gastosTerceiros;
                            const limiteTotal = Number(c.limite || 0);
                            const limiteRestante = limiteTotal - limiteUtilizado;

                            let pctUtilizado = limiteTotal > 0 ? (limiteUtilizado / limiteTotal) * 100 : 0;
                            const isEstourado = limiteRestante < 0;

                            return (
                                <div key={c.id} className="bg-gradient-to-tr from-slate-800 to-slate-900 text-white p-5 md:p-6 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden group flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none"></div>

                                    <div>
                                        <div className="flex justify-between items-start mb-6 relative z-10 gap-2">
                                            <h4 className="text-base md:text-lg font-black tracking-widest uppercase truncate">{c.nome}</h4>

                                            {/* 🔥 MOBILE FIX: Pílula de ações sempre visível no mobile */}
                                            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0 shadow-sm">
                                                <button onClick={() => handleEditar(c)} className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer rounded hover:bg-slate-700" title="Editar"><Pencil className="w-3.5 h-3.5" strokeWidth={2} /></button>
                                                <div className="w-px h-4 bg-slate-600"></div>
                                                <button onClick={() => handleExcluir(c.id)} className="p-1.5 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer rounded hover:bg-slate-700" title="Excluir"><Trash2 className="w-3.5 h-3.5" strokeWidth={2} /></button>
                                            </div>
                                        </div>

                                        <div className="mb-5 relative z-10 space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Limite Disponível</p>
                                                    <p className={`text-xl md:text-2xl font-black ${isEstourado ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {formatarMoeda(limiteRestante)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Limite Total</p>
                                                    <p className="text-sm font-bold text-slate-300">{formatarMoeda(limiteTotal)}</p>
                                                </div>
                                            </div>

                                            <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden shadow-inner border border-slate-600/50">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${isEstourado ? 'bg-rose-500' : pctUtilizado > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min(pctUtilizado, 100)}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex flex-col gap-1.5 text-[10px] font-semibold text-slate-300 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/70 shadow-inner">
                                                <div className="flex justify-between items-center">
                                                    <span>Meus Gastos:</span>
                                                    <strong className="text-white">{formatarMoeda(gastosPessoais)}</strong>
                                                </div>
                                                {gastosTerceiros > 0 && (
                                                    <div className="flex justify-between items-center text-amber-400">
                                                        <span>De Terceiros:</span>
                                                        <strong>{formatarMoeda(gastosTerceiros)}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-[10px] text-slate-400 relative z-10 border-t border-slate-700/50 pt-3 uppercase tracking-wider mt-auto">
                                        <p>Fechamento: <strong className="text-white">Dia {c.melhorDia || '--'}</strong></p>
                                        <p>Vencimento: <strong className="text-white">Dia {c.vencimento || '--'}</strong></p>
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