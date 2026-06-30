import { useCallback } from 'react';

export function useTransacoes({ API, getHeaders, modal, token, nomeUsuario, transacoes, setTransacoes, categorias, cartoes, garagem }) {
    
    const carregarTransacoes = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/transacoes`, { headers: getHeaders() });
            if (res.ok) setTransacoes(await res.json());
        } catch (err) { console.error("Erro ao recarregar transações:", err); }
    }, [API, getHeaders, token, setTransacoes]);

    const addTransacao = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        let valorBruto = formData.get('valor');
        if (typeof valorBruto === 'string') {
            valorBruto = valorBruto.replace(/[R$\s.]/g, '').replace(',', '.');
        }

        const obj = {
            id: Date.now().toString(),
            descricao: formData.get('descricao'),
            categoria: formData.get('categoria'),
            valorParcela: parseFloat(valorBruto),
            dataCompra: formData.get('dataCompra'),
            tipo: formData.get('tipo'),
            formaPagamento: formData.get('formaPagamento'),
            status: formData.get('status'),
            mesReferencia: parseInt(formData.get('dataCompra').split('-')[1]),
            anoReferencia: parseInt(formData.get('dataCompra').split('-')[0]),
            observacao: formData.get('observacao') || '',
            km_moto: formData.get('kmMoto') ? parseFloat(formData.get('kmMoto')) : null
        };

        const numParcelas = parseInt(formData.get('parcelas')) || 1;
        let sucesso = true;

        for (let i = 0; i < numParcelas; i++) {
            let mesRef = obj.mesReferencia + i;
            let anoRef = obj.anoReferencia;
            if (mesRef > 12) { mesRef -= 12; anoRef += 1; }
            
            const parcelaObj = { 
                ...obj, 
                id: `${obj.id}_${i}`, 
                mesReferencia: mesRef, 
                anoReferencia: anoRef, 
                descricao: numParcelas > 1 ? `${obj.descricao} (${i + 1}/${numParcelas})` : obj.descricao 
            };
            
            const res = await fetch(`${API}/transacoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(parcelaObj) });
            if (!res.ok) sucesso = false;
            else if (obj.km_moto && garagem) await garagem.registrarHodometro(obj.km_moto, obj.dataCompra, obj.descricao);
        }

        if (sucesso) { await carregarTransacoes(); modal.alert('Lançamento registrado com sucesso!', '✅ Sucesso'); return true; }
        else { modal.alert('Erro ao registrar lançamento.', '❌ Erro'); return false; }
    };

    const alternarStatusTransacao = async (id, statusAtual, valor, dataCompra) => {
        const novoStatus = statusAtual === 'pago' ? 'pendente' : 'pago';
        
        try {
            const res = await fetch(`${API}/transacoes/${id}/status`, { 
                method: 'PUT', 
                headers: getHeaders(), 
                body: JSON.stringify({ status: novoStatus }) 
            });
            const data = await res.json();
            
            if (res.ok) {
                setTransacoes(prev => prev.map(t => t.id === id ? { ...t, status: novoStatus, data_pagamento: data.data_pagamento } : t));
            } else {
                modal.alert(`Falha ao alterar status:\n${data.error}`, '❌ Erro do Servidor');
            }
        } catch (err) { console.error("Erro ao mudar status:", err); }
    };

    const editarValor = async (transacao) => {
        const dadosEditados = await modal.prompt('', '', '✏️ Edição de Lançamento', { inputType: 'editar_transacao', transacao, categorias, cartoes });
        if (!dadosEditados) return;

        try {
            const res = await fetch(`${API}/transacoes/${transacao.id}`, { 
                method: 'PUT', headers: getHeaders(), body: JSON.stringify(dadosEditados) 
            });
            
            if (res.ok) {
                await carregarTransacoes();
                modal.alert('Lançamento atualizado com segurança!', '✅ Sucesso');
            } else {
                // ATUALIZADO: Agora ele mostra EXATAMENTE o erro do Banco de Dados
                const errData = await res.json();
                modal.alert(`Servidor rejeitou a atualização.\n\nMotivo: ${errData.error}`, '❌ Erro de Sistema');
            }
        } catch (err) { modal.alert(`Erro de conexão: ${err.message}`, '❌ Erro de Rede'); }
    };

    const deletarTransacao = async (t) => {
        const ok = await modal.confirm(`Excluir definitivamente o lançamento "${t.descricao}"?`, '🗑️ Excluir');
        if (!ok) return;
        try {
            const res = await fetch(`${API}/transacoes/${t.id}`, { method: 'DELETE', headers: getHeaders() });
            if (res.ok) setTransacoes(prev => prev.filter(item => item.id !== t.id));
        } catch (err) { modal.alert('Erro ao deletar.', '❌ Erro'); }
    };

    const executarAcaoEmMassa = async (idsSelecionados, acao) => {
        const acoesNomes = { 'pago': 'Pagar', 'pendente': 'Marcar como Pendente', 'excluir': 'Excluir' };
        const ok = await modal.confirm(`Deseja realmente ${acoesNomes[acao]} os ${idsSelecionados.length} itens selecionados?`, '⚠️ Ação em Lote');
        if (!ok) return;
        try {
            const res = await fetch(`${API}/transacoes/massa/acao`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ ids: idsSelecionados, acao }) });
            if (res.ok) await carregarTransacoes();
        } catch (err) { modal.alert('Erro na ação.', '❌ Erro'); }
    };

    const anexarComprovante = async (t) => { modal.alert("Funcionalidade de anexo está integrada noutro módulo. Verifique o uploadController.", "Aviso"); };
    const verComprovante = (t) => { if (t.comprovante_url) window.open(t.comprovante_url, '_blank'); else modal.alert('Nenhum comprovante anexado a esta transação.', 'Sem Anexo'); };

    return { addTransacao, alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa, anexarComprovante, verComprovante };
}