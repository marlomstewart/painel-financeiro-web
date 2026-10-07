import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { Cobrancas } from './Cobrancas'

const baseProps = {
  dividas: [], cartoes: [], dataVis: { mes: 9, ano: 2026 },
  marcarRecebidoTerceiro: vi.fn(), modal: { confirm: vi.fn() }, showToast: vi.fn(), chavePix: '',
}

test.each(['WhatsApp no PC', 'WhatsApp no celular', 'cópia'])('mensagem de %s resume só as pendências da pessoa por vencimento, em ordem', async (canal) => {
  const usaWhatsApp = canal !== 'cópia'
  const celular = canal === 'WhatsApp no celular'
  const copiar = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText: copiar }, userAgent: celular ? 'Mozilla/5.0 (Linux; Android 14) Mobile' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })
  const abrir = vi.spyOn(window, 'open').mockImplementation(() => null)
  const telefone = usaWhatsApp ? '85999990000' : null
  const compra = (campos) => ({
    isThirdParty: true, thirdPartyName: 'João', thirdPartyPhone: telefone,
    mesReferencia: 10, anoReferencia: 2026, dataCompra: '2026-09-01',
    formaPagamento: 'credito_card_com_id', ...campos,
  })
  let unmount
  try {
    const tela = render(<Cobrancas {...baseProps} dataVis={{ mes: 10, ano: 2026 }} chavePix="chave-de-teste"
      cartoes={[{ id: 'card_com_id', nome: 'Nubank', vencimento: 10 }, { id: 'outro', nome: 'Outro cartão', vencimento: 10 }]}
      dividas={[{ id: 'emprestimo', descricao: 'Empréstimo de João', valor_parcela: 1041.50,
        qtd_parcelas: 15, para_terceiros: true, nome_terceiro: 'João', forma_pagamento: 'pix' }]}
      transacoes={[
        // Entrada fora de ordem para garantir que o resumo começa no vencimento mais próximo.
        { id: 'emprestimo', grupo_id: 'divida_emprestimo', tipo: 'despesa', categoria: 'Dívidas e Empréstimos',
          descricao: 'Empréstimo (11/15)', valorParcela: 1041.50, terceiro_recebido: false,
          mesReferencia: 10, anoReferencia: 2026, dataCompra: '2026-10-16', formaPagamento: 'pix' },
        compra({ id: 'tenis', descricao: 'Tênis (7/7)', valorParcela: 33, thirdPartyValue: 33 }),
        compra({ id: 'revisao', descricao: 'Revisão (3/3)', valorParcela: 62.62, thirdPartyValue: 62.62, formaPagamento: 'credito_outro' }),
        compra({ id: 'medidor', descricao: 'Medidor (1/3)', valorParcela: 100, participantes: [
          { id: 'joao', nome: 'João', valorParcela: 28.60, recebido: false },
          { id: 'bia', nome: 'Bia', valorParcela: 50, recebido: false },
        ] }),
        compra({ id: 'recebida', descricao: 'Compra já recebida', valorParcela: 200, thirdPartyValue: 200, terceiro_recebido: true }),
        compra({ id: 'futura', descricao: 'Compra de outro mês', valorParcela: 300, thirdPartyValue: 300, mesReferencia: 11 }),
      ]} />)
    unmount = tela.unmount
    const card = screen.getByRole('heading', { name: 'João' }).closest('.rounded-3xl')
    fireEvent.click(within(card).getByRole('button', { name: usaWhatsApp ? /Abrir WhatsApp/ : /Copiar Cobrança Mensal/ }))
    await waitFor(() => expect(usaWhatsApp ? abrir : copiar).toHaveBeenCalledTimes(1))
    const texto = (usaWhatsApp
      ? new URL(abrir.mock.calls[0][0]).searchParams.get('text')
      : copiar.mock.calls[0][0]).replace(/\u00a0/g, ' ')
    const resumo = '*Total vence 10/10: R$ 124,22*\n🗓 *Total vence 16/10: R$ 1.041,50*\n\n💰 *Total do Mês: R$ 1.165,72*'
    expect(texto).toContain(resumo)
    expect(texto).toContain('Oi João, tudo bem? ✌️')
    expect(texto).toContain('🛍 *Revisão (3/3)*')
    expect(texto).toContain('💵 Valor: R$ 28,60')
    expect(texto).toContain('Chave PIX: chave-de-teste 🚀')
    expect(texto).not.toContain('\uFFFD')
    expect(texto).toContain('Valor: R$ 28,60')
    expect(texto).toContain('Vencimento: 10/10 (Nubank)')
    expect(texto).toContain('Vencimento: 16/10 (pix)')
    expect(texto).toContain('Chave PIX: chave-de-teste')
    expect(texto).not.toContain('Compra já recebida')
    expect(texto).not.toContain('Compra de outro mês')
    expect(texto.match(/Total vence 10\/10/g)).toHaveLength(1)
    if (usaWhatsApp) {
      expect(abrir.mock.calls[0][0]).toContain(celular
        ? 'https://wa.me/5585999990000?text='
        : 'https://web.whatsapp.com/send/?phone=5585999990000&text=')
      expect(copiar).not.toHaveBeenCalled()
    } else {
      expect(abrir).not.toHaveBeenCalled()
    }
  } finally {
    unmount?.()
    abrir.mockRestore()
    vi.unstubAllGlobals()
  }
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

test('terceiro único legado usa a rota do lançamento, sem ID de participante', async () => {
  const marcarRecebidoTerceiro = vi.fn()
  const modal = { confirm: vi.fn().mockResolvedValue(true) }
  render(<Cobrancas {...baseProps} modal={modal} marcarRecebidoTerceiro={marcarRecebidoTerceiro} transacoes={[{
    id: 'compra-legada', isThirdParty: true, thirdPartyName: 'Mayara', thirdPartyValue: 25,
    valorParcela: 50, descricao: 'Compra antiga', mesReferencia: 9, anoReferencia: 2026,
    dataCompra: '2026-09-10', formaPagamento: 'pix',
    participantes: [{ id: 'legado', nome: 'Mayara', valorParcela: 25, recebido: false, legado: true }],
  }]} />)

  fireEvent.click(screen.getByRole('button', { name: /Marcar como Recebido/ }))
  await waitFor(() => expect(marcarRecebidoTerceiro).toHaveBeenCalledWith('compra-legada', false, null))
})

test('não tenta receber participante de lançamento que ainda está na fila offline', () => {
  const marcarRecebidoTerceiro = vi.fn()
  render(<Cobrancas {...baseProps} marcarRecebidoTerceiro={marcarRecebidoTerceiro} transacoes={[{
    id: 'compra-local', descricao: 'Compra offline', mesReferencia: 9, anoReferencia: 2026,
    dataCompra: '2026-09-10', formaPagamento: 'pix', _pendingSync: true,
    participantes: [{ id: 'arthur', nome: 'Arthur', valorParcela: 30, recebido: false }],
  }]} />)

  const acao = screen.getByRole('button', { name: /Aguardando sincronização/ })
  expect(acao.disabled).toBe(true)
  fireEvent.click(acao)
  expect(marcarRecebidoTerceiro).not.toHaveBeenCalled()
})

test('não oferece recebimento para parcela de dívida ainda na fila offline', () => {
  render(<Cobrancas {...baseProps}
    dividas={[{ id: 'd1', descricao: 'Empréstimo', valor_parcela: 100, qtd_parcelas: 2, para_terceiros: 1, nome_terceiro: 'José' }]}
    transacoes={[{ id: 'parcela-local', grupo_id: 'divida_d1', tipo: 'despesa', categoria: 'Dívidas e Empréstimos',
      valorParcela: 100, thirdPartyValue: 100, terceiro_recebido: false, mesReferencia: 9, anoReferencia: 2026,
      dataCompra: '2026-09-10', _pendingSync: true }]}
  />)

  expect(screen.getByRole('button', { name: /Aguardando sincronização/ }).disabled).toBe(true)
})

test('desfaz recebimento legado mesmo quando não há mais cobranças pendentes', async () => {
  const marcarRecebidoTerceiro = vi.fn()
  const modal = { confirm: vi.fn().mockResolvedValue(true) }
  render(<Cobrancas {...baseProps} modal={modal} marcarRecebidoTerceiro={marcarRecebidoTerceiro} transacoes={[{
    id: 'compra-legada', isThirdParty: true, thirdPartyName: 'Mayara', thirdPartyValue: 25,
    valorParcela: 50, descricao: 'Compra antiga', mesReferencia: 9, anoReferencia: 2026,
    dataCompra: '2026-09-10', formaPagamento: 'pix',
    participantes: [{ id: 'legado', nome: 'Mayara', valorParcela: 25, recebido: true, legado: true }],
  }]} />)

  expect(screen.getByRole('heading', { name: 'Nenhuma cobrança pendente neste mês' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Recebidos nesta competência' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Desfazer recebimento de Compra antiga para Mayara/ }))
  await waitFor(() => expect(marcarRecebidoTerceiro).toHaveBeenCalledWith('compra-legada', true, null))
})

test('desfaz somente a pessoa recebida de uma compra compartilhada', async () => {
  const marcarRecebidoTerceiro = vi.fn()
  const modal = { confirm: vi.fn().mockResolvedValue(true) }
  render(<Cobrancas {...baseProps} modal={modal} marcarRecebidoTerceiro={marcarRecebidoTerceiro} transacoes={[{
    id: 'compartilhada-1', isThirdParty: true, descricao: 'Compra compartilhada',
    mesReferencia: 9, anoReferencia: 2026, dataCompra: '2026-09-10', formaPagamento: 'pix',
    participantes: [
      { id: 'ana', nome: 'Ana', valorParcela: 30, recebido: true },
      { id: 'bia', nome: 'Bia', valorParcela: 20, recebido: false },
    ],
  }]} />)

  expect(screen.getByRole('heading', { name: 'Bia' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Desfazer recebimento de Compra compartilhada para Ana/ }))
  await waitFor(() => expect(marcarRecebidoTerceiro).toHaveBeenCalledWith('compartilhada-1', true, 'ana'))
})

test('desfaz a parcela recebida de dívida da competência selecionada', async () => {
  const marcarRecebidoTerceiro = vi.fn()
  const modal = { confirm: vi.fn().mockResolvedValue(true) }
  render(<Cobrancas {...baseProps} modal={modal} marcarRecebidoTerceiro={marcarRecebidoTerceiro}
    dividas={[{ id: 'd1', descricao: 'Empréstimo', valor_parcela: 100, qtd_parcelas: 3, para_terceiros: 1, nome_terceiro: 'José' }]}
    transacoes={[
      { id: 'parcela-agosto', grupo_id: 'divida_d1', tipo: 'despesa', categoria: 'Dívidas e Empréstimos', valorParcela: 100, terceiro_recebido: true, mesReferencia: 8, anoReferencia: 2026, dataCompra: '2026-08-10' },
      { id: 'parcela-setembro', grupo_id: 'divida_d1', tipo: 'despesa', categoria: 'Dívidas e Empréstimos', valorParcela: 100, terceiro_recebido: true, mesReferencia: 9, anoReferencia: 2026, dataCompra: '2026-09-10' },
    ]}
  />)

  expect(screen.getAllByRole('button', { name: /Desfazer recebimento/ })).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: /Desfazer recebimento/ }))
  await waitFor(() => expect(marcarRecebidoTerceiro).toHaveBeenCalledWith('parcela-setembro', true, undefined))
})

test('cancelar o desfazer não altera o recebimento', async () => {
  const marcarRecebidoTerceiro = vi.fn()
  const modal = { confirm: vi.fn().mockResolvedValue(false) }
  render(<Cobrancas {...baseProps} modal={modal} marcarRecebidoTerceiro={marcarRecebidoTerceiro} transacoes={[{
    id: 'compra-legada', isThirdParty: true, thirdPartyName: 'Mayara', thirdPartyValue: 25,
    valorParcela: 50, descricao: 'Compra antiga', mesReferencia: 9, anoReferencia: 2026,
    dataCompra: '2026-09-10', formaPagamento: 'pix', terceiro_recebido: true,
  }]} />)

  fireEvent.click(screen.getByRole('button', { name: /Desfazer recebimento/ }))
  await waitFor(() => expect(modal.confirm).toHaveBeenCalled())
  expect(marcarRecebidoTerceiro).not.toHaveBeenCalled()
})
