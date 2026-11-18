import { act, renderHook } from '@testing-library/react'
import assert from 'node:assert/strict'
import { vi } from 'vitest'
import { useTransacoes } from './useTransacoes'

const tokenDeTeste = `x.${btoa(JSON.stringify({ id: 1 }))}.sig`

vi.mock('../utils/offlineQueue', () => ({
  salvarLotePendente: vi.fn(),
}))

function campo(form, name, value, type = 'text') {
  const input = document.createElement('input')
  input.name = name
  input.value = value
  input.type = type
  form.appendChild(input)
  return input
}

function formularioDeLancamento() {
  const form = document.createElement('form')
  campo(form, 'valor', '100,00')
  campo(form, 'categoria', 'Alimentação')
  campo(form, 'dataCompra', '2026-08-11')
  campo(form, 'formaPagamento', 'credito_card-1')
  campo(form, 'parcelas', '2')
  campo(form, 'descricao', 'Compra dividida')
  campo(form, 'tipo', 'despesa')
  campo(form, 'status', 'pendente')
  const terceiro = campo(form, 'isThirdParty', 'on', 'checkbox')
  terceiro.checked = true
  campo(form, 'participantes', JSON.stringify([
    { id: 'ana', nome: 'Ana', telefone: '85999990001', valorTotal: 30 },
    { id: 'bia', nome: 'Bia', telefone: '', valorTotal: 20 },
  ]))
  return form
}

function propsBase() {
  return {
    API: 'https://api.test',
    getHeaders: () => ({ Authorization: 'Bearer token' }),
    modal: { prompt: vi.fn(), options: vi.fn(), confirm: vi.fn() },
    token: tokenDeTeste,
    temGaragem: false,
    transacoes: [],
    setTransacoes: vi.fn(),
    categorias: [],
    cartoes: [{ id: 'card-1', melhorDia: 10, nome: 'Visa teste' }],
    garagem: null,
    showToast: vi.fn(),
  }
}

test('cria todas as parcelas em uma única chamada e envia os totais dos participantes para a API', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ quantidade: 2 }) })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
  vi.stubGlobal('fetch', fetchMock)

  const { result } = renderHook(() => useTransacoes(propsBase()))
  await act(async () => {
    await result.current.addTransacao({
      preventDefault: vi.fn(),
      target: formularioDeLancamento(),
    })
  })

  assert.equal(fetchMock.mock.calls[0][0], 'https://api.test/transacoes/lote')
  assert.equal(fetchMock.mock.calls[0][1].headers['X-Fincontrole-Owner-Id'], '1')
  const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body)
  assert.equal(requestBody.transacoes.length, 2)
  assert.equal(requestBody.transacoes[0].mesReferencia, 9)
  assert.equal(requestBody.transacoes[1].mesReferencia, 10)
  assert.deepEqual(requestBody.transacoes.map(item => item.valorParcela), [50, 50])
  assert.deepEqual(requestBody.transacoes[0].participantes, [
    { id: 'ana', nome: 'Ana', telefone: '85999990001', valorTotal: 30 },
    { id: 'bia', nome: 'Bia', telefone: '', valorTotal: 20 },
  ])
  assert.deepEqual(requestBody.transacoes[1].participantes, requestBody.transacoes[0].participantes)
  assert.equal(requestBody.transacoes[0].thirdPartyValue, undefined)
  assert.equal(requestBody.transacoes[0].formaPagamento, 'credito_card-1')
})

test('marca somente o participante informado como recebido', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ recebido: true }) })
  vi.stubGlobal('fetch', fetchMock)
  const props = propsBase()
  const setTransacoes = vi.fn()
  props.modal.prompt.mockResolvedValue('2026-09-20')
  props.setTransacoes = setTransacoes
  const { result } = renderHook(() => useTransacoes(props))

  await act(async () => {
    await result.current.marcarRecebidoTerceiro('tx-1', false, 'ana')
  })

  assert.equal(fetchMock.mock.calls[0][0], 'https://api.test/transacoes/tx-1/participantes/ana/recebido')
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[0][1].body), { recebido: true, dataRecebimento: '2026-09-20' })
  const atualizar = setTransacoes.mock.calls[0][0]
  const atualizadas = atualizar([{ id: 'tx-1', participantes: [{ id: 'ana', recebido: false }, { id: 'bia', recebido: false }] }])
  assert.deepEqual(atualizadas[0].participantes, [{ id: 'ana', recebido: true, recebimento: null }, { id: 'bia', recebido: false }])
})

