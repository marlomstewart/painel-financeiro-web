import assert from 'node:assert/strict'
import { afterEach, test } from 'vitest'
import { lerRotaDeRetorno, lerTelaDaURL, montarURL, montarURLLogin } from './urlEstado'

const abrir = (url) => window.history.replaceState(null, '', url)

afterEach(() => abrir('/'))

test('lê módulos pelas rotas amigáveis e mantém mês e ano como consulta', () => {
  abrir('/extrato?mes=9&ano=2026')

  assert.equal(lerTelaDaURL(), 'extrato')
  assert.equal(montarURL('extrato', { mes: 9, ano: 2026 }), '/extrato?mes=9&ano=2026')
  assert.equal(montarURL('configuracoes'), '/configuracoes')
})

test('aceita links legados na leitura para convertê-los ao caminho canônico', () => {
  abrir('/?tela=investimentos')

  assert.equal(lerTelaDaURL(), 'investimentos')
  assert.equal(montarURL('investimentos'), '/investimentos')
})

test('preserva apenas retornos internos para uma rota protegida', () => {
  abrir('/login?retorno=%2Fextrato%3Fmes%3D9%26ano%3D2026')
  assert.equal(lerRotaDeRetorno(), '/extrato?mes=9&ano=2026')
  assert.equal(montarURLLogin('/extrato?mes=9&ano=2026'), '/login?retorno=%2Fextrato%3Fmes%3D9%26ano%3D2026')

  abrir('/login?retorno=%2F%2Fevil.example')
  assert.equal(lerRotaDeRetorno(), null)
})
