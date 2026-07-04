import React from 'react';

export function AlertasDashboard({ transacoesMes = [], cartoes = [], dataVis }) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limiteAlerta = new Date(hoje);
    limiteAlerta.setDate(hoje.getDate() + 7);

    const alertas = [];

    // ============================================================================
    // 1. VARREDURA DE CONTAS FIXAS, DÍVIDAS E RENDAS (Tudo que NÃO é Cartão)
    // ============================================================================
    const pendentesNormal = transacoesMes.filter(t =>
        t.status === 'pendente' &&
        // Filtra para fora as transações que foram pagas no crédito (elas serão agrupadas depois)
        !(
            String(t.formaPagamento).startsWith('credito_') ||
            cartoes.some(c => c.nome && String(t.formaPagamento).toLowerCase() === String(c.nome).toLowerCase())
        )
    );

    pendentesNormal.forEach(t => {
        if (!t.dataCompra) return;
        const [ano, mes, dia] = t.dataCompra.split('T')[0].split('-');
        const dataVenc = new Date(ano, mes - 1, dia);

        if (dataVenc <= limiteAlerta) {
            const diffTime = dataVenc - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // INTELIGÊNCIA: Se for Dívida/Consórcio, tenta achar a parcela na observação (ex: "Parcela 5/48")
            let parcelaInfo = null;
            if (t.observacao && t.observacao.includes('Parcela')) {
                const match = t.observacao.match(/Parcela (\d+\/\d+)/);
                if (match) parcelaInfo = match[1]; // Salva apenas o "5/48"
            }

            alertas.push({
                id: t.id,
                titulo: t.descricao || t.nomeContaFixa || 'Lançamento Pendente',
                valor: t.valorParcela || t.valor || 0,
                dias: diffDays,
                tipo: t.tipo, // 'renda', 'despesa', 'terceiros'
                parcelaInfo: parcelaInfo,
                isRenda: t.tipo === 'renda'
            });
        }
    });

    // ============================================================================
    // 2. AGRUPAMENTO DE FATURAS DE CARTÃO DE CRÉDITO (1 Alerta por Cartão)
    // ============================================================================
    cartoes.forEach(c => {
        // Encontra todas as compras pendentes do mês que pertencem a este cartão
        const transCartao = transacoesMes.filter(t =>
            t.status === 'pendente' &&
            (
                String(t.formaPagamento).includes(c.id) ||
                (c.nome && String(t.formaPagamento).toLowerCase() === String(c.nome).toLowerCase())
            )
        );

        if (transCartao.length > 0) {
            const dataVenc = new Date(dataVis.ano, dataVis.mes - 1, c.vencimento);

            // INTELIGÊNCIA: O alerta dispara se estiver a 7 dias do vencimento 
            // OU se hoje já passou do "Melhor Dia" (ou seja, a fatura fechou)
            const isFaturaFechada = hoje.getDate() >= (c.melhorDia || c.vencimento - 7) && hoje.getDate() <= c.vencimento && hoje.getMonth() + 1 === dataVis.mes;

            if (dataVenc <= limiteAlerta || isFaturaFechada) {
                const diffTime = dataVenc - hoje;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Soma o valor de todos os vestidos, sapatos, Ifood, etc.
                const valorTotalDaFatura = transCartao.reduce((acc, t) => acc + Number(t.valorParcela || t.valor || 0), 0);

                alertas.push({
                    id: `fatura_${c.id}`,
                    titulo: `Fatura: ${c.nome}`,
                    valor: valorTotalDaFatura,
                    dias: diffDays,
                    tipo: 'cartao_fatura',
                    isRenda: false
                });
            }
        }
    });

    // Ordenação: O que está mais atrasado/urgente aparece primeiro
    alertas.sort((a, b) => a.dias - b.dias);

    if (alertas.length === 0) return null;

    const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="animate-fade-in-down mb-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="text-rose-500">🚨</span> Alertas do Mês
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alertas.map(alerta => {
                    const isRenda = alerta.isRenda;
                    let statusConfig = {};

                    if (alerta.dias < 0) {
                        statusConfig = {
                            texto: isRenda ? `Renda atrasada há ${Math.abs(alerta.dias)} dias` : `Atrasado há ${Math.abs(alerta.dias)} dias`,
                            cor: isRenda ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50',
                            textoCor: isRenda ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        };
                    } else if (alerta.dias === 0) {
                        statusConfig = {
                            texto: isRenda ? 'Recebe HOJE' : 'Vence HOJE',
                            cor: isRenda ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50',
                            textoCor: isRenda ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                        };
                    } else {
                        statusConfig = {
                            texto: isRenda ? `Recebe em ${alerta.dias} dias` : `Vence em ${alerta.dias} dias`,
                            cor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
                            textoCor: 'text-blue-700 dark:text-blue-400'
                        };
                    }

                    return (
                        <div key={alerta.id} className={`p-4 rounded-xl border flex flex-col gap-2 shadow-sm transition-colors ${statusConfig.cor}`}>
                            <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1 flex-1" title={alerta.titulo}>{alerta.titulo}</h4>

                                <div className="flex flex-col gap-1 items-end shrink-0">
                                    {/* ETIQUETA DA FATURA DE CARTÃO */}
                                    {alerta.tipo === 'cartao_fatura' && (
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                            💳 Fatura
                                        </span>
                                    )}
                                    {/* ETIQUETA DE TERCEIROS */}
                                    {alerta.tipo === 'terceiros' && (
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                            🤝 Terceiros
                                        </span>
                                    )}
                                    {/* ETIQUETA DE PARCELA (DÍVIDAS) */}
                                    {alerta.parcelaInfo && (
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                            {alerta.parcelaInfo}
                                        </span>
                                    )}
                                    {/* ETIQUETA DE RENDA */}
                                    {isRenda && (
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            💰 Receita
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <span className="text-lg font-black text-slate-900 dark:text-white">{formatarMoeda(alerta.valor)}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${statusConfig.textoCor}`}>{statusConfig.texto}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}