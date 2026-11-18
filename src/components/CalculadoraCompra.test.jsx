import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { CalculadoraCompra } from './CalculadoraCompra';
import { useInvestimentos } from '../hooks/useInvestimentos';
vi.mock('../hooks/useInvestimentos', () => ({ useInvestimentos: vi.fn() }));

it('CDI ausente não vira zero nem gera veredito financeiro', () => {
    const fetchDashboard = vi.fn();
    useInvestimentos.mockReturnValue({ loading: false, error: null, fetchDashboard, dashboardData: { taxas: { cdiAnual: null }, caixinhas: [] } });
    render(<CalculadoraCompra />);
    expect(screen.getByRole('alert').textContent).toMatch(/Nenhum resultado foi estimado/);
    expect(screen.queryByText('Compre à Vista')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(fetchDashboard).toHaveBeenCalledOnce();
});

it('503 exibe erro recuperável em vez de carregamento permanente', () => {
    useInvestimentos.mockReturnValue({ loading: false, error: 'Taxas do Banco Central indisponíveis.', dashboardData: null, fetchDashboard: vi.fn() });
    render(<CalculadoraCompra />);
    expect(screen.queryByText(/Sincronizando/)).toBeNull();
    expect(screen.getByRole('alert').textContent).toMatch(/Banco Central indisponíveis/);
});

it('simulação com última taxa válida mantém aviso de degradação', () => {
    useInvestimentos.mockReturnValue({ loading: false, error: null, dashboardData: { taxas: { cdiAnual: 14.15, cdiEstimado: true, indicadores: { selic: { desatualizado: true, dataReferencia: '2026-10-02', consultadoEm: '2026-10-03T12:00:00Z', fonte: 'BCB/SGS', serie: 432 } } }, caixinhas: [] } });
    render(<CalculadoraCompra />);
    expect(screen.getByRole('alert').textContent).toMatch(/desatualizada/);
});
