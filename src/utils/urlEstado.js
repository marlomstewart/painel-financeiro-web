/**
 * @file src/utils/urlEstado.js
 * @description Sincroniza a navegação interna (tela ativa + mês/ano visualizado) com a URL via
 * History API nativa — sem react-router. Permite compartilhar/recarregar um link direto pra uma
 * tela (ex: `?tela=dividas`) ou um mês específico (ex: `?tela=lancamentos&mes=7&ano=2026`).
 */

const TELAS_VALIDAS = new Set([
    'dashboard', 'admin', 'cobrancas', 'cartoes', 'metas_categorias', 'dividas',
    'contas_fixas', 'rendas_fixas', 'configuracoes', 'ajuda', 'garagem',
    'novo_lancamento', 'extrato', 'lancamentos', 'investimentos', 'calculadora_compra'
]);

export function lerTelaDaURL(padrao = 'dashboard') {
    const tela = new URLSearchParams(window.location.search).get('tela');
    return tela && TELAS_VALIDAS.has(tela) ? tela : padrao;
}

export function lerDataVisDaURL(padrao) {
    const params = new URLSearchParams(window.location.search);
    const mes = parseInt(params.get('mes'), 10);
    const ano = parseInt(params.get('ano'), 10);
    if (mes >= 1 && mes <= 12 && ano >= 2000 && ano <= 2100) return { mes, ano };
    return padrao;
}

export function montarURL(tela, dataVis) {
    const params = new URLSearchParams();
    params.set('tela', tela);
    if (dataVis) {
        params.set('mes', dataVis.mes);
        params.set('ano', dataVis.ano);
    }
    return `${window.location.pathname}?${params.toString()}`;
}
