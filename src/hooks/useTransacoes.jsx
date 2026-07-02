import { useCallback } from 'react';

/**
 * @file src/hooks/useTransacoes.jsx
 * @description Hook customizado para gerir o CRUD (Create, Read, Update, Delete) de transações financeiras.
 * Implementa lógicas de interceção para a Garagem, cálculo de parcelamentos e inteligência de faturas de cartão.
 */
export function useTransacoes({ API, getHeaders, modal, token, nomeUsuario, transacoes, setTransacoes, categorias, cartoes, garagem }) {

    /**
     * Sincroniza o estado global das transações com a base de dados.
     */
    const carregarTransacoes = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/transacoes`, { headers: getHeaders() });
            if (res.ok) setTransacoes(await res.json());
        } catch (err) { console.error("Erro ao recarregar transações:", err); }
    }, [API, getHeaders, token, setTransacoes]);

    /**
     * Processa a submissão do formulário, valida viaturas, aplica divisão de parcelas
     * e calcula a data de competência baseada no dia de fechamento do cartão de crédito.
     * @param {Event} e - Evento de submissão do formulário.
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
        const dataCompraStr = formData.get('dataCompra');
        const formaPagamento = formData.get('formaPagamento');
        const numParcelas = parseInt(formData.get('parcelas'), 10) || 1;

        let km_moto = formData.get('kmMoto') ? parseFloat(formData.get('kmMoto')) : null;
        let veiculo_id = null;
        let veiculo_emprestado = 0;

        // POP-UP NATIVO: Interrompe o fluxo e pede a viatura ANTES de disparar os dados para o servidor.
        if ((categoria === 'Gasolina' || categoria === 'Manutenção da moto') && nomeUsuario?.toLowerCase() === 'stewart') {
            if (garagem && garagem.veiculosGaragem && garagem.veiculosGaragem.length > 0) {
                const opcoes = garagem.veiculosGaragem.filter(v => v.ativo === 1).map(v => ({
                    label: `${v.modelo} ${v.tipo !== 'proprio' ? '(Convidado)' : ''}`,
                    value: v.id
                }));

                if (opcoes.length > 0) {
                    veiculo_id = await modal.options('A qual veículo este lançamento pertence?', opcoes, '🔧 Selecione o Veículo');
                    if (!veiculo_id) return false;

                    const veicObj = garagem.veiculosGaragem.find(v => v.id === veiculo_id);
                    if (veicObj && veicObj.tipo !== 'proprio') {
                        veiculo_emprestado = 1;
                        km_moto = null;
                    }
                }
            }
        }

        // CÁLCULO DE DATAS E FATURA: Identifica a competência inicial respeitando o "Melhor Dia" do Cartão
        const [anoStr, mesStr, diaStr] = dataCompraStr.split('-');
        const diaCompra = parseInt(diaStr, 10);
        let mesRefInicial = parseInt(mesStr, 10);
        let anoRefInicial = parseInt(anoStr, 10);

        if (formaPagamento.startsWith('credito_')) {
            const cartaoId = formaPagamento.split('_')[1];
            // Verifica as configurações do cartão selecionado
            const cartao = cartoes.find(c => String(c.id) === String(cartaoId));

            if (cartao && cartao.dia_fechamento) {
                const diaFechamento = parseInt(cartao.dia_fechamento, 10);
                // Se a compra foi feita no dia de fechamento ou depois, entra apenas na próxima fatura
                if (diaCompra >= diaFechamento) {
                    mesRefInicial += 1;
                    if (mesRefInicial > 12) {
                        mesRefInicial = 1;
                        anoRefInicial += 1;
                    }
                }
            }
        }

        // CÁLCULO DE VALOR: Divide o valor total pelo número de parcelas (arredondando para 2 casas decimais)
        const valorParcelaCalculado = Math.round((parseFloat(valorBruto) / numParcelas) * 100) / 100;

        const objBase = {
            id: Date.now().toString(),
            descricao: formData.get('descricao'),
            categoria,
            dataCompra: dataCompraStr,
            tipo: formData.get('tipo'),
            formaPagamento,
            status: formData.get('status'),
            observacao: formData.get('observacao') || '',
            veiculo_id,
            veiculo_emprestado,
            km_moto
        };

        let sucesso = true;

        // Geração das parcelas com a matemática de datas e valores corretos
        for (let i = 0; i < numParcelas; i++) {
            let mesRef = mesRefInicial + i;
            let anoRef = anoRefInicial;

            // Corrige viradas de ano (ex: Mês 13 vira Janeiro do ano seguinte)
            while (mesRef > 12) {
                mesRef -= 12;
                anoRef += 1;
            }

            const parcelaObj = {
                ...objBase,
                id: `${objBase.id}_${i}`,
                valorParcela: valorParcelaCalculado, // Valor já dividido
                mesReferencia: mesRef,
                anoReferencia: anoRef,
                descricao: numParcelas > 1 ? `${objBase.descricao} (${i + 1}/${numParcelas})` : objBase.descricao
            };

            const res = await fetch(`${API}/transacoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(parcelaObj) });
            if (!res.ok) sucesso = false;
        }

        if (sucesso) {
            await carregarTransacoes();

            // Força a Garagem a atualizar os dados para os Alertas no Dashboard
            if (veiculo_id && garagem && garagem.carregarDadosGaragem) {
                await garagem.carregarDadosGaragem();
            }

            modal.alert('Lançamento registado com sucesso!', '✅ Sucesso');
            return true;
        } else {
            modal.alert('Erro ao registar lançamento.', '❌ Erro');
            return false;
        }
    };

    /**
     * Alterna o estado de uma transação entre pendente e liquidado.
     * @param {string} id - O UUID da transação.
     * @param {string} statusAtual - Status presente.
     * @param {number} valor - Valor associado.
     * @param {string} dataCompra - Data de competência.
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
     * Exibe o modal com o formulário completo para edição detalhada da transação.
     * @param {Object} transacao - Objeto completo da transação selecionada.
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
     * Interpela o utilizador para segurança e exclui permanentemente o registo.
     * @param {Object} t - A transação a eliminar.
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
     * Aplica uma determinada ação (pagar, pendente, excluir) sobre múltiplas transações.
     * @param {Array<string>} idsSelecionados - Matriz com os identificadores.
     * @param {string} acao - Ação a desencadear.
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

    /** Placeholder para o módulo de anexo de comprovativos. */
    const anexarComprovante = async (t) => { modal.alert("Funcionalidade de anexo está integrada noutro módulo.", "Aviso"); };

    /** Exibe o comprovativo anexado num novo separador. */
    const verComprovante = (t) => {
        if (t.comprovante_url) window.open(t.comprovante_url, '_blank');
        else modal.alert('Nenhum comprovante anexado a esta transação.', 'Sem Anexo');
    };

    return { addTransacao, alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa, anexarComprovante, verComprovante };
}