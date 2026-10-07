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
      metas: [
        { id: 'meta_alimentacao', descricao: 'Alimentação', origem: 'Reserva adicional até o orçamento', orcamento: 1100, jaLancado: 1100, previsto: 1100, valor: 0 },
        { id: 'meta_viagem', descricao: 'Viagem', origem: 'Reserva adicional até o orçamento', orcamento: 80, jaLancado: 0, previsto: 80, valor: 80 }
      ]
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

test('detalhamento do fluxo mostra a fatura e apenas os gastos pessoais do cartão', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-22T12:00:00'))
  const modal = { alert: vi.fn() }
  const lista = [
    { id: 'mercado', descricao: 'Mercado', tipo: 'despesa', valorParcela: 200, status: 'pendente', formaPagamento: 'credito_nubank', mesReferencia: 10, anoReferencia: 2026 },
    { id: 'restaurante', descricao: 'Restaurante', tipo: 'despesa', valorParcela: 100, status: 'pendente', formaPagamento: 'credito_nubank', mesReferencia: 10, anoReferencia: 2026, participantes: [{ nome: 'Ana', valorParcela: 70 }] }
  ]
  const { result } = renderHook(() => useDashboard({
    ...criarProps({ mes: 9, ano: 2026 }, lista),
    modal,
    cartoes: [{ id: 'nubank', nome: 'Nubank' }]
  }))

  const outubro = result.current.fluxoProjetado[0]
  assert.equal(outubro.faturasCartao, 230)
  assert.equal(outubro.terceirosExcluidos, 70)
  result.current.abrirDetalheMesProjetado(outubro)
  const { unmount } = render(modal.alert.mock.calls[0][0])

  assert.ok(screen.getByText('Faturas pessoais de cartão'))
  assert.ok(screen.getByText('Faturas de cartão'))
  assert.ok(screen.getByText('Sua parte considerada'))
  assert.ok(screen.getByText('Terceiros excluídos'))
  assert.ok(screen.getByText('Gastos pessoais no cartão'))
  assert.ok(screen.getByText('Mercado'))
  assert.ok(screen.getByText('Restaurante'))
  unmount()
  vi.useRealTimers()
})

test('prévia de novembro reserva o orçamento restante sem importar outubro nem duplicar lançamentos', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-07T12:00:00'))
  const modal = { alert: vi.fn() }
  const lista = [
    { id: 'corte-outubro', descricao: 'Corte', tipo: 'despesa', categoria: 'Corte de Cabelo', valorParcela: 35, status: 'pago', mesReferencia: 10, anoReferencia: 2026 },
    { id: 'fixa-outubro', descricao: 'Manutenção fixa', tipo: 'despesa', categoria: 'Manutenção Fixa da Moto', valorParcela: 73.78, status: 'pendente', mesReferencia: 10, anoReferencia: 2026 },
    { id: 'sonho-outubro', descricao: 'Sonho', tipo: 'investimento', categoria: 'Sonho', valorParcela: 600, status: 'pago', mesReferencia: 10, anoReferencia: 2026 },
    { id: 'gasolina-novembro', descricao: 'Abastecimento', tipo: 'despesa', categoria: 'Gasolina', valorParcela: 26.50, status: 'pendente', formaPagamento: 'pix', mesReferencia: 11, anoReferencia: 2026 },
    { id: 'moto-novembro', descricao: 'Reparo da moto', tipo: 'despesa', categoria: 'Manutenção da moto', valorParcela: 354.12, status: 'pendente', formaPagamento: 'credito_card', mesReferencia: 11, anoReferencia: 2026 },
    { id: 'outros-gastos', descricao: 'Outros gastos', tipo: 'despesa', categoria: 'Contas Fixas', valorParcela: 654.19, status: 'pendente', formaPagamento: 'pix', mesReferencia: 11, anoReferencia: 2026 },
    { id: 'outras-faturas', descricao: 'Outras faturas', tipo: 'despesa', categoria: 'Contas Fixas', valorParcela: 446.05, status: 'pendente', formaPagamento: 'credito_card', mesReferencia: 11, anoReferencia: 2026 },
    { id: 'renda', descricao: 'Renda', tipo: 'renda', valorParcela: 2518.74, status: 'pendente', mesReferencia: 11, anoReferencia: 2026 }
  ]
  const categorias = [
    { id: 'corte', nome: 'Corte de Cabelo', meta: 70, tipo: 'despesa' },
    { id: 'gasolina', nome: 'Gasolina', meta: 253, tipo: 'despesa' },
    { id: 'sonho', nome: 'Sonho', meta: 600, tipo: 'investimento' },
    { id: 'fixa-moto', nome: 'Manutenção Fixa da Moto', meta: 80, tipo: 'despesa' },
    { id: 'moto', nome: 'Manutenção da moto', meta: 100, tipo: 'despesa' }
  ]
  const { result, rerender } = renderHook(({ dataVis }) => useDashboard({ ...criarProps(dataVis, lista), categorias, modal }), {
    initialProps: { dataVis: { mes: 11, ano: 2026 } }
  })

  assert.equal(result.current.gCat.Gasolina, 26.50)
  assert.equal(result.current.gCat.Sonho, 0)
  assert.equal(result.current.gCat['Manutenção Fixa da Moto'], 0)
  assert.equal(result.current.gCat['Manutenção da moto'], 354.12)
  assert.equal(result.current.previaCompetenciaFutura.gastos, 680.69)
  assert.equal(result.current.previaCompetenciaFutura.faturas, 800.17)
  assert.equal(result.current.previaCompetenciaFutura.reservaMetas, 976.50)
  assert.equal(result.current.previaCompetenciaFutura.resultado, 61.38)
  assert.deepEqual(result.current.previaCompetenciaFutura.detalhes.metas.map(item => [item.descricao, item.jaLancado, item.previsto, item.valor]), [
    ['Corte de Cabelo', 0, 70, 70],
    ['Gasolina', 26.50, 253, 226.50],
    ['Sonho', 0, 600, 600],
    ['Manutenção Fixa da Moto', 0, 80, 80],
    ['Manutenção da moto', 354.12, 354.12, 0]
  ])
  result.current.abrirResumoCard('previa_metas')
  const { unmount } = render(modal.alert.mock.calls[0][0])
  assert.ok(screen.getByText(/Reserva adicional = orçamento do mês/))
  fireEvent.click(screen.getByTitle('Clique para ver os lançamentos'))
  assert.ok(screen.getByText('Reserva adicional até o orçamento: Gasolina'))
  assert.ok(screen.getByText(/Orçamento: R\$\s*253,00.*Já lançado.*26,50.*Total previsto.*253,00/))
  assert.ok(screen.getByText(/Orçamento: R\$\s*100,00.*Já lançado.*354,12.*Total previsto.*354,12/))
  unmount()
  result.current.abrirDetalhesCategoria('Gasolina', 26.50, 253, 'despesa')
  const raioX = render(modal.alert.mock.calls[1][0])
  assert.ok(screen.getByText(/Reserva adicional: R\$\s*226,50.*Total previsto da categoria: R\$\s*253,00/))
  raioX.unmount()

  vi.setSystemTime(new Date('2026-11-01T12:00:00'))
  rerender({ dataVis: { mes: 11, ano: 2026 } })
  assert.equal(result.current.isMesFuturo, false)
  assert.equal(result.current.previaCompetenciaFutura, null)
  assert.equal(result.current.gCat.Gasolina, 26.50)
  assert.equal(result.current.gCat.Sonho, 0)
  assert.equal(result.current.gCat['Manutenção Fixa da Moto'], 0)
  assert.equal(result.current.gCat['Manutenção da moto'], 354.12)
  vi.useRealTimers()
})

