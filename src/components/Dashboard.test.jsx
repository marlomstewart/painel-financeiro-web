import { fireEvent, render, screen, within } from '@testing-library/react'
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
  assert.equal(screen.queryByText(/Valores de terceiros excluídos da previsão/), null)
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

test('metas futuras distinguem lançado, orçamento, total previsto e reserva adicional', () => {
  const abrirDetalhesCategoria = vi.fn()
  render(
    <Dashboard
      dataVis={{ mes: 11, ano: 2026 }} mesAnterior={vi.fn()} mesProximo={vi.fn()}
      categorias={[
        { id: 'gas', nome: 'Gasolina', meta: 253, tipo: 'despesa' },
        { id: 'moto', nome: 'Manutenção da moto', meta: 100, tipo: 'despesa' }
      ]}
      gCat={{ Gasolina: 26.50, 'Manutenção da moto': 354.12 }}
      abrirDetalhesCategoria={abrirDetalhesCategoria} pendenciasPassadas={[]}
      abrirResumoCard={vi.fn()} isMesFuturo
      previaCompetenciaFutura={{ rendas: 2518.74, gastos: 680.69, faturas: 800.17, reservaMetas: 976.50, resultado: 61.38 }}
    />
  )
  const gas = within(screen.getByText('Gasolina').closest('[class*="cursor-pointer"]'))
  assert.ok(gas.getByText('Já lançado (sua parte)'))
  assert.ok(gas.getByText('Orçamento'))
  assert.match(gas.getByText(/Total previsto:/).textContent, /253,00/)
  assert.match(gas.getByText(/Reserva adicional:/).textContent, /226,50/)
  const moto = within(screen.getByText('Manutenção da moto').closest('[class*="cursor-pointer"]'))
  assert.match(moto.getByText(/Total previsto:/).textContent, /354,12/)
  assert.match(moto.getByText(/Reserva adicional:/).textContent, /0,00/)
  assert.equal(screen.queryByText(/progresso do mês atual/), null)
  fireEvent.click(gas.getByText('Gasolina'))
  assert.deepEqual(abrirDetalhesCategoria.mock.calls, [['Gasolina', 26.50, 253, 'despesa']])
})
