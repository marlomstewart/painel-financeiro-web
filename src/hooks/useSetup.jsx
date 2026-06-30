import { useState, useCallback } from 'react';

const loadingIcon = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

/**
 * Hook Customizado: useSetup
 * Abstrai o CRUD das configurações com bloqueio de duplo clique via Loader Visual.
 * Gere a injeção e gravação de Metas de Renda, Exportação CSV e a
 * validação de segurança reforçada para a Zona de Perigo.
 */
export function useSetup({ API, getHeaders, modal, transacoes, setTransacoes }) {
    const [cartoes, setCartoes] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [metasRenda, setMetasRenda] = useState([]);
    const [contasFixas, setContasFixas] = useState([]);
    const [rendasFixas, setRendasFixas] = useState([]);
    const [gerandoMes, setGerandoMes] = useState(false);

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

    const addMetaRenda = useCallback((e) => processarSubmitComLoading(e, async (fd) => {
        await salvarConfig('metas-renda', {
            id: Date.now().toString(),
            nome: fd.get('nome'),
            valor: Number(fd.get('meta'))
        }, setMetasRenda, metasRenda);
    }), [processarSubmitComLoading, salvarConfig, metasRenda]);

    const addContaFixa = useCallback((e) => processarSubmitComLoading(e, async (fd) => { await salvarConfig('contas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valorPadrao')), vencimento: Number(fd.get('vencimento')) }, setContasFixas, contasFixas); }), [processarSubmitComLoading, salvarConfig, contasFixas]);
    const addRendaFixa = useCallback((e) => processarSubmitComLoading(e, async (fd) => { await salvarConfig('rendas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valorPadrao')), diaRecebimento: Number(fd.get('diaRecebimento')) }, setRendasFixas, rendasFixas); }), [processarSubmitComLoading, salvarConfig, rendasFixas]);

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

    /**
     * Remove um registro individual ou limpa conjuntos em massa.
     * ATUALIZAÇÃO: Exclusões em massa agora exigem confirmação rigorosa e validação de senha.
     */
    const removerSetup = useCallback(async (banco, id = null) => {
        if (!id) {
            // Bloco de Exclusão em Massa (Zona de Perigo)
            const mapNomes = {
                categoria: 'todas as Metas e Categorias',
                contaFixa: 'todas as Contas Fixas',
                cartao: 'todos os Cartões'
            };
            const nomeAmigavel = mapNomes[banco];

            // 1. Confirmação de intenção destrutiva
            const confirmacao = await modal.confirm(
                `Tem a certeza absoluta que deseja EXCLUIR ${nomeAmigavel}? Esta ação é destrutiva e não pode ser desfeita.`,
                '⚠️ Confirmação Destrutiva',
                { confirmColor: 'bg-red-600 hover:bg-red-700', confirmLabel: 'Sim, Excluir' }
            );
            if (!confirmacao) return;

            // 2. Validação da credencial
            const senha = await modal.prompt(
                'Por motivos de segurança, digite a sua senha de acesso para confirmar a exclusão:',
                '',
                '🔒 Validação de Segurança',
                { inputType: 'password', confirmLabel: 'Validar e Excluir' }
            );

            if (!senha) return;

            try {
                const resVal = await fetch(`${API}/validar-senha`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ senha })
                });

                if (!resVal.ok) {
                    const dataVal = await resVal.json();
                    await modal.alert(dataVal.message || 'Senha incorreta. Ação abortada.', '❌ Acesso Negado');
                    return;
                }
            } catch (err) {
                await modal.alert('Erro de rede ao validar segurança.', '❌ Erro');
                return;
            }

            // 3. Execução efetiva da limpeza após a senha ser validada
            let rotaLimpar = banco;
            if (banco === 'categoria') rotaLimpar = 'categorias';
            if (banco === 'contaFixa') rotaLimpar = 'contas-fixas';
            if (banco === 'cartao') rotaLimpar = 'cartoes';

            try {
                const res = await fetch(`${API}/${rotaLimpar}`, { method: 'DELETE', headers: getHeaders() });
                if (res.ok) {
                    if (banco === 'categoria') { setCategorias([]); setMetasRenda([]); }
                    if (banco === 'contaFixa') { setContasFixas([]); setRendasFixas([]); }
                    if (banco === 'cartao') setCartoes([]);

                    await modal.alert(`${nomeAmigavel} excluídos com sucesso da base de dados.`, '✅ Exclusão Concluída');
                }
            } catch (err) {
                console.error('Erro na remoção massiva:', err);
            }
            return;
        }

        // Bloco de Exclusão Unitária
        const rotas = { cartoes: 'cartoes', categorias: 'categorias', metasRenda: 'metas-renda', contasFixas: 'contas-fixas', rendasFixas: 'rendas-fixas' };
        await fetch(`${API}/${rotas[banco]}/${id}`, { method: 'DELETE', headers: getHeaders() });
        const setters = { cartoes: [setCartoes, cartoes], categorias: [setCategorias, categorias], metasRenda: [setMetasRenda, metasRenda], contasFixas: [setContasFixas, contasFixas], rendasFixas: [setRendasFixas, rendasFixas] };
        const [setter, state] = setters[banco];
        setter(state.filter(i => i.id !== id));
    }, [API, getHeaders, cartoes, categorias, metasRenda, contasFixas, rendasFixas, modal]);

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

    const exportarCSV = useCallback(() => {
        if (!transacoes || transacoes.length === 0) {
            modal.alert('Não existem lançamentos disponíveis para exportação.', '⚠️ Livro-Razão Vazio');
            return;
        }

        const cabecalhos = ['ID', 'Descricao', 'Categoria', 'Valor Parcela', 'Data Compra', 'Tipo', 'Forma Pagamento', 'Status', 'Mes Referencia', 'Ano Referencia', 'Nome Conta Fixa', 'KM Registrado', 'Observacao'];
        const linhas = transacoes.map(t => [
            t.id || '', `"${(t.descricao || '').replace(/"/g, '""')}"`, `"${(t.categoria || '').replace(/"/g, '""')}"`, t.valorParcela || t.valor || 0,
            t.dataCompra ? t.dataCompra.split('T')[0] : '', t.tipo || '', `"${(t.formaPagamento || '').replace(/"/g, '""')}"`, t.status || '', t.mesReferencia || '',
            t.anoReferencia || '', `"${(t.nomeContaFixa || '').replace(/"/g, '""')}"`, t.km_moto || t.kmMoto || '', `"${(t.observacao || '').replace(/"/g, '""')}"`
        ]);
        const conteudoCSV = [cabecalhos.join(';'), ...linhas.map(l => l.join(';'))].join('\n');
        const blob = new Blob(['\uFEFF' + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.setAttribute('download', `backup_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    }, [transacoes, modal]);

    return {
        cartoes, setCartoes, categorias, setCategorias, metasRenda, setMetasRenda,
        contasFixas, setContasFixas, rendasFixas, setRendasFixas, gerandoMes,
        addCartao, addCategoria, addMetaRenda, addContaFixa, addRendaFixa,
        editarSetup, removerSetup, gerarMesManual, exportarCSV
    };
}