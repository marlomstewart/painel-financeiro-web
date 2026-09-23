import { fireEvent, render, renderHook, screen } from '@testing-library/react'
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
  assert.ok(screen.getByText(/Planejamento em dia: você deve gastar cerca de R\$\s*297,63/))
  unmount()
})

test('Raio-X de combustível alerta quando o gasto registrado ultrapassa o planejado', () => {
  const plano = criarPlano()
  plano.resumo = { planejadoCentavos: 2300, registradoCentavos: 2500, restanteCentavos: 0, previstoCentavos: 2500 }
  const modal = { alert: vi.fn() }
  const { result } = renderHook(() => useDashboard({ ...criarProps({ mes: 9, ano: 2026 }, []), modal,
    temGaragem: true, categorias: [{ id: 'gas', nome: 'Gasolina', tipo: 'despesa', meta: 23 }], garagem: { planoMes: plano } }))
  result.current.abrirDetalhesCategoria('Gasolina', 25, 23, 'despesa')
  const { unmount } = render(modal.alert.mock.calls[0][0])
  assert.ok(screen.getByText(/Atenção: você já gastou R\$\s*25,00/))
  unmount()
})

test('Raio-X de combustível confirma quando todos os abastecimentos planejados foram registrados', () => {
  const plano = criarPlano()
  plano.resumo = { planejadoCentavos: 2300, registradoCentavos: 2300, restanteCentavos: 0, previstoCentavos: 2300 }
  const modal = { alert: vi.fn() }
  const { result } = renderHook(() => useDashboard({ ...criarProps({ mes: 9, ano: 2026 }, []), modal,
    temGaragem: true, categorias: [{ id: 'gas', nome: 'Gasolina', tipo: 'despesa', meta: 23 }], garagem: { planoMes: plano } }))
  result.current.abrirDetalhesCategoria('Gasolina', 23, 23, 'despesa')
  const { unmount } = render(modal.alert.mock.calls[0][0])
  assert.ok(screen.getByText(/Planejamento concluído: os abastecimentos previstos/))
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

test('prévia futura usa somente compromissos e rendas da competência, sem saldo acumulado', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-22T12:00:00'))
  const modal = { alert: vi.fn() }
  const lista = [
    { id: 'saldo-antigo', descricao: 'Saldo de setembro', tipo: 'renda', categoria: 'Renda', valorParcela: 9999, status: 'pago', mesReferencia: 9, anoReferencia: 2026 },
    { id: 'renda-manual', descricao: 'Freela de outubro', tipo: 'renda', categoria: 'Renda', valorParcela: 1000, status: 'pendente', mesReferencia: 10, anoReferencia: 2026 },
    { id: 'fixa_luz_10_2026', descricao: 'Luz', tipo: 'despesa', categoria: 'Contas Fixas', valorParcela: 300, status: 'pendente', formaPagamento: 'pix', mesReferencia: 10, anoReferencia: 2026 },
    { id: 'mercado', descricao: 'Mercado', tipo: 'despesa', categoria: 'Alimentação', valorParcela: 100, status: 'pendente', formaPagamento: 'pix', mesReferencia: 10, anoReferencia: 2026 },
    { id: 'cartao', descricao: 'Compra no cartão', tipo: 'despesa', categoria: 'Alimentação', valorParcela: 200, status: 'pendente', formaPagamento: 'credito_card', mesReferencia: 10, anoReferencia: 2026, isThirdParty: true, participantes: [{ id: 'ana', nome: 'Ana', valorParcela: 80 }, { id: 'bia', nome: 'Bia', valorParcela: 20 }] },
    { id: 'pago-antes', descricao: 'Já pago', tipo: 'despesa', categoria: 'Alimentação', valorParcela: 900, status: 'pago', formaPagamento: 'pix', mesReferencia: 10, anoReferencia: 2026 }
  ]
  const { result } = renderHook(() => useDashboard({
    ...criarProps({ mes: 10, ano: 2026 }, lista), modal,
    cartoes: [{ id: 'card', nome: 'Nubank', melhorDia: 20 }],
    rendasFixas: [{ id: 'salario', nome: 'Salário fixo', valorPadrao: 500 }],
    contasFixas: [
      { id: 'luz', nome: 'Luz', valorPadrao: 300, vencimento: 10, forma_pagamento: 'pix' },
      { id: 'internet', nome: 'Internet', valorPadrao: 400, vencimento: 25, forma_pagamento: 'credito_card' }
    ],
    dividas: [{ id: 'emprestimo', descricao: 'Empréstimo', valor_parcela: 150, qtd_parcelas: 3, parcelas_pagas_iniciais: 0, mes_primeira_parcela: 10, ano_primeira_parcela: 2026, dia_vencimento: 10, forma_pagamento: 'pix' }],
    categorias: [{ id: 'alimentacao', nome: 'Alimentação', meta: 1100, tipo: 'despesa' }, { id: 'viagem', nome: 'Viagem', meta: 80, tipo: 'despesa' }]
  }))

  assert.equal(result.current.isMesFuturo, true)
  assert.deepEqual(result.current.previaCompetenciaFutura, {
    rendas: 1500,
    gastos: 550,
    faturas: 500,
    reservaMetas: 80,
    resultado: 370,
    detalhes: {
      rendas: [
        { id: 'renda-manual', descricao: 'Freela de outubro', origem: 'Lançamento', valor: 1000 },
        { id: 'renda_salario_10_2026', descricao: 'Salário fixo', origem: 'Renda fixa', valor: 500 }
      ],
      gastos: [
        { id: 'fixa_luz_10_2026', descricao: 'Luz', origem: 'Lançamento', valor: 300 },
        { id: 'mercado', descricao: 'Mercado', origem: 'Lançamento', valor: 100 },
        { id: 'divlanc_emprestimo_10_2026', descricao: 'Empréstimo', origem: 'Parcela de dívida', valor: 150 }
      ],
      faturas: [
        { id: 'cartao', descricao: 'Compra no cartão', origem: 'Lançamento no cartão', valor: 100, valorFatura: 200, cartao: 'Nubank', terceiros: [{ nome: 'Ana', valor: 80 }, { nome: 'Bia', valor: 20 }] },
        { id: 'fixa_internet_10_2026', descricao: 'Internet', origem: 'Conta fixa', valor: 400, valorFatura: 400, cartao: 'Nubank', terceiros: [] }
      ],
      metas: [{ id: 'meta_viagem', descricao: 'Viagem', origem: 'Meta da categoria', valor: 80 }]
    },
    faturasPorCartao: [{
      id: 'card', nome: 'Nubank', total: 600, pessoal: 500,
      terceiros: [{ nome: 'Ana', valor: 80 }, { nome: 'Bia', valor: 20 }],
      itens: [
        { id: 'cartao', descricao: 'Compra no cartão', origem: 'Lançamento no cartão', valor: 100, valorFatura: 200, cartao: 'Nubank', terceiros: [{ nome: 'Ana', valor: 80 }, { nome: 'Bia', valor: 20 }] },
        { id: 'fixa_internet_10_2026', descricao: 'Internet', origem: 'Conta fixa', valor: 400, valorFatura: 400, cartao: 'Nubank', terceiros: [] }
      ]
    }]
  })

  result.current.abrirResumoCard('previa_faturas')
  render(modal.alert.mock.calls[0][0])
  assert.ok(screen.getByText('Total da fatura'))
  assert.ok(screen.getByText('Seu gasto pessoal'))
  assert.ok(screen.getByText('Ana'))
  assert.ok(screen.getByText('Bia'))
  fireEvent.click(screen.getByTitle('Clique para ver os lançamentos'))
  assert.ok(screen.getByText('Lançamento no cartão: Compra no cartão'))
  assert.ok(screen.getByText('Conta fixa: Internet'))
  vi.useRealTimers()
})

test('mês atual mantém os indicadores atuais e não cria prévia futura', () => {
  const { result } = renderHook(() => useDashboard(criarProps({ mes: 9, ano: 2026 }, [])))
  assert.equal(result.current.isMesFuturo, false)
  assert.equal(result.current.previaCompetenciaFutura, null)
})

test('prévia futura usa o progresso do mês atual sem carregá-lo quando a competência vira atual', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-22T12:00:00'))
  const lista = [
    { id: 'gasolina-setembro', descricao: 'Abastecimento', tipo: 'despesa', categoria: 'Gasolina', valorParcela: 167, status: 'pago', mesReferencia: 9, anoReferencia: 2026 },
    { id: 'sonho-setembro', descricao: 'Reserva do sonho', tipo: 'investimento', categoria: 'Sonho', valorParcela: 600, status: 'pago', mesReferencia: 9, anoReferencia: 2026 },
    { id: 'fixa-moto-setembro', descricao: 'Manutenção fixa', tipo: 'despesa', categoria: 'Manutenção Fixa da Moto', valorParcela: 65, status: 'pendente', mesReferencia: 9, anoReferencia: 2026 },
    { id: 'moto-outubro', descricao: 'Reparo da moto', tipo: 'despesa', categoria: 'Manutenção da moto', valorParcela: 334, status: 'pendente', mesReferencia: 10, anoReferencia: 2026 }
  ]
  const categorias = [
    { id: 'corte', nome: 'Corte de Cabelo', meta: 70, tipo: 'despesa' },
    { id: 'gasolina', nome: 'Gasolina', meta: 299, tipo: 'despesa' },
    { id: 'sonho', nome: 'Sonho', meta: 600, tipo: 'investimento' },
    { id: 'fixa-moto', nome: 'Manutenção Fixa da Moto', meta: 80, tipo: 'despesa' },
    { id: 'moto', nome: 'Manutenção da moto', meta: 100, tipo: 'despesa' }
  ]
  const { result, rerender } = renderHook(({ dataVis }) => useDashboard({ ...criarProps(dataVis, lista), categorias }), {
    initialProps: { dataVis: { mes: 10, ano: 2026 } }
  })

  assert.equal(result.current.gCat.Gasolina, 167)
  assert.equal(result.current.gCat.Sonho, 600)
  assert.equal(result.current.gCat['Manutenção Fixa da Moto'], 65)
  assert.equal(result.current.gCat['Manutenção da moto'], 334)
  assert.equal(result.current.previaCompetenciaFutura.reservaMetas, 217)

  vi.setSystemTime(new Date('2026-10-01T12:00:00'))
  rerender({ dataVis: { mes: 10, ano: 2026 } })
  assert.equal(result.current.isMesFuturo, false)
  assert.equal(result.current.gCat.Gasolina, 0)
  assert.equal(result.current.gCat.Sonho, 0)
  assert.equal(result.current.gCat['Manutenção Fixa da Moto'], 0)
  assert.equal(result.current.gCat['Manutenção da moto'], 334)
  vi.useRealTimers()
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
