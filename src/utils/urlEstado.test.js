import assert from 'node:assert/strict'
import { afterEach, test } from 'vitest'
import { lerDataVisDaURL, lerRotaDeRetorno, lerTelaDaURL, montarURL, montarURLLogin } from './urlEstado'

const abrir = (url) => window.history.replaceState(null, '', url)

afterEach(() => abrir('/'))

test('monta caminhos legíveis sem competência na consulta', () => {
  abrir('/extrato')

  assert.equal(lerTelaDaURL(), 'extrato')
  assert.equal(montarURL('extrato'), '/extrato')
  assert.equal(montarURL('configuracoes'), '/configuracoes')
})

test('aceita links legados e mantém sua competência apenas na abertura', () => {
  abrir('/?tela=investimentos&mes=9&ano=2026')

  assert.equal(lerTelaDaURL(), 'investimentos')
  assert.deepEqual(lerDataVisDaURL({ mes: 1, ano: 2026 }), { mes: 9, ano: 2026 })
  assert.equal(montarURL('investimentos'), '/investimentos')
})

test('preserva apenas retornos internos para uma rota protegida', () => {
  abrir('/login?retorno=%2Fextrato')
  assert.equal(lerRotaDeRetorno(), '/extrato')
  assert.equal(montarURLLogin('/extrato'), '/login?retorno=%2Fextrato')

  abrir('/login?retorno=%2F%2Fevil.example')
  assert.equal(lerRotaDeRetorno(), null)
})
