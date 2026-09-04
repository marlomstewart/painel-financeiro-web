import { renderHook } from '@testing-library/react'
import assert from 'node:assert/strict'
import { vi } from 'vitest'
import { useDashboard } from './useDashboard'

const transacoes = [
  {
    id: 'renda-julho', descricao: 'Renda julho', tipo: 'renda', categoria: 'Renda', valorParcela: 1000,
    status: 'pago', mesReferencia: 7, anoReferencia: 2026,
  },
  {
    id: 'split-agosto', descricao: 'Split agosto', tipo: 'despesa', categoria: 'Alimentação', valorParcela: 500,
    status: 'pago', mesReferencia: 8, anoReferencia: 2026,
    isThirdParty: true, thirdPartyValue: 416.45, terceiro_recebido: true,
  },
]

function criarProps(dataVis, lista = transacoes, saldoConciliado = null, saldoCaixaCanonico = null) {
  return {
    transacoes: lista,
    transacoesMes: lista.filter(t => t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano),
    setTransacoes: vi.fn(),
    categorias: [],
    dataVis,
    setDataVis: vi.fn(),
    modal: { alert: vi.fn() },
    API: 'https://api.test',
    getHeaders: () => ({}),
    garagem: null,
    cartoes: [],
    showToast: vi.fn(),
    rendasFixas: [],
    contasFixas: [],
    dividas: [],
    saldoConciliado,
    saldoCaixaCanonico,
  }
}

test('saldo de um mês vira saldo anterior idêntico no mês seguinte após split já reembolsado', () => {
  const agosto = { mes: 8, ano: 2026 }
  const { result, rerender } = renderHook(({ dataVis }) => useDashboard(criarProps(dataVis)), {
    initialProps: { dataVis: agosto },
  })

  // R$ 1.000,00 recebidos em julho - R$ 83,55 da própria parte no split de agosto.
  assert.equal(result.current.saldoAtual, 916.45)

  rerender({ dataVis: { mes: 9, ano: 2026 } })

  assert.equal(result.current.saldoMesAnterior, 916.45)
  assert.equal(result.current.saldoAtual, 916.45)
})

test('ignora saldo canônico de agosto ao renderizar setembro e mantém a despesa paga no líquido', () => {
  const lista = [{
    id: 'combustivel-setembro', descricao: 'Combustível', tipo: 'despesa', categoria: 'Gasolina', valorParcela: 21.63,
    status: 'pago', dataCompra: '2026-09-02', data_pagamento: '2026-09-02', mesReferencia: 9, anoReferencia: 2026,
  }]
  const marco = { valor: 43.90, data: '2026-08-31' }
  const respostaAntiga = { ate: '2026-08-31', valor: 43.90 }
  const { result } = renderHook(() => useDashboard(criarProps({ mes: 9, ano: 2026 }, lista, marco, respostaAntiga)))

  assert.equal(result.current.saldoAtual, 22.27)
})

test('saldo conciliado inicia setembro pelo fechamento real de agosto e usa a data do pagamento', () => {
  const lista = [
    {
      id: 'combustivel-setembro', descricao: 'Combustível', tipo: 'despesa', categoria: 'Gasolina', valorParcela: 21.63,
      status: 'pago', dataCompra: '2026-09-02', data_pagamento: '2026-09-02', mesReferencia: 9, anoReferencia: 2026,
    },
    {
      id: 'fatura-agosto-paga-setembro', descricao: 'Fatura de agosto', tipo: 'despesa', categoria: 'Alimentação', valorParcela: 100,
      status: 'pago', dataCompra: '2026-08-20', data_pagamento: '2026-09-03', mesReferencia: 8, anoReferencia: 2026,
    },
  ]
  const saldoConciliado = { valor: 43.90, data: '2026-08-31' }
  const { result, rerender } = renderHook(({ dataVis }) => useDashboard(criarProps(dataVis, lista, saldoConciliado)), {
    initialProps: { dataVis: { mes: 8, ano: 2026 } },
  })

  assert.equal(result.current.saldoAtual, 43.90)

  rerender({ dataVis: { mes: 9, ano: 2026 } })

  assert.equal(result.current.saldoMesAnterior, 43.90)
  assert.equal(result.current.saldoAtual, -77.73)
})
