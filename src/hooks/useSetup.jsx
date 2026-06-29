import { useState, useCallback } from 'react';

const loadingIcon = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

/**
 * Hook Customizado: useSetup
 * Abstrai o CRUD das configurações com bloqueio de duplo clique via Loader Visual.
 * Atualizado na Fase 4 com o motor de Edição (editarSetup) otimista.
 */
export function useSetup({ API, getHeaders, modal, setTransacoes }) {
    const [cartoes, setCartoes] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [metasRenda, setMetasRenda] = useState([]);
    const [contasFixas, setContasFixas] = useState([]);
    const [rendasFixas, setRendasFixas] = useState([]);
    const [gerandoMes, setGerandoMes] = useState(false);

    /** Motor central que recebe a submissão, liga o Spinner, salva e desliga o Spinner. */
    const processarSubmitComLoading = useCallback(async (e, acaoData) => {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
        const originalText = btn ? btn.innerHTML : '';

        if (btn) {
            btn.disabled = true;
            btn.classList.add('opacity-70', 'cursor-wait');
            btn.innerHTML = `${loadingIcon} Salvando...`;
        }

        try {
            await acaoData(new FormData(form));
            // form.reset() removido daqui para evitar conflito com inputs controlados pelo React nas Views.
        } catch (err) {
            console.error("Erro no processamento:", err);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('opacity-70', 'cursor-wait');
                btn.innerHTML = originalText;
            }
        }
    }, []);

    const salvarConfig = useCallback(async (rota, dados, setState, stateAtual) => {
        const res = await fetch(`${API}/${rota}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dados) });
        if (res.ok) setState([...stateAtual, dados]);
    }, [API, getHeaders]);

    const addCartao = useCallback((e) => processarSubmitComLoading(e, async (fd) => { await salvarConfig('cartoes', { id: Date.now().toString(), nome: fd.get('nome'), melhorDia: Number(fd.get('melhorDia')), vencimento: Number(fd.get('vencimento')) }, setCartoes, cartoes); }), [processarSubmitComLoading, salvarConfig, cartoes]);
    const addCategoria = useCallback((e) => processarSubmitComLoading(e, async (fd) => { await salvarConfig('categorias', { id: Date.now().toString(), nome: fd.get('nome'), meta: Number(fd.get('meta')), tipo: fd.get('tipo') }, setCategorias, categorias); }), [processarSubmitComLoading, salvarConfig, categorias]);
    const addContaFixa = useCallback((e) => processarSubmitComLoading(e, async (fd) => { await salvarConfig('contas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valorPadrao')), vencimento: Number(fd.get('vencimento')) }, setContasFixas, contasFixas); }), [processarSubmitComLoading, salvarConfig, contasFixas]);
    const addRendaFixa = useCallback((e) => processarSubmitComLoading(e, async (fd) => { await salvarConfig('rendas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valorPadrao')), diaRecebimento: Number(fd.get('diaRecebimento')) }, setRendasFixas, rendasFixas); }), [processarSubmitComLoading, salvarConfig, rendasFixas]);

    // Novo motor de edição (Fase 4)
    const editarSetup = useCallback(async (banco, id, dadosAtualizados) => {
        const rotas = { cartoes: 'cartoes', categorias: 'categorias', metasRenda: 'metas-renda', contasFixas: 'contas-fixas', rendasFixas: 'rendas-fixas' };
        try {
            const res = await fetch(`${API}/${rotas[banco]}/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(dadosAtualizados)
            });
            if (res.ok) {
                const setters = { cartoes: [setCartoes, cartoes], categorias: [setCategorias, categorias], metasRenda: [setMetasRenda, metasRenda], contasFixas: [setContasFixas, contasFixas], rendasFixas: [setRendasFixas, rendasFixas] };
                const [setter, state] = setters[banco];
                setter(state.map(i => i.id === id ? { ...i, ...dadosAtualizados } : i));
                return true;
            }
            return false;
        } catch (err) {
            console.error("Erro ao editar setup:", err);
            return false;
        }
    }, [API, getHeaders, cartoes, categorias, metasRenda, contasFixas, rendasFixas]);

    const removerSetup = useCallback(async (banco, id) => {
        const rotas = { cartoes: 'cartoes', categorias: 'categorias', metasRenda: 'metas-renda', contasFixas: 'contas-fixas', rendasFixas: 'rendas-fixas' };
        await fetch(`${API}/${rotas[banco]}/${id}`, { method: 'DELETE', headers: getHeaders() });
        const setters = { cartoes: [setCartoes, cartoes], categorias: [setCategorias, categorias], metasRenda: [setMetasRenda, metasRenda], contasFixas: [setContasFixas, contasFixas], rendasFixas: [setRendasFixas, rendasFixas] };
        const [setter, state] = setters[banco];
        setter(state.filter(i => i.id !== id));
    }, [API, getHeaders, cartoes, categorias, metasRenda, contasFixas, rendasFixas]);

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
        addCartao, addCategoria, addContaFixa, addRendaFixa, editarSetup, removerSetup, gerarMesManual
    };
}