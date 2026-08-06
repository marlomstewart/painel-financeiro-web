import React, { useMemo, useState } from 'react';

/**
 * @file src/components/Cobrancas.jsx
 * @description Central de Gestão de Terceiros. Agrupa transações por mês, calcula vencimentos 
 * com base nos cartões e exibe o detalhamento de dívidas a longo prazo.
 */
export function Cobrancas({ transacoes = [], cartoes = [], dataVis, alternarStatusTransacao, modal, showToast }) {

    // Fallback caso a dataVis não venha preenchida imediatamente
    const mesAtual = dataVis ? dataVis.mes : new Date().getMonth() + 1;
    const anoAtual = dataVis ? dataVis.ano : new Date().getFullYear();

    // Controle do Modal Interno de Detalhamento
    const [pessoaDetalhe, setPessoaDetalhe] = useState(null);

    // Processamento central: Agrupa transações, calcula vencimentos e separa Mês vs. Futuro
    const cobrancasPorPessoa = useMemo(() => {
        const mapa = {};

        transacoes.forEach(t => {
            if (!t.isThirdParty || !t.thirdPartyName) return;

            const nome = t.thirdPartyName.trim();
            const nomeUpper = nome.toUpperCase();

            if (!mapa[nomeUpper]) {
                mapa[nomeUpper] = {
                    nomeExibicao: nome,
                    totalPendenteGeral: 0,
                    totalPagoGeral: 0,
                    totalMesAtual: 0,
                    itensMesAtual: [],
                    todasTransacoes: []
                };
            }

            const p = mapa[nomeUpper];
            const valorCobrado = Number(t.thirdPartyValue) > 0 ? Number(t.thirdPartyValue) : Number(t.valorParcela || t.valor || 0);
            const isMesAtual = t.mesReferencia === mesAtual && t.anoReferencia === anoAtual;

            // 1. Calcular Vencimento Real (Olhando para o Cartão de Crédito)
            let dataVencimento = new Date(t.dataCompra);
            let nomeForma = 'PIX/Débito';

            if (String(t.formaPagamento).startsWith('credito_') && cartoes.length > 0) {
                const cId = t.formaPagamento.split('_')[1];
                const cartao = cartoes.find(c => c.id === cId);
                if (cartao) {
                    // O vencimento é o dia da fatura no mês de referência da transação
                    dataVencimento = new Date(t.anoReferencia, t.mesReferencia - 1, cartao.vencimento);
                    nomeForma = cartao.nome;
                }
            }

            const itemFormatado = { ...t, valorCobradoCalculado: valorCobrado, dataVencimento, nomeForma };

            // 2. Salva no histórico global da pessoa (para o detalhamento)
            p.todasTransacoes.push(itemFormatado);

            // 3. Soma nos totais
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

        // Converte o objeto em array e ordena por quem deve mais no MÊS ATUAL
        return Object.values(mapa).sort((a, b) => b.totalMesAtual - a.totalMesAtual);
    }, [transacoes, cartoes, mesAtual, anoAtual]);

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Totais Globais do Cabeçalho
    const totalGeralMes = cobrancasPorPessoa.reduce((acc, p) => acc + p.totalMesAtual, 0);
    const totalGeralRestante = cobrancasPorPessoa.reduce((acc, p) => acc + p.totalPendenteGeral, 0);

    /**
     * @function gerarTextoCobranca
     * @description Monta a string formatada EXCLUSIVA DO MÊS e copia para a área de transferência.
     */
    const gerarTextoCobranca = async (pessoa) => {
        if (pessoa.itensMesAtual.length === 0) {
            modal.alert('Não há cobranças pendentes para esta pessoa no mês atual.', 'Sem cobranças');
            return;
        }

        const nomeMes = new Date(anoAtual, mesAtual - 1).toLocaleString('pt-BR', { month: 'long' });
        const mesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

        let texto = `Oi ${pessoa.nomeExibicao}, tudo bem? ✌️\nAqui estão as cobranças referentes ao mês de *${mesCapitalizado}*:\n\n`;

        // Ordena os itens do mês por data de vencimento
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

    /**
     * @function agruparComprasDetalhamento
     * @description Agrupa as transações de uma pessoa pelas "Compras Originais" para o Modal de Detalhes
     */
    const agruparComprasDetalhamento = (transacoesDaPessoa) => {
        const compras = {};

        transacoesDaPessoa.forEach(t => {
            // Regex para extrair o nome base tirando o "(1/10)"
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
                    parcelasPendentes: 0
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

    const handleMarcarPago = async (transacao) => {
        const confirm = await modal.confirm(
            `Confirma o recebimento de ${formatarMoeda(transacao.valorCobradoCalculado)} referente a "${transacao.descricao}"?`,
            '💰 Confirmar Recebimento',
            { confirmLabel: 'Sim, Recebi', confirmColor: 'bg-emerald-600 hover:bg-emerald-700' }
        );
        if (confirm) await alternarStatusTransacao(transacao.id, 'pendente');
    };

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 animate-fade-in relative">

            {/* 🌟 CABEÇALHO COM TOTAIS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 transition-colors">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        🤝 A Receber (Terceiros)
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Visualize o que devem no mês atual e analise o histórico completo.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 px-5 py-3 rounded-xl shadow-sm flex-1 lg:flex-none">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-0.5">Total a Receber (Até o Fim)</p>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Você não tem transações atreladas a terceiros no sistema.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cobrancasPorPessoa.map((pessoa, index) => (
                        <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors">

                            {/* CARD HEADER */}
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
                                <button onClick={() => setPessoaDetalhe(pessoa)} className="shrink-0 p-2 text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors" title="Ver Detalhamento Completo">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                </button>
                            </div>

                            {/* CARD BODY (ITENS APENAS DO MÊS) */}
                            <div className="p-4 flex-1 max-h-72 overflow-y-auto custom-scrollbar space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Pendências do Mês Atual</p>
                                {pessoa.itensMesAtual.length === 0 ? (
                                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-center">
                                        <span className="text-2xl mb-1 block">✅</span>
                                        <p className="text-xs font-bold text-slate-500">Tudo pago neste mês!</p>
                                    </div>
                                ) : (
                                    pessoa.itensMesAtual.map(item => (
                                        <div key={item.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 group transition-colors">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate leading-tight mb-1" title={item.descricao}>{item.descricao}</p>
                                                    <p className="text-[10px] font-bold text-slate-500">Venc: {item.dataVencimento.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })} <span className="uppercase text-slate-400">({item.nomeForma})</span></p>
                                                </div>
                                                <span className="text-sm font-black text-rose-600 dark:text-rose-400 shrink-0">{formatarMoeda(item.valorCobradoCalculado)}</span>
                                            </div>
                                            <button onClick={() => handleMarcarPago(item)} className="w-full bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors active:scale-95 shadow-sm">
                                                ✅ Marcar como Recebido
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* CARD FOOTER */}
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

                        {/* Header Modal */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Detalhamento Completo</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Histórico financeiro com <strong>{pessoaDetalhe.nomeExibicao}</strong></p>
                            </div>
                            <button onClick={() => setPessoaDetalhe(null)} className="p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Totais do Detalhamento */}
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

                        {/* Lista de Compras Agrupadas */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Histórico de Compras</h4>
                            {agruparComprasDetalhamento(pessoaDetalhe.todasTransacoes).map((compra, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
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