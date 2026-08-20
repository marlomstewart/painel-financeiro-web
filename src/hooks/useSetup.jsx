import { useState } from 'react';

export function useSetup({ API, getHeaders, modal, transacoes, setTransacoes, showToast }) {
    const [cartoes, setCartoes] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [metasRenda, setMetasRenda] = useState([]);
    const [contasFixas, setContasFixas] = useState([]);
    const [rendasFixas, setRendasFixas] = useState([]);
    const [dividas, setDividas] = useState([]);

    const [gerandoMes, setGerandoMes] = useState(false);

    const parseCurrency = (val) => Number(String(val).replace(/\./g, '').replace(',', '.'));

    const addCartao = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const dados = { nome: fd.get('nome'), melhorDia: Number(fd.get('melhorDia')), vencimento: Number(fd.get('vencimento')), limite: parseCurrency(fd.get('limite')) };
        const res = await fetch(`${API}/cartoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dados) });
        if (res.ok) {
            const data = await res.json();
            setCartoes([...cartoes, data.cartao]);
            e.target.reset();
            showToast('Cartão adicionado com sucesso!', 'success');
        } else {
            showToast('Erro ao cadastrar cartão.', 'error');
        }
    };

    const addCategoria = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const dados = { id: `cat_${Date.now()}`, nome: fd.get('nome'), meta: parseCurrency(fd.get('meta')), tipo: fd.get('tipo'), is_garagem: fd.get('is_garagem') === '1' };
        const res = await fetch(`${API}/categorias`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dados) });
        if (res.ok) { setCategorias([...categorias, dados]); e.target.reset(); showToast('Categoria adicionada!', 'success'); }
    };

    const addMetaRenda = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const dados = { id: `meta_${Date.now()}`, nome: fd.get('nome'), valor: parseCurrency(fd.get('valor')) };
        const res = await fetch(`${API}/metas-renda`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dados) });
        if (res.ok) { setMetasRenda([...metasRenda, dados]); e.target.reset(); showToast('Meta adicionada!', 'success'); }
    };

    // 🔥 CORREÇÃO: Lendo a forma de pagamento do FormData
    const addContaFixa = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const dados = {
            id: `cf_${Date.now()}`,
            nome: fd.get('nome'),
            valorPadrao: parseCurrency(fd.get('valorPadrao')),
            vencimento: Number(fd.get('vencimento')),
            forma_pagamento: fd.get('forma_pagamento') || 'pix'
        };
        const res = await fetch(`${API}/contas-fixas`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dados) });
        if (res.ok) { setContasFixas([...contasFixas, dados]); e.target.reset(); showToast('Conta Fixa adicionada com sucesso!', 'success'); }
    };

    const addRendaFixa = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const dados = { id: `rf_${Date.now()}`, nome: fd.get('nome'), valorPadrao: parseCurrency(fd.get('valorPadrao')), diaRecebimento: Number(fd.get('diaRecebimento')) };
        const res = await fetch(`${API}/rendas-fixas`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dados) });
        if (res.ok) { setRendasFixas([...rendasFixas, dados]); e.target.reset(); showToast('Renda Fixa adicionada!', 'success'); }
    };

    // 🔥 CORREÇÃO: Lendo a forma de pagamento e suportando envio direto do objeto
    const addDivida = async (e, objDireto = null) => {
        if (e && e.preventDefault) e.preventDefault();

        let dados = objDireto;
        if (!dados) {
            const fd = new FormData(e.target);
            dados = {
                descricao: fd.get('descricao'),
                valor_total: parseCurrency(fd.get('valorTotal')),
                valor_parcela: parseCurrency(fd.get('valorParcela')),
                qtd_parcelas: Number(fd.get('qtdParcelas')),
                dia_vencimento: Number(fd.get('diaVencimento')),
                parcelas_pagas_iniciais: Number(fd.get('parcelasPagasIniciais') || 0),
                forma_pagamento: fd.get('forma_pagamento') || 'pix',
                para_terceiros: fd.get('para_terceiros') ? 1 : 0,
                nome_terceiro: fd.get('nome_terceiro') || null
            };
        }
        if (!dados.id) dados.id = `div_${Date.now()}`;

        const res = await fetch(`${API}/dividas`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dados) });
        if (res.ok) {
            setDividas([...dividas, dados]);
            if (e && e.target && e.target.reset) e.target.reset();
            showToast('Dívida adicionada com sucesso!', 'success');
        }
    };

    const editarSetup = async (tipo, id, dados) => {
        const rotas = {
            'contas_fixas': 'contas-fixas',
            'dividas': 'dividas',
            'cartoes': 'cartoes',
            'categorias': 'categorias',
            'rendas_fixas': 'rendas-fixas',
            'metas_renda': 'metas-renda'
        };
        const endpoint = rotas[tipo] || tipo;
        const res = await fetch(`${API}/${endpoint}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dados)
        });
        if (res.ok) {
            if (tipo === 'contas_fixas') setContasFixas(contasFixas.map(item => item.id === id ? { ...item, ...dados } : item));
            if (tipo === 'dividas') setDividas(dividas.map(item => item.id === id ? { ...item, ...dados } : item));
            if (tipo === 'cartoes') setCartoes(cartoes.map(item => item.id === id ? { ...item, ...dados } : item));
            if (tipo === 'categorias') setCategorias(categorias.map(item => item.id === id ? { ...item, ...dados } : item));
            if (tipo === 'rendas_fixas') setRendasFixas(rendasFixas.map(item => item.id === id ? { ...item, ...dados } : item));
            if (tipo === 'metas_renda') setMetasRenda(metasRenda.map(item => item.id === id ? { ...item, ...dados } : item));
            return true;
        }
        return false;
    };

    const removerSetup = async (tipo, id) => {
        const rotas = {
            'cartoes': 'cartoes',
            'categorias': 'categorias',
            'metas_renda': 'metas-renda',
            'contas_fixas': 'contas-fixas',
            'rendas_fixas': 'rendas-fixas',
            'dividas': 'dividas' // 🔥 Mapeamento de dívidas garantido
        };
        const nomes = {
            'cartoes': 'Cartão',
            'categorias': 'Categoria',
            'metas_renda': 'Meta de Renda',
            'contas_fixas': 'Conta Fixa',
            'rendas_fixas': 'Renda Fixa',
            'dividas': 'Dívida'
        };

        const endpoint = rotas[tipo] || tipo;
        const nomeStr = nomes[tipo] || tipo;

        // Se passar 'all', a rota de exclusão em lote precisa estar no backend. 
        // Como o backend atual não tem delete em lote para setup, deletamos pela chave única.
        const res = await fetch(`${API}/${endpoint}/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (res.ok) {
            if (tipo === 'cartoes') setCartoes(cartoes.filter(i => i.id !== id));
            if (tipo === 'categorias') setCategorias(categorias.filter(i => i.id !== id));
            if (tipo === 'metas_renda') setMetasRenda(metasRenda.filter(i => i.id !== id));
            if (tipo === 'contas_fixas') setContasFixas(contasFixas.filter(i => i.id !== id));
            if (tipo === 'rendas_fixas') setRendasFixas(rendasFixas.filter(i => i.id !== id));
            if (tipo === 'dividas') setDividas(dividas.filter(i => i.id !== id));
            showToast(`${nomeStr} excluído(a) com sucesso!`, 'success');
        } else {
            showToast(`Erro ao remover ${nomeStr}.`, 'error');
        }
    };

    const gerarMesManual = async (mes, ano) => {
        setGerandoMes(true);
        try {
            const res = await fetch(`${API}/gerar-mes`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ mes, ano })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message, 'success');
                // Força recarregar a página para o App.jsx puxar as novas transações
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showToast(data.error || 'Erro ao gerar mês.', 'error');
            }
        } catch (err) {
            console.error('Erro ao gerar mês:', err);
            showToast('Falha na conexão com o servidor.', 'error');
        } finally {
            setGerandoMes(false);
        }
    };

    const exportarCSV = async () => {
        // 🔥 Busca dedicada e SEM o filtro `desde`: `transacoes` em memória só cobre os últimos
        // 24 meses (paginação por período, ver src/utils/janelaTransacoes.js), mas o extrato
        // exportado precisa do histórico completo — paga esse custo só aqui, sob demanda.
        let transacoesCompletas;
        try {
            const res = await fetch(`${API}/transacoes`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Falha ao buscar histórico completo');
            transacoesCompletas = await res.json();
        } catch (err) {
            return showToast('Erro ao buscar o histórico completo pra exportação.', 'error');
        }

        if (!transacoesCompletas || transacoesCompletas.length === 0) {
            return showToast('Não há transações para exportar.', 'error');
        }

        const cabecalho = ['ID', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Forma Pagamento', 'Mês', 'Ano'].join(';');
        const linhas = transacoesCompletas.map(t => {
            const data = t.datacompra || t.dataCompra || '';
            const desc = (t.descricao || '').replace(/;/g, ',');
            const cat = (t.categoria || '').replace(/;/g, ',');
            const tipo = t.tipo || '';
            const val = Number(t.valorparcela || t.valorParcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const status = t.status || '';
            const forma = t.formapagamento || t.formaPagamento || '';
            const mes = t.mesreferencia || t.mesReferencia || '';
            const ano = t.anoreferencia || t.anoReferencia || '';

            return `${t.id};${data};${desc};${cat};${tipo};${val};${status};${forma};${mes};${ano}`;
        });

        const csvContent = "\uFEFF" + cabecalho + "\n" + linhas.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const dataAtual = new Date().toISOString().split('T')[0];
        a.download = `extrato_financeiro_${dataAtual}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Download do extrato iniciado!', 'success');
    };

    return {
        cartoes, setCartoes, categorias, setCategorias, metasRenda, setMetasRenda,
        contasFixas, setContasFixas, rendasFixas, setRendasFixas, dividas, setDividas,
        addCartao, addCategoria, addMetaRenda, addContaFixa, addRendaFixa, addDivida,
        editarSetup, removerSetup, gerarMesManual, gerandoMes, exportarCSV
    };
}