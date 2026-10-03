import { useState, useCallback, useEffect, useRef } from 'react';

// Requisições substituídas/desmontadas não podem reapresentar números antigos como atuais.
export function useInvestmentDashboard({ endpoint, getHeaders }) {
    const [estado, setEstado] = useState({ dashboardData: null, loading: true, error: null });
    const controle = useRef({ versao: 0, ativo: false, abort: null, endpoint: null, getHeaders: null });

    const fetchDashboard = useCallback(async () => {
        const contexto = controle.current;
        if (!contexto.ativo || contexto.endpoint !== endpoint || contexto.getHeaders !== getHeaders) return;
        contexto.abort?.abort();
        contexto.abort = new AbortController();
        const versao = ++contexto.versao;
        const atual = () => contexto.ativo && contexto.versao === versao;
        setEstado({ dashboardData: null, loading: true, error: null });
        try {
            const res = await fetch(endpoint, { headers: getHeaders(), signal: contexto.abort.signal });
            if (!res.ok) {
                let corpo = null;
                if (res.status === 503) {
                    try { corpo = await res.json(); } catch { /* Proxy pode responder sem JSON. */ }
                }
                const error = corpo?.code === 'TAXAS_BCB_INDISPONIVEIS'
                    ? 'Taxas do Banco Central indisponíveis. Seus investimentos foram preservados. Tente novamente em instantes.'
                    : 'Não foi possível carregar os investimentos. Tente novamente.';
                if (atual()) setEstado({ dashboardData: null, loading: false, error });
                return;
            }
            const dashboardData = await res.json();
            if (atual()) setEstado({ dashboardData, loading: false, error: null });
        } catch (error) {
            if (atual() && error.name !== 'AbortError') setEstado({ dashboardData: null, loading: false, error: 'Não foi possível carregar os investimentos. Verifique sua conexão e tente novamente.' });
        }
    }, [endpoint, getHeaders]);

    useEffect(() => {
        const contexto = controle.current;
        contexto.ativo = true;
        contexto.endpoint = endpoint;
        contexto.getHeaders = getHeaders;
        fetchDashboard();
        return () => { contexto.ativo = false; contexto.versao++; contexto.abort?.abort(); };
    }, [fetchDashboard, endpoint, getHeaders]);

    return { ...estado, fetchDashboard };
}
