import { expect, test, vi } from 'vitest'
import { ehFalhaDeChunk, instalarRecargaPorPreloadDoVite, recarregarPorChunkDesatualizado } from './pwaUpdate'

function criarAmbiente() {
  const valores = new Map()
  const ambiente = new EventTarget()
  ambiente.location = { pathname: '/dashboard', search: '?origem=pwa', hash: '', reload: vi.fn() }
  ambiente.sessionStorage = { getItem: chave => valores.get(chave) || null, setItem: (chave, valor) => valores.set(chave, valor) }
  return ambiente
}

test('reconhece somente falhas conhecidas de chunk carregado sob demanda', () => {
  expect(ehFalhaDeChunk(new TypeError('Failed to fetch dynamically imported module'))).toBe(true)
  expect(ehFalhaDeChunk(new Error('Loading chunk 42 failed.'))).toBe(true)
  expect(ehFalhaDeChunk(new Error('Erro de validação financeira'))).toBe(false)
})

test('recarrega uma única vez para atualizar o chunk antigo', () => {
  const ambiente = criarAmbiente()
  const erro = new Error('Importing a module script failed')

  expect(recarregarPorChunkDesatualizado(erro, ambiente)).toBe(true)
  expect(ambiente.location.reload).toHaveBeenCalledTimes(1)
  expect(recarregarPorChunkDesatualizado(erro, ambiente)).toBe(false)
  expect(ambiente.location.reload).toHaveBeenCalledTimes(1)
})

test('intercepta o preload do Vite antes que ele alcance o ErrorBoundary', () => {
  const ambiente = criarAmbiente()
  const remover = instalarRecargaPorPreloadDoVite(ambiente)
  const evento = new Event('vite:preloadError', { cancelable: true })
  evento.payload = new Error('Failed to fetch dynamically imported module')

  expect(ambiente.dispatchEvent(evento)).toBe(false)
  expect(ambiente.location.reload).toHaveBeenCalledTimes(1)
  remover()
})
