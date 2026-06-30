import { useState, useCallback } from 'react';

/**
 * Hook Customizado: useSetup
 * Abstrai as operações de CRUD para matrizes de configuração do sistema (Cartões, Categorias,
 * Contas Fixas e Rendas Fixas) com prevenção contra cliques múltiplos.
 * Inclui o motor de exportação de dados analíticos para formato CSV.
 * * @param {Object} params - Parâmetros de dependência.
 * @param {string} params.API - URL base do servidor backend.
 * @param {Function} params.getHeaders - Função que retorna os cabeçalhos com token JWT.
 * @param {Object} params.modal - Instância de controle do Modal global.
 * @param {Array} params.transacoes - Array contendo todo o histórico de lançamentos.
 * @param {Function} params.setTransacoes - Setter para atualizar o estado global de transações.
 * @returns {Object} Estados de configuração e métodos de manipulação de dados.
 */
export function useSetup({ API, getHeaders, modal, transacoes, setTransacoes }) {
    const [cartoes, setCartoes] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [metasRenda, setMetasRenda] = useState([]);
    const [contasFixas, setContasFixas] = useState([]);
    const [rendasFixas, setRendasFixas] = useState([]);
    const [gerandoMes, setGerandoMes] = useState(false);

    /**
     * Adiciona um novo cartão de crédito à base de dados.
     * @param {Event} e - Evento de submit do formulário.
     */
    const addCartao = useCallback(async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const body = {
            id: Date.now().toString(),
            nome: fd.get('nome'),
            limite: Number(fd.get('limite')),
            melhorDia: Number(fd.get('melhorDia')),
            vencimento: Number(fd.get('vencimento'))
        };
        try {
            const res = await fetch(`${API}/cartoes`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setCartoes(prev => [...prev, body]);
            }
        } catch (err) {
            console.error('Erro ao adicionar cartão:', err);
        }
    }, [API, getHeaders]);

    /**
     * Adiciona uma nova categoria de planejamento orçamentário.
     * @param {Event} e - Evento de submit do formulário.
     */
    const addCategoria = useCallback(async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const body = {
            id: Date.now().toString(),
            nome: fd.get('nome'),
            meta: Number(fd.get('meta')),
            tipo: fd.get('tipo') || 'despesa'
        };
        try {
            const res = await fetch(`${API}/categorias`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setCategorias(prev => [...prev, body]);
            }
        } catch (err) {
            console.error('Erro ao adicionar categoria:', err);
        }
    }, [API, getHeaders]);

    /**
     * Adiciona uma obrigação recorrente de despesa fixa.
     * @param {Event} e - Evento de submit do formulário.
     */
    const addContaFixa = useCallback(async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const body = {
            id: Date.now().toString(),
            nome: fd.get('nome'),
            valorPadrao: Number(fd.get('valorPadrao')),
            vencimento: Number(fd.get('vencimento'))
        };
        try {
            const res = await fetch(`${API}/contas-fixas`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setContasFixas(prev => [...prev, body]);
            }
        } catch (err) {
            console.error('Erro ao adicionar conta fixa:', err);
        }
    }, [API, getHeaders]);

    /**
     * Adiciona uma receita recorrente de renda fixa.
     * @param {Event} e - Evento de submit do formulário.
     */
    const addRendaFixa = useCallback(async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const body = {
            id: Date.now().toString(),
            nome: fd.get('nome'),
            valorPadrao: Number(fd.get('valorPadrao')),
            diaRecebimento: Number(fd.get('diaRecebimento'))
        };
        try {
            const res = await fetch(`${API}/rendas-fixas`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setRendasFixas(prev => [...prev, body]);
            }
        } catch (err) {
            console.error('Erro ao adicionar renda fixa:', err);
        }
    }, [API, getHeaders]);

    /**
     * Atualiza os dados de um elemento específico em uma matriz contábil.
     * @param {string} banco - Nome identificador do conjunto de dados.
     * @param {string} id - ID único do registro a ser editado.
     * @param {Object} dados - Novos campos modificados.
     * @returns {boolean} Retorna verdadeiro em caso de sucesso na API.
     */
    const editarSetup = useCallback(async (banco, id, dados) => {
        let rota = banco;
        if (banco === 'contasFixas') rota = 'contas-fixas';
        if (banco === 'rendasFixas') rota = 'rendas-fixas';
        if (banco === 'metasRenda') rota = 'metas-renda';

        try {
            const res = await fetch(`${API}/${rota}/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ id, ...dados })
            });
            if (res.ok) {
                if (banco === 'cartoes') setCartoes(prev => prev.map(i => i.id === id ? { ...i, ...dados } : i));
                if (banco === 'categorias') setCategorias(prev => prev.map(i => i.id === id ? { ...i, ...dados } : i));
                if (banco === 'metasRenda') setMetasRenda(prev => prev.map(i => i.id === id ? { ...i, ...dados } : i));
                if (banco === 'contasFixas') setContasFixas(prev => prev.map(i => i.id === id ? { ...i, ...dados } : i));
                if (banco === 'rendasFixas') setRendasFixas(prev => prev.map(i => i.id === id ? { ...i, ...dados } : i));
                return true;
            }
        } catch (err) {
            console.error('Erro ao editar setup:', err);
        }
        return false;
    }, [API, getHeaders]);

    /**
     * Remove um registro individual ou limpa conjuntos em massa do banco de dados.
     * @param {string} banco - Identificador do conjunto afetado.
     * @param {string|null} id - ID do elemento. Se nulo, trata-se de remoção em massa.
     */
    const removerSetup = useCallback(async (banco, id = null) => {
        if (!id) {
            let rotaLimpar = banco;
            if (banco === 'categoria') rotaLimpar = 'categorias';
            if (banco === 'contaFixa') rotaLimpar = 'contas-fixas';
            if (banco === 'cartao') rotaLimpar = 'cartoes';

            try {
                const res = await fetch(`${API}/${rotaLimpar}`, { method: 'DELETE', headers: getHeaders() });
                if (res.ok) {
                    if (banco === 'categoria') setCategorias([]);
                    if (banco === 'contaFixa') { setContasFixas([]); setRendasFixas([]); }
                    if (banco === 'cartao') setCartoes([]);
                }
            } catch (err) {
                console.error('Erro na remoção massiva:', err);
            }
            return;
        }

        let rotaS = banco;
        if (banco === 'contasFixas') rotaS = 'contas-fixas';
        if (banco === 'rendasFixas') rotaS = 'rendas-fixas';
        if (banco === 'metasRenda') rotaS = 'metas-renda';

        try {
            const res = await fetch(`${API}/${rotaS}/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (res.ok) {
                if (banco === 'cartoes') setCartoes(prev => prev.filter(i => i.id !== id));
                if (banco === 'categorias') setCategorias(prev => prev.filter(i => i.id !== id));
                if (banco === 'metasRenda') setMetasRenda(prev => prev.filter(i => i.id !== id));
                if (banco === 'contasFixas') setContasFixas(prev => prev.filter(i => i.id !== id));
                if (banco === 'rendasFixas') setRendasFixas(prev => prev.filter(i => i.id !== id));
            }
        } catch (err) {
            console.error('Erro ao remover do setup:', err);
        }
    }, [API, getHeaders]);

    /**
     * Força a injeção manual das contas e rendas fixas para o mês de competência vigente.
     */
    const gerarMesManual = useCallback(async () => {
        setGerandoMes(true);
        try {
            const res = await fetch(`${API}/gerar-mes`, { method: 'POST', headers: getHeaders() });
            const data = await res.json();
            if (data.gerados.length === 0) {
                await modal.alert(`Tudo já estava gerado para ${data.mes}/${data.ano}.\nNenhum lançamento novo.`, '✅ Nenhum novo');
            } else {
                const lista = data.gerados.map(g => `• ${g.nome} (${g.tipo})`).join('\n');
                await modal.alert(`${data.gerados.length} lançamento(s):\n\n${lista}`, '✅ Gerados');
                const resT = await fetch(`${API}/transacoes`, { headers: getHeaders() });
                if (resT.ok) setTransacoes(await resT.json());
            }
        } catch (err) {
            await modal.alert('Erro ao gerar lançamentos.', '❌ Erro');
        } finally {
            setGerandoMes(false);
        }
    }, [API, getHeaders, modal, setTransacoes]);

    /**
     * Compila a base de transações e gera um download físico de arquivo estruturado em CSV (UTF-8 com BOM).
     */
    const exportarCSV = useCallback(() => {
        if (!transacoes || transacoes.length === 0) {
            modal.alert('Não existem lançamentos disponíveis para exportação.', '⚠️ Livro-Razão Vazio');
            return;
        }

        const cabecalhos = [
            'ID', 'Descricao', 'Categoria', 'Valor Parcela', 'Data Compra',
            'Tipo', 'Forma Pagamento', 'Status', 'Mes Referencia',
            'Ano Referencia', 'Nome Conta Fixa', 'KM Registrado', 'Observacao'
        ];

        const linhas = transacoes.map(t => [
            t.id || '',
            `"${(t.descricao || '').replace(/"/g, '""')}"`,
            `"${(t.categoria || '').replace(/"/g, '""')}"`,
            t.valorParcela || t.valor || 0,
            t.dataCompra ? t.dataCompra.split('T')[0] : '',
            t.tipo || '',
            `"${(t.formaPagamento || '').replace(/"/g, '""')}"`,
            t.status || '',
            t.mesReferencia || '',
            t.anoReferencia || '',
            `"${(t.nomeContaFixa || '').replace(/"/g, '""')}"`,
            t.km_moto || t.kmMoto || '',
            `"${(t.observacao || '').replace(/"/g, '""')}"`
        ]);

        const conteudoCSV = [
            cabecalhos.join(';'),
            ...linhas.map(l => l.join(';'))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `backup_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [transacoes, modal]);

    return {
        cartoes, setCartoes,
        categorias, setCategorias,
        metasRenda, setMetasRenda,
        contasFixas, setContasFixas,
        rendasFixas, setRendasFixas,
        gerandoMes,
        addCartao, addCategoria, addContaFixa, addRendaFixa,
        editarSetup, removerSetup, gerarMesManual, exportarCSV
    };
}