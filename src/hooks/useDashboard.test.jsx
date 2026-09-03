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

function criarProps(dataVis) {
  return {
    transacoes,
    transacoesMes: transacoes.filter(t => t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano),
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
