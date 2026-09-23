import assert from 'node:assert/strict'
import { test } from 'vitest'
import { calcularFluxoProjetado } from './fluxoProjetado'

test('projeção respeita a competência âncora da dívida, sem deslocar parcelas', () => {
  const fluxo = calcularFluxoProjetado({
    mesAtual: 8,
    anoAtual: 2026,
    horizonteMeses: 3,
    dividas: [{
      id: 'consorcio',
      descricao: 'Consórcio',
      valor_parcela: 100,
      qtd_parcelas: 2,
      parcelas_pagas_iniciais: 0,
      mes_primeira_parcela: 9,
      ano_primeira_parcela: 2026,
      forma_pagamento: 'pix'
    }]
  })

  assert.deepEqual(fluxo.map(mes => mes.dividasParcelas), [100, 100, 0])
})

test('dívida feita para terceiro não reduz o caixa futuro pessoal', () => {
  const fluxo = calcularFluxoProjetado({
    mesAtual: 8,
    anoAtual: 2026,
    horizonteMeses: 2,
    dividas: [{
      id: 'emprestimo-terceiro', descricao: 'Empréstimo do João', valor_parcela: 150,
      qtd_parcelas: 2, mes_primeira_parcela: 9, ano_primeira_parcela: 2026,
      para_terceiros: 1, forma_pagamento: 'pix'
    }]
  })

  assert.deepEqual(fluxo.map(mes => mes.dividasParcelas), [0, 0])
  assert.deepEqual(fluxo.map(mes => mes.terceirosExcluidos), [150, 150])
  assert.deepEqual(fluxo.map(mes => mes.saldoAcumulado), [0, 0])
})

test('inclui na fatura apenas os gastos pessoais de cartão da competência', () => {
  const fluxo = calcularFluxoProjetado({
    mesAtual: 8,
    anoAtual: 2026,
    horizonteMeses: 1,
    saldoInicial: 1000,
    cartoes: [{ id: 'nubank', nome: 'Nubank' }],
    transacoes: [
      {
        id: 'compra-pessoal', descricao: 'Mercado', tipo: 'despesa', valorParcela: 200,
        status: 'pendente', formaPagamento: 'credito_nubank', mesReferencia: 9, anoReferencia: 2026
      },
      {
        id: 'compra-dividida', descricao: 'Restaurante', tipo: 'despesa', valorParcela: 100,
        status: 'pendente', formaPagamento: 'credito_nubank', mesReferencia: 9, anoReferencia: 2026,
        participantes: [{ nome: 'Ana', valorParcela: 70 }]
      },
      {
        id: 'compra-paga', descricao: 'Já quitada', tipo: 'despesa', valorParcela: 500,
        status: 'pago', formaPagamento: 'credito_nubank', mesReferencia: 9, anoReferencia: 2026
      }
    ]
  })

  assert.equal(fluxo[0].faturasCartao, 230)
  assert.equal(fluxo[0].terceirosExcluidos, 70)
  assert.equal(fluxo[0].saldoAcumulado, 770)
  assert.deepEqual(fluxo[0].detalhes.faturas, [{
    id: 'nubank', nome: 'Nubank', total: 300, pessoal: 230, terceiros: 70,
    itens: [
      { id: 'compra-pessoal', nome: 'Mercado', valor: 200, valorFatura: 200, terceiros: 0 },
      { id: 'compra-dividida', nome: 'Restaurante', valor: 30, valorFatura: 100, terceiros: 70 }
    ]
  }])
})

test('não duplica uma conta fixa já lançada na fatura do cartão', () => {
  const fluxo = calcularFluxoProjetado({
    mesAtual: 8,
    anoAtual: 2026,
    horizonteMeses: 1,
    contasFixas: [{
      id: 'internet', nome: 'Internet', valorPadrao: 400, vencimento: 10,
      forma_pagamento: 'credito_nubank'
    }],
    cartoes: [{ id: 'nubank', nome: 'Nubank', melhorDia: 20 }],
    transacoes: [{
      id: 'fixa_internet_9_2026', descricao: 'Internet', tipo: 'despesa', valorParcela: 400,
      status: 'pendente', formaPagamento: 'credito_nubank', mesReferencia: 9, anoReferencia: 2026
    }]
  })

  assert.equal(fluxo[0].contas, 0)
  assert.equal(fluxo[0].faturasCartao, 400)
  assert.equal(fluxo[0].saldoAcumulado, -400)
})

test('mantém dívida de terceiro fora da fatura pessoal mesmo quando já foi lançada no cartão', () => {
  const fluxo = calcularFluxoProjetado({
    mesAtual: 8,
    anoAtual: 2026,
    horizonteMeses: 1,
    dividas: [{
      id: 'emprestimo-terceiro', descricao: 'Empréstimo do João', valor_parcela: 150,
      qtd_parcelas: 1, mes_primeira_parcela: 9, ano_primeira_parcela: 2026,
      para_terceiros: true, forma_pagamento: 'credito_nubank'
    }],
    cartoes: [{ id: 'nubank', nome: 'Nubank' }],
    transacoes: [{
      id: 'divida-lancada', grupo_id: 'divida_emprestimo-terceiro', descricao: 'Empréstimo do João',
      tipo: 'despesa', valorParcela: 150, status: 'pendente', formaPagamento: 'credito_nubank',
      mesReferencia: 9, anoReferencia: 2026
    }]
  })

  assert.equal(fluxo[0].faturasCartao, 0)
  assert.equal(fluxo[0].terceirosExcluidos, 150)
  assert.equal(fluxo[0].saldoAcumulado, 0)
})
