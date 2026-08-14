import { useCallback } from 'react';
import { ehPagamentoCredito, resolverCartao } from '../utils/cartaoUtils';
import { salvarPendente } from '../utils/offlineQueue';

/**
 * @file src/hooks/useTransacoes.jsx
 * @description Hook customizado para gerir o CRUD de transações financeiras.
 * Refatorado para suportar valores fracionados de Terceiros (Split).
 */
export function useTransacoes({ API, getHeaders, modal, token, temGaragem, transacoes, setTransacoes, categorias, cartoes, garagem }) {

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
        const thirdPartyPhone = isThirdParty ? (formData.get('thirdPartyPhone') || null) : null;

        // 🔥 CAPTURA E FORMATA O VALOR TOTAL DO TERCEIRO
        let thirdPartyTotalRaw = formData.get('thirdPartyValue');
        let thirdPartyTotal = null;
        if (isThirdParty && thirdPartyTotalRaw) {
            if (typeof thirdPartyTotalRaw === 'string') {
                thirdPartyTotal = parseFloat(thirdPartyTotalRaw.replace(/[R$\s.]/g, '').replace(',', '.'));
            } else {
                thirdPartyTotal = parseFloat(thirdPartyTotalRaw);
            }
        }

        let km_moto = formData.get('kmMoto') ? parseFloat(formData.get('kmMoto')) : null;
        let veiculo_id = null;
        let veiculo_emprestado = 0;

        if (temGaragem && categorias.find(c => c.nome === categoria)?.is_garagem) {
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

        if (ehPagamentoCredito(formaPagamento)) {
            const cartao = resolverCartao(formaPagamento, cartoes);

            let diaFechamento = 31;

            if (cartao && cartao.melhorDia) {
                diaFechamento = parseInt(cartao.melhorDia, 10);
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

        // 🔥 DIVIDE O VALOR DO TERCEIRO PELO NÚMERO DE PARCELAS
        const thirdPartyValueCalculado = thirdPartyTotal ? Math.round((thirdPartyTotal / numParcelas) * 100) / 100 : null;

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
            thirdPartyName,
            thirdPartyPhone
        };

        let sucesso = true;
        let teveOffline = false;
        let algumaSalvaNoServidor = false;
        const itensParaFilaOffline = [];

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
                thirdPartyValue: thirdPartyValueCalculado, // 🔥 Injeta a fração do terceiro na parcela
                mesReferencia: mesRef,
                anoReferencia: anoRef,
                descricao: numParcelas > 1 ? `${objBase.descricao} (${i + 1}/${numParcelas})` : objBase.descricao
            };

            try {
                const res = await fetch(`${API}/transacoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(parcelaObj) });
                if (res.ok) {
                    algumaSalvaNoServidor = true;
                } else {
                    sucesso = false;
                }
            } catch (err) {
                // Falha de rede (offline): guarda o lançamento localmente pra mostrar já na tela.
                teveOffline = true;
                await salvarPendente(parcelaObj);
                itensParaFilaOffline.push({ ...parcelaObj, _pendingSync: true });
            }
        }

        if (algumaSalvaNoServidor) {
            await carregarTransacoes();
            if (veiculo_id && garagem && garagem.carregarDadosGaragem) {
                await garagem.carregarDadosGaragem();
            }
        }

        // Reaplica os itens que ficaram só na fila offline por cima do que veio do servidor,
        // pra um refetch de parcelas parcialmente sincronizadas não apagar os pendentes da tela.
        if (itensParaFilaOffline.length > 0) {
            setTransacoes(prev => [...prev, ...itensParaFilaOffline]);
        }

        if (!sucesso) {
            modal.alert('Erro ao registrar lançamento.', '❌ Erro');
            return 'erro';
        }

        if (teveOffline) {
            modal.alert('Sem conexão — lançamento guardado no aparelho e será enviado automaticamente quando a internet voltar.', '📴 Salvo offline');
            return 'offline';
        }

        modal.alert('Lançamento registrado com sucesso!', '✅ Sucesso');
        return 'sucesso';
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

    const getTransacoesRelacionadas = (tTarget) => {
        if (tTarget.id && String(tTarget.id).includes('_')) {
            const baseId = String(tTarget.id).split('_')[0];
            const currentIndex = parseInt(String(tTarget.id).split('_')[1], 10) + 1;

            const encontradas = transacoes.filter(item => String(item.id).startsWith(baseId));
            encontradas.sort((a, b) => new Date(a.dataCompra) - new Date(b.dataCompra));

            return { isParcelado: true, relacionadas: encontradas, currentIndex };
        }

        const matchNome = String(tTarget.descricao).match(/^(.*?)\s*\((\d+)\/(\d+)\)$/);

        if (matchNome) {
            const baseDescricao = matchNome[1].trim();
            const currentIndex = parseInt(matchNome[2], 10);
            const totalParcelas = parseInt(matchNome[3], 10);

            const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`^${escapeRegExp(baseDescricao)}\\s*\\(\\d+\\/${totalParcelas}\\)$`);

            const encontradas = transacoes.filter(item => regex.test(item.descricao) && item.categoria === tTarget.categoria);
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
            // 🔥 Adicionada verificação de thirdPartyValue original no parcelamento
            infoParcelamento = {
                atual: currentIndex,
                total: relacionadas.length,
                valorTotal: relacionadas.reduce((acc, curr) => acc + Number(curr.valorParcela), 0),
                valorTerceiroTotal: relacionadas.reduce((acc, curr) => acc + (Number(curr.thirdPartyValue) || 0), 0)
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

                let novaDescricao = dadosEditados.descricao;
                const sufixoMatch = oldTx.descricao.match(/\s?\(\d+\/\d+\)$/);
                if (sufixoMatch && !novaDescricao.includes(sufixoMatch[0])) {
                    novaDescricao = `${novaDescricao.replace(/\s?\(\d+\/\d+\)$/, '')}${sufixoMatch[0]}`;
                }

                let novaData = oldTx.dataCompra;
                if (dadosEditados.dataCompra !== t.dataCompra) {
                    const novoDia = dadosEditados.dataCompra.split('-')[2];
                    const [oldAno, oldMes] = oldTx.dataCompra.split('T')[0].split('-');
                    novaData = `${oldAno}-${oldMes}-${novoDia}`;
                }

                let novoStatus = oldTx.status;
                if (oldTx.id === t.id) {
                    novoStatus = dadosEditados.status;
                }

                const payloadFinal = {
                    ...dadosEditados,
                    descricao: novaDescricao,
                    dataCompra: novaData,
                    status: novoStatus,
                    mesReferencia: oldTx.mesReferencia,
                    anoReferencia: oldTx.anoReferencia
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

    const TIPOS_COMPROVANTE_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const TAMANHO_MAXIMO_COMPROVANTE = 10 * 1024 * 1024; // 10MB, mesmo limite do multer no backend

    const anexarComprovante = async (t, file) => {
        if (!file) return;
        if (!TIPOS_COMPROVANTE_PERMITIDOS.includes(file.type)) {
            return modal.alert('Envie uma imagem (JPG, PNG ou WEBP) ou um PDF.', '❌ Formato inválido');
        }
        if (file.size > TAMANHO_MAXIMO_COMPROVANTE) {
            return modal.alert('O arquivo precisa ter até 10MB.', '❌ Arquivo muito grande');
        }
        try {
            const fd = new FormData();
            fd.append('arquivo', file);
            // Sem getHeaders() aqui de propósito: ela fixa Content-Type: application/json, o que
            // quebraria o multipart/form-data — o navegador precisa definir o boundary sozinho.
            const res = await fetch(`${API}/transacoes/${t.id}/comprovante`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fd
            });
            const data = await res.json();
            if (res.ok) {
                setTransacoes(prev => prev.map(item => item.id === t.id
                    ? { ...item, comprovante_url: data.comprovante_url, comprovante_public_id: data.comprovante_public_id }
                    : item
                ));
                await modal.alert('Comprovante anexado com sucesso!', '✅ Sucesso');
            } else {
                await modal.alert(data.message || 'Erro ao anexar o comprovante.', '❌ Erro');
            }
        } catch (err) {
            await modal.alert('Erro de conexão ao enviar o comprovante.', '❌ Erro de Rede');
        }
    };
    // Comprovantes novos usam entrega autenticada no Cloudinary — o link salvo na transação não
    // funciona sozinho, então sempre busca uma URL assinada (de curta duração) na hora de abrir,
    // em vez de usar t.comprovante_url direto (que só ainda funciona pra comprovantes antigos).
    const verComprovante = async (t) => {
        if (!t.comprovante_public_id && !t.comprovante_url) return modal.alert('Nenhum comprovante anexado a esta transação.', 'Sem Anexo');
        try {
            const res = await fetch(`${API}/transacoes/${t.id}/comprovante-url`, { headers: getHeaders() });
            const data = await res.json();
            if (res.ok && data.comprovante_url) window.open(data.comprovante_url, '_blank');
            else modal.alert(data.message || 'Não foi possível abrir o comprovante.', '❌ Erro');
        } catch (err) {
            modal.alert('Erro de conexão ao tentar abrir o comprovante.', '❌ Erro de Rede');
        }
    };

    return { addTransacao, alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa, anexarComprovante, verComprovante };
}