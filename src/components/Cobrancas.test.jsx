import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { Cobrancas } from './Cobrancas'

const baseProps = {
  dividas: [], cartoes: [], dataVis: { mes: 9, ano: 2026 },
  marcarRecebidoTerceiro: vi.fn(), modal: { confirm: vi.fn() }, showToast: vi.fn(), chavePix: '',
}

test('AUD-007: recebimento antigo quitado fora da competência permite informar data sem desmarcar', () => {
  const marcarRecebidoTerceiro = vi.fn()
  render(<Cobrancas {...baseProps} marcarRecebidoTerceiro={marcarRecebidoTerceiro} transacoes={[
    { id: 'antiga', descricao: 'Compra antiga', mesReferencia: 8, anoReferencia: 2026, dataCompra: '2026-08-01',
      isThirdParty: true, terceiro_recebido: true, formaPagamento: 'pix',
      participantes: [{ id: 'legado', legado: true, nome: 'Ana', valorParcela: 70, recebido: true, recebimento: null }] },
  ]} />)
  expect(screen.getByText(/Recebido sem data histórica/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Informar data conhecida' }))
  expect(marcarRecebidoTerceiro).toHaveBeenCalledWith('antiga', true, null, true)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar marcação incorreta' }))
  expect(marcarRecebidoTerceiro).toHaveBeenLastCalledWith('antiga', true, null)
})

test('AUD-007: mostra a data recebida sem permitir redatação silenciosa', () => {
  render(<Cobrancas {...baseProps} transacoes={[
    { id: 'datada', descricao: 'Compra', mesReferencia: 9, anoReferencia: 2026, dataCompra: '2026-09-01', formaPagamento: 'pix',
      participantes: [{ id: 'ana', nome: 'Ana', valorParcela: 70, recebido: true,
        recebimento: { data_recebimento: '2026-10-01' } }] },
  ]} />)
  expect(screen.getByText(/Recebido em 01\/10\/2026/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Informar data conhecida' }).disabled).toBe(true)
})

test('mostra apenas pessoas com cobrança pendente na competência selecionada', () => {
  render(<Cobrancas {...baseProps} transacoes={[
    { id: 'anterior', isThirdParty: true, thirdPartyName: 'Ana', thirdPartyValue: 30, valorParcela: 30, descricao: 'Compra anterior', mesReferencia: 8, anoReferencia: 2026, dataCompra: '2026-08-10', formaPagamento: 'pix' },
    { id: 'atual', isThirdParty: true, thirdPartyName: 'Bia', thirdPartyValue: 45, valorParcela: 45, descricao: 'Descrição de cobrança muito longa para verificar a segunda linha do card', mesReferencia: 9, anoReferencia: 2026, dataCompra: '2026-09-10', formaPagamento: 'pix' },
  ]} />)

  expect(screen.queryByRole('heading', { name: 'Ana' })).toBeNull()
  expect(screen.getByRole('heading', { name: 'Bia' })).toBeTruthy()
  expect(screen.getByText(/Descrição de cobrança muito longa/).className).toContain('line-clamp-2')
})

test('empilha os valores do detalhamento em telas estreitas', () => {
  render(<Cobrancas {...baseProps} transacoes={[
    { id: 'atual', isThirdParty: true, thirdPartyName: 'Bia', thirdPartyValue: 1234567.89, valorParcela: 1234567.89, descricao: 'Cobrança', mesReferencia: 9, anoReferencia: 2026, dataCompra: '2026-09-10', formaPagamento: 'pix' },
  ]} />)

  fireEvent.click(screen.getByTitle('Ver Detalhamento Completo'))
  expect(screen.getByText('Total Já Pago').parentElement.parentElement.className).toContain('grid-cols-1')
  expect(screen.getByText('Dívida Restante (Geral)').parentElement.parentElement.className).toContain('sm:grid-cols-2')
  expect(screen.getByText('0 Pagas').parentElement.parentElement.className).toContain('grid-cols-1')
})

test('recebimento no Extrato reduz o total geral de uma dívida de terceiro', () => {
  render(<Cobrancas {...baseProps}
    dividas={[{ id: 'd1', descricao: 'Empréstimo', valor_parcela: 100, qtd_parcelas: 3, parcelas_pagas_iniciais: 0, para_terceiros: 1, nome_terceiro: 'Bia' }]}
    transacoes={[
      { id: 'parcela-1', grupo_id: 'divida_d1', tipo: 'despesa', categoria: 'Dívidas e Empréstimos', valorParcela: 100, thirdPartyValue: 100, terceiro_recebido: true, mesReferencia: 8, anoReferencia: 2026 },
      { id: 'parcela-2', grupo_id: 'divida_d1', tipo: 'despesa', categoria: 'Dívidas e Empréstimos', valorParcela: 100, thirdPartyValue: 100, terceiro_recebido: false, mesReferencia: 9, anoReferencia: 2026, dataCompra: '2026-09-10' },
    ]}
  />)

  expect(screen.getByText('Total Restante (Geral)').parentElement.textContent).toContain('200,00')
  expect(screen.getByRole('heading', { name: 'Bia' })).toBeTruthy()
})

test('exibe e recebe participantes da mesma parcela de forma independente', async () => {
  const marcarRecebidoTerceiro = vi.fn()
  const modal = { confirm: vi.fn().mockResolvedValue(true) }
  render(<Cobrancas {...baseProps} modal={modal} marcarRecebidoTerceiro={marcarRecebidoTerceiro} transacoes={[
    {
      id: 'compartilhada-1', isThirdParty: true, descricao: 'Compra compartilhada (1/3)',
      mesReferencia: 9, anoReferencia: 2026, dataCompra: '2026-09-10', formaPagamento: 'pix',
      participantes: [
        { id: 'ana', nome: 'Ana', valorParcela: 30, recebido: false },
        { id: 'bia', nome: 'Bia', valorParcela: 20, recebido: false },
      ],
    },
  ]} />)

  expect(screen.getByRole('heading', { name: 'Ana' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Bia' })).toBeTruthy()
  expect(screen.getAllByText(/50,00/).length).toBeGreaterThan(0)
  fireEvent.click(screen.getAllByRole('button', { name: /Marcar como Recebido/ })[0])
  await waitFor(() => expect(marcarRecebidoTerceiro).toHaveBeenCalledWith('compartilhada-1', false, 'ana'))
  expect(marcarRecebidoTerceiro).toHaveBeenCalledTimes(1)
})
