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
