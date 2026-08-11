const PREFIXO_CREDITO = 'credito_';

export function ehPagamentoCredito(formaPagamento) {
    return typeof formaPagamento === 'string' && formaPagamento.startsWith(PREFIXO_CREDITO);
}

export function extrairCartaoId(formaPagamento) {
    return ehPagamentoCredito(formaPagamento) ? formaPagamento.slice(PREFIXO_CREDITO.length) : null;
}

export function resolverCartao(formaPagamento, cartoes) {
    const cartaoId = extrairCartaoId(formaPagamento);
    if (cartaoId === null) return null;
    return cartoes.find(c => String(c.id) === cartaoId) || null;
}

export function nomeCartao(formaPagamento, cartoes, fallback = 'Cartão Excluído / Desconhecido') {
    const cartao = resolverCartao(formaPagamento, cartoes);
    return cartao ? cartao.nome : fallback;
}
