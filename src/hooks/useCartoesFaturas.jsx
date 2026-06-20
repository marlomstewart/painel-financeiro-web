import { useCallback } from 'react';

const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/**
 * Hook Customizado para Gestão de Faturas de Cartão de Crédito.
 * * Desacopla do componente principal a lógica de agrupamento financeiro,
 * pagamento em lote (Bulk Update) e reversão de status das compras feitas no crédito.
 * * @param {Object} params - Dependências e estados injetados a partir do App.jsx.
 * @returns {Object} Funções de manipulação das faturas a serem passadas para a UI.
 */
export function useCartoesFaturas({
    transacoes,
    setTransacoes,
    transacoesMes,
    cartoes,
    dataVis,
    API,
    getHeaders,
    modal
}) {

    /**
     * Marca todas as transações pendentes de um cartão específico no mês atual como "pago".
     * Funciona através de Promise.all para requisições assíncronas paralelas.
     */
    const pagarFaturaCartao = useCallback(async (cartaoId) => {
        const cartao = cartoes.find(c => c.id === cartaoId);
        if (!cartao) return;

        const confirmacao = await modal.confirm(`Deseja marcar TODOS os lançamentos pendentes no cartão "${cartao.nome}" como PAGO?`, '💳 Pagar Fatura');
        if (!confirmacao) return;

        const pendentes = transacoes.filter(t => t.status === 'pendente' && t.formaPagamento === `credito_${cartaoId}` && t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano);

        try {
            const promessas = pendentes.map(t => fetch(`${API}/transacoes/${t.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: 'pago', valorParcela: t.valorParcela, dataCompra: t.dataCompra }) }));
            await Promise.all(promessas);
            setTransacoes(prev => prev.map(t => pendentes.find(p => p.id === t.id) ? { ...t, status: 'pago' } : t));
            modal.alert('Fatura marcada como paga com sucesso!', '✅ Concluído');
        } catch (err) { modal.alert('Erro ao processar pagamento da fatura.', '❌ Erro'); }
    }, [cartoes, transacoes, dataVis, API, getHeaders, modal, setTransacoes]);

    /**
     * Reverte todas as transações pagas de um cartão específico no mês atual de volta para "pendente".
     */
    const reverterFaturaCartao = useCallback(async (cartaoId) => {
        const cartao = cartoes.find(c => c.id === cartaoId);
        if (!cartao) return;

        const confirmacao = await modal.confirm(`Deseja REVERTER os pagamentos do cartão "${cartao.nome}" para PENDENTE?`, '↩️ Reverter Fatura');
        if (!confirmacao) return;

        const pagos = transacoes.filter(t => t.status === 'pago' && t.formaPagamento === `credito_${cartaoId}` && t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano);

        try {
            const promessas = pagos.map(t => fetch(`${API}/transacoes/${t.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: 'pendente', valorParcela: t.valorParcela, dataCompra: t.dataCompra }) }));
            await Promise.all(promessas);
            setTransacoes(prev => prev.map(t => pagos.find(p => p.id === t.id) ? { ...t, status: 'pendente' } : t));
            modal.alert('Fatura revertida com sucesso!', '✅ Concluído');
        } catch (err) { modal.alert('Erro na reversão.', '❌ Erro'); }
    }, [cartoes, transacoes, dataVis, API, getHeaders, modal, setTransacoes]);

    /**
     * Agrupa e soma os lançamentos do mês dividindo-os por cartão de crédito e por status (pago vs pendente).
     * Configura e dispara o modal UI com as opções de pagamento.
     */
    const verFaturasPorCartao = useCallback(() => {
        const porCartao = {};
        const cartaoIds = {};

        transacoesMes.forEach(t => {
            if (t.formaPagamento && t.formaPagamento.startsWith('credito_')) {
                const cartaoId = t.formaPagamento.split('_')[1];
                const cartao = cartoes.find(c => c.id === cartaoId);
                const nome = cartao ? cartao.nome : 'Cartão Desconhecido';
                if (cartao) cartaoIds[nome] = cartao.id;

                if (!porCartao[nome]) porCartao[nome] = { total: 0, pago: 0, pendente: 0 };
                porCartao[nome].total += Number(t.valorParcela);
                if (t.status === 'pago') porCartao[nome].pago += Number(t.valorParcela);
                else porCartao[nome].pendente += Number(t.valorParcela);
            }
        });

        const itens = Object.entries(porCartao).map(([nome, v]) => ({ nome, ...v }));
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