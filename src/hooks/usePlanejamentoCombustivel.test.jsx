import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { usePlanejamentoCombustivel } from './usePlanejamentoCombustivel';
import { criarPlano } from '../testUtils/planoCombustivel';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const headers = () => ({ Authorization: 'Bearer teste', 'Content-Type': 'application/json' });
const props = { API: '/api', getHeaders: headers, modal: {}, temGaragem: true, token: 'teste',
    dataVis: { mes: 9, ano: 2026 }, transacoes: [] };

test('resposta antiga não substitui mês novo e trocar usuário não reaproveita dados', async () => {
    const resolvers = [];
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => resolvers.push(resolve))));
    const { result, rerender } = renderHook(p => usePlanejamentoCombustivel(p), { initialProps: props });
    rerender({ ...props, dataVis: { mes: 10, ano: 2026 } });
    await act(async () => resolvers[1]({ ok: true, json: async () => criarPlano('2026-10') }));
    expect(result.current.planoMes.competencia).toBe('2026-10');
    await act(async () => resolvers[0]({ ok: true, json: async () => criarPlano('2026-09') }));
    expect(result.current.planoMes.competencia).toBe('2026-10');
    rerender({ ...props, token: 'outro' });
    expect(result.current.planoMes).toBeNull();
});

test('mudança do Extrato invalida resumo anterior e força nova leitura', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => criarPlano() })));
    const { result, rerender } = renderHook(p => usePlanejamentoCombustivel(p), { initialProps: props });
    await waitFor(() => expect(result.current.planoMes).not.toBeNull());
    const transacoes = [{ id: 'novo' }];
    rerender({ ...props, transacoes });
    expect(result.current.planoMes).toBeNull();
    await waitFor(() => expect(result.current.planoMes).not.toBeNull());
    expect(fetch).toHaveBeenCalledTimes(2);
});
