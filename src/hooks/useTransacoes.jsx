import { useCallback } from 'react';

/**
 * @file src/hooks/useTransacoes.jsx
 * @description Hook customizado para gerenciar o CRUD de transações financeiras.
 * Implementa a interceção via pop-up (modal.options) para seleção obrigatória de veículo em despesas automotivas.
 */
export function useTransacoes({ API, getHeaders, modal, token, nomeUsuario, transacoes, setTransacoes, categorias, cartoes, garagem }) {

    /**
     * Sincroniza o estado global das transações com o Backend.
     */
    const carregarTransacoes = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/transacoes`, { headers: getHeaders() });
            if (res.ok) setTransacoes(await res.json());
        } catch (err) { console.error("Erro ao recarregar transações:", err); }
    }, [API, getHeaders, token, setTransacoes]);

    /**
     * Intercepta a submissão, solicita o veículo via pop-up (se aplicável), e grava a transação.
     * @param {Event} e - Evento de formulário.
     * @returns {Promise<boolean>} Retorna true se a operação for concluída com sucesso.
     */
    const addTransacao = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        let valorBruto = formData.get('valor');
        if (typeof valorBruto === 'string') {
            valorBruto = valorBruto.replace(/[R$\s.]/g, '').replace(',', '.');
        }

        const categoria = formData.get('categoria');
        let km_moto = formData.get('kmMoto') ? parseFloat(formData.get('kmMoto')) : null;
        let veiculo_id = null;
        let veiculo_emprestado = 0;

        // POP-UP NATIVO: Pede o veículo ANTES de disparar os dados para o banco.
        // BUG CORRIGIDO: Usando 'garagem.veiculosGaragem' conforme exportado pelo useGaragem.jsx
        if ((categoria === 'Gasolina' || categoria === 'Manutenção da moto') && nomeUsuario?.toLowerCase() === 'stewart') {
            if (garagem && garagem.veiculosGaragem && garagem.veiculosGaragem.length > 0) {
                // Monta a lista de botões que aparecerão no pop-up
                const opcoes = garagem.veiculosGaragem.filter(v => v.ativo === 1).map(v => ({
                    label: `${v.modelo} ${v.tipo !== 'proprio' ? '(Convidado)' : ''}`,
                    value: v.id
                }));

                // Exibe o modal interrompendo a execução até que você clique em um veículo
                veiculo_id = await modal.options('A qual veículo este lançamento pertence?', opcoes, '🔧 Selecione o Veículo');

                // Se você fechar o pop-up ou clicar em Cancelar, aborta o registro
                if (!veiculo_id) return false;

                // Identifica se é convidado para não alterar o seu KM principal
                const veicObj = garagem.veiculosGaragem.find(v => v.id === veiculo_id);
                if (veicObj && veicObj.tipo !== 'proprio') {
                    veiculo_emprestado = 1;
                    km_moto = null;
                }
            }
        }

        const obj = {
            id: Date.now().toString(),
            descricao: formData.get('descricao'),
            categoria,
            valorParcela: parseFloat(valorBruto),
            dataCompra: formData.get('dataCompra'),
            tipo: formData.get('tipo'),
            formaPagamento: formData.get('formaPagamento'),
            status: formData.get('status'),
            mesReferencia: parseInt(formData.get('dataCompra').split('-')[1], 10),
            anoReferencia: parseInt(formData.get('dataCompra').split('-')[0], 10),
            observacao: formData.get('observacao') || '',
            veiculo_id,
            veiculo_emprestado,
            km_moto
        };

        const numParcelas = parseInt(formData.get('parcelas'), 10) || 1;
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
        }

        if (sucesso) {
            await carregarTransacoes();

            // Atualiza a garagem para os Alertas do Dashboard refletirem o novo KM na mesma hora
            if (veiculo_id && garagem && garagem.carregarDadosGaragem) {
                await garagem.carregarDadosGaragem();
            }

            modal.alert('Lançamento registrado com sucesso!', '✅ Sucesso');
            return true;
        } else {
            modal.alert('Erro ao registrar lançamento.', '❌ Erro');
            return false;
        }
    };

    /**
     * Alterna o status entre liquidado (pago) e pendente com atualização otimista na tela.
     * @param {string} id - ID da transação
     * @param {string} statusAtual - Status presente
     * @param {number} valor - Valor da parcela
     * @param {string} dataCompra - Data de registro
     */
    const alternarStatusTransacao = async (id, statusAtual, valor, dataCompra) => {
        const novoStatus = statusAtual === 'pago' ? 'pendente' : 'pago';

        try {
            const res = await fetch(`${API}/transacoes/${id}/status`, {
                method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: novoStatus })
            });
            const data = await res.json();

            if (res.ok) {
                setTransacoes(prev => prev.map(t => t.id === id ? { ...t, status: novoStatus, data_pagamento: data.data_pagamento } : t));
            } else {
                modal.alert(`Falha ao alterar status:\n${data.error}`, '❌ Erro do Servidor');
            }
        } catch (err) { console.error("Erro ao mudar status:", err); }
    };

    /**
     * Aciona o modal customizado com formulário completo para edição de valores e atributos.
     * @param {Object} transacao - Objeto transacional selecionado.
     */
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
                const errData = await res.json();
                modal.alert(`Servidor rejeitou a atualização.\n\nMotivo: ${errData.error}`, '❌ Erro de Sistema');
            }
        } catch (err) { modal.alert(`Erro de conexão: ${err.message}`, '❌ Erro de Rede'); }
    };

    /**
     * Interpela o usuário para segurança e exclui a transação definitivamente.
     * @param {Object} t - Transação a excluir.
     */
    const deletarTransacao = async (t) => {
        const ok = await modal.confirm(`Excluir definitivamente o lançamento "${t.descricao}"?`, '🗑️ Excluir');
        if (!ok) return;
        try {
            const res = await fetch(`${API}/transacoes/${t.id}`, { method: 'DELETE', headers: getHeaders() });
            if (res.ok) setTransacoes(prev => prev.filter(item => item.id !== t.id));
        } catch (err) { modal.alert('Erro ao deletar.', '❌ Erro'); }
    };

    /**
     * Executa alterações rápidas (status ou deleção) para uma matriz de IDs.
     * @param {Array<string>} idsSelecionados - Identificadores.
     * @param {string} acao - Comando a executar.
     */
    const executarAcaoEmMassa = async (idsSelecionados, acao) => {
        const acoesNomes = { 'pago': 'Pagar', 'pendente': 'Marcar como Pendente', 'excluir': 'Excluir' };
        const ok = await modal.confirm(`Deseja realmente ${acoesNomes[acao]} os ${idsSelecionados.length} itens selecionados?`, '⚠️ Ação em Lote');
        if (!ok) return;
        try {
            const res = await fetch(`${API}/transacoes/massa/acao`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ ids: idsSelecionados, acao }) });
            if (res.ok) await carregarTransacoes();
        } catch (err) { modal.alert('Erro na ação.', '❌ Erro'); }
    };

    /** Placeholder para anexar comprovantes visuais. */
    const anexarComprovante = async (t) => { modal.alert("Funcionalidade de anexo está integrada noutro módulo. Verifique o uploadController.", "Aviso"); };

    /** Exibe o anexo da transação (se houver). */
    const verComprovante = (t) => {
        if (t.comprovante_url) window.open(t.comprovante_url, '_blank');
        else modal.alert('Nenhum comprovante anexado a esta transação.', 'Sem Anexo');
    };

    return { addTransacao, alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa, anexarComprovante, verComprovante };
}