import { useCallback } from 'react';

/**
 * @file src/hooks/useTransacoes.jsx
 * @description Hook customizado para gerir o CRUD de transações financeiras.
 * Implementa inteligência de faturas, exclusão inteligente de parcelamentos e integração com a Garagem.
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
     * e calcula a data de competência baseada no 'melhorDia' de compra do cartão.
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

        // POP-UP NATIVO: Interrompe o fluxo e pede a viatura ANTES de disparar os dados
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

        // CÁLCULO DE DATAS E FATURA: Identifica a competência inicial respeitando o "Melhor Dia"
        const [anoStr, mesStr, diaStr] = dataCompraStr.split('-');
        const diaCompra = parseInt(diaStr, 10);
        let mesRefInicial = parseInt(mesStr, 10);
        let anoRefInicial = parseInt(anoStr, 10);

        if (formaPagamento.startsWith('credito_')) {
            const cartaoId = formaPagamento.split('_')[1];
            const cartao = cartoes.find(c => String(c.id) === String(cartaoId));

            let diaFechamento = 31;

            if (cartao && cartao.melhorDia) {
                diaFechamento = parseInt(cartao.melhorDia, 10);
            } else if (cartao && cartao.nome?.toLowerCase().includes('nubank')) {
                diaFechamento = 8;
            }

            if (diaCompra >= diaFechamento) {
                mesRefInicial += 1;
                if (mesRefInicial > 12) {
                    mesRefInicial = 1;
                    anoRefInicial += 1;
                }
            }
        }

        // CÁLCULO DE VALOR: Divide o valor total pelo número de parcelas
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

        for (let i = 0; i < numParcelas; i++) {
            let mesRef = mesRefInicial + i;
            let anoRef = anoRefInicial;

            while (mesRef > 12) {
                mesRef -= 12;
                anoRef += 1;
            }

            const parcelaObj = {
                ...objBase,
                id: `${objBase.id}_${i}`,
                valorParcela: valorParcelaCalculado,
                mesReferencia: mesRef,
                anoReferencia: anoRef,
                descricao: numParcelas > 1 ? `${objBase.descricao} (${i + 1}/${numParcelas})` : objBase.descricao
            };

            const res = await fetch(`${API}/transacoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(parcelaObj) });
            if (!res.ok) sucesso = false;
        }

        if (sucesso) {
            await carregarTransacoes();
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
     * Alterna o estado de uma transação entre pendente e liquidado.
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
     * Motor de Exclusão Inteligente. Verifica se a transação faz parte de um parcelamento
     * e oferece opções de exclusão em massa baseada na cronologia das parcelas.
     * @param {Object} t - Transação a excluir.
     */
    const deletarTransacao = async (t) => {
        // Identifica se a transação tem o padrão de ID parcelado (timestamp_indice)
        const isParcelado = t.id && String(t.id).includes('_');
        let idsParaDeletar = [t.id];

        if (isParcelado) {
            const baseId = String(t.id).split('_')[0];
            const currentIndex = parseInt(String(t.id).split('_')[1], 10);

            const acao = await modal.options(
                `Atenção: O lançamento "${t.descricao}" faz parte de um parcelamento. O que deseja fazer?`,
                [
                    { label: '🗑️ Excluir APENAS esta parcela', value: 'unica' },
                    { label: '⏭️ Excluir esta e as PRÓXIMAS', value: 'futuras' },
                    { label: '⚠️ Excluir TODAS as parcelas', value: 'todas' }
                ],
                'Exclusão de Parcelamento'
            );

            if (!acao) return; // O utilizador fechou a janela ou cancelou

            if (acao === 'todas') {
                idsParaDeletar = transacoes.filter(item => String(item.id).startsWith(baseId)).map(item => item.id);
            } else if (acao === 'futuras') {
                idsParaDeletar = transacoes.filter(item => {
                    if (!String(item.id).startsWith(baseId)) return false;
                    const idx = parseInt(String(item.id).split('_')[1], 10);
                    return idx >= currentIndex;
                }).map(item => item.id);
            }
        } else {
            // Exclusão padrão para transações de parcela única
            const ok = await modal.confirm(`Excluir definitivamente o lançamento "${t.descricao}"?`, '🗑️ Excluir');
            if (!ok) return;
        }

        try {
            // Executa a exclusão de todos os IDs levantados utilizando Promise.all para máxima compatibilidade com a API atual
            const promessas = idsParaDeletar.map(id =>
                fetch(`${API}/transacoes/${id}`, { method: 'DELETE', headers: getHeaders() })
            );

            await Promise.all(promessas);

            // Limpa o estado local
            setTransacoes(prev => prev.filter(item => !idsParaDeletar.includes(item.id)));

            if (idsParaDeletar.length > 1) {
                modal.alert(`${idsParaDeletar.length} parcelas foram excluídas com sucesso!`, '✅ Excluído');
            }
        } catch (err) {
            modal.alert('Falha de rede ao tentar excluir lançamentos.', '❌ Erro');
        }
    };

    /**
     * Aplica uma ação em lote sobre múltiplas transações via caixa de seleção.
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

    const anexarComprovante = async (t) => { modal.alert("Funcionalidade de anexo está integrada noutro módulo.", "Aviso"); };
    const verComprovante = (t) => { if (t.comprovante_url) window.open(t.comprovante_url, '_blank'); else modal.alert('Nenhum comprovante anexado a esta transação.', 'Sem Anexo'); };

    return { addTransacao, alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa, anexarComprovante, verComprovante };
}