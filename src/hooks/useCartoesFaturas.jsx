import { useCallback } from 'react';

const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/**
 * @file src/hooks/useCartoesFaturas.jsx
 * @description Hook Customizado para Gestão de Faturas de Cartão de Crédito.
 * Desacopla do componente principal a lógica de agrupamento financeiro,
 * pagamento em lote (Bulk Update) e reversão de status das compras feitas no crédito.
 */
export function useCartoesFaturas({ transacoes, setTransacoes, transacoesMes, cartoes, dataVis, API, getHeaders, modal }) {

    const pagarFaturaCartao = useCallback(async (cartaoId) => {
        const cartao = cartoes.find(c => String(c.id) === String(cartaoId));
        if (!cartao) return;

        const confirmacao = await modal.confirm(`Deseja marcar TODOS os lançamentos pendentes na fatura do "${cartao.nome}" como PAGO?`, '💳 Pagar Fatura');
        if (!confirmacao) return;

        const pendentes = transacoes.filter(t => t.status === 'pendente' && String(t.formaPagamento) === `credito_${cartaoId}` && Number(t.mesReferencia) === Number(dataVis.mes) && Number(t.anoReferencia) === Number(dataVis.ano));

        try {
            const promessas = pendentes.map(t => fetch(`${API}/transacoes/${t.id}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: 'pago' }) }));
            await Promise.all(promessas);

            const hojeISO = new Date().toISOString();
            setTransacoes(prev => prev.map(t => pendentes.find(p => p.id === t.id) ? { ...t, status: 'pago', data_pagamento: hojeISO } : t));

            modal.close();
            modal.alert('Fatura marcada como paga com sucesso!', '✅ Concluído');
        } catch (err) { modal.alert('Erro ao processar pagamento da fatura.', '❌ Erro'); }
    }, [cartoes, transacoes, dataVis, API, getHeaders, modal, setTransacoes]);

    const reverterFaturaCartao = useCallback(async (cartaoId) => {
        const cartao = cartoes.find(c => String(c.id) === String(cartaoId));
        if (!cartao) return;

        const confirmacao = await modal.confirm(`Deseja REVERTER os pagamentos da fatura do "${cartao.nome}" para PENDENTE?`, '↩️ Reverter Fatura');
        if (!confirmacao) return;

        const pagos = transacoes.filter(t => t.status === 'pago' && String(t.formaPagamento) === `credito_${cartaoId}` && Number(t.mesReferencia) === Number(dataVis.mes) && Number(t.anoReferencia) === Number(dataVis.ano));

        try {
            const promessas = pagos.map(t => fetch(`${API}/transacoes/${t.id}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: 'pendente' }) }));
            await Promise.all(promessas);

            setTransacoes(prev => prev.map(t => pagos.find(p => p.id === t.id) ? { ...t, status: 'pendente', data_pagamento: null } : t));

            modal.close();
            modal.alert('Fatura revertida com sucesso!', '✅ Concluído');
        } catch (err) { modal.alert('Erro na reversão.', '❌ Erro'); }
    }, [cartoes, transacoes, dataVis, API, getHeaders, modal, setTransacoes]);

    const verFaturasPorCartao = useCallback(() => {
        const porCartao = {};
        const cartaoIds = {};

        // 🔥 OBJETO PARA AGRUPAR GASTOS DE TERCEIROS DENTRO DE CADA CARTÃO
        const gastosTerceiros = {};

        transacoesMes.forEach(t => {
            if (t.formaPagamento && String(t.formaPagamento).startsWith('credito_')) {
                const cartaoId = String(t.formaPagamento).split('_')[1];
                const cartao = cartoes.find(c => String(c.id) === String(cartaoId));
                const nomeCartao = cartao ? cartao.nome : 'Cartão Excluído / Desconhecido';
                cartaoIds[nomeCartao] = cartao ? cartao.id : cartaoId;

                if (!porCartao[nomeCartao]) porCartao[nomeCartao] = { total: 0, pago: 0, pendente: 0 };
                if (!gastosTerceiros[nomeCartao]) gastosTerceiros[nomeCartao] = {};

                const valorAtual = Number(t.valorParcela) || 0;
                porCartao[nomeCartao].total += valorAtual;

                if (t.status === 'pago') {
                    porCartao[nomeCartao].pago += valorAtual;
                } else {
                    porCartao[nomeCartao].pendente += valorAtual;
                }

                // 🔥 REGISTRA O GASTO SE FOR DE TERCEIRO
                if (t.isThirdParty && t.thirdPartyName) {
                    const nomeT = String(t.thirdPartyName).trim();
                    gastosTerceiros[nomeCartao][nomeT] = (gastosTerceiros[nomeCartao][nomeT] || 0) + valorAtual;
                }
            }
        });

        const itens = Object.entries(porCartao).map(([nome, v]) => {
            // Converte o objeto de terceiros do cartão numa array
            const arrTerceiros = Object.entries(gastosTerceiros[nome]).map(([nomeT, valorT]) => ({ nome: nomeT, valor: valorT }));
            const totalTerceiros = arrTerceiros.reduce((acc, curr) => acc + curr.valor, 0);

            return {
                nome,
                ...v,
                gastoPessoal: v.total - totalTerceiros,
                listaTerceiros: arrTerceiros
            };
        });

        modal.setConfig({
            type: 'faturas',
            title: `💳 Gastos no Crédito — ${nomesMeses[dataVis.mes - 1]} ${dataVis.ano}`,
            itens,
            cartaoIds,
            pagarFatura: pagarFaturaCartao,
            reverterFatura: reverterFaturaCartao,
            onCancel: modal.close,
            onClose: modal.close
        });
    }, [transacoesMes, cartoes, dataVis, modal, pagarFaturaCartao, reverterFaturaCartao]);

    return { verFaturasPorCartao, pagarFaturaCartao, reverterFaturaCartao };
}