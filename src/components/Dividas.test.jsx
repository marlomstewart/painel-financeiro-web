import assert from 'node:assert/strict'
import { test } from 'vitest'
import { obterProgressoDivida } from './Dividas'

test('progresso de dívida de terceiro usa recebimento e parcelas do tipo despesa', () => {
  const divida = { id: 'd1', qtd_parcelas: 3, parcelas_pagas_iniciais: 0, para_terceiros: true }
  const transacoes = [
    { grupo_id: 'divida_d1', tipo: 'despesa', status: 'pendente', terceiro_recebido: true },
    { grupo_id: 'divida_d1', tipo: 'despesa', status: 'pago', terceiro_recebido: false },
  ]
  assert.deepEqual(obterProgressoDivida(divida, transacoes), { pagas: 1, total: 3, percentual: 33 })
})

test('progresso de dívida própria usa pagamento e parcelas do tipo despesa', () => {
  const divida = { id: 'd2', qtd_parcelas: 2, parcelas_pagas_iniciais: 0, para_terceiros: false }
  const transacoes = [{ grupo_id: 'divida_d2', tipo: 'despesa', status: 'pago', terceiro_recebido: false }]
  assert.deepEqual(obterProgressoDivida(divida, transacoes), { pagas: 1, total: 2, percentual: 50 })
})
