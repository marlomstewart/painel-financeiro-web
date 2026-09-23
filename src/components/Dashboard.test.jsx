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
    saldoAnterior: 236.57,
    terceirosExcluidos: 150,
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

  assert.ok(screen.getByText('O que este cálculo considera?'))
  assert.ok(screen.getByText(/Valores de terceiros excluídos da previsão: R\$\s?150,00/))
  assert.ok(screen.getByText(/R\$\s?436,57/))
  fireEvent.click(screen.getByRole('button', { name: /Saldo previsto ao fim de Outubro.*436,57/i }))

  assert.deepEqual(abrirDetalheMesProjetado.mock.calls, [[mesProjetado]])
})

test('mostra somente os cards da prévia quando a competência é futura', () => {
  const abrirResumoCard = vi.fn()
  render(
    <Dashboard
      dataVis={{ mes: 10, ano: 2026 }} mesAnterior={vi.fn()} mesProximo={vi.fn()}
      totRendaPaga={0} totGastoReal={0} totInvestido={0} totFaturaCreditoAberto={0}
      saldoAtual={9999} previstoFimMes={9999} somarSaldoAnterior setSomarSaldoAnterior={vi.fn()}
      categorias={[]} gCat={{}} abrirDetalhesCategoria={vi.fn()} pendenciasPassadas={[]}
      abrirModalPendencias={vi.fn()} abrirResumoCard={abrirResumoCard} verFaturasPorCartao={vi.fn()}
      isMesFuturo
      previaCompetenciaFutura={{ rendas: 1500, gastos: 550, faturas: 600, reservaMetas: 80, resultado: 270, detalhes: {} }}
    />
  )

  assert.ok(screen.getByText('Rendas previstas'))
  assert.ok(screen.getByText('Gastos previstos'))
  assert.ok(screen.getByText('Faturas abertas'))
  assert.ok(screen.getByText('Reserva de metas'))
  assert.ok(screen.getByText('Resultado previsto'))
  assert.equal(screen.queryByText('Saldo Líquido'), null)
  assert.equal(screen.queryByText('Fluxo de Caixa Projetado'), null)
  fireEvent.click(screen.getByText('Resultado previsto'))
  assert.deepEqual(abrirResumoCard.mock.calls, [['previa_resultado', []]])
})
