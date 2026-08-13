import { useState, useCallback, useEffect } from 'react';

/**
 * @file src/hooks/useTesouro.jsx
 * @description Hook customizado para o módulo de Tesouro Direto. Mesmo esqueleto de
 * useBolsa.jsx/useInvestimentos.jsx: busca o dashboard (títulos + rentabilidade calculada), e
 * permite registrar/excluir títulos.
 */
export function useTesouro({ API, getHeaders, modal }) {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/investimentos/tesouro`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
            } else {
                console.error('Erro ao buscar dashboard de Tesouro Direto. Status:', res.status);
            }
        } catch (error) {
            console.error('Falha de conexão ao buscar Tesouro Direto:', error);
        } finally {
            setLoading(false);
        }
    }, [API, getHeaders]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    /**
     * @function criarTitulo
     * @description Registra a compra de um novo título do Tesouro Direto.
     */
    const criarTitulo = async (nome, tipo, taxa_contratada, valor_investido, data_compra, data_vencimento) => {
        try {
            const res = await fetch(`${API}/investimentos/tesouro`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ nome, tipo, taxa_contratada, valor_investido, data_compra, data_vencimento })
            });
            if (res.ok) {
                fetchDashboard();
                return true;
            }
            throw new Error('Falha ao registrar o título');
        } catch (err) {
            modal.alert('Erro ao registrar o título. Tente novamente.', '❌ Erro');
            return false;
        }
    };

    /**
     * @function excluirTitulo
     * @description Remove um título (representa o resgate total dele).
     */
    const excluirTitulo = async (id) => {
        const ok = await modal.confirm('Deseja resgatar/excluir este título? Essa ação não pode ser desfeita.', '🗑️ Resgatar Título', { confirmColor: 'bg-rose-600 hover:bg-rose-700' });
        if (!ok) return false;

        try {
            const res = await fetch(`${API}/investimentos/tesouro/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchDashboard();
                return true;
            }
        } catch (err) {
            modal.alert('Erro de conexão ao excluir o título.', '❌ Erro');
        }
        return false;
    };

    return { dashboardData, loading, fetchDashboard, criarTitulo, excluirTitulo };
}
