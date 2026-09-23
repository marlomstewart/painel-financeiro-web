import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Lancamentos } from './Lancamentos';
import { baixarCsvExtrato, montarCsvExtrato } from '../utils/exportarExtratoCsv';

vi.mock('../utils/exportarExtratoCsv', () => ({
  montarCsvExtrato: vi.fn(() => 'csv'),
  baixarCsvExtrato: vi.fn()
}));

const propsBase = {
  categorias: [], cartoes: [{ id: 'card-1', nome: 'Cartão teste' }], addTransacao: vi.fn(),
  filtroStatus: 'todos', setFiltroStatus: vi.fn(), buscaTexto: '', setBuscaTexto: vi.fn(),
  mostrarFiltrosAvancados: false, setMostrarFiltrosAvancados: vi.fn(),
  filtrosAvancados: {}, setFiltrosAvancados: vi.fn(), mudarOrdenacao: vi.fn(),
  ordenacao: { coluna: 'data', direcao: 'desc' }, alternarStatusTransacao: vi.fn(),
  editarValor: vi.fn(), deletarTransacao: vi.fn(), executarAcaoEmMassa: vi.fn(),
  anteciparParcelasCredito: vi.fn(), modal: { setConfig: vi.fn() }, showToast: vi.fn(),
  nomeUsuario: 'Teste', dataVis: { mes: 10, ano: 2026 }, transacoes: []
};

test('exporta apenas as linhas visíveis do Extrato na competência selecionada', () => {
  const outubro = {
    id: 'compra_1', descricao: 'Compra feita em setembro (1/2)', dataCompra: '2026-09-26',
    valorParcela: 75, formaPagamento: 'credito_card-1', mesReferencia: 10, anoReferencia: 2026,
    status: 'pendente', categoria: 'Mercado'
  };
  render(<Lancamentos {...propsBase} dadosTabela={[outubro]} />);

  fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));

  expect(montarCsvExtrato).toHaveBeenCalledWith([outubro], propsBase.cartoes);
  expect(baixarCsvExtrato).toHaveBeenCalledWith('csv', 'extrato-fatura-2026-10.csv');
  expect(propsBase.showToast).toHaveBeenCalledWith('1 lançamento exportado em CSV.', 'success');
});

test('desabilita a exportação quando os filtros não deixam linhas visíveis', () => {
  render(<Lancamentos {...propsBase} dadosTabela={[]} />);
  expect(screen.getByRole('button', { name: 'Exportar CSV' }).disabled).toBe(true);
});
