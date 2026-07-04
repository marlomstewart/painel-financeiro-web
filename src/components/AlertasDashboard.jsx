import React from 'react';

export function AlertasDashboard({ transacoes = [], cartoes = [] }) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limiteAlerta = new Date(hoje);
    limiteAlerta.setDate(hoje.getDate() + 7);

    const alertas = [];

    // 1. Varredura de Contas Fixas e Dívidas Pendentes
    const pendentes = transacoes.filter(t => t.status === 'pendente' && (t.tipo === 'despesa' || t.tipo === 'terceiros' || t.tipo === 'divida'));

    pendentes.forEach(t => {
        if (!t.dataCompra) return;
        const [ano, mes, dia] = t.dataCompra.split('T')[0].split('-');
        const dataVenc = new Date(ano, mes - 1, dia);

        if (dataVenc <= limiteAlerta) {
            const diffTime = dataVenc - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            alertas.push({
                id: t.id,
                titulo: t.descricao || t.nomeContaFixa || 'Despesa Pendente',
                valor: t.valorParcela || t.valor || 0,
                dias: diffDays,
                tipo: t.tipo === 'terceiros' ? 'terceiros' : 'conta'
            });
        }
    });

    // 2. Varredura de Faturas de Cartão de Crédito
    cartoes.forEach(c => {
        const transCartao = transacoes.filter(t => t.status === 'pendente' && String(t.formaPagamento) === `credito_${c.id}`);
        if (transCartao.length > 0) {
            let dataVenc = new Date(hoje.getFullYear(), hoje.getMonth(), c.vencimento);

            // Se hoje já passou do dia de vencimento, a fatura deste mês está atrasada
            if (hoje.getDate() > c.vencimento) {
                dataVenc = new Date(hoje.getFullYear(), hoje.getMonth(), c.vencimento);
            }

            if (dataVenc <= limiteAlerta) {
                const diffTime = dataVenc - hoje;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const valorTotal = transCartao.reduce((acc, t) => acc + Number(t.valorParcela || 0), 0);

                alertas.push({
                    id: `fatura_${c.id}`,
                    titulo: `Fatura: ${c.nome}`,
                    valor: valorTotal,
                    dias: diffDays,
                    tipo: 'cartao'
                });
            }
        }
    });

    // Ordenação: Atrasados primeiro, depois os que vencem hoje, etc.
    alertas.sort((a, b) => a.dias - b.dias);

    if (alertas.length === 0) return null;

    const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="mb-8 animate-fade-in-down">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="text-rose-500">🚨</span> Alertas de Vencimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alertas.map(alerta => {
                    let statusConfig = { texto: `Vence em ${alerta.dias} dias`, cor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50', textoCor: 'text-blue-700 dark:text-blue-400' };

                    if (alerta.dias < 0) {
                        statusConfig = { texto: `Atrasado há ${Math.abs(alerta.dias)} dias`, cor: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50', textoCor: 'text-rose-700 dark:text-rose-400' };
                    } else if (alerta.dias === 0) {
                        statusConfig = { texto: 'Vence HOJE', cor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50', textoCor: 'text-amber-700 dark:text-amber-400' };
                    }

                    return (
                        <div key={alerta.id} className={`p-4 rounded-xl border flex flex-col gap-2 shadow-sm transition-colors ${statusConfig.cor}`}>
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1" title={alerta.titulo}>{alerta.titulo}</h4>
                                {alerta.tipo === 'terceiros' && (
                                    <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Terceiros</span>
                                )}
                                {alerta.tipo === 'cartao' && (
                                    <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">Cartão</span>
                                )}
                            </div>
                            <div className="flex justify-between items-end">
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