test('recebimento legado usa a rota da transação e atualiza a prévia imediatamente', async () => {
  const recebimento = { id: 'r-legado', participante_chave: 'legado', valor: 15, data_recebimento: '2026-09-20' }
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ terceiro_recebido: true, recebimento }) })
  vi.stubGlobal('fetch', fetchMock)
  const props = propsBase()
  props.modal.prompt.mockResolvedValue('2026-09-20')
  const { result } = renderHook(() => useTransacoes(props))

  await act(async () => {
    await result.current.marcarRecebidoTerceiro('tx-legada', false, null)
  })

  assert.equal(fetchMock.mock.calls[0][0], 'https://api.test/transacoes/tx-legada/terceiro-recebido')
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[0][1].body), { recebido: true, dataRecebimento: '2026-09-20' })
  const atualizadas = props.setTransacoes.mock.calls[0][0]([
    { id: 'tx-legada', terceiro_recebido: false, participantes: [{ id: 'legado', legado: true, recebido: false }] },
    { id: 'tx-normalizada', participantes: [{ id: 'ana', recebido: false }] },
  ])
  assert.equal(atualizadas[0].terceiro_recebido, true)
  assert.equal(atualizadas[0].participantes[0].recebido, true)
  assert.deepEqual(atualizadas[0].recebimentos, [recebimento])
  assert.deepEqual(atualizadas[0].participantes[0].recebimento, recebimento)
  assert.equal(atualizadas[1].participantes[0].recebido, false)
})

test('desfazer recebimento envia false e atualiza somente o estado correspondente', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ recebido: false }) })
  vi.stubGlobal('fetch', fetchMock)
  const props = propsBase()
  props.modal.confirm.mockResolvedValue(true)
  const { result } = renderHook(() => useTransacoes(props))

  await act(async () => {
    await result.current.marcarRecebidoTerceiro('tx-compartilhada', true, 'ana')
    await result.current.marcarRecebidoTerceiro('tx-legada', true, null)
  })

  assert.equal(fetchMock.mock.calls[0][0], 'https://api.test/transacoes/tx-compartilhada/participantes/ana/recebido')
  assert.equal(fetchMock.mock.calls[1][0], 'https://api.test/transacoes/tx-legada/terceiro-recebido')
  assert.deepEqual(fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body)), [{ recebido: false }, { recebido: false }])
  const normalizada = props.setTransacoes.mock.calls[0][0]([
    { id: 'tx-compartilhada', participantes: [{ id: 'ana', recebido: true }, { id: 'bia', recebido: true }] },
  ])[0]
  assert.deepEqual(normalizada.participantes, [{ id: 'ana', recebido: false, recebimento: null }, { id: 'bia', recebido: true }])
  const legada = props.setTransacoes.mock.calls[1][0]([
    { id: 'tx-legada', terceiro_recebido: true, participantes: [{ id: 'legado', legado: true, recebido: true }] },
  ])[0]
  assert.equal(legada.terceiro_recebido, false)
  assert.equal(legada.participantes[0].recebido, false)
})

test('desfazer confirmado em Cobranças não pede confirmação duas vezes', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ recebido: false, recebimento: null }) })
  vi.stubGlobal('fetch', fetchMock)
  const props = propsBase()
  const { result } = renderHook(() => useTransacoes(props))
  await act(async () => result.current.marcarRecebidoTerceiro('tx-legada', true, null, false, true))
  assert.equal(props.modal.confirm.mock.calls.length, 0)
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[0][1].body), { recebido: false })
})

test('Marcar Pago usa a data escolhida e preserva os recebimentos de terceiros na tela', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data_pagamento: '2026-09-03' }) })
  vi.stubGlobal('fetch', fetchMock)
  const props = propsBase()
  props.transacoes = [{ id: 'tx-1', status: 'pendente', data_pagamento: null, terceiro_recebido: true, participantes: [{ id: 'joao', recebido: true }] }]
  props.modal.prompt.mockResolvedValue('2026-09-03')
  const { result } = renderHook(() => useTransacoes(props))

  await act(async () => {
    await result.current.alternarStatusTransacao('tx-1', 'pendente')
  })

  assert.equal(props.modal.prompt.mock.calls[0][3].inputType, 'date')
  assert.equal(props.modal.prompt.mock.calls[0][3].inputLabel, 'Data em que você pagou')
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[0][1].body), { status: 'pago', dataPagamento: '2026-09-03' })
  const atualizada = props.setTransacoes.mock.calls[0][0](props.transacoes)[0]
  assert.equal(atualizada.status, 'pago')
  assert.equal(atualizada.data_pagamento, '2026-09-03')
  assert.equal(atualizada.terceiro_recebido, true)
  assert.deepEqual(atualizada.participantes, [{ id: 'joao', recebido: true }])
})

test('cancelar a escolha de data não envia nada; reconciliar legado preserva recebido=true', async () => {
  const props = propsBase()
  const r = { id: 'r', participante_chave: 'legado', valor: 70, data_recebimento: '2026-09-20' }
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ recebido: true, recebimento: r }) })
  vi.stubGlobal('fetch', fetchMock)
  const { result } = renderHook(() => useTransacoes(props))
  props.modal.prompt.mockResolvedValueOnce(null).mockResolvedValueOnce('2026-09-20')
  await act(async () => result.current.marcarRecebidoTerceiro('tx-1', false))
  assert.equal(fetchMock.mock.calls.length, 0)
  await act(async () => result.current.marcarRecebidoTerceiro('tx-1', true, null, true))
  assert.equal(props.modal.prompt.mock.calls[1][1], '') // não estima data antiga
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[0][1].body), { recebido: true, dataRecebimento: '2026-09-20' })
  const tx = props.setTransacoes.mock.calls[0][0]([{ id: 'tx-1', terceiro_recebido: true, recebimentos: [{ participante_chave: 'legado', data_recebimento: null }] }])[0]
  assert.equal(tx.terceiro_recebido, true)
  assert.deepEqual(tx.recebimentos, [r])
})

