export const obterProgressoDivida = (divida, transacoes) => {
    const paraTerceiros = divida.para_terceiros == 1 || divida.para_terceiros === true;
    const historico = transacoes.filter(t =>
        t.grupo_id === `divida_${divida.id}` &&
        t.tipo === 'despesa' &&
        (paraTerceiros ? t.terceiro_recebido === true : t.status === 'pago')
    ).length;
    const totalPago = (divida.parcelas_pagas_iniciais || 0) + historico;
    const total = divida.qtd_parcelas;
    return { pagas: totalPago, total, percentual: total === 0 ? 0 : Math.min(100, Math.round((totalPago / total) * 100)) };
};
