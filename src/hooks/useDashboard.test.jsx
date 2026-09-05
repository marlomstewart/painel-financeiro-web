import { render, renderHook, screen } from '@testing-library/react'
import assert from 'node:assert/strict'
import { vi, test } from 'vitest'
import { useDashboard } from './useDashboard'
import { criarPlano } from '../testUtils/planoCombustivel'

test('planejamento zerado não volta à meta antiga e mantém acesso ao Raio-X', () => {
  const plano = criarPlano('2026-09', { config: { diasSemana: [], valorCentavos: 2300, categoriaId: 'gas', veiculoId: null } })
  const { result } = renderHook(() => useDashboard({ ...criarProps({ mes: 9, ano: 2026 }, []),
    temGaragem: true, categorias: [{ id: 'gas', nome: 'Gasolina', tipo: 'despesa', meta: 299 }], garagem: { planoMes: plano } }))
  assert.equal(result.current.categoriasDinamicas[0].meta, 0)
  assert.equal(result.current.categoriasDinamicas[0].planejamentoCombustivel, true)
  assert.equal(result.current.previstoFimMes, 0)
})

test('reserva somente os abastecimentos não atendidos e usa previsão canônica no Raio-X', () => {
  const plano = criarPlano()
  plano.resumo = { planejadoCentavos: 29900, registradoCentavos: 2163, restanteCentavos: 27600, previstoCentavos: 29763 }
  const lista = [{ id: 't1', descricao: 'Combustível', categoria: 'Gasolina', tipo: 'despesa', valorParcela: 21.63,
    mesReferencia: 9, anoReferencia: 2026, status: 'pago' }]
  const modal = { alert: vi.fn() }
  const { result } = renderHook(() => useDashboard({ ...criarProps({ mes: 9, ano: 2026 }, lista), modal,
    temGaragem: true, categorias: [{ id: 'gas', nome: 'Gasolina', tipo: 'despesa', meta: 299 }], garagem: { planoMes: plano } }))
  assert.equal(result.current.previstoFimMes, -297.63)
  result.current.abrirDetalhesCategoria('Gasolina', 21.63, 299, 'despesa')
  const { unmount } = render(modal.alert.mock.calls[0][0])
  assert.ok(screen.getByText(/Previsão pelo planejamento: R\$\s*297,63/))
  unmount()
})

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

test('abre o Raio-X de uma categoria estratégica sem progresso', () => {
  const modal = { alert: vi.fn() }
  const { result } = renderHook(() => useDashboard({
    ...criarProps({ mes: 9, ano: 2026 }, []),
    modal,
  }))

  result.current.abrirDetalhesCategoria('Corte de Cabelo', 0, 70, 'despesa')

  assert.equal(modal.alert.mock.calls.length, 1)
  assert.equal(modal.alert.mock.calls[0][1], 'Raio-X: Corte de Cabelo')
  render(modal.alert.mock.calls[0][0])
  assert.equal(screen.getAllByText('Nenhum gasto no período.').length, 2)
  assert.ok(screen.getByText('Nenhum lançamento nesta categoria no período.'))
  assert.ok(screen.getByText('em 0 transações'))
})

test('exibe os lançamentos da categoria no Raio-X', () => {
  const modal = { alert: vi.fn() }
  const lista = [
    {
      id: 'corte-antigo', descricao: 'Corte simples', tipo: 'despesa', categoria: 'Corte de Cabelo', valorParcela: 30,
      status: 'pago', dataCompra: '2026-09-05', mesReferencia: 9, anoReferencia: 2026,
    },
    {
      id: 'corte-recente', descricao: 'Barbearia completa', tipo: 'despesa', categoria: 'Corte de Cabelo', valorParcela: 40,
      status: 'pendente', dataCompra: '2026-09-15', mesReferencia: 9, anoReferencia: 2026,
    },
  ]
  const { result } = renderHook(() => useDashboard({
    ...criarProps({ mes: 9, ano: 2026 }, lista),
    modal,
  }))

  result.current.abrirDetalhesCategoria('Corte de Cabelo', 70, 70, 'despesa')

  render(modal.alert.mock.calls[0][0])
  assert.ok(screen.getByText('Lançamentos desta categoria'))
  assert.ok(screen.getByText('Barbearia completa'))
  assert.ok(screen.getByText('Corte simples'))
  assert.ok(screen.getByText('2 lançamentos'))
})
