import { useState, useCallback, useEffect } from 'react';

/**
 * @file src/hooks/useInvestimentos.jsx
 * @description Hook Customizado para Gestão do Módulo de Investimentos (Renda Fixa / CDB).
 * Gerencia o estado global do dashboard, realiza as requisições para a API e controla as interações do usuário.
 */
export function useInvestimentos({ API, getHeaders, modal, showToast }) {
    // Estado principal que guarda o resumo financeiro calculado pelo back-end
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * @function fetchDashboard
     * @description Busca as taxas atualizadas do BCB, as caixinhas e o resumo financeiro do patrimônio.
     */
    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/investimentos`, {
                headers: getHeaders()
            });

            if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
            } else {
                console.error('Erro ao buscar dashboard de investimentos. Status:', res.status);
            }
        } catch (error) {
            console.error('Falha de conexão ao buscar investimentos:', error);
        } finally {
            setLoading(false);
        }
    }, [API, getHeaders]);

    // Carrega os dados automaticamente ao montar o módulo
    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    /**
     * @function criarCaixinha
     * @description Envia uma requisição POST para registrar uma nova instituição/caixinha.
     * @param {string} instituicao - Nome do Banco/Corretora (Ex: Nubank, Inter)
     * @param {string} nome_caixinha - Apelido do fundo (Ex: Reserva de Emergência)
     * @param {number} percentual_cdi - Taxa de rendimento (Ex: 100, 110)
     */
    const criarCaixinha = async (instituicao, nome_caixinha, percentual_cdi) => {
        try {
            const res = await fetch(`${API}/investimentos/caixinha`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ instituicao, nome_caixinha, percentual_cdi })
            });
            if (res.ok) {
                showToast(`Caixinha "${nome_caixinha}" criada!`, 'success');
                fetchDashboard(); // Atualiza a tela com a nova caixinha
                return true;
            }
            throw new Error('Falha na criação da caixinha');
        } catch (err) {
            showToast('Erro ao tentar criar a caixinha de investimentos. Tente novamente.', 'error');
            return false;
        }
    };

    /**
     * @function criarAporte
     * @description Registra um novo depósito em uma caixinha específica para controle de IR regressivo e IOF.
     * @param {string} caixinha_id - ID da caixinha de destino
     * @param {number} valor - Valor nominal depositado
     * @param {string} data_aporte - Data no formato YYYY-MM-DD
     */
    const criarAporte = async (caixinha_id, valor, data_aporte) => {
        try {
            const res = await fetch(`${API}/investimentos/aporte`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ caixinha_id, valor, data_aporte })
            });
            if (res.ok) {
                showToast('Aporte registrado! O cálculo de IOF/IR já iniciou.', 'success');
                fetchDashboard(); // Atualiza os cálculos de juros
                return true;
            }
            throw new Error('Falha ao registrar o aporte');
        } catch (err) {
            showToast('Erro de conexão ao registrar o aporte.', 'error');
            return false;
        }
    };

    /**
     * @function excluirCaixinha
     * @description Deleta uma instituição inteira (ATENÇÃO: apaga os aportes vinculados a ela em cascata).
     * @param {string} id - ID da caixinha
     */
    const excluirCaixinha = async (id) => {
        const ok = await modal.confirm('Você está prestes a excluir esta Caixinha. ATENÇÃO: Todos os aportes vinculados a ela serão apagados e não poderão ser recuperados. Tem certeza?', '🗑️ Excluir Caixinha', { confirmColor: 'bg-rose-600 hover:bg-rose-700' });
        if (!ok) return false;

        try {
            const res = await fetch(`${API}/investimentos/caixinha/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchDashboard();
                return true;
            }
        } catch (err) {
            showToast('Erro de conexão ao excluir caixinha.', 'error');
        }
        return false;
    };

    /**
     * @function excluirAporte
     * @description Remove um aporte específico, recalculando o rendimento total da caixinha.
     * @param {string} id - ID do aporte
     */
    const excluirAporte = async (id) => {
        const ok = await modal.confirm('Deseja excluir este aporte? Isso removerá o valor do seu patrimônio e alterará a sua rentabilidade total acumulada.', '🗑️ Excluir Aporte', { confirmColor: 'bg-rose-600 hover:bg-rose-700' });
        if (!ok) return false;

        try {
            const res = await fetch(`${API}/investimentos/aporte/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchDashboard();
                return true;
            }
        } catch (err) {
            showToast('Erro de conexão ao excluir o aporte.', 'error');
        }
        return false;
    };

    return {
        dashboardData,
        loading,
        fetchDashboard,
        criarCaixinha,
        criarAporte,
        excluirCaixinha,
        excluirAporte
    };
}