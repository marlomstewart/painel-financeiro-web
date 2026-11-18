import { test, expect } from 'vitest';
import { movimentosCaixa, temRecebimentosSemData } from './movimentosCaixa';

const t = { id: 't', descricao: 'Compra', tipo: 'despesa', categoria: 'Teste', status: 'pago',
    data_pagamento: '2026-09-10', valorParcela: 100, isThirdParty: true, terceiro_recebido: true,
    recebimentos: [{ id: 'r', participante_chave: 'legado', valor: 70, data_recebimento: '2026-10-01' }] };
test('corta pagamentos e recebimentos independentemente, inclusive após marco', () => {
    expect(movimentosCaixa([t], '', '2026-09-30').map(m => m.valorParcela)).toEqual([100]);
    expect(movimentosCaixa([t], '2026-09-30', '2026-10-31').map(m => [m.tipo, m.valorParcela, m.data_pagamento])).toEqual([['renda', 70, '2026-10-01']]);
    expect(movimentosCaixa([{ ...t, status: 'pendente' }], '', '2026-10-31')).toHaveLength(1);
    expect(temRecebimentosSemData([t])).toBe(false);
});
test('legado sem data ou sem ledger exige reconciliação, sem presumir saldo zero', () => {
    expect(temRecebimentosSemData([{ ...t, recebimentos: [] }])).toBe(true);
    const legado = { ...t, recebimentos: [{ ...t.recebimentos[0], data_recebimento: null, registrado_em: '2026-10-02T12:00:00Z' }] };
    expect(temRecebimentosSemData([legado], { valor: 100, data: '2026-10-02' })).toBe(true);
    expect(temRecebimentosSemData([legado], { valor: 100, data: '2026-10-02', confirmadoEm: '2026-10-02T13:00:00Z' })).toBe(false);
    expect(temRecebimentosSemData([legado], { valor: 100, data: '2026-09-30', confirmadoEm: '2026-10-02T13:00:00Z' })).toBe(true);
});
