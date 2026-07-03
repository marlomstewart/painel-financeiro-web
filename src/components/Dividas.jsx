import React, { useState } from 'react';

export function Dividas({ dividas, transacoes, addDivida, removerSetup, modal }) {
    const [paraTerceiros, setParaTerceiros] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await addDivida(e);
        e.target.reset();
        setParaTerceiros(false);
        setIsSubmitting(false);
    };

    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta dívida? As parcelas que já foram pagas no extrato não serão afetadas, mas o sistema deixará de gerar as próximas automaticamente.', '🗑️ Excluir Dívida', { confirmLabel: 'Sim, Excluir', confirmColor: 'bg-red-600 hover:bg-red-700' });
        if (ok) removerSetup('dividas', id);
    };

    const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 animate-fade-in relative">

            {/* CABEÇALHO FIXO COM VIDRO FOSCO */}
            <div className="sticky top-0 z-40 pt-4 md:pt-6 pb-2 -mt-4 md:-mt-6 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md mb-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">📉 Dívidas e Financiamentos</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe a quitação de empréstimos, consórcios e repasses a terceiros.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ================= FORMULÁRIO DE CADASTRO ================= */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm h-fit sticky top-32">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Registrar Dívida</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
                            <input name="descricao" type="text" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: Consórcio Moto, Empréstimo Nubank" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor Total (Opcional)</label>
                                <input name="valor_total" type="number" step="any" min="0" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: 15000.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor da Parcela</label>
                                <input name="valor_parcela" type="number" step="any" min="0.01" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: 598.61" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Qtd. Parcelas</label>
                                <input name="qtd_parcelas" type="number" min="1" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: 48" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia Vencimento</label>
                                <input name="dia_vencimento" type="number" min="1" max="31" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: 10" />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="flex items-center gap-2 cursor-pointer mb-3">
                                <input type="checkbox" name="para_terceiros" checked={paraTerceiros} onChange={(e) => setParaTerceiros(e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Emprestei meu nome a terceiros</span>
                            </label>

                            {paraTerceiros && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 animate-fade-in-down mb-3">
                                    <label className="block text-[10px] font-bold text-amber-700 dark:text-amber-500 mb-1 uppercase">Nome da Pessoa (Responsável)</label>
                                    <input name="nome_terceiro" type="text" required className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500" placeholder="Ex: João da Silva" />
                                    <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-2 font-medium">As parcelas desta dívida aparecerão no seu Extrato para cobrança, mas o valor NÃO será somado no seu Gasto Real do Dashboard.</p>
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={isSubmitting} className={`w-full text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md flex justify-center items-center gap-2 ${isSubmitting ? 'bg-blue-400 opacity-90 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            Registrar Contrato
                        </button>
                    </form>
                </div>

                {/* ================= GRELHA DE DÍVIDAS ATIVAS ================= */}
                <div className="lg:col-span-2 space-y-6">

                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Contratos em Andamento</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dividas.length === 0 ? (
                            <div className="md:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
                                Nenhuma dívida ou financiamento registrado.
                            </div>
                        ) : (
                            dividas.map(d => {
                                // MOTOR DE CÁLCULO: Varrer o Extrato
                                // Pega todas as parcelas dessa dívida que já constam como 'pago'
                                const parcelasPagas = transacoes.filter(t => t.nomeContaFixa === d.descricao && t.status === 'pago').length;
                                const qtdTotal = Number(d.qtd_parcelas);
                                const parcelasRestantes = qtdTotal - parcelasPagas;
                                const pctProgresso = qtdTotal > 0 ? (parcelasPagas / qtdTotal) * 100 : 0;
                                const isQuitado = parcelasPagas >= qtdTotal;

                                return (
                                    <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group">

                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-base font-black text-slate-800 dark:text-slate-100">{d.descricao}</h4>
                                                {d.para_terceiros === 1 && (
                                                    <span className="inline-block mt-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm border border-amber-200 dark:border-amber-800">
                                                        🤝 {d.nome_terceiro}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleExcluir(d.id)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-sm" title="Excluir">🗑️</button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Valor Parcela</p>
                                                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatarMoeda(d.valor_parcela)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Vencimento</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Dia {d.dia_vencimento}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className={`text-xs font-black ${isQuitado ? 'text-emerald-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    {isQuitado ? '🎉 Quitado!' : `${parcelasPagas} de ${qtdTotal} Pagas`}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500">{pctProgresso.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-1000 ${isQuitado ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min(pctProgresso, 100)}%` }}
                                                ></div>
                                            </div>
                                            {!isQuitado && (
                                                <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">Faltam {parcelasRestantes} parcelas</p>
                                            )}
                                        </div>

                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* DICA DE CARTÕES (AUTOMÁTICO) */}
                    <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl flex items-start gap-3">
                        <span className="text-xl">💳</span>
                        <div>
                            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400">Dívidas Automáticas de Cartão</h4>
                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1 leading-relaxed">
                                Qualquer compra inserida na aba de <strong>Novo Lançamento</strong> utilizando Cartão de Crédito e parcelada em mais de 10x é controlada automaticamente na sua aba de Cartões de Crédito. O limite é atualizado em tempo real!
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}