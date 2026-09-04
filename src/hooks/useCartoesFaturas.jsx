import { useCallback } from 'react';
import { ehPagamentoCredito, extrairCartaoId, resolverCartao } from '../utils/cartaoUtils';

const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/**
 * Função Auxiliar para extrair a fração exata que pertence ao terceiro na parcela.
 * Garante retrocompatibilidade: se não houver thirdPartyValue definido, assume 100%.
 */
const getValorTerceiro = (t) => {
    const vp = Number(t.valorParcela) || 0;
    if (!t.isThirdParty) return 0;
    return t.thirdPartyValue !== null && t.thirdPartyValue !== undefined ? Number(t.thirdPartyValue) : vp;
};

/**
 * @file src/hooks/useCartoesFaturas.jsx
 * @description Hook Customizado para Gestão de Faturas de Cartão de Crédito.
 * Suporta abates de estornos (reembolsos) e o novo modelo de Split (divisão fracionada com terceiros).
 */
export function useCartoesFaturas({ transacoes, setTransacoes, transacoesMes, cartoes, dataVis, API, getHeaders, modal, showToast }) {

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
    }, [cartoes, transacoes, dataVis, API, getHeaders, modal, setTransacoes, showToast]);

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
    }, [cartoes, transacoes, dataVis, API, getHeaders, modal, setTransacoes, showToast]);

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

                const valorTotalParcela = Number(t.valorParcela) || 0;
                // 🔥 NOVA LÓGICA: Calcula a fração exata do terceiro
                const valorDoTerceiro = getValorTerceiro(t);

                if (t.tipo === 'reembolso') {
                    porCartao[nomeCartao].total -= valorTotalParcela;

                    if (t.status === 'pago') {
                        porCartao[nomeCartao].pago -= valorTotalParcela;
                    } else {
                        porCartao[nomeCartao].pendente -= valorTotalParcela;
                    }

                    if (t.isThirdParty && t.thirdPartyName) {
                        const nomeT = String(t.thirdPartyName).trim();
                        // Subtrai a fração do terceiro em caso de reembolso
                        gastosTerceiros[nomeCartao][nomeT] = (gastosTerceiros[nomeCartao][nomeT] || 0) - valorDoTerceiro;
                    }
                }
                else {
                    porCartao[nomeCartao].total += valorTotalParcela;

                    if (t.status === 'pago') {
                        porCartao[nomeCartao].pago += valorTotalParcela;
                    } else {
                        porCartao[nomeCartao].pendente += valorTotalParcela;
                    }

                    if (t.isThirdParty && t.thirdPartyName) {
                        const nomeT = String(t.thirdPartyName).trim();
                        // Soma a fração do terceiro na fatura
                        gastosTerceiros[nomeCartao][nomeT] = (gastosTerceiros[nomeCartao][nomeT] || 0) + valorDoTerceiro;
                    }
                }
            }
        });

        const itens = Object.entries(porCartao).map(([nome, v]) => {
            const arrTerceiros = Object.entries(gastosTerceiros[nome]).map(([nomeT, valorT]) => ({ nome: nomeT, valor: valorT }));
            const totalTerceiros = arrTerceiros.reduce((acc, curr) => acc + curr.valor, 0);

            return {
                nome,
                ...v,
                // 🔥 SEU GASTO PESSOAL: É a fatura total gerada pelo banco menos a soma das frações de dívida dos terceiros
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
