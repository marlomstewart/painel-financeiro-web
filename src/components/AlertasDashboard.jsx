import React from 'react';
import { Radar, CreditCard, Users, Hourglass, Wallet } from 'lucide-react';

/**
 * @file src/components/AlertasDashboard.jsx
 * @description Componente visual responsável por calcular e exibir avisos de vencimentos
 * próximos (Contas, Faturas de Cartão, Dívidas e Entradas de Renda).
 */
export function AlertasDashboard({ transacoesMes = [], transacoesGlobais = [], cartoes = [], dividas = [], dataVis }) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limiteAlerta = new Date(hoje);
    limiteAlerta.setDate(hoje.getDate() + 7);

    const alertas = [];

    // 1. VARREDURA (Contas, Dívidas e Rendas)
    const pendentesNormal = transacoesMes.filter(t =>
        t.status === 'pendente' &&
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

            let parcelaInfo = null;
            let isDivida = t.tipo === 'divida';

            // INTELIGÊNCIA EM TEMPO REAL: Busca a dívida na memória e calcula a parcela atual (mesmo se for o 1º mês)
            const dividaRelacionada = dividas.find(d => String(d.descricao).toLowerCase() === String(t.nomeContaFixa || t.descricao).toLowerCase());

            if (dividaRelacionada) {
                isDivida = true;
                const pagasIniciais = Number(dividaRelacionada.parcelas_pagas_iniciais || 0);
                const pagasNoExtrato = transacoesGlobais.filter(tx => String(tx.nomeContaFixa).toLowerCase() === String(dividaRelacionada.descricao).toLowerCase() && tx.status === 'pago').length;
                const parcelaAtual = pagasIniciais + pagasNoExtrato + 1;
                parcelaInfo = `${parcelaAtual}/${dividaRelacionada.qtd_parcelas}`;
            } else if (t.observacao && t.observacao.includes('Parcela')) {
                const match = t.observacao.match(/Parcela (\d+\/\d+)/);
                if (match) parcelaInfo = match[1];
            }

            alertas.push({
                id: t.id,
                titulo: t.descricao || t.nomeContaFixa || 'Lançamento Pendente',
                valor: t.valorParcela || t.valor || 0,
                dias: diffDays,
                tipo: isDivida ? 'divida' : t.tipo,
                parcelaInfo: parcelaInfo,
                isRenda: t.tipo === 'renda'
            });
        }
    });

    // 2. AGRUPAMENTO DE FATURAS DE CARTÃO
    cartoes.forEach(c => {
        const transCartao = transacoesMes.filter(t =>
            t.status === 'pendente' &&
            (String(t.formaPagamento).includes(c.id) || (c.nome && String(t.formaPagamento).toLowerCase() === String(c.nome).toLowerCase()))
        );

        if (transCartao.length > 0) {
            const dataVenc = new Date(dataVis.ano, dataVis.mes - 1, c.vencimento);
            const isFaturaFechada = hoje.getDate() >= (c.melhorDia || c.vencimento - 7) && hoje.getDate() <= c.vencimento && hoje.getMonth() + 1 === dataVis.mes;

            if (dataVenc <= limiteAlerta || isFaturaFechada) {
                const diffTime = dataVenc - hoje;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

    alertas.sort((a, b) => a.dias - b.dias);

    if (alertas.length === 0) return null;

    const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="animate-fade-in-down mb-6 md:mb-8">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Radar className="w-4 h-4 text-rose-500" strokeWidth={2.25} /> Radar de Vencimentos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {alertas.map(alerta => {
                    const isRenda = alerta.isRenda;
                    let statusConfig;

                    if (alerta.dias < 0) {
                        statusConfig = {
                            texto: isRenda ? `Renda atrasada há ${Math.abs(alerta.dias)} dias` : `Atrasado há ${Math.abs(alerta.dias)} dias`,
                            cor: isRenda ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/40 shadow-[0_0_15px_rgba(225,29,72,0.1)]',
                            textoCor: isRenda ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        };
                    } else if (alerta.dias === 0) {
                        statusConfig = {
                            texto: isRenda ? 'Recebe HOJE' : 'Vence HOJE',
                            cor: isRenda ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
                            textoCor: isRenda ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                        };
                    } else {
                        statusConfig = {
                            texto: isRenda ? `Recebe em ${alerta.dias} dias` : `Vence em ${alerta.dias} dias`,
                            cor: 'bg-white dark:bg-slate-900/50 border-blue-200 dark:border-blue-800/50',
                            textoCor: 'text-blue-700 dark:text-blue-400'
                        };
                    }

                    return (
                        <div key={alerta.id} className={`p-4 md:p-5 rounded-2xl border flex flex-col gap-3 shadow-sm transition-colors ${statusConfig.cor}`}>
                            <div className="flex justify-between items-start gap-3">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight flex-1" title={alerta.titulo}>{alerta.titulo}</h4>

                                {/* Badges informativas */}
                                <div className="flex flex-col gap-1.5 items-end shrink-0">
                                    {alerta.tipo === 'cartao_fatura' && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm">
                                            <CreditCard className="w-2.5 h-2.5" strokeWidth={2.5} /> Fatura
                                        </span>
                                    )}
                                    {alerta.tipo === 'terceiros' && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm">
                                            <Users className="w-2.5 h-2.5" strokeWidth={2.5} /> Terceiros
                                        </span>
                                    )}
                                    {alerta.parcelaInfo && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm">
                                            <Hourglass className="w-2.5 h-2.5" strokeWidth={2.5} /> {alerta.parcelaInfo}
                                        </span>
                                    )}
                                    {isRenda && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                                            <Wallet className="w-2.5 h-2.5" strokeWidth={2.5} /> Receita
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-auto pt-2">
                                <span className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{formatarMoeda(alerta.valor)}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${statusConfig.textoCor}`}>{statusConfig.texto}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
