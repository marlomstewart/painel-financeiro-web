import { render, renderHook, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useCartoesFaturas } from './useCartoesFaturas'
import { Modal } from '../components/Modal'

const criarProps = (transacoesMes) => ({
  transacoesMes,
  cartoes: [{ id: 'card_com_id', nome: 'Meu cartão' }],
  dataVis: { mes: 10, ano: 2026 },
  setTransacoes: vi.fn(), API: 'https://api.test', getHeaders: () => ({}),
  modal: { setConfig: vi.fn(), close: vi.fn() }, showToast: vi.fn(),
})
const compra = (campos = {}) => ({
  id: 'compra', valorParcela: 100, tipo: 'despesa', status: 'pendente',
  formaPagamento: 'credito_card_com_id', ...campos,
})

test('fatura usa todos os participantes, preserva rateio após recebimento e esclarece pendências', () => {
  const participantes = [
    { id: 'ana', nome: 'Ana', valorParcela: 30, recebido: true },
    { id: 'bia', nome: 'Bia', valorParcela: 20, recebido: false },
  ]
  const props = criarProps([compra({
    participantes, isThirdParty: true, thirdPartyName: 'Legado ignorado', thirdPartyValue: 99,
  })])
  const { result, rerender } = renderHook(({ lista }) => useCartoesFaturas({ ...props, transacoesMes: lista }), {
    initialProps: { lista: props.transacoesMes },
  })
  result.current.verFaturasPorCartao()
  const config = props.modal.setConfig.mock.calls[0][0]
  expect(config.itens).toEqual([{
    nome: 'Meu cartão', total: 100, pago: 0, pendente: 100, gastoPessoal: 50,
    listaTerceiros: [{ nome: 'Ana', valor: 30 }, { nome: 'Bia', valor: 20 }],
  }])
  expect(config.cartaoIds).toEqual({ 'Meu cartão': 'card_com_id' })

  rerender({ lista: [compra({ participantes: participantes.map(p => ({ ...p, recebido: true })) })] })
  result.current.verFaturasPorCartao()
  expect(props.modal.setConfig.mock.calls[1][0].itens).toEqual(config.itens)

  const { unmount } = render(<Modal config={config} onClose={props.modal.close} />)
  expect(screen.getByText('Ana')).toBeTruthy()
  expect(screen.getByText('Bia')).toBeTruthy()
  expect(screen.queryByText('Legado ignorado')).toBeNull()
  expect(screen.getByText(/incluindo valores já recebidos/)).toBeTruthy()
  expect(screen.getByText(/Consulte A Receber para ver as pendências/)).toBeTruthy()
  unmount()
})

test('estorno abate a fatura e as partes dos participantes em centavos por cartão', () => {
  const props = criarProps([
    compra({ status: 'pago', valorParcela: '100.03', participantes: [
      { nome: ' Ana ', valorParcela: '30.01' }, { nome: 'Bia', valorParcela: '20.02' },
    ] }),
    compra({ id: 'estorno', tipo: 'reembolso', status: 'pago', valorParcela: '10.03', participantes: [
      { nome: 'Ana', valorParcela: '3.01' }, { nome: 'Bia', valorParcela: '2.02' },
    ] }),
    compra({ id: 'outra', valorParcela: 15 }),
    compra({ id: 'pix', formaPagamento: 'pix', valorParcela: 900 }),
  ])
  const { result } = renderHook(() => useCartoesFaturas(props))
  result.current.verFaturasPorCartao()
  expect(props.modal.setConfig.mock.calls[0][0].itens).toEqual([{
    nome: 'Meu cartão', total: 105, pago: 90, pendente: 15, gastoPessoal: 60,
    listaTerceiros: [{ nome: 'Ana', valor: 27 }, { nome: 'Bia', valor: 18 }],
  }])
})

test.each([
  { thirdPartyValue: 40, gastoPessoal: 60, valorTerceiro: 40 },
  { thirdPartyValue: null, gastoPessoal: 0, valorTerceiro: 100 },
])('mantém terceiro único legado: $valorTerceiro na fatura', ({ thirdPartyValue, gastoPessoal, valorTerceiro }) => {
  const props = criarProps([compra({ participantes: [], isThirdParty: true, thirdPartyName: 'João', thirdPartyValue })])
  const { result } = renderHook(() => useCartoesFaturas(props))
  result.current.verFaturasPorCartao()
  expect(props.modal.setConfig.mock.calls[0][0].itens[0]).toMatchObject({
    total: 100, gastoPessoal, listaTerceiros: [{ nome: 'João', valor: valorTerceiro }],
  })
})
