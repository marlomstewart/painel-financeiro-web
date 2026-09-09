/**
 * @file src/utils/urlEstado.js
 * @description Sincroniza a navegação interna (tela ativa + mês/ano visualizado) com a URL via
 * History API nativa — sem react-router. As telas usam caminhos amigáveis e a consulta fica
 * restrita a estado secundário, como competência e filtros.
 */

const TELAS_VALIDAS = new Set([
    'dashboard', 'admin', 'cobrancas', 'cartoes', 'metas_categorias', 'dividas',
    'contas_fixas', 'rendas_fixas', 'configuracoes', 'ajuda', 'garagem',
    'novo_lancamento', 'extrato', 'lancamentos', 'investimentos', 'calculadora_compra'
]);

const ROTA_POR_TELA = {
    dashboard: '/dashboard',
    admin: '/admin',
    cobrancas: '/cobrancas',
    cartoes: '/cartoes',
    metas_categorias: '/metas-categorias',
    dividas: '/dividas',
    contas_fixas: '/contas-fixas',
    rendas_fixas: '/rendas-fixas',
    configuracoes: '/configuracoes',
    ajuda: '/ajuda',
    garagem: '/garagem',
    novo_lancamento: '/novo-lancamento',
    extrato: '/extrato',
    lancamentos: '/lancamentos',
    investimentos: '/investimentos',
    calculadora_compra: '/calculadora-compra'
};

const TELA_POR_ROTA = Object.fromEntries(Object.entries(ROTA_POR_TELA).map(([tela, rota]) => [rota, tela]));

function normalizarCaminho(pathname) {
    if (!pathname || pathname === '/') return '/';
    return pathname.replace(/\/+$/, '') || '/';
}

export function lerTelaDaURL(padrao = 'dashboard') {
    const telaPeloCaminho = TELA_POR_ROTA[normalizarCaminho(window.location.pathname)];
    if (telaPeloCaminho) return telaPeloCaminho;

    // Migração suave para links compartilhados antes das rotas por caminho. A URL é
    // normalizada pelo App assim que uma sessão válida assume a navegação.
    const telaLegada = new URLSearchParams(window.location.search).get('tela');
    return telaLegada && TELAS_VALIDAS.has(telaLegada) ? telaLegada : padrao;
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
    if (dataVis) {
        params.set('mes', dataVis.mes);
        params.set('ano', dataVis.ano);
    }
    const consulta = params.toString();
    return `${ROTA_POR_TELA[tela] || ROTA_POR_TELA.dashboard}${consulta ? `?${consulta}` : ''}`;
}

export function lerRotaDeRetorno() {
    const retorno = new URLSearchParams(window.location.search).get('retorno');
    if (!retorno || !retorno.startsWith('/') || retorno.startsWith('//')) return null;
    const destino = new URL(retorno, window.location.origin);
    return TELA_POR_ROTA[normalizarCaminho(destino.pathname)] ? `${destino.pathname}${destino.search}${destino.hash}` : null;
}

export function montarURLLogin(retorno) {
    const params = new URLSearchParams();
    if (retorno) params.set('retorno', retorno);
    const consulta = params.toString();
    return `/login${consulta ? `?${consulta}` : ''}`;
}

export function rotaAtual() {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
