import { extrairCartaoId } from './cartaoUtils';

/**
 * @file src/utils/fluxoProjetado.js
 * @description Projeta o saldo dos próximos meses a partir do que já é conhecido/recorrente
 * (rendas fixas, contas fixas, parcelas de dívidas restantes) — NÃO prevê gastos avulsos que o
 * usuário ainda vai lançar no dia a dia (Uber, mercado etc.), só o que já está "garantido".
 *
 * Replica a MESMA regra de rolagem de fatura do motor de geração de lançamentos
 * (gerarLancamentosDoMesParaUsuario, painel-financeiro-api/controllers/setupController.js):
 * se o item é pago no cartão e o dia de vencimento cai no/depois do fechamento da fatura
 * (dia >= cartao.melhorDia), ele só é cobrado na fatura do mês seguinte.
 */

/**
 * Calcula em qual (mês, ano) um item pago no cartão realmente vai ser cobrado, dado o mês
 * "nominal" em que ele venceria. Itens fora do cartão (pix, débito) nunca rolam.
 */
function resolverMesEfetivo(mesNominal, anoNominal, diaVencimento, formaPagamento, cartoes) {
    const cartaoId = extrairCartaoId(formaPagamento);
    if (!cartaoId) return { mes: mesNominal, ano: anoNominal };

    const cartao = cartoes.find(c => String(c.id) === cartaoId);
    if (!cartao || Number(diaVencimento) < Number(cartao.melhorDia)) {
        return { mes: mesNominal, ano: anoNominal };
    }

    let mes = mesNominal + 1;
    let ano = anoNominal;
    if (mes > 12) { mes = 1; ano += 1; }
    return { mes, ano };
}

const chaveMes = (mes, ano) => `${ano}-${mes}`;

/**
 * @param {number} mesAtual, anoAtual - competência corrente (a partir daqui os meses são projetados)
 * @param {number} horizonteMeses - quantos meses à frente projetar
 * @param {number} saldoInicial - ponto de partida do acumulado (ex: previstoFimMes do mês atual)
 */
export function calcularFluxoProjetado({
    mesAtual, anoAtual, horizonteMeses = 6, saldoInicial = 0,
    rendasFixas = [], contasFixas = [], dividas = [], cartoes = [], transacoes = []
}) {
    const competencias = [];
    let m = mesAtual, a = anoAtual;
    for (let i = 0; i < horizonteMeses; i++) {
        m += 1;
        if (m > 12) { m = 1; a += 1; }
        competencias.push({ mes: m, ano: a });
    }

    // Buckets por mês efetivo (pode receber contribuições rolladas de fora da janela de competências
    // processadas, ou nem receber nada de uma competência cujos itens rolaram todos pra frente —
    // isso é intencional: espelha exatamente o comportamento real do motor de geração).
    const buckets = {};
    const garantirBucket = (mes, ano) => {
        const chave = chaveMes(mes, ano);
        if (!buckets[chave]) buckets[chave] = { mes, ano, renda: 0, contas: 0, dividasParcelas: 0, detalhes: { rendas: [], contas: [], dividas: [] } };
        return buckets[chave];
    };
    competencias.forEach(({ mes, ano }) => garantirBucket(mes, ano));

    // Rendas fixas: nunca rolam (não são pagas via cartão), então caem direto na própria competência.
    competencias.forEach(({ mes, ano }) => {
        const bucket = garantirBucket(mes, ano);
        rendasFixas.forEach(r => {
            const valor = Number(r.valorPadrao) || 0;
            bucket.renda += valor;
            bucket.detalhes.rendas.push({ nome: r.nome, valor });
        });
    });

    // Contas fixas: recorrem toda competência, com possível rolagem de mês se pagas no cartão.
    competencias.forEach(({ mes, ano }) => {
        contasFixas.forEach(c => {
            const { mes: mesEf, ano: anoEf } = resolverMesEfetivo(mes, ano, c.vencimento, c.forma_pagamento, cartoes);
            const bucket = garantirBucket(mesEf, anoEf);
            const valor = Number(c.valorPadrao) || 0;
            bucket.contas += valor;
            bucket.detalhes.contas.push({ nome: c.nome, valor });
        });
    });

    // Dívidas: só entram enquanto restarem parcelas. Conta quantas já foram "usadas" (pagas
    // manualmente + já lançadas em transacoes com o grupo_id da dívida) pra saber onde parar —
    // mesma lógica do motor de geração (setupController.js:515-518).
    const restantesPorDivida = {};
    dividas.forEach(d => {
        const pagasIniciais = Number(d.parcelas_pagas_iniciais) || 0;
        const jaLancadas = transacoes.filter(t => t.grupo_id === `divida_${d.id}`).length;
        restantesPorDivida[d.id] = Math.max(0, Number(d.qtd_parcelas) - (pagasIniciais + jaLancadas));
    });

    competencias.forEach(({ mes, ano }) => {
        dividas.forEach(d => {
            if (restantesPorDivida[d.id] <= 0) return;
            const { mes: mesEf, ano: anoEf } = resolverMesEfetivo(mes, ano, d.dia_vencimento, d.forma_pagamento, cartoes);
            const bucket = garantirBucket(mesEf, anoEf);
            const valor = Number(d.valor_parcela) || 0;
            bucket.dividasParcelas += valor;
            bucket.detalhes.dividas.push({ nome: d.descricao, valor });
            restantesPorDivida[d.id] -= 1;
        });
    });

    let saldoAcumulado = saldoInicial;
    return competencias.map(({ mes, ano }) => {
        const bucket = garantirBucket(mes, ano);
        const net = bucket.renda - bucket.contas - bucket.dividasParcelas;
        saldoAcumulado += net;
        return { mes, ano, renda: bucket.renda, contas: bucket.contas, dividasParcelas: bucket.dividasParcelas, net, saldoAcumulado, detalhes: bucket.detalhes };
    });
}
