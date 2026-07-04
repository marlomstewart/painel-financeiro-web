import React from 'react';

export function AlertasDashboard({ transacoesMes = [], cartoes = [], dataVis }) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limiteAlerta = new Date(hoje);
    limiteAlerta.setDate(hoje.getDate() + 7);

    const alertas = [];

    // 1. Varredura de TODOS os lançamentos pendentes do MÊS ATUAL (Rendas, Despesas, Dívidas)
    const pendentes = transacoesMes.filter(t => t.status === 'pendente');

    pendentes.forEach(t => {
        // Tenta encontrar se esta transação foi paga com algum dos cartões cadastrados
        const cartaoVinculado = cartoes.find(c =>
            t.formaPagamento && (
                String(t.formaPagamento).includes(c.id) ||
                String(t.formaPagamento).toLowerCase() === c.nome.toLowerCase()
            )
        );

        let dataBaseParaVencimento = null;

        if (cartaoVinculado) {
            // REGRA DO CARTÃO: Ignora a data da compra e usa o dia de Vencimento do Cartão no mês atual!
            dataBaseParaVencimento = new Date(dataVis.ano, dataVis.mes - 1, cartaoVinculado.vencimento);
        } else if (t.dataCompra) {
            // REGRA NORMAL: Se for Pix, Boleto ou Dinheiro, usa a data de compra/vencimento original
            const [ano, mes, dia] = t.dataCompra.split('T')[0].split('-');
            dataBaseParaVencimento = new Date(ano, mes - 1, dia);
        }

        if (!dataBaseParaVencimento) return;

        // Se a data de vencimento for menor ou igual a hoje + 7 dias, entra no alerta
        if (dataBaseParaVencimento <= limiteAlerta) {
            const diffTime = dataBaseParaVencimento - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            alertas.push({
                id: t.id,
                titulo: t.descricao || t.nomeContaFixa || 'Lançamento Pendente',
                valor: t.valorParcela || t.valor || 0,
                dias: diffDays,
                tipo: t.tipo, // 'renda', 'despesa', 'terceiros', 'divida'
                cartaoNome: cartaoVinculado ? cartaoVinculado.nome : null
            });
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
                    const isRenda = alerta.tipo === 'renda';
                    let statusConfig = {};

                    // MOTOR DE INTELIGÊNCIA SEMÂNTICA (Textos Dinâmicos)
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
                                    {/* ETIQUETA DO CARTÃO */}
                                    {alerta.cartaoNome && (
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                            💳 {alerta.cartaoNome}
                                        </span>
                                    )}
                                    {/* ETIQUETA DE TERCEIROS */}
                                    {alerta.tipo === 'terceiros' && (
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                            🤝 Terceiros
                                        </span>
                                    )}
                                    {/* ETIQUETA DE RENDA */}
                                    {isRenda && !alerta.cartaoNome && (
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