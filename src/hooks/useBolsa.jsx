import { useState, useCallback, useEffect } from 'react';

/**
 * @file src/hooks/useBolsa.jsx
 * @description Hook customizado para o módulo de Ações e FIIs. Segue o mesmo esqueleto de
 * useInvestimentos.jsx: busca o dashboard (posições + cotações), e permite registrar/excluir
 * operações de compra/venda.
 */
export function useBolsa({ API, getHeaders, modal, showToast }) {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/investimentos/bolsa`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
            } else {
                console.error('Erro ao buscar dashboard de Ações/FIIs. Status:', res.status);
            }
        } catch (error) {
            console.error('Falha de conexão ao buscar Ações/FIIs:', error);
        } finally {
            setLoading(false);
        }
    }, [API, getHeaders]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    /**
     * @function criarCompra
     * @description Registra uma operação de compra (quantidade positiva) ou venda (negativa).
     */
    const criarCompra = async (ticker, quantidade, preco_unitario, data_compra) => {
        try {
            const res = await fetch(`${API}/investimentos/bolsa/compra`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ ticker, quantidade, preco_unitario, data_compra })
            });
            if (res.ok) {
                fetchDashboard();
                return true;
            }
            throw new Error('Falha ao registrar a operação');
        } catch (err) {
            showToast('Erro ao registrar a operação. Verifique o ticker e tente novamente.', 'error');
            return false;
        }
    };

    /**
     * @function excluirCompra
     * @description Remove uma operação de compra/venda específica.
     */
    const excluirCompra = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta operação? Isso vai alterar a quantidade e o preço médio do ativo.', '🗑️ Excluir Operação', { confirmColor: 'bg-rose-600 hover:bg-rose-700' });
        if (!ok) return false;

        try {
            const res = await fetch(`${API}/investimentos/bolsa/compra/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchDashboard();
                return true;
            }
        } catch (err) {
            showToast('Erro de conexão ao excluir a operação.', 'error');
        }
        return false;
    };

    /**
     * @function criarProvento
     * @description Registra um provento (dividendo, JCP ou rendimento de FII) recebido de um ativo.
     */
    const criarProvento = async (ticker, valor, tipo, data_pagamento) => {
        try {
            const res = await fetch(`${API}/investimentos/bolsa/provento`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ ticker, valor, tipo, data_pagamento })
            });
            if (res.ok) {
                fetchDashboard();
                return true;
            }
            throw new Error('Falha ao registrar o provento');
        } catch (err) {
            showToast('Erro ao registrar o provento. Tente novamente.', 'error');
            return false;
        }
    };

    /**
     * @function excluirProvento
     * @description Remove um provento específico.
     */
    const excluirProvento = async (id) => {
        const ok = await modal.confirm('Deseja excluir este provento? Isso vai reduzir a rentabilidade total do ativo.', '🗑️ Excluir Provento', { confirmColor: 'bg-rose-600 hover:bg-rose-700' });
        if (!ok) return false;

        try {
            const res = await fetch(`${API}/investimentos/bolsa/provento/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchDashboard();
                return true;
            }
        } catch (err) {
            showToast('Erro de conexão ao excluir o provento.', 'error');
        }
        return false;
    };

    return { dashboardData, loading, fetchDashboard, criarCompra, excluirCompra, criarProvento, excluirProvento };
}
