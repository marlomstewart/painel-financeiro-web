import React, { useMemo, useState } from 'react';

/**
 * @file src/components/Cobrancas.jsx
 * @description Central de Gestão de Terceiros. Agrupa transações e dívidas por mês.
 * Utiliza o NOME EXATO (case insensitive) para agrupar as pessoas e evitar colisão de homônimos.
 */
export function Cobrancas({ transacoes = [], dividas = [], cartoes = [], dataVis, alternarStatusTransacao, editarSetup, modal, showToast }) {

    const mesAtual = dataVis ? dataVis.mes : new Date().getMonth() + 1;
    const anoAtual = dataVis ? dataVis.ano : new Date().getFullYear();

    const [pessoaDetalhe, setPessoaDetalhe] = useState(null);

    // Processamento central: Unifica Transações de Terceiros e Dívidas de Terceiros
    const cobrancasPorPessoa = useMemo(() => {
        const mapa = {};

        // Helper para normalizar e agrupar nomes
        const registrarNoMapa = (nomeBruto) => {
            const nomeStr = nomeBruto.trim();
            // 🔥 CORREÇÃO: Usa o nome inteiro, apenas convertendo para maiúsculo para evitar case-sensitivity
            // Ex: "João" != "João Marcos", mas "JOÃO MARCOS" == "joão marcos"
            const chave = nomeStr.toUpperCase();

            if (!mapa[chave]) {
                mapa[chave] = {
                    nomeExibicao: nomeStr, // Guarda o nome original (ex: João Marcos) para exibição bonita
                    totalPendenteGeral: 0,
                    totalPagoGeral: 0,
                    totalMesAtual: 0,
                    itensMesAtual: [],
                    todasTransacoes: []
                };
            }
            return mapa[chave];
        };

        // 1. PROCESSAR TRANSAÇÕES (Cartão/PIX)
        transacoes.forEach(t => {
            if (!t.isThirdParty || !t.thirdPartyName) return;

            const p = registrarNoMapa(t.thirdPartyName);
            const valorCobrado = Number(t.thirdPartyValue) > 0 ? Number(t.thirdPartyValue) : Number(t.valorParcela || t.valor || 0);
            const isMesAtual = t.mesReferencia === mesAtual && t.anoReferencia === anoAtual;

            let dataVencimento = new Date(t.dataCompra);
            let nomeForma = 'PIX/Débito';

            if (String(t.formaPagamento).startsWith('credito_') && cartoes.length > 0) {
                const cId = t.formaPagamento.split('_')[1];
                const cartao = cartoes.find(c => c.id === cId);
                if (cartao) {
                    dataVencimento = new Date(t.anoReferencia, t.mesReferencia - 1, cartao.vencimento);
                    nomeForma = cartao.nome;
                }
            }

            const itemFormatado = { ...t, valorCobradoCalculado: valorCobrado, dataVencimento, nomeForma, isTransacaoSimples: true };

            p.todasTransacoes.push(itemFormatado);

            if (t.status === 'pendente') {
                p.totalPendenteGeral += valorCobrado;
                if (isMesAtual) {
                    p.totalMesAtual += valorCobrado;
                    p.itensMesAtual.push(itemFormatado);
                }
            } else if (t.status === 'pago') {
                p.totalPagoGeral += valorCobrado;
            }
        });

        // 2. PROCESSAR DÍVIDAS (Empréstimos/Consórcios para Terceiros)
        if (dividas && dividas.length > 0) {
            dividas.forEach(d => {
                if (!d.isThirdParty || !d.thirdPartyName) return;

                const p = registrarNoMapa(d.thirdPartyName);

                const valorParcela = Number(d.valorParcela || 0);
                const parcelasPendentes = Number(d.qtdParcelas) - Number(d.pagas);
                const valorPendenteTotal = parcelasPendentes * valorParcela;
                const valorPagoTotal = Number(d.pagas) * valorParcela;

                p.todasTransacoes.push({
                    isDividaDeLongoPrazo: true,
                    descricao: `Empréstimo: ${d.descricao} (${d.pagas}/${d.qtdParcelas})`,
                    valorCobradoCalculado: valorParcela * d.qtdParcelas,
                    status: parcelasPendentes === 0 ? 'pago' : 'pendente',
                    parcelasTotais: d.qtdParcelas,
                    parcelasPagas: d.pagas,
                    valorPendente: valorPendenteTotal,
                    valorPago: valorPagoTotal
                });

                if (parcelasPendentes > 0) {
                    p.totalPendenteGeral += valorPendenteTotal;
                    p.totalPagoGeral += valorPagoTotal;

                    // Exige 1 parcela no mês atual da tela
                    p.totalMesAtual += valorParcela;

                    let dataVencimento = new Date(anoAtual, mesAtual - 1, d.diaVencimento || 10);

                    p.itensMesAtual.push({
                        id: `divida_${d.id}`,
                        isEmprestimo: true,
                        descricao: `Parcela: ${d.descricao}`,
                        valorCobradoCalculado: valorParcela,
                        dataVencimento: dataVencimento,
                        nomeForma: d.formaPagamento || 'Empréstimo',
                        refDivida: d
                    });
                } else {
                    p.totalPagoGeral += valorPagoTotal;
                }
            });
        }

        return Object.values(mapa).sort((a, b) => b.totalMesAtual - a.totalMesAtual);
    }, [transacoes, dividas, cartoes, mesAtual, anoAtual]);

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const totalGeralMes = cobrancasPorPessoa.reduce((acc, p) => acc + p.totalMesAtual, 0);
    const totalGeralRestante = cobrancasPorPessoa.reduce((acc, p) => acc + p.totalPendenteGeral, 0);

    const gerarTextoCobranca = async (pessoa) => {
        if (pessoa.itensMesAtual.length === 0) {
            modal.alert('Não há cobranças pendentes para esta pessoa no mês atual.', 'Sem cobranças');
            return;
        }

        const nomeMes = new Date(anoAtual, mesAtual - 1).toLocaleString('pt-BR', { month: 'long' });
        const mesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

        let texto = `Oi ${pessoa.nomeExibicao}, tudo bem? ✌️\nAqui estão as cobranças referentes ao mês de *${mesCapitalizado}*:\n\n`;

        const itensOrdenados = [...pessoa.itensMesAtual].sort((a, b) => a.dataVencimento - b.dataVencimento);

        itensOrdenados.forEach(item => {
            const vencFormatado = item.dataVencimento.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' });
            const valorFormatado = formatarMoeda(item.valorCobradoCalculado);
            texto += `🛍 *${item.descricao}*\n`;
            texto += `   💵 Valor: ${valorFormatado}\n`;
            texto += `   🗓 Vencimento: ${vencFormatado} (${item.nomeForma})\n\n`;
        });

        texto += `💰 *Total do Mês: ${formatarMoeda(pessoa.totalMesAtual)}*\n\n`;
        texto += `Quando puder, me avisa! Chave PIX: (Sua Chave Aqui) 🚀`;

        try {
            await navigator.clipboard.writeText(texto);
            if (showToast) showToast(`Cobrança de ${pessoa.nomeExibicao} copiada!`, 'success');
            else modal.alert('Resumo do mês copiado! Pronto para colar no WhatsApp.', '✅ Copiado com sucesso');
        } catch (err) {
            modal.alert('Não foi possível copiar automaticamente.', '❌ Erro');
        }
    };

    const agruparComprasDetalhamento = (transacoesDaPessoa) => {
        const compras = {};

        transacoesDaPessoa.forEach(t => {
            if (t.isDividaDeLongoPrazo) {
                compras[t.descricao] = {
                    nome: t.descricao,
                    isParcelado: true,
                    totalParcelasDaCompra: t.parcelasTotais,
                    valorTotal: t.valorCobradoCalculado,
                    valorPago: t.valorPago,
                    valorPendente: t.valorPendente,
                    parcelasPagas: t.parcelasPagas,
                    parcelasPendentes: t.parcelasTotais - t.parcelasPagas,
                    tipoBadge: '🏛️ Empréstimo'
                };
                return;
            }

            let baseName = t.descricao;
            let isParcelado = false;
            let totalParcelasDaCompra = 1;

            const parcelMatch = t.descricao.match(/(.+?)\s*\((\d+)\/(\d+)\)$/);
            if (parcelMatch) {
                baseName = parcelMatch[1].trim();
                isParcelado = true;
                totalParcelasDaCompra = Number(parcelMatch[3]);
            }

            if (!compras[baseName]) {
                compras[baseName] = {
                    nome: baseName,
                    isParcelado,
                    totalParcelasDaCompra,
                    valorTotal: 0,
                    valorPago: 0,
                    valorPendente: 0,
                    parcelasPagas: 0,
                    parcelasPendentes: 0,
                    tipoBadge: '💳 Cartão/Pix'
                };
            }

            compras[baseName].valorTotal += t.valorCobradoCalculado;

            if (t.status === 'pago') {
                compras[baseName].valorPago += t.valorCobradoCalculado;
                compras[baseName].parcelasPagas += 1;
            } else {
                compras[baseName].valorPendente += t.valorCobradoCalculado;
                compras[baseName].parcelasPendentes += 1;
            }
        });

        return Object.values(compras);
    };

    const handleMarcarPago = async (item) => {
        const confirm = await modal.confirm(
            `Confirma o recebimento de ${formatarMoeda(item.valorCobradoCalculado)} referente a "${item.descricao}"?`,
            '💰 Confirmar Recebimento',
            { confirmLabel: 'Sim, Recebi', confirmColor: 'bg-emerald-600 hover:bg-emerald-700' }
        );

        if (confirm) {
            if (item.isEmprestimo) {
                const novaQtdPagas = item.refDivida.pagas + 1;
                await editarSetup('dividas', item.refDivida.id, { pagas: novaQtdPagas });
                if (showToast) showToast('Parcela do empréstimo avançada!', 'success');
            } else {
                await alternarStatusTransacao(item.id, 'pendente');
            }
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 animate-fade-in relative">

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 transition-colors">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        🤝 A Receber (Terceiros)
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Unificação de gastos no cartão e empréstimos cedidos a terceiros.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 px-5 py-3 rounded-xl shadow-sm flex-1 lg:flex-none">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-0.5">Total Restante (Geral)</p>
                        <p className="text-xl font-black text-blue-700 dark:text-blue-400">
                            {formatarMoeda(totalGeralRestante)}
                        </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-5 py-3 rounded-xl shadow-sm flex-1 lg:flex-none">
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-0.5">A Receber no Mês ({dataVis ? `${String(dataVis.mes).padStart(2, '0')}/${dataVis.ano}` : 'Atual'})</p>
                        <p className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                            {formatarMoeda(totalGeralMes)}
                        </p>
                    </div>
                </div>
            </div>

            {cobrancasPorPessoa.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
                    <span className="text-5xl block mb-4 opacity-80">🙌</span>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Nenhuma cobrança registrada</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Não há dívidas ou compras de terceiros em aberto no seu nome.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cobrancasPorPessoa.map((pessoa, index) => (
                        <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors">

                            <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center gap-2">
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                    <div className="w-12 h-12 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-black uppercase text-xl shadow-inner border border-blue-200 dark:border-blue-800/50">
                                        {pessoa.nomeExibicao.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Devedor</p>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 truncate">{pessoa.nomeExibicao}</h3>
                                    </div>
                                </div>
                                <button onClick={() => setPessoaDetalhe(pessoa)} className="shrink-0 p-2 text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors cursor-pointer" title="Ver Detalhamento Completo">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                </button>
                            </div>

                            <div className="p-4 flex-1 max-h-72 overflow-y-auto custom-scrollbar space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Pendências do Mês Atual</p>
                                {pessoa.itensMesAtual.length === 0 ? (
                                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-center">
                                        <span className="text-2xl mb-1 block">✅</span>
                                        <p className="text-xs font-bold text-slate-500">Tudo pago neste mês!</p>
                                    </div>
                                ) : (
                                    pessoa.itensMesAtual.map((item, i) => (
                                        <div key={i} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 group transition-colors">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0">
                                                    {item.isEmprestimo && <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 mb-1 uppercase tracking-wider">Empréstimo</span>}
                                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate leading-tight mb-1" title={item.descricao}>{item.descricao}</p>
                                                    <p className="text-[10px] font-bold text-slate-500">Venc: {item.dataVencimento.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })} <span className="uppercase text-slate-400">({item.nomeForma})</span></p>
                                                </div>
                                                <span className="text-sm font-black text-rose-600 dark:text-rose-400 shrink-0">{formatarMoeda(item.valorCobradoCalculado)}</span>
                                            </div>
                                            <button onClick={() => handleMarcarPago(item)} className="w-full bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors active:scale-95 shadow-sm cursor-pointer">
                                                ✅ Marcar como Recebido
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                                <div className="flex justify-between items-end px-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total do Mês</span>
                                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{formatarMoeda(pessoa.totalMesAtual)}</span>
                                </div>
                                <button onClick={() => gerarTextoCobranca(pessoa)} disabled={pessoa.itensMesAtual.length === 0} className="w-full bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
                                    <span className="text-lg">💬</span> Copiar Cobrança Mensal
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* 🔥 MODAL DE DETALHAMENTO (OVERLAY NATIVO DA TELA) */}
            {pessoaDetalhe && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPessoaDetalhe(null)}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">

                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Detalhamento Completo</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Histórico financeiro com <strong>{pessoaDetalhe.nomeExibicao}</strong></p>
                            </div>
                            <button onClick={() => setPessoaDetalhe(null)} className="p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition-colors shadow-sm cursor-pointer">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 p-4 rounded-2xl">
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Total Já Pago</p>
                                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatarMoeda(pessoaDetalhe.totalPagoGeral)}</p>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 p-4 rounded-2xl">
                                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider mb-1">Dívida Restante (Geral)</p>
                                <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{formatarMoeda(pessoaDetalhe.totalPendenteGeral)}</p>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Resumo Consolidado</h4>
                            {agruparComprasDetalhamento(pessoaDetalhe.todasTransacoes).map((compra, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 mb-1.5 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                                {compra.tipoBadge}
                                            </span>
                                            <h5 className="font-black text-slate-800 dark:text-slate-100 text-base leading-tight">{compra.nome}</h5>
                                            <p className="text-xs font-semibold text-slate-500 mt-1">
                                                {compra.isParcelado ? `Parcelado em ${compra.totalParcelasDaCompra}x` : 'Pagamento Único'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Valor Original</span>
                                            <span className="font-black text-slate-700 dark:text-slate-300">{formatarMoeda(compra.valorTotal)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800">
                                        <div className="flex-1 flex items-center justify-between px-2 border-r border-slate-200 dark:border-slate-700">
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{compra.parcelasPagas} Pagas</span>
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{formatarMoeda(compra.valorPago)}</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-between px-2">
                                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{compra.parcelasPendentes} A Receber</span>
                                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{formatarMoeda(compra.valorPendente)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}