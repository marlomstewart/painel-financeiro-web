import { renderHook, waitFor } from '@testing-library/react'
import assert from 'node:assert/strict'
import { afterEach, test, vi } from 'vitest'
import { useOfflineSync } from './useOfflineSync'

const queue = vi.hoisted(() => ({
  listarPendentes: vi.fn(),
  contarPendentesSemDono: vi.fn(),
  removerPendente: vi.fn(),
  atualizarPendente: vi.fn(),
}))

vi.mock('../utils/offlineQueue', () => queue)

const lote = {
  id: 'lote_1_compra_0',
  usuarioId: '1',
  tipo: 'lote',
  estado: 'pendente',
  tentativas: 0,
  criadoEm: 1,
  payload: { transacoes: [{ id: 'compra_0' }, { id: 'compra_1' }] },
}

const tokenDaConta = id => `x.${btoa(JSON.stringify({ id }))}.sig`

function propsBase() {
  return {
    API: 'https://api.test',
    getHeaders: () => ({ Authorization: 'Bearer token' }),
    token: tokenDaConta(1),
    setTransacoes: vi.fn(),
    showToast: vi.fn(),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

queue.contarPendentesSemDono.mockResolvedValue(0)

test('reenvia um lote offline em uma chamada transacional e remove somente após sucesso', async () => {
  queue.listarPendentes.mockResolvedValue([lote])
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

  renderHook(() => useOfflineSync(propsBase()))

  await waitFor(() => assert.ok(queue.removerPendente.mock.calls.length >= 1))
  assert.equal(fetch.mock.calls[0][0], 'https://api.test/transacoes/lote')
  assert.deepEqual(JSON.parse(fetch.mock.calls[0][1].body), lote.payload)
  assert.equal(queue.removerPendente.mock.calls[0][0], lote.id)
  assert.equal(queue.removerPendente.mock.calls[0][1], '1')
  assert.equal(fetch.mock.calls[0][1].headers['X-Fincontrole-Owner-Id'], '1')
  assert.equal(fetch.mock.calls[0][1].headers.Authorization, `Bearer ${tokenDaConta(1)}`)
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
  assert.deepEqual(queue.atualizarPendente.mock.calls[0], [lote.id, '1', {
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

test('troca A→B não envia lançamento de A com a sessão de B', async () => {
  queue.listarPendentes.mockImplementation(id => Promise.resolve(id === '1' ? [] : [lote])) // Leitura de B contaminada.
  vi.stubGlobal('fetch', vi.fn())
  const props = propsBase()
  const { rerender } = renderHook(({ token }) => useOfflineSync({ ...props, token }), {
    initialProps: { token: tokenDaConta(1) },
  })
  await waitFor(() => assert.ok(queue.listarPendentes.mock.calls.length >= 1))
  rerender({ token: tokenDaConta(2) })
  await waitFor(() => assert.ok(queue.listarPendentes.mock.calls.some(call => call[0] === '2')))
  assert.equal(fetch.mock.calls.length, 0)
  assert.equal(queue.removerPendente.mock.calls.length, 0)
})

test('entrada antiga sem dono é contabilizada, mas não enviada', async () => {
  queue.listarPendentes.mockResolvedValue([])
  queue.contarPendentesSemDono.mockResolvedValue(1)
  vi.stubGlobal('fetch', vi.fn())
  const { result } = renderHook(() => useOfflineSync(propsBase()))
  await waitFor(() => assert.equal(result.current.semDono, 1))
  assert.equal(fetch.mock.calls.length, 0)
  assert.deepEqual(result.current.pendentes, [])
})

test('resposta de sincronização de A não atualiza a tela após entrar em B', async () => {
  queue.listarPendentes.mockImplementation(id => Promise.resolve(id === '1' ? [lote] : []))
  let responder
  vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { responder = resolve })))
  const props = propsBase()
  const { rerender } = renderHook(({ token }) => useOfflineSync({ ...props, token }), {
    initialProps: { token: tokenDaConta(1) },
  })
  await waitFor(() => assert.equal(fetch.mock.calls.length, 1))
  rerender({ token: tokenDaConta(2) })
  responder({ ok: true })
  await waitFor(() => assert.ok(queue.listarPendentes.mock.calls.some(call => call[0] === '2')))
  assert.equal(queue.removerPendente.mock.calls.length, 0)
  assert.equal(props.setTransacoes.mock.calls.length, 0)
})
