import assert from 'node:assert/strict'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { Dividas } from './Dividas'
import { obterProgressoDivida } from '../utils/progressoDivida'

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

test('envia a competência selecionada em mês e ano no formato esperado pela API', async () => {
  const addDivida = vi.fn().mockResolvedValue(undefined)

  render(<Dividas
    dividas={[]}
    transacoes={[]}
    addDivida={addDivida}
    editarSetup={vi.fn()}
    removerSetup={vi.fn()}
    modal={{ confirm: vi.fn() }}
    showToast={vi.fn()}
  />)

  fireEvent.change(screen.getByPlaceholderText('Ex: Financiamento Carro'), { target: { value: 'Moto' } })
  fireEvent.change(screen.getAllByPlaceholderText('0,00')[0], { target: { value: '69000' } })
  fireEvent.change(screen.getAllByPlaceholderText('0,00')[1], { target: { value: '11500' } })
  fireEvent.change(screen.getByPlaceholderText('Ex: 48'), { target: { value: '6' } })
  fireEvent.change(screen.getByLabelText('Mês da primeira parcela'), { target: { value: '3' } })
  fireEvent.change(screen.getByLabelText('Ano da primeira parcela'), { target: { value: '2027' } })
  fireEvent.change(screen.getByPlaceholderText('Ex: 10'), { target: { value: '10' } })
  fireEvent.click(screen.getByRole('button', { name: 'Registrar Dívida' }))

  await waitFor(() => expect(addDivida).toHaveBeenCalledTimes(1))
  expect(addDivida.mock.calls[0][1]).toMatchObject({
    mes_primeira_parcela: 3,
    ano_primeira_parcela: 2027,
  })
})
