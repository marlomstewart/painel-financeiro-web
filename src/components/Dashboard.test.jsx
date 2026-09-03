import { fireEvent, render, screen } from '@testing-library/react'
import assert from 'node:assert/strict'
import { vi } from 'vitest'
import { Dashboard } from './Dashboard'

test('abre o detalhamento ao selecionar um mês do fluxo de caixa projetado', () => {
  const abrirDetalheMesProjetado = vi.fn()
  const mesProjetado = {
    mes: 10,
    ano: 2026,
    saldoAcumulado: 436.57,
    renda: 1000,
    contas: 500,
    dividasParcelas: 0,
    net: 500,
    detalhes: { rendas: [], contas: [], dividas: [] },
  }

  render(
    <Dashboard
      dataVis={{ mes: 9, ano: 2026 }}
      mesAnterior={vi.fn()}
      mesProximo={vi.fn()}
      totRendaPaga={0}
      totGastoReal={0}
      totInvestido={0}
      totFaturaCreditoAberto={0}
      saldoAtual={0}
      previstoFimMes={0}
      somarSaldoAnterior
      setSomarSaldoAnterior={vi.fn()}
      categorias={[]}
      gCat={{}}
      abrirDetalhesCategoria={vi.fn()}
      pendenciasPassadas={[]}
      abrirModalPendencias={vi.fn()}
      abrirResumoCard={vi.fn()}
      verFaturasPorCartao={vi.fn()}
      fluxoProjetado={[mesProjetado]}
      abrirDetalheMesProjetado={abrirDetalheMesProjetado}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: /436,57 OUT/i }))

  assert.deepEqual(abrirDetalheMesProjetado.mock.calls, [[mesProjetado]])
})