test.each([
  ['abaixo', [{ tipo: 'despesa', valorParcela: 26.50 }], 26.50, 73.50, 26.50],
  ['igual', [{ tipo: 'despesa', valorParcela: 100 }], 100, 0, 100],
  ['acima', [{ tipo: 'despesa', valorParcela: 354.12 }], 354.12, 0, 354.12],
  ['dividido', [{ tipo: 'despesa', valorParcela: 120, participantes: [{ nome: 'Ana', valorParcela: 80 }] }], 40, 60, 40],
  ['só terceiro', [{ tipo: 'despesa', valorParcela: 120, isThirdParty: true }], 0, 100, 0],
  ['reembolso', [{ tipo: 'despesa', valorParcela: 80 }, { tipo: 'reembolso', valorParcela: 30 }], 50, 50, 50],
  ['crédito líquido', [{ tipo: 'reembolso', valorParcela: 20 }], -20, 120, -20],
  ['investimento', [{ tipo: 'investimento', valorParcela: 30 }], 30, 70, 30],
  ['já pago', [{ tipo: 'despesa', valorParcela: 30, status: 'pago' }], 30, 70, 0]
])('reserva futura considera somente a fração pessoal: %s', (_, movimentos, jaLancado, reserva, compromisso) => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-12-07T12:00:00'))
  const lista = movimentos.map((item, id) => ({
    id, descricao: `Movimento ${id}`, categoria: 'Meta', formaPagamento: 'credito_card', status: 'pendente',
    mesReferencia: 1, anoReferencia: 2027, ...item
  }))
  const { result } = renderHook(() => useDashboard({
    ...criarProps({ mes: 1, ano: 2027 }, lista),
    categorias: [{ id: 'meta', nome: 'Meta', meta: 100, tipo: 'despesa' }]
  }))
  const previa = result.current.previaCompetenciaFutura
  assert.equal(previa.detalhes.metas[0].jaLancado, jaLancado)
  assert.equal(previa.reservaMetas, reserva)
  assert.equal(previa.gastos + previa.faturas, compromisso)
  assert.equal(previa.resultado, -(compromisso + reserva))
  vi.useRealTimers()
})

test.each([0, 25300])('prévia futura respeita o orçamento canônico de combustível: %i centavos', (planejado) => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-07T12:00:00'))
  const plano = criarPlano('2026-11')
  plano.resumo = { planejadoCentavos: planejado, registradoCentavos: 2650, restanteCentavos: 0, previstoCentavos: 2650 }
  const lista = [{ id: 'gasolina', descricao: 'Abastecimento', categoria: 'Gasolina', tipo: 'despesa',
    valorParcela: 26.50, status: 'pendente', formaPagamento: 'pix', mesReferencia: 11, anoReferencia: 2026 }]
  const { result } = renderHook(() => useDashboard({
    ...criarProps({ mes: 11, ano: 2026 }, lista), temGaragem: true,
    categorias: [{ id: 'gas', nome: 'Gasolina', tipo: 'despesa', meta: 299 }], garagem: { planoMes: plano }
  }))
  assert.equal(result.current.categoriasDinamicas[0].meta, planejado / 100)
  assert.equal(result.current.previaCompetenciaFutura.reservaMetas, planejado ? 226.50 : 0)
  assert.equal(result.current.previaCompetenciaFutura.resultado, planejado ? -253 : -26.50)
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
