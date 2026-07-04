import React, { useState } from 'react';

export function Dividas({ dividas, transacoes, addDivida, editarSetup, removerSetup, modal }) {
    const [editandoId, setEditandoId] = useState(null);
    const [descricao, setDescricao] = useState('');
    const [valorDivida, setValorDivida] = useState('0,00');
    const [valorParcela, setValorParcela] = useState('0,00');
    const [qtdParcelas, setQtdParcelas] = useState('');
    const [parcelasRestantes, setParcelasRestantes] = useState('');
    const [diaVencimento, setDiaVencimento] = useState('');
    const [paraTerceiros, setParaTerceiros] = useState(false);
    const [nomeTerceiro, setNomeTerceiro] = useState('');

    const handleCurrency = (e, setter) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value === '') value = '0';
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) return;
        const stringValue = numericValue.toString().padStart(3, '0');
        const inteiros = stringValue.slice(0, -2);
        const centavos = stringValue.slice(-2);
        const inteirosFormatados = inteiros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        setter(`${inteirosFormatados},${centavos}`);
    };

    const handleEditar = (d) => {
        setEditandoId(d.id);
        setDescricao(d.descricao);
        setValorDivida(Number(d.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setValorParcela(Number(d.valor_parcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setQtdParcelas(d.qtd_parcelas);

        // MOTOR DE CÁLCULO REVERSO: Descobre as parcelas restantes atuais lendo o Extrato e a base!
        const pagasIniciais = Number(d.parcelas_pagas_iniciais || 0);
        const parcelasPagasNoExtrato = transacoes.filter(t => String(t.nomeContaFixa).toLowerCase() === String(d.descricao).toLowerCase() && t.status === 'pago').length;
        const parcelasPagasTotal = pagasIniciais + parcelasPagasNoExtrato;

        setParcelasRestantes(d.qtd_parcelas - parcelasPagasTotal);
        setDiaVencimento(d.dia_vencimento);
        setParaTerceiros(d.para_terceiros === 1);
        setNomeTerceiro(d.nome_terceiro || '');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelarEdicao = () => {
        setEditandoId(null);
        setDescricao('');
        setValorDivida('0,00');
        setValorParcela('0,00');
        setQtdParcelas('');
        setParcelasRestantes('');
        setDiaVencimento('');
        setParaTerceiros(false);
        setNomeTerceiro('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (valorParcela === '0,00') {
            modal.alert('O valor da parcela não pode ser zero.', 'Aviso');
            return;
        }

        if (editandoId) {
            const parseCurrency = (val) => Number(String(val).replace(/\./g, '').replace(',', '.'));
            const totais = Number(qtdParcelas);
            const restantes = Number(parcelasRestantes);

            // Recalibra o histórico caso a pessoa altere as parcelas restantes na edição
            const pagasNoExtratoAtuais = transacoes.filter(t => String(t.nomeContaFixa).toLowerCase() === String(descricao).toLowerCase() && t.status === 'pago').length;
            const pagasIniciais = (totais - restantes) - pagasNoExtratoAtuais;

            const sucesso = await editarSetup('dividas', editandoId, {
                descricao,
                valor_total: parseCurrency(valorDivida),
                valor_parcela: parseCurrency(valorParcela),
                qtd_parcelas: totais,
                parcelas_pagas_iniciais: pagasIniciais,
                dia_vencimento: Number(diaVencimento),
                para_terceiros: paraTerceiros ? 1 : 0,
                nome_terceiro: nomeTerceiro || ''
            });

            if (sucesso) {
                cancelarEdicao();
                modal.alert('Dívida atualizada com sucesso!', '✅ Editado');
            }
        } else {
            await addDivida(e);
            cancelarEdicao();
        }
    };

    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta dívida? As parcelas que já foram pagas no extrato não serão afetadas, mas o sistema deixará de gerar as próximas automaticamente.', '🗑️ Excluir Dívida', { confirmLabel: 'Sim, Excluir', confirmColor: 'bg-red-600 hover:bg-red-700' });
        if (ok) removerSetup('dividas', id);
    };

    const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 animate-fade-in relative">
            <div className="sticky top-0 z-40 pt-4 md:pt-6 pb-2 -mt-4 md:-mt-6 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md mb-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">📉 Dívidas e Financiamentos</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe a quitação de empréstimos, consórcios e repasses a terceiros.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-1 border p-5 rounded-xl shadow-sm h-fit lg:sticky top-32 z-10 transition-colors ${editandoId ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                        {editandoId ? '✏️ Editar Dívida' : 'Registrar Dívida'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
                            <input name="descricao" type="text" value={descricao} onChange={e => setDescricao(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: Consórcio Moto, Empréstimo Nubank" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor da Dívida (R$)</label>
                                <input name="valor_total" type="text" inputMode="numeric" value={valorDivida} onChange={(e) => handleCurrency(e, setValorDivida)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="0,00" title="Opcional" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor da Parcela (R$)</label>
                                <input name="valor_parcela" type="text" inputMode="numeric" value={valorParcela} onChange={(e) => handleCurrency(e, setValorParcela)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="0,00" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Parcelas Totais</label>
                                <input name="qtd_parcelas" type="number" min="1" value={qtdParcelas} onChange={e => setQtdParcelas(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: 48" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Parcelas Restantes</label>
                                <input name="parcelas_restantes" type="number" min="1" value={parcelasRestantes} onChange={e => setParcelasRestantes(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: 48" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia de Vencimento Mensal</label>
                            <input name="dia_vencimento" type="number" min="1" max="31" value={diaVencimento} onChange={e => setDiaVencimento(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: 10" />
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="flex items-center gap-2 cursor-pointer mb-3">
                                <input type="checkbox" name="para_terceiros" checked={paraTerceiros} onChange={(e) => setParaTerceiros(e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Emprestei meu nome a terceiros</span>
                            </label>

                            {paraTerceiros && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 animate-fade-in-down mb-3">
                                    <label className="block text-[10px] font-bold text-amber-700 dark:text-amber-500 mb-1 uppercase">Nome da Pessoa (Responsável)</label>
                                    <input name="nome_terceiro" type="text" value={nomeTerceiro} onChange={e => setNomeTerceiro(e.target.value)} required className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500" placeholder="Ex: João da Silva" />
                                </div>
                            )}
                        </div>

                        {editandoId ? (
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={cancelarEdicao} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">
                                    Salvar Edição
                                </button>
                            </div>
                        ) : (
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md mt-2">
                                Registrar Contrato
                            </button>
                        )}
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Dívidas em Andamento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dividas.length === 0 ? (
                            <div className="md:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
                                Nenhuma dívida ou financiamento registrado.
                            </div>
                        ) : (
                            dividas.map(d => {
                                const pagasIniciais = Number(d.parcelas_pagas_iniciais || 0);
                                const parcelasPagasNoExtrato = transacoes.filter(t => String(t.nomeContaFixa).toLowerCase() === String(d.descricao).toLowerCase() && t.status === 'pago').length;
                                const parcelasPagas = pagasIniciais + parcelasPagasNoExtrato;

                                const qtdTotal = Number(d.qtd_parcelas);
                                const parcelasRestantes = qtdTotal - parcelasPagas;
                                const pctProgresso = qtdTotal > 0 ? (parcelasPagas / qtdTotal) * 100 : 0;
                                const isQuitado = parcelasPagas >= qtdTotal;

                                return (
                                    <div key={d.id} className={`bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-sm relative overflow-hidden group transition-colors ${editandoId === d.id ? 'border-blue-400' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
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
                                                <button onClick={() => handleEditar(d)} className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer text-sm" title="Editar">✏️</button>
                                                <button onClick={() => handleExcluir(d.id)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-sm" title="Excluir">🗑️</button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Valor Parcela</p>
                                                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatarMoeda(d.valor_parcela)}</p>
                                                {d.valor_total > 0 && <p className="text-[9px] text-slate-400 mt-0.5">Total Recebido: {formatarMoeda(d.valor_total)}</p>}
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
                                                <div className={`h-2 rounded-full transition-all duration-1000 ${isQuitado ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(pctProgresso, 100)}%` }}></div>
                                            </div>
                                            {!isQuitado && <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">Faltam {parcelasRestantes} parcelas</p>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}