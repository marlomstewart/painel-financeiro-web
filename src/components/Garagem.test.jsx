import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { Garagem } from './Garagem'

const resposta = (dados) => ({ ok: true, json: async () => dados })

test('padroniza os painéis técnicos com cabeçalho fixo e área rolável no desktop', async () => {
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (String(url).includes('consumo-combustivel')) return Promise.resolve(resposta({ dados_suficientes: false, motivo_insuficiencia: 'Sem dados', ultimo_abastecimento: null, km_por_litro_medio: null, custo_medio_por_km: null, preco_medio_por_litro: null, distancia_desde_ultimo_abastecimento_km: null, variacao_ultimo_consumo_percentual: null }))
    return Promise.resolve(resposta([]))
  }))
  const veiculo = { id: 'veiculo-painel', modelo: 'Veículo de painel', km_atual: 10000, tipo: 'proprio', ano_fabricacao: 2024, ano_modelo: 2024 }
  const transacoes = [
    { id: 'setembro', descricao: 'Combustível de setembro', tipo: 'despesa', veiculo_id: veiculo.id, mesReferencia: 9, anoReferencia: 2026, dataCompra: '2026-09-10', valorParcela: 50, categoria: 'Combustível', status: 'pago' },
    { id: 'agosto', descricao: 'Combustível de agosto', tipo: 'despesa', veiculo_id: veiculo.id, mesReferencia: 8, anoReferencia: 2026, dataCompra: '2026-08-10', valorParcela: 45, categoria: 'Combustível', status: 'pago' },
    { id: 'renda', descricao: 'Movimento que não é custo', tipo: 'renda', veiculo_id: veiculo.id, mesReferencia: 9, anoReferencia: 2026, dataCompra: '2026-09-11', valorParcela: 10, categoria: 'Teste', status: 'pago' }
  ]
  render(<Garagem getHeaders={() => ({})} setTelaAtiva={vi.fn()} transacoes={transacoes} setTransacoes={vi.fn()} cartoes={[]}
    ModalComponent={() => null} modalConfig={null} modalClose={vi.fn()}
    garagem={{ veiculosGaragem: [veiculo], setVeiculosGaragem: vi.fn() }} dataVis={{ mes: 9, ano: 2026 }} />)

  fireEvent.click(screen.getByText('Veículo de painel').closest('[role="button"]'))
  await screen.findByText('Custos Associados (Extrato)')

  const rastreador = screen.getByText('Rastreador de Peças').parentElement.parentElement
  const historico = screen.getByText('Histórico Clínico').parentElement
  const custos = screen.getByText('Custos Associados (Extrato)').parentElement.parentElement
  expect(rastreador.className).toContain('min-h-[84px]')
  expect(historico.className).toContain('min-h-[84px]')
  expect(custos.className).toContain('min-h-[84px]')
  await waitFor(() => expect(screen.getByText('Consumo de combustível')).toBeTruthy())
  expect(screen.getByText('Combustível de setembro')).toBeTruthy()
  expect(screen.queryByText('Combustível de agosto')).toBeNull()
  expect(screen.queryByText('Movimento que não é custo')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Mês anterior dos custos' }))
  expect(screen.getByText('Combustível de agosto')).toBeTruthy()
  expect(screen.queryByText('Combustível de setembro')).toBeNull()
  expect(screen.getByText('Despesas do Extrato vinculadas a este veículo no mês selecionado.')).toBeTruthy()
})

test('lista despesas do veículo no seletor próprio com data, valor e preço por litro monetário', async () => {
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (String(url).includes('consumo-combustivel')) return Promise.resolve(resposta({ dados_suficientes: false, motivo_insuficiencia: 'Sem dados', ultimo_abastecimento: null, km_por_litro_medio: null, custo_medio_por_km: null, custo_medio_diario: null, preco_medio_por_litro: null, distancia_desde_ultimo_abastecimento_km: null, variacao_ultimo_consumo_percentual: null }))
    return Promise.resolve(resposta([]))
  }))
  const veiculo = { id: 'veiculo-vinculo', modelo: 'Veículo de vínculo', km_atual: 10000, tipo: 'proprio' }
  const { container } = render(<Garagem getHeaders={() => ({})} setTelaAtiva={vi.fn()} transacoes={[{ id: 'despesa-1', descricao: 'Combustível', tipo: 'despesa', veiculo_id: veiculo.id, dataCompra: '2026-09-10', valorParcela: 25 }]}
    setTransacoes={vi.fn()} cartoes={[]} ModalComponent={() => null} modalConfig={null} modalClose={vi.fn()}
    garagem={{ veiculosGaragem: [veiculo], setVeiculosGaragem: vi.fn() }} dataVis={{ mes: 9, ano: 2026 }} />)

  fireEvent.click(screen.getByText('Veículo de vínculo').closest('[role="button"]'))
  await screen.findByText('Registrar abastecimento')
  fireEvent.click(screen.getByRole('button', { name: /Registrar abastecimento/ }))
  const odometro = container.querySelector('input[name="odometro"]')
  expect(odometro.value).toBe('10.000')
  fireEvent.change(odometro, { target: { value: '84.437' } })
  expect(odometro.value).toBe('84.437')
  fireEvent.change(odometro, { target: { value: '84.660,5' } })
  expect(odometro.value).toBe('84.660,5')
  fireEvent.change(container.querySelector('select[name="modo"]'), { target: { value: 'vincular' } })
  fireEvent.click(screen.getByRole('button', { name: /Selecione uma despesa deste veículo/ }))
  expect(screen.getByText(/10\/09\/2026.*25,00/)).toBeTruthy()
  fireEvent.click(screen.getByText('Combustível'))
  expect(screen.getByRole('button', { name: /Combustível.*10\/09\/2026/ })).toBeTruthy()
  const precoLitro = container.querySelector('input[name="precoLitro"]')
  fireEvent.change(precoLitro, { target: { value: '537' } })
  expect(precoLitro.value).toBe('5,37')
})
