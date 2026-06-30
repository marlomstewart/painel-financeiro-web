import { useCallback } from 'react';

/**
 * Hook Customizado: useTransacoes
 * Gere o CRUD do livro-razão financeiro, integração com a Garagem (hodômetro),
 * edição inteligente (aceitando vírgulas) e controle de Data de Pagamento.
 */
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

        // Permite que o usuário digite com vírgula no formulário
        let valorBruto = formData.get('valor');
        if (typeof valorBruto === 'string') valorBruto = valorBruto.replace(',', '.');

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

    /**
     * Alternar Status: Agora grava a Data de Pagamento se mudar para "pago"
     */
    const alternarStatusTransacao = async (id, statusAtual, valor, dataCompra) => {
        const novoStatus = statusAtual === 'pago' ? 'pendente' : 'pago';

        // Se for mudar para pago, avisamos no texto que a data de hoje será registrada
        let tituloAlert = novoStatus === 'pago' ? '💰 Marcar como Pago' : '⏳ Marcar como Pendente';
        let msgAlert = novoStatus === 'pago'
            ? 'A data de pagamento será registrada como o dia de hoje.'
            : 'O lançamento voltará para pendências.';

        try {
            const res = await fetch(`${API}/transacoes/${id}/status`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ status: novoStatus })
            });
            const data = await res.json();

            if (res.ok) {
                // Atualiza o estado local preservando todos os dados, injetando apenas o status e a data_pagamento
                setTransacoes(transacoes.map(t => t.id === id ? { ...t, status: novoStatus, data_pagamento: data.data_pagamento } : t));
                // Opcional: Retirar o modal visual se preferir um clique mais rápido e silencioso
                // modal.alert(msgAlert, tituloAlert); 
            }
        } catch (err) { console.error("Erro ao mudar status:", err); }
    };

    /**
     * Edição Inteligente: Aceita formato Brasileiro e preserva competência.
     */
    const editarValor = async (transacao) => {
        // Exibe o valor atual formatado para o Brasil como sugestão
        const valorSugerido = transacao.valorParcela.toString().replace('.', ',');

        // NOVIDADE: Em vez de inputType: 'number', usamos text para permitir a vírgula!
        const novoValorStr = await modal.prompt(
            `Atualize o valor (ex: 89,90) ou a descrição do lançamento "${transacao.descricao}":\n\n(Dica: Para alterar outros dados estruturais, apague e crie novamente)`,
            valorSugerido,
            '✏️ Edição Rápida',
            { inputType: 'text' }
        );

        if (!novoValorStr) return;

        // Limpeza e conversão do formato brasileiro para o formato do banco
        let valorTratado = novoValorStr.replace('R$', '').trim().replace(',', '.');
        if (isNaN(parseFloat(valorTratado))) {
            return modal.alert("Por favor, digite um número válido.", "❌ Erro de Formato");
        }

        try {
            const res = await fetch(`${API}/transacoes/${transacao.id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ valorParcela: parseFloat(valorTratado) })
            });
            if (res.ok) {
                await carregarTransacoes();
                modal.alert('Valor atualizado com segurança!', '✅ Sucesso');
            }
        } catch (err) { modal.alert('Erro ao editar', '❌ Erro'); }
    };

    const deletarTransacao = async (t) => {
        const ok = await modal.confirm(`Excluir definitivamente o lançamento "${t.descricao}"?`, '🗑️ Excluir');
        if (!ok) return;
        try {
            const res = await fetch(`${API}/transacoes/${t.id}`, { method: 'DELETE', headers: getHeaders() });
            if (res.ok) setTransacoes(transacoes.filter(item => item.id !== t.id));
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