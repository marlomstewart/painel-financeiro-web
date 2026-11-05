import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInvestmentDashboard } from './useInvestmentDashboard';
import { useInvestimentos } from './useInvestimentos';
import { useTesouro } from './useTesouro';

const getHeaders = () => ({ Authorization: 'Bearer token-sintetico' });
const data = { taxas: { cdiAnual: 14.15, desatualizadas: false }, resumo: { aplicadoTotal: 100 }, caixinhas: [] };
const ok = dashboardData => ({ ok: true, json: async () => dashboardData });
const indisponivel = { ok: false, status: 503, json: async () => ({ code: 'TAXAS_BCB_INDISPONIVEIS' }) };
const pendente = () => { let resolver; const promise = new Promise(resolve => { resolver = resolve; }); return { promise, resolver }; };
afterEach(() => vi.unstubAllGlobals());

describe('dashboard de investimentos', () => {
    it('503 termina o carregamento, não inventa números e permite recuperar', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(indisponivel).mockResolvedValueOnce(ok(data));
        vi.stubGlobal('fetch', fetchMock);
        const { result } = renderHook(() => useInvestmentDashboard({ endpoint: '/investimentos', getHeaders }));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.dashboardData).toBeNull();
        expect(result.current.error).toMatch(/Banco Central indisponíveis/);
        await act(async () => result.current.fetchDashboard());
        expect(result.current.error).toBeNull();
        expect(result.current.dashboardData).toEqual(data);
    });

    it('falha após consulta válida remove dados antigos em vez de tratá-los como atuais', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(ok(data)).mockRejectedValueOnce(new Error('offline')));
        const { result } = renderHook(() => useInvestmentDashboard({ endpoint: '/investimentos', getHeaders }));
        await waitFor(() => expect(result.current.dashboardData).toEqual(data));
        await act(async () => result.current.fetchDashboard());
        expect(result.current.dashboardData).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toMatch(/conexão/);
    });

    it('metadados de taxa antiga permanecem visíveis sem ser convertidos em taxa atual', async () => {
        const degradado = { ...data, taxas: { cdiAnual: 14.15, desatualizadas: true, indicadores: { selic: { valor: 14.25, desatualizado: true, consultadoEm: '2026-10-01T12:00:00Z' } } } };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(degradado)));
        const { result } = renderHook(() => useInvestmentDashboard({ endpoint: '/investimentos', getHeaders }));
        await waitFor(() => expect(result.current.dashboardData).toEqual(degradado));
        expect(result.current.error).toBeNull();
    });

    it('requisição substituída é abortada e resposta atrasada não sobrescreve a nova', async () => {
        const antiga = pendente();
        const fetchMock = vi.fn().mockReturnValueOnce(antiga.promise).mockResolvedValueOnce(ok(data));
        vi.stubGlobal('fetch', fetchMock);
        const { result } = renderHook(() => useInvestmentDashboard({ endpoint: '/investimentos', getHeaders }));
        await act(async () => result.current.fetchDashboard());
        expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
        await act(async () => antiga.resolver(ok({ resumo: { aplicadoTotal: 999 } })));
        expect(result.current.dashboardData).toEqual(data);
    });

    it('troca de endpoint e desmontagem abortam a requisição anterior', async () => {
        const antiga = pendente();
        const fetchMock = vi.fn().mockReturnValueOnce(antiga.promise).mockResolvedValueOnce(ok(data));
        vi.stubGlobal('fetch', fetchMock);
        const { result, rerender, unmount } = renderHook(({ endpoint }) => useInvestmentDashboard({ endpoint, getHeaders }), { initialProps: { endpoint: '/a' } });
        const refreshAntigo = result.current.fetchDashboard;
        rerender({ endpoint: '/b' });
        await waitFor(() => expect(result.current.dashboardData).toEqual(data));
        expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
        await act(async () => refreshAntigo());
        expect(fetchMock).toHaveBeenCalledTimes(2);
        const refreshAtual = result.current.fetchDashboard;
        unmount();
        expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(true);
        await act(async () => antiga.resolver(ok({ resumo: { aplicadoTotal: 999 } })));
        await act(async () => refreshAtual());
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('hooks de CDB e Tesouro propagam o erro pelo mesmo contrato', async () => {
        const fetchMock = vi.fn().mockResolvedValue(indisponivel);
        vi.stubGlobal('fetch', fetchMock);
        const props = { API: '/api', getHeaders, modal: {}, showToast: vi.fn() };
        const cdb = renderHook(() => useInvestimentos(props));
        const tesouro = renderHook(() => useTesouro(props));
        await waitFor(() => expect(cdb.result.current.error).toMatch(/Banco Central/));
        await waitFor(() => expect(tesouro.result.current.error).toMatch(/Banco Central/));
        expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/investimentos', '/api/investimentos/tesouro']);
    });

    it('503 genérico do proxy não é atribuído indevidamente ao BCB', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => { throw new SyntaxError('HTML'); } }));
        const { result } = renderHook(() => useInvestmentDashboard({ endpoint: '/investimentos', getHeaders }));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toMatch(/Não foi possível carregar/);
        expect(result.current.error).not.toMatch(/Banco Central/);
    });
});
