const dia = v => String(v || '').slice(0, 10);
const terceiros = t => (t.isThirdParty && t.thirdPartyName && t.categoria === 'Dívidas e Empréstimos')
    || String(t.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === 'divida de terceiros';

// Recebimento é entrada própria, não redução retroativa da despesa nem renda no Extrato.
export function movimentosCaixa(transacoes, inicio = '', fim = '9999-12-31') {
    const movimentos = [];
    for (const t of transacoes) {
        if (terceiros(t)) continue;
        const pagamento = dia(t.data_pagamento || t.dataCompra);
        if (t.status === 'pago' && pagamento > inicio && pagamento <= fim) movimentos.push({ ...t, data_pagamento: pagamento });
        for (const r of t.recebimentos || []) {
            const data = dia(r.data_recebimento);
            if (!data || data <= inicio || data > fim) continue;
            movimentos.push({ id: `recebimento_${r.id}`, descricao: `Recebimento de terceiro — ${t.descricao}`,
                tipo: 'renda', categoria: 'Renda', status: 'pago', valorParcela: Number(r.valor),
                data_pagamento: data, dataCompra: data });
        }
    }
    return movimentos;
}

export function temRecebimentosSemData(transacoes, marco = null) {
    return transacoes.some(t => {
        if (terceiros(t)) return false;
        const recebimentos = t.recebimentos || [];
        const participantes = (t.participantes || []).filter(p => !p.legado);
        const chaves = participantes.filter(p => p.recebido).map(p => `participante:${p.id}`);
        if (!participantes.length && t.isThirdParty && t.terceiro_recebido) chaves.push('legado');
        if (chaves.some(c => !recebimentos.some(r => r.participante_chave === c))) return true;
        return recebimentos.some(r => {
            if (r.data_recebimento) return false;
            const observado = new Date(r.registrado_em);
            const diaObservado = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(observado);
            return !(marco?.confirmadoEm && new Date(marco.confirmadoEm) >= observado && marco.data >= diaObservado);
        });
    });
}
