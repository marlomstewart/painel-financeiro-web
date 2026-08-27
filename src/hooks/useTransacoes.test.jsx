import { act, renderHook } from '@testing-library/react'
import assert from 'node:assert/strict'
import { vi } from 'vitest'
import { useTransacoes } from './useTransacoes'

vi.mock('../utils/offlineQueue', () => ({
  salvarPendente: vi.fn(),
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
  campo(form, 'thirdPartyName', 'Pessoa teste')
  campo(form, 'thirdPartyValue', '20,00')
  return form
}

function propsBase() {
  return {
    API: 'https://api.test',
    getHeaders: () => ({ Authorization: 'Bearer token' }),
    modal: { options: vi.fn(), confirm: vi.fn() },
    token: 'token',
    temGaragem: false,
    transacoes: [],
    setTransacoes: vi.fn(),
    categorias: [],
    cartoes: [{ id: 'card-1', melhorDia: 10, nome: 'Visa teste' }],
    garagem: null,
    showToast: vi.fn(),
  }
}

test('cria todas as parcelas em uma única chamada e divide o terceiro', async () => {
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
  const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body)
  assert.equal(requestBody.transacoes.length, 2)
  assert.equal(requestBody.transacoes[0].mesReferencia, 9)
  assert.equal(requestBody.transacoes[1].mesReferencia, 10)
  assert.equal(requestBody.transacoes[0].thirdPartyValue, 10)
  assert.equal(requestBody.transacoes[1].thirdPartyValue, 10)
  assert.equal(requestBody.transacoes[0].formaPagamento, 'credito_card-1')
})

test('guarda todas as parcelas na fila quando o backend está offline', async () => {
  const { salvarPendente } = await import('../utils/offlineQueue')
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
  assert.equal(salvarPendente.mock.calls.length, 2)
  assert.equal(setTransacoes.mock.calls.length, 1)
  assert.equal(props.showToast.mock.calls.at(-1)[0], 'Sem conexão — lançamento guardado no aparelho e será enviado quando a internet voltar.')
})
