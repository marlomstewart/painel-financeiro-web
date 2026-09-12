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
  render(<Garagem getHeaders={() => ({})} setTelaAtiva={vi.fn()} transacoes={[]} setTransacoes={vi.fn()} cartoes={[]}
    ModalComponent={() => null} modalConfig={null} modalClose={vi.fn()}
    garagem={{ veiculosGaragem: [veiculo], setVeiculosGaragem: vi.fn() }} />)

  fireEvent.click(screen.getByText('Veículo de painel').closest('[role="button"]'))
  await screen.findByText('Custos Associados (Extrato)')

  const rastreador = screen.getByText('Rastreador de Peças').parentElement.parentElement
  const historico = screen.getByText('Histórico Clínico').parentElement
  const custos = screen.getByText('Custos Associados (Extrato)').parentElement
  expect(rastreador.className).toContain('min-h-[84px]')
  expect(historico.className).toContain('min-h-[84px]')
  expect(custos.className).toContain('min-h-[84px]')
  await waitFor(() => expect(screen.getByText('Consumo de combustível')).toBeTruthy())
})
