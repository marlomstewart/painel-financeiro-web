import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { Investimentos } from './Investimentos';
import { useInvestimentos } from '../hooks/useInvestimentos';
import { useBolsa } from '../hooks/useBolsa';
import { useTesouro } from '../hooks/useTesouro';
vi.mock('../hooks/useInvestimentos', () => ({ useInvestimentos: vi.fn() }));
vi.mock('../hooks/useBolsa', () => ({ useBolsa: vi.fn() }));
vi.mock('../hooks/useTesouro', () => ({ useTesouro: vi.fn() }));
const props = { API: '/api', getHeaders: () => ({}), modal: {}, showToast: vi.fn() };
const cdb = { loading: false, error: null, fetchDashboard: vi.fn(), dashboardData: { taxas: { cdiAnual: 14.15 }, caixinhas: [], resumo: { patrimonioTotal: 0, aplicadoTotal: 0, lucroBrutoTotal: 0, impostosTotal: 0, lucroLiquidoTotal: 0 } } };
beforeEach(() => {
    vi.clearAllMocks();
    useInvestimentos.mockReturnValue(cdb);
    useBolsa.mockReturnValue({ loading: false, dashboardData: { posicoes: [], resumo: { valorAtualTotal: 0, valorInvestidoTotal: 0, rentabilidadeTotal: 0, proventosTotal: 0 } } });
    useTesouro.mockReturnValue({ loading: false, dashboardData: { titulos: [], resumo: { valorInvestidoTotal: 0, valorLiquidoTotal: 0, lucroLiquidoTotal: 0 } } });
});

it('falha CDB mostra erro recuperável em vez de carregamento permanente', () => {
    useInvestimentos.mockReturnValue({ ...cdb, dashboardData: null, error: 'Taxas do Banco Central indisponíveis.' });
    render(<Investimentos {...props} />);
    expect(screen.queryByText(/Sincronizando/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(cdb.fetchDashboard).toHaveBeenCalledOnce();
});

it('carteira vazia não usa CDI null como zero e mantém cadastro, sem simuladores fictícios', () => {
    useInvestimentos.mockReturnValue({ ...cdb, dashboardData: { ...cdb.dashboardData, taxas: { cdiAnual: null, cdiIndisponivel: true } } });
    render(<Investimentos {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Renda Fixa' }));
    expect(screen.getByRole('button', { name: 'Criar Caixinha' })).toBeTruthy();
    expect(screen.getByText(/Simuladores indisponíveis sem uma taxa CDI válida/)).toBeTruthy();
    expect(screen.queryByText('Calculadora de Curto Prazo (Promoções)')).toBeNull();
});

it('erro Tesouro impede total consolidado falso e fornece nova tentativa', () => {
    const fetchDashboard = vi.fn();
    useTesouro.mockReturnValue({ loading: false, dashboardData: null, error: 'Taxas do Banco Central indisponíveis.', fetchDashboard });
    render(<Investimentos {...props} />);
    expect(screen.getByRole('alert').textContent).toMatch(/Não foi possível calcular/);
    expect(screen.queryByText('Consolidando seu patrimônio...')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(fetchDashboard).toHaveBeenCalledOnce();
});
