import { useCallback } from 'react';
import { ehPagamentoCredito, extrairCartaoId, resolverCartao } from '../utils/cartaoUtils';

const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// A API já entrega o rateio por parcela. Recebimento não altera a participação na fatura.
const obterParticipantes = (t) => Array.isArray(t.participantes) && t.participantes.length > 0
    ? t.participantes
    : (t.isThirdParty ? [{
        nome: t.thirdPartyName || 'Terceiro',
        valorParcela: t.thirdPartyValue !== null && t.thirdPartyValue !== undefined
            ? t.thirdPartyValue : t.valorParcela
    }] : []);
const emCentavos = (valor) => Math.round((Number(valor) || 0) * 100);

/**
 * @file src/hooks/useCartoesFaturas.jsx
 * @description Hook Customizado para Gestão de Faturas de Cartão de Crédito.
 * Suporta abates de estornos (reembolsos) e o novo modelo de Split (divisão fracionada com terceiros).
 */
export function useCartoesFaturas({ setTransacoes, transacoesMes, cartoes, dataVis, API, getHeaders, modal, showToast }) {

    const pagarFaturaCartao = useCallback(async (cartaoId) => {
        const cartao = cartoes.find(c => String(c.id) === String(cartaoId));
        if (!cartao) return;

        const confirmacao = await modal.confirm(`Deseja marcar TODOS os lançamentos pendentes na fatura do "${cartao.nome}" como PAGO?`, '💳 Pagar Fatura');
        if (!confirmacao) return;

        try {
            const resposta = await fetch(`${API}/transacoes/fatura/${cartaoId}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ mes: dataVis.mes, ano: dataVis.ano, status: 'pago' }) });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.message || 'Falha ao pagar fatura');
            const ids = new Set(dados.ids);
            setTransacoes(prev => prev.map(t => ids.has(t.id) ? { ...t, status: 'pago', data_pagamento: dados.data_pagamento } : t));
            modal.close();
            showToast('Fatura marcada como paga com sucesso!', 'success');
        } catch (err) {
            showToast(err.message || 'Erro ao processar pagamento da fatura.', 'error');
        }
    }, [cartoes, dataVis, API, getHeaders, modal, setTransacoes, showToast]);

    const reverterFaturaCartao = useCallback(async (cartaoId) => {
        const cartao = cartoes.find(c => String(c.id) === String(cartaoId));
        if (!cartao) return;

        const confirmacao = await modal.confirm(`Deseja REVERTER os pagamentos da fatura do "${cartao.nome}" para PENDENTE?`, '↩️ Reverter Fatura');
        if (!confirmacao) return;

        try {
            const resposta = await fetch(`${API}/transacoes/fatura/${cartaoId}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ mes: dataVis.mes, ano: dataVis.ano, status: 'pendente' }) });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.message || 'Falha ao reverter fatura');
            const ids = new Set(dados.ids);
            setTransacoes(prev => prev.map(t => ids.has(t.id) ? { ...t, status: 'pendente', data_pagamento: null } : t));
            modal.close();
            showToast('Fatura revertida com sucesso!', 'success');
        } catch (err) {
            showToast(err.message || 'Erro na reversão.', 'error');
        }
    }, [cartoes, dataVis, API, getHeaders, modal, setTransacoes, showToast]);

    const verFaturasPorCartao = useCallback(() => {
        const porCartao = {};
        const cartaoIds = {};

        const gastosTerceiros = {};

        transacoesMes.forEach(t => {
            if (ehPagamentoCredito(t.formaPagamento)) {
                const cartaoId = extrairCartaoId(t.formaPagamento);
                const cartao = resolverCartao(t.formaPagamento, cartoes);
                const nomeCartao = cartao ? cartao.nome : 'Cartão Excluído / Desconhecido';
                cartaoIds[nomeCartao] = cartao ? cartao.id : cartaoId;

                if (!porCartao[nomeCartao]) porCartao[nomeCartao] = { total: 0, pago: 0, pendente: 0 };
                if (!gastosTerceiros[nomeCartao]) gastosTerceiros[nomeCartao] = {};

                const sinal = t.tipo === 'reembolso' ? -1 : 1;
                const valorTotalParcela = sinal * emCentavos(t.valorParcela);
                porCartao[nomeCartao].total += valorTotalParcela;
                porCartao[nomeCartao][t.status === 'pago' ? 'pago' : 'pendente'] += valorTotalParcela;

                obterParticipantes(t).forEach(participante => {
                    const nomeT = String(participante.nome || 'Terceiro').trim() || 'Terceiro';
                    const valorDoTerceiro = sinal * emCentavos(participante.valorParcela);
                    gastosTerceiros[nomeCartao][nomeT] = (gastosTerceiros[nomeCartao][nomeT] || 0) + valorDoTerceiro;
                });
            }
        });

        const itens = Object.entries(porCartao).map(([nome, v]) => {
            const arrTerceiros = Object.entries(gastosTerceiros[nome]).map(([nomeT, valorT]) => ({ nome: nomeT, valor: valorT / 100 }));
            const totalTerceiros = Object.values(gastosTerceiros[nome]).reduce((acc, valor) => acc + valor, 0);

            return {
                nome,
                total: v.total / 100,
                pago: v.pago / 100,
                pendente: v.pendente / 100,
                gastoPessoal: (v.total - totalTerceiros) / 100,
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
