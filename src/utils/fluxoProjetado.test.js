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