test('falha HTTP preserva o estado local e exibe erro; cancelamento requer confirmação', async () => {
  const props = propsBase()
  props.modal.prompt.mockResolvedValue('2026-09-20')
  props.modal.confirm.mockResolvedValue(false)
  const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: 'Conflito' }) })
  vi.stubGlobal('fetch', fetchMock)
  const { result } = renderHook(() => useTransacoes(props))
  await act(async () => result.current.marcarRecebidoTerceiro('tx-1', true))
  assert.equal(fetchMock.mock.calls.length, 0)
  await act(async () => result.current.marcarRecebidoTerceiro('tx-1', false))
  assert.equal(props.setTransacoes.mock.calls.length, 0)
  assert.deepEqual(props.showToast.mock.calls[0], ['Conflito', 'error'])
})

test('cancelar a data não marca pago nem chama a API', async () => {
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  const props = propsBase()
  props.modal.prompt.mockResolvedValue(null)
  const { result } = renderHook(() => useTransacoes(props))
  let retorno
  await act(async () => { retorno = await result.current.alternarStatusTransacao('tx-1', 'pendente') })
  assert.equal(retorno, false)
  assert.equal(fetchMock.mock.calls.length, 0)
  assert.equal(props.setTransacoes.mock.calls.length, 0)
})

test('Marcar Pago em lote confirma e envia a mesma data para os itens selecionados', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
  vi.stubGlobal('fetch', fetchMock)
  const props = propsBase()
  props.modal.prompt.mockResolvedValue('2026-09-05')
  props.modal.confirm.mockResolvedValue(true)
  const { result } = renderHook(() => useTransacoes(props))
  let retorno
  await act(async () => { retorno = await result.current.executarAcaoEmMassa(['tx-1', 'tx-2'], 'pago') })
  assert.equal(retorno, true)
  assert.equal(props.modal.prompt.mock.calls[0][3].inputType, 'date')
  assert.match(props.modal.confirm.mock.calls[0][0], /05\/09\/2026/)
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[0][1].body), { ids: ['tx-1', 'tx-2'], acao: 'pago', dataPagamento: '2026-09-05' })
})

test('guarda todas as parcelas como um único lote quando o backend está offline', async () => {
  const { salvarLotePendente } = await import('../utils/offlineQueue')
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  const props = propsBase()
  const setTransacoes = vi.fn()
  props.setTransacoes = setTransacoes
  const { result } = renderHook(() => useTransacoes(props))

  let retorno
  await act(async () => {
    retorno = await result.current.addTransacao({
      preventDefault: vi.fn(),
      target: formularioDeLancamento(),
    })
  })

  assert.equal(retorno, 'offline')
  assert.equal(salvarLotePendente.mock.calls.length, 1)
  assert.equal(salvarLotePendente.mock.calls[0][0].length, 2)
  assert.equal(salvarLotePendente.mock.calls[0][1], '1')
  assert.equal(setTransacoes.mock.calls.length, 1)
  const atualizar = setTransacoes.mock.calls[0][0]
  const otimistas = atualizar([])
  assert.deepEqual(otimistas[0].participantes.map(item => [item.id, item.valorParcela]), [['ana', 15], ['bia', 10]])
  assert.deepEqual(otimistas[1].participantes.map(item => [item.id, item.valorParcela]), [['ana', 15], ['bia', 10]])
  assert.equal(props.showToast.mock.calls.at(-1)[0], 'Sem conexão — lançamento guardado no aparelho e será enviado quando a internet voltar.')
})

test('envia a data escolhida na prévia e na confirmação da antecipação', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dataAntecipacao: '2026-10-02',
        quantidadeDisponivel: 2,
        destino: { mes: 10, ano: 2026, faturasQuitadasIgnoradas: 0 },
        parcelas: [{ valorParcela: 20 }, { valorParcela: 30 }],
      }),
    })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Parcelas antecipadas com sucesso.' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
  vi.stubGlobal('fetch', fetchMock)
  const props = propsBase()
  props.modal.prompt.mockResolvedValue('2026-10-02')
  props.modal.options.mockResolvedValue(2)
  props.modal.confirm.mockResolvedValue(true)
  const { result } = renderHook(() => useTransacoes(props))

  await act(async () => {
    await result.current.anteciparParcelasCredito({ id: 'parcela-1' })
  })

  assert.equal(fetchMock.mock.calls[0][0], 'https://api.test/transacoes/parcela-1/antecipacao/previa?dataAntecipacao=2026-10-02')
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[1][1].body), { quantidade: 2, dataAntecipacao: '2026-10-02' })
  assert.match(props.modal.confirm.mock.calls[0][0], /02\/10\/2026/)
  assert.match(props.modal.confirm.mock.calls[0][0], /R\$\s?50,00/)
  assert.match(props.modal.confirm.mock.calls[0][0], /10\/2026/)
})
