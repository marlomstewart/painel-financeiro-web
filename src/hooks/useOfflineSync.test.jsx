import { renderHook, waitFor } from '@testing-library/react'
import assert from 'node:assert/strict'
import { afterEach, test, vi } from 'vitest'
import { useOfflineSync } from './useOfflineSync'

const queue = vi.hoisted(() => ({
  listarPendentes: vi.fn(),
  removerPendente: vi.fn(),
  atualizarPendente: vi.fn(),
}))

vi.mock('../utils/offlineQueue', () => queue)

const lote = {
  id: 'lote_compra_0',
  tipo: 'lote',
  estado: 'pendente',
  tentativas: 0,
  criadoEm: 1,
  payload: { transacoes: [{ id: 'compra_0' }, { id: 'compra_1' }] },
}

function propsBase() {
  return {
    API: 'https://api.test',
    getHeaders: () => ({ Authorization: 'Bearer token' }),
    token: 'token',
    setTransacoes: vi.fn(),
    showToast: vi.fn(),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

test('reenvia um lote offline em uma chamada transacional e remove somente após sucesso', async () => {
  queue.listarPendentes.mockResolvedValue([lote])
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

  renderHook(() => useOfflineSync(propsBase()))

  await waitFor(() => assert.ok(queue.removerPendente.mock.calls.length >= 1))
  assert.equal(fetch.mock.calls[0][0], 'https://api.test/transacoes/lote')
  assert.deepEqual(JSON.parse(fetch.mock.calls[0][1].body), lote.payload)
  assert.equal(queue.removerPendente.mock.calls[0][0], lote.id)
})

test('marca resposta 400 como falha permanente e interrompe retry automático', async () => {
  queue.listarPendentes.mockResolvedValue([lote])
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 400,
    json: async () => ({ message: 'Cartão não pertence ao usuário.' }),
  }))

  const props = propsBase()
  renderHook(() => useOfflineSync(props))

  await waitFor(() => assert.equal(queue.atualizarPendente.mock.calls.length, 1))
  assert.deepEqual(queue.atualizarPendente.mock.calls[0], [lote.id, {
    tentativas: 1,
    estado: 'falha_permanente',
    erro: 'Cartão não pertence ao usuário.',
  }])
  assert.equal(props.showToast.mock.calls.at(-1)[0], 'Um lote precisa de correção e não será reenviado automaticamente.')
})

test('não reenvia automaticamente um lote já marcado como falha permanente', async () => {
  queue.listarPendentes.mockResolvedValue([{ ...lote, estado: 'falha_permanente' }])
  vi.stubGlobal('fetch', vi.fn())

  renderHook(() => useOfflineSync(propsBase()))
  await waitFor(() => assert.ok(queue.listarPendentes.mock.calls.length >= 1))

  assert.equal(fetch.mock.calls.length, 0)
})
