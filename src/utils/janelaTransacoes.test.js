import assert from 'node:assert/strict'
import { test } from 'vitest'
import { montarConsultaTransacoes } from './janelaTransacoes'

test('inclui o marco de caixa na consulta de transações quando disponível', () => {
  const params = new URLSearchParams(montarConsultaTransacoes({ valor: 43.9, data: '2026-08-31' }))
  assert.equal(params.get('desdeCaixa'), '2026-08-31')
  assert.match(params.get('desde'), /^\d{4}-\d{2}-\d{2}$/)
})

test('não envia marco de caixa inválido', () => {
  const params = new URLSearchParams(montarConsultaTransacoes({ valor: 43.9, data: '31/08/2026' }))
  assert.equal(params.has('desdeCaixa'), false)
})
