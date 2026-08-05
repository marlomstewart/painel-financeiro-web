import React, { useMemo } from 'react';

/**
 * @file src/components/Cobrancas.jsx
 * @description Central de Gestão de Terceiros. Agrupa todas as transações pendentes vinculadas a outras pessoas.
 */
export function Cobrancas({ transacoes, alternarStatusTransacao, modal, showToast }) {

    // Processamento: Agrupa as transações pendentes por nome do Terceiro
    const cobrancasPorPessoa = useMemo(() => {
        const mapa = {};

        transacoes.forEach(t => {
            // Filtra apenas transações que são de terceiros e estão pendentes
            if (t.isThirdParty && t.thirdPartyName && t.status === 'pendente') {
                // Normaliza o nome para evitar "Maiara" e "maiara" separados
                const nome = t.thirdPartyName.trim();
                const nomeUpper = nome.toUpperCase();

                if (!mapa[nomeUpper]) {
                    mapa[nomeUpper] = {
                        nomeExibicao: nome,
                        totalPendente: 0,
                        itens: []
                    };
                }

                // O valor do terceiro pode estar no thirdPartyValue. Se for null/0, assume o valor total da parcela
                const valorCobrado = Number(t.thirdPartyValue) > 0 ? Number(t.thirdPartyValue) : Number(t.valorParcela || t.valor || 0);

                mapa[nomeUpper].totalPendente += valorCobrado;
                mapa[nomeUpper].itens.push({
                    ...t,
                    valorCobradoCalculado: valorCobrado
                });
            }
        });

        // Converte o objeto em array e ordena por quem deve mais 😅
        return Object.values(mapa).sort((a, b) => b.totalPendente - a.totalPendente);
    }, [transacoes]);

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    /**
     * @function gerarTextoCobranca
     * @description Monta a string formatada para o WhatsApp e copia para a área de transferência.
     */
    const gerarTextoCobranca = async (pessoa) => {
        let texto = `Fala ${pessoa.nomeExibicao}, tudo bem? ✌️\nPassando para enviar o resumo das comprinhas que fiz no meu cartão/conta para você:\n\n`;

        pessoa.itens.forEach(item => {
            const data = new Date(item.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const valorFormatado = formatarMoeda(item.valorCobradoCalculado);
            texto += `🗓 *${data}* - ${item.descricao}: ${valorFormatado}\n`;
        });

        texto += `\n💰 *Total em aberto: ${formatarMoeda(pessoa.totalPendente)}*\n\n`;
        texto += `Quando puder, me avisa! Chave PIX: (Sua Chave Aqui) 🚀`;

        try {
            await navigator.clipboard.writeText(texto);
            if (showToast) {
                showToast('Resumo copiado! Pronto para colar no WhatsApp.', 'success');
            } else {
                modal.alert('Resumo copiado! Pronto para colar no WhatsApp.', '✅ Copiado com sucesso');
            }
        } catch (err) {
            modal.alert('Não foi possível copiar automaticamente. Verifique as permissões do navegador.', '❌ Erro');
        }
    };

    /**
     * @function handleMarcarPago
     * @description Confirma com o usuário e marca a transação específica como paga.
     */
    const handleMarcarPago = async (transacao) => {
        const confirm = await modal.confirm(
            `Confirma o recebimento de ${formatarMoeda(transacao.valorCobradoCalculado)} referente a "${transacao.descricao}"?`,
            '💰 Confirmar Recebimento',
            { confirmLabel: 'Sim, Recebi', confirmColor: 'bg-emerald-600 hover:bg-emerald-700' }
        );

        if (confirm) {
            await alternarStatusTransacao(transacao.id, 'pendente'); // Passa o status ATUAL para o hook alternar para 'pago'
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 animate-fade-in relative">

            {/* 🌟 CABEÇALHO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        🤝 A Receber (Terceiros)
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Gerencie os gastos feitos para outras pessoas e gere resumos de cobrança.
                    </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-4 py-2 rounded-lg shadow-sm">
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-0.5">Total a Receber</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">
                        {formatarMoeda(cobrancasPorPessoa.reduce((acc, curr) => acc + curr.totalPendente, 0))}
                    </p>
                </div>
            </div>

            {cobrancasPorPessoa.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
                    <span className="text-5xl block mb-4 opacity-80">🙌</span>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Nenhuma cobrança pendente</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Você não tem valores em aberto com terceiros no momento. Tá todo mundo quite!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cobrancasPorPessoa.map((pessoa, index) => (
                        <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors">

                            {/* CARD HEADER */}
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                    <div className="w-12 h-12 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-black uppercase text-xl shadow-inner border border-blue-200 dark:border-blue-800/50">
                                        {pessoa.nomeExibicao.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Devedor</p>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 truncate">{pessoa.nomeExibicao}</h3>
                                    </div>
                                </div>
                            </div>

                            {/* CARD BODY (LISTA DE ITENS) */}
                            <div className="p-4 flex-1 max-h-64 overflow-y-auto custom-scrollbar space-y-3">
                                {pessoa.itens.map(item => (
                                    <div key={item.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col gap-3 group transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate leading-tight mb-1" title={item.descricao}>{item.descricao}</p>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{new Date(item.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                            </div>
                                            <span className="text-sm font-black text-rose-600 dark:text-rose-400 shrink-0">{formatarMoeda(item.valorCobradoCalculado)}</span>
                                        </div>

                                        <button
                                            onClick={() => handleMarcarPago(item)}
                                            className="w-full bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 py-2 rounded-lg text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors active:scale-95"
                                        >
                                            ✅ Marcar como Recebido
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* CARD FOOTER */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                                <div className="flex justify-between items-end px-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Devido</span>
                                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{formatarMoeda(pessoa.totalPendente)}</span>
                                </div>
                                <button
                                    onClick={() => gerarTextoCobranca(pessoa)}
                                    className="w-full bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <span className="text-lg">💬</span> Copiar Cobrança p/ WhatsApp
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}