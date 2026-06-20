import { useState, useCallback } from 'react';

/**
 * Hook Customizado: useSetup
 * Abstrai o CRUD completo das configurações periféricas do usuário
 * (Cartões, Categorias, Contas Fixas e Metas) e a rotina de Geração Mensal (CRON Manual).
 */
export function useSetup({ API, getHeaders, modal, setTransacoes }) {
    // Estados do Setup
    const [cartoes, setCartoes] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [metasRenda, setMetasRenda] = useState([]);
    const [contasFixas, setContasFixas] = useState([]);
    const [rendasFixas, setRendasFixas] = useState([]);
    const [gerandoMes, setGerandoMes] = useState(false);

    /** Motor interno de injeção no DB */
    const salvarConfig = useCallback(async (rota, dados, setState, stateAtual) => {
        try {
            const res = await fetch(`${API}/${rota}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dados) });
            if (res.ok) setState([...stateAtual, dados]);
        } catch (err) { console.error("Erro ao salvar:", err); }
    }, [API, getHeaders]);

    const addCartao = useCallback((e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('cartoes', { id: Date.now().toString(), nome: fd.get('nome'), melhorDia: Number(fd.get('melhorDia')), vencimento: Number(fd.get('vencimento')) }, setCartoes, cartoes); e.target.reset(); }, [salvarConfig, cartoes]);
    const addCategoria = useCallback((e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('categorias', { id: Date.now().toString(), nome: fd.get('nome'), meta: Number(fd.get('meta')), tipo: fd.get('tipo') }, setCategorias, categorias); e.target.reset(); }, [salvarConfig, categorias]);
    const addContaFixa = useCallback((e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('contas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valor')), vencimento: Number(fd.get('vencimento')) }, setContasFixas, contasFixas); e.target.reset(); }, [salvarConfig, contasFixas]);
    const addRendaFixa = useCallback((e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('rendas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valor')), diaRecebimento: Number(fd.get('diaRecebimento')) }, setRendasFixas, rendasFixas); e.target.reset(); }, [salvarConfig, rendasFixas]);

    /** Destrói configurações locais e atualiza o estado */
    const removerSetup = useCallback(async (banco, id) => {
        const rotas = { cartoes: 'cartoes', categorias: 'categorias', metasRenda: 'metas-renda', contasFixas: 'contas-fixas', rendasFixas: 'rendas-fixas' };
        await fetch(`${API}/${rotas[banco]}/${id}`, { method: 'DELETE', headers: getHeaders() });
        const setters = { cartoes: [setCartoes, cartoes], categorias: [setCategorias, categorias], metasRenda: [setMetasRenda, metasRenda], contasFixas: [setContasFixas, contasFixas], rendasFixas: [setRendasFixas, rendasFixas] };
        const [setter, state] = setters[banco];
        setter(state.filter(i => i.id !== id));
    }, [API, getHeaders, cartoes, categorias, metasRenda, contasFixas, rendasFixas]);

    /** Dispara a automação de geração de contas fixas e atualiza o ledger principal */
    const gerarMesManual = useCallback(async () => {
        setGerandoMes(true);
        try {
            const res = await fetch(`${API}/gerar-mes`, { method: 'POST', headers: getHeaders() }); const data = await res.json();
            if (data.gerados.length === 0) { await modal.alert(`Tudo já estava gerado para ${data.mes}/${data.ano}.\nNenhum lançamento novo.`, '✅ Nenhum novo'); }
            else {
                const lista = data.gerados.map(g => `• ${g.nome} (${g.tipo})`).join('\n');
                await modal.alert(`${data.gerados.length} lançamento(s):\n\n${lista}`, '✅ Gerados');
                const resT = await fetch(`${API}/transacoes`, { headers: getHeaders() }); if (resT.ok) setTransacoes(await resT.json());
            }
        } catch (err) { await modal.alert('Erro ao gerar lançamentos.', '❌ Erro'); } finally { setGerandoMes(false); }
    }, [API, getHeaders, modal, setTransacoes]);

    return {
        cartoes, setCartoes, categorias, setCategorias, metasRenda, setMetasRenda,
        contasFixas, setContasFixas, rendasFixas, setRendasFixas, gerandoMes,
        addCartao, addCategoria, addContaFixa, addRendaFixa, removerSetup, gerarMesManual
    };
}