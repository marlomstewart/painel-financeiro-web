/**
 * @file src/utils/janelaTransacoes.js
 * @description Janela de paginação por período usada em toda busca de /transacoes que não
 * precisa do histórico completo (login, refetch pós-mutação). O backend sempre inclui
 * status='pendente' independente da data, então pendências antigas nunca ficam de fora.
 */
export const MESES_JANELA_PADRAO = 24;

export function obterDesdeISO(meses = MESES_JANELA_PADRAO) {
    const desde = new Date();
    desde.setMonth(desde.getMonth() - meses);
    return desde.toISOString().split('T')[0];
}

// A paginação padrão é por data de compra, mas uma fatura antiga pode ser paga depois de um
// marco conciliado. Nesse caso a API deve manter o movimento na resposta pela data de pagamento.
export function montarConsultaTransacoes(saldoConciliado) {
    const params = new URLSearchParams({ desde: obterDesdeISO() });
    const data = String(saldoConciliado?.data || '').slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) params.set('desdeCaixa', data);
    return params.toString();
}
