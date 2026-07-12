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

        const categoria = formData.get('categoria');
        const dataCompraStr = formData.get('dataCompra');
        const formaPagamento = formData.get('formaPagamento');
        const numParcelas = parseInt(formData.get('parcelas'), 10) || 1;

        const isThirdParty = formData.get('isThirdParty') === 'on' || formData.get('isThirdParty') === 'true';
        const thirdPartyName = isThirdParty ? formData.get('thirdPartyName') : null;

        let km_moto = formData.get('kmMoto') ? parseFloat(formData.get('kmMoto')) : null;
        let veiculo_id = null;
        let veiculo_emprestado = 0;

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
            km_moto,
            isThirdParty,
            thirdPartyName
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

    // 🔥 MOTOR DE BUSCA AVANÇADA DE PARCELAS (Ignora IDs e olha para o nome (x/y))
    const getTransacoesRelacionadas = (tTarget) => {
        // Tenta capturar o padrão do nome, ex: "Tenis (1/7)"
        const matchNome = String(tTarget.descricao).match(/^(.*?)\s*\((\d+)\/(\d+)\)$/);

        if (matchNome) {
            const baseDescricao = matchNome[1].trim();
            const currentIndex = parseInt(matchNome[2], 10);
            const totalParcelas = parseInt(matchNome[3], 10);

            // Cria uma busca segura para encontrar todas as faturas com o mesmo nome base
            const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`^${escapeRegExp(baseDescricao)}\\s*\\(\\d+\\/${totalParcelas}\\)$`);

            const encontradas = transacoes.filter(item => regex.test(item.descricao));
            encontradas.sort((a, b) => new Date(a.dataCompra) - new Date(b.dataCompra)); // Ordena por data

            return { isParcelado: true, relacionadas: encontradas, currentIndex };
        }

        // Se for um lançamento novo mas que ainda usa _, pega pelo ID como fallback
        if (tTarget.id && String(tTarget.id).includes('_')) {
            const baseId = String(tTarget.id).split('_')[0];
            const currentIndex = parseInt(String(tTarget.id).split('_')[1], 10) + 1;

            const encontradas = transacoes.filter(item => String(item.id).startsWith(baseId));
            encontradas.sort((a, b) => new Date(a.dataCompra) - new Date(b.dataCompra));

            return { isParcelado: true, relacionadas: encontradas, currentIndex };
        }

        return { isParcelado: false, relacionadas: [tTarget], currentIndex: 1 };
    };

    const editarValor = async (t) => {
        const { isParcelado, relacionadas, currentIndex } = getTransacoesRelacionadas(t);
        let transacoesAEditar = [t];
        let acao = 'unica';
        let infoParcelamento = null;

        if (isParcelado && relacionadas.length > 1) {
            infoParcelamento = {
                atual: currentIndex,
                total: relacionadas.length,
                valorTotal: relacionadas.reduce((acc, curr) => acc + Number(curr.valorParcela), 0)
            };

            acao = await modal.options(
                `O lançamento "${t.descricao}" é parcelado. Quais parcelas deseja editar?`,
                [
                    { label: '📍 Apenas a parcela atual', value: 'unica' },
                    { label: '⏭️ Esta e as FUTURAS', value: 'futuras' },
                    { label: '⏮️ Esta e as ANTERIORES', value: 'anteriores' },
                    { label: '⚠️ TODAS as parcelas', value: 'todas' }
                ],
                'Edição de Parcelamento'
            );

            if (!acao) return;

            // Identifica a posição exata da parcela clicada na lista de parcelas
            const idxNoArray = relacionadas.findIndex(item => item.id === t.id);

            if (acao === 'todas') transacoesAEditar = relacionadas;
            else if (acao === 'futuras') transacoesAEditar = relacionadas.slice(idxNoArray);
            else if (acao === 'anteriores') transacoesAEditar = relacionadas.slice(0, idxNoArray + 1);
        }

        const tituloModal = isParcelado && transacoesAEditar.length > 1
            ? `✏️ Editando em Lote (${transacoesAEditar.length} parcelas)`
            : '✏️ Edição de Lançamento';

        const dadosEditados = await modal.prompt('', '', tituloModal, {
            inputType: 'editar_transacao',
            transacao: t,
            categorias,
            cartoes,
            infoParcelamento,
            acaoEdicao: acao
        });

        if (!dadosEditados) return;

        try {
            const promessas = transacoesAEditar.map(oldTx => {

                // Mágica 1: Preservar o (1/10) no final do nome para não estragar a lista
                let novaDescricao = dadosEditados.descricao;
                const sufixoMatch = oldTx.descricao.match(/\s?\(\d+\/\d+\)$/);
                if (sufixoMatch && !novaDescricao.includes(sufixoMatch[0])) {
                    novaDescricao = `${novaDescricao.replace(/\s?\(\d+\/\d+\)$/, '')}${sufixoMatch[0]}`;
                }

                // Mágica 2: Se mudou o dia do pagamento, altera só o dia, preservando o Mês e Ano originais!
                let novaData = oldTx.dataCompra;
                if (dadosEditados.dataCompra !== t.dataCompra) {
                    const novoDia = dadosEditados.dataCompra.split('-')[2];
                    const [oldAno, oldMes] = oldTx.dataCompra.split('T')[0].split('-');
                    novaData = `${oldAno}-${oldMes}-${novoDia}`;
                }

                // Mágica 3: BLINDAGEM DO STATUS. Mantém a conta velha como "pago".
                let novoStatus = oldTx.status;
                if (oldTx.id === t.id) {
                    novoStatus = dadosEditados.status; // Só edita o status na parcela que o usuário de fato clicou
                }

                const payloadFinal = {
                    ...dadosEditados,
                    descricao: novaDescricao,
                    dataCompra: novaData,
                    status: novoStatus
                };

                return fetch(`${API}/transacoes/${oldTx.id}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify(payloadFinal)
                });
            });

            await Promise.all(promessas);

            await carregarTransacoes();
            modal.alert(transacoesAEditar.length > 1 ? `${transacoesAEditar.length} parcelas atualizadas com sucesso!` : 'Lançamento atualizado com segurança!', '✅ Sucesso');

        } catch (err) {
            modal.alert(`Erro de conexão: ${err.message}`, '❌ Erro de Rede');
        }
    };

    const deletarTransacao = async (t) => {
        const { isParcelado, relacionadas } = getTransacoesRelacionadas(t);
        let idsParaDeletar = [t.id];

        if (isParcelado && relacionadas.length > 1) {
            const acao = await modal.options(
                `Atenção: O lançamento "${t.descricao}" faz parte de um parcelamento. O que deseja fazer?`,
                [
                    { label: '🗑️ Excluir APENAS esta parcela', value: 'unica' },
                    { label: '⏭️ Excluir esta e as FUTURAS', value: 'futuras' },
                    { label: '⏮️ Excluir esta e as ANTERIORES', value: 'anteriores' },
                    { label: '⚠️ Excluir TODAS as parcelas', value: 'todas' }
                ],
                'Exclusão de Parcelamento'
            );

            if (!acao) return;

            const idxNoArray = relacionadas.findIndex(item => item.id === t.id);

            if (acao === 'todas') idsParaDeletar = relacionadas.map(item => item.id);
            else if (acao === 'futuras') idsParaDeletar = relacionadas.slice(idxNoArray).map(item => item.id);
            else if (acao === 'anteriores') idsParaDeletar = relacionadas.slice(0, idxNoArray + 1).map(item => item.id);
        } else {
            const ok = await modal.confirm(`Excluir definitivamente o lançamento "${t.descricao}"?`, '🗑️ Excluir');
            if (!ok) return;
        }

        try {
            const promessas = idsParaDeletar.map(id =>
                fetch(`${API}/transacoes/${id}`, { method: 'DELETE', headers: getHeaders() })
            );

            await Promise.all(promessas);

            setTransacoes(prev => prev.filter(item => !idsParaDeletar.includes(item.id)));

            if (idsParaDeletar.length > 1) {
                modal.alert(`${idsParaDeletar.length} parcelas foram excluídas com sucesso!`, '✅ Excluído');
            }
        } catch (err) {
            modal.alert('Falha de rede ao tentar excluir lançamentos.', '❌ Erro');
        }
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

    const anexarComprovante = async (t) => { modal.alert("Funcionalidade de anexo está integrada noutro módulo.", "Aviso"); };
    const verComprovante = (t) => { if (t.comprovante_url) window.open(t.comprovante_url, '_blank'); else modal.alert('Nenhum comprovante anexado a esta transação.', 'Sem Anexo'); };

    return { addTransacao, alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa, anexarComprovante, verComprovante };
}