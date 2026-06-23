import { useCallback } from 'react';

const loadingIcon = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

/**
 * Hook Customizado: useTransacoes
 * Responsável pelo ciclo de vida das transações, incluindo feedback visual de Loading.
 */
export function useTransacoes({ API, getHeaders, modal, token, nomeUsuario, transacoes, setTransacoes, categorias, cartoes, garagem }) {

    /** Processa os formulários financeiros e previne cliques duplos com Loader */
    const addTransacao = useCallback(async (e) => {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
        const originalText = btn ? btn.innerHTML : '';

        // Feedback Visual Imediato (Bloqueia o botão e gira o spinner)
        if (btn) {
            btn.disabled = true;
            btn.classList.add('opacity-70', 'cursor-wait');
            btn.innerHTML = `${loadingIcon} Processando...`;
        }

        try {
            const fd = new FormData(form);
            const d = fd.get('descricao'), v = Number(fd.get('valor')), dt = new Date(fd.get('dataCompra') + 'T00:00:00');
            let t = fd.get('tipo'), c = fd.get('categoria'), p = fd.get('formaPagamento'), parc = Number(fd.get('parcelas')) || 1, s = fd.get('status');

            let km_moto = fd.get('kmMoto') ? Number(fd.get('kmMoto')) : null;
            let veiculo_id = null; let veiculo_emprestado = null;

            if (nomeUsuario.toLowerCase() === 'stewart' && (c === 'Gasolina' || c === 'Manutenção da moto')) {
                let listaAtual = garagem.veiculosGaragem;
                try { const resGar = await fetch(`${API}/garagem/veiculos`, { headers: getHeaders() }); if (resGar.ok) { listaAtual = await resGar.json(); garagem.setVeiculosGaragem(listaAtual); } } catch (err) { console.error('Erro garagem:', err); }
                const opcoesVeiculo = listaAtual.map(vc => ({ value: vc.id, icon: vc.tipo === 'convidado' ? '🤝' : '🚗', label: vc.modelo, desc: vc.tipo === 'convidado' ? 'Convidado' : `${vc.ano_fabricacao}/${vc.ano_modelo}` }));
                if (opcoesVeiculo.length === 0) { await modal.alert('Cadastre um veículo primeiro.', '🏍️ Vazio'); return; }
                const idEscolhido = await modal.options('Qual veículo recebeu o lançamento?', opcoesVeiculo, '🏍️ Veículo');
                if (!idEscolhido) return;
                const veiculoEscolhido = listaAtual.find(vc => vc.id === idEscolhido);
                veiculo_id = veiculoEscolhido.id;
                if (veiculoEscolhido.tipo === 'convidado') { veiculo_emprestado = veiculoEscolhido.modelo; km_moto = null; }
            }

            if (c === 'Renda' || c === 'Renda Fixa') t = 'renda';
            if (c === 'Contas Fixas') t = 'despesa';
            const grupoId = parc > 1 ? Date.now().toString() : null; let novasT = [];

            if (p.startsWith('credito_')) {
                const cart = cartoes.find(card => card.id === p.split('_')[1]); let mI = (dt.getDate() >= cart.melhorDia) ? dt.getMonth() + 1 : dt.getMonth();
                for (let i = 0; i < parc; i++) { let mP = mI + i, aP = dt.getFullYear(); if (mP > 11) { aP += Math.floor(mP / 12); mP %= 12; } novasT.push({ id: (Date.now() + i).toString(), descricao: parc > 1 ? `${d} (${i + 1}/${parc})` : d, categoria: c, valorParcela: v / parc, dataCompra: dt.toISOString(), tipo: t, formaPagamento: p, status: s, mesReferencia: mP + 1, anoReferencia: aP, grupo_id: grupoId, km_moto, veiculo_id, veiculo_emprestado }); }
            } else {
                novasT.push({ id: Date.now().toString(), descricao: d, categoria: c, valorParcela: v, dataCompra: dt.toISOString(), tipo: t, formaPagamento: p, status: s, mesReferencia: dt.getMonth() + 1, anoReferencia: dt.getFullYear(), grupo_id: grupoId, km_moto, veiculo_id, veiculo_emprestado });
            }

            for (const nova of novasT) await fetch(`${API}/transacoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(nova) });
            setTransacoes([...transacoes, ...novasT]); form.reset();

            if (km_moto && veiculo_id && !veiculo_emprestado) await garagem.verificarDesgasteVeiculo(veiculo_id, km_moto);
        } finally {
            // Reverte o botão para o estado normal independente de sucesso ou erro
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('opacity-70', 'cursor-wait');
                btn.innerHTML = originalText;
            }
        }
    }, [API, getHeaders, modal, nomeUsuario, cartoes, transacoes, setTransacoes, garagem]);

    /** Ações massivas ativadas pelos checkboxes na Dashboard */
    const executarAcaoEmMassa = useCallback(async (acao, ids) => {
        const confirmacao = await modal.confirm(`Deseja aplicar ${acao.toUpperCase()} a ${ids.length} item(s)?`, '⚠️ Ação em Massa'); if (!confirmacao) return false;
        try {
            const promessas = ids.map(id => {
                if (acao === 'excluir') return fetch(`${API}/transacoes/${id}`, { method: 'DELETE', headers: getHeaders() });
                const t = transacoes.find(tr => tr.id === id); return fetch(`${API}/transacoes/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: acao, valorParcela: t.valorParcela }) });
            });
            await Promise.all(promessas);
            if (acao === 'excluir') setTransacoes(prev => prev.filter(tr => !ids.includes(tr.id))); else setTransacoes(prev => prev.map(tr => ids.includes(tr.id) ? { ...tr, status: acao } : tr));
            return true;
        } catch (err) { modal.alert('Erro de conexão.', '❌ Erro'); return false; }
    }, [API, getHeaders, modal, transacoes, setTransacoes]);

    /** Exclusão atômica (Lida de forma especial com objetos contendo grupo_id de parcelamento) */
    const deletarTransacao = useCallback(async (t) => {
        if (t.grupo_id) {
            const opcao = await modal.options(`"${t.descricao}" parcelada. O que excluir?`, [{ value: '1', icon: '1️⃣', label: 'Esta parcela' }, { value: '2', icon: '2️⃣', label: 'Esta e futuras' }, { value: '3', icon: '3️⃣', label: 'Esta e anteriores' }, { value: '4', icon: '4️⃣', label: 'Todas parcelas' }], '🗑️ Excluir');
            if (!opcao) return;
            if (opcao === '1') { await fetch(`${API}/transacoes/${t.id}`, { method: 'DELETE', headers: getHeaders() }); setTransacoes(prev => prev.filter(tr => tr.id !== t.id)); }
            else if (opcao === '2') { await fetch(`${API}/transacoes/grupo/${t.grupo_id}?mes=${t.mesReferencia}&ano=${t.anoReferencia}&modo=futuras`, { method: 'DELETE', headers: getHeaders() }); setTransacoes(prev => prev.filter(tr => !(tr.grupo_id === t.grupo_id && (tr.anoReferencia > t.anoReferencia || (tr.anoReferencia === t.anoReferencia && tr.mesReferencia >= t.mesReferencia))))); }
            else if (opcao === '3') { await fetch(`${API}/transacoes/grupo/${t.grupo_id}?mes=${t.mesReferencia}&ano=${t.anoReferencia}&modo=anteriores`, { method: 'DELETE', headers: getHeaders() }); setTransacoes(prev => prev.filter(tr => !(tr.grupo_id === t.grupo_id && (tr.anoReferencia < t.anoReferencia || (tr.anoReferencia === t.anoReferencia && tr.mesReferencia <= t.mesReferencia))))); }
            else if (opcao === '4') { await fetch(`${API}/transacoes/grupo/${t.grupo_id}?modo=todas`, { method: 'DELETE', headers: getHeaders() }); setTransacoes(prev => prev.filter(tr => tr.grupo_id !== t.grupo_id)); }
            return;
        }
        const ok = await modal.confirm('Excluir transação?', '🗑️ Excluir', { confirmLabel: 'Excluir', confirmColor: 'bg-red-600 hover:bg-red-700' }); if (!ok) return;
        await fetch(`${API}/transacoes/${t.id}`, { method: 'DELETE', headers: getHeaders() }); setTransacoes(prev => prev.filter(tr => tr.id !== t.id));
    }, [API, getHeaders, modal, setTransacoes]);

    const alternarStatusTransacao = useCallback(async (id, statusAtual, valorParcela, dataCompra) => {
        const opcaoEscolhida = await modal.options(`Status: ${statusAtual.toUpperCase()}\n\nEscolha:`, [{ value: 'pago', icon: '✔', label: 'PAGO' }, { value: 'pendente', icon: '⏳', label: 'PENDENTE' }], '🔄 Alterar Status');
        if (!opcaoEscolhida || opcaoEscolhida === statusAtual) return;
        try { await fetch(`${API}/transacoes/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: opcaoEscolhida, valorParcela, dataCompra }) }); setTransacoes(prev => prev.map(t => t.id === id ? { ...t, status: opcaoEscolhida } : t)); } catch (err) { modal.alert('Erro de conexão.', '❌ Erro'); }
    }, [API, getHeaders, modal, setTransacoes]);

    const editarValor = useCallback(async (t) => {
        const nV = await modal.prompt(`1️⃣ Novo VALOR?`, String(t.valorParcela), '✏️ Editar', { inputType: 'number', placeholder: '0.00', confirmLabel: 'Próximo' }); if (nV === null) return;
        const novoValor = Number(String(nV).replace(',', '.')); if (isNaN(novoValor)) return modal.alert('Inválido.', '❌ Erro');
        const [ano, mes, dia] = String(t.dataCompra).split('T')[0].split('-');
        const nD = await modal.prompt(`2️⃣ Nova DATA?\nDD/MM/AAAA`, `${dia}/${mes}/${ano}`, '📅 Editar', { confirmLabel: 'Próximo' }); if (nD === null) return;
        const partes = nD.split('/'); if (partes.length !== 3) return modal.alert('Formato inválido.', '❌ Erro'); const novaDataStr = `${partes[2]}-${partes[1]}-${partes[0]}`;
        const opcoesCat = [{ value: 'Sem Categoria', icon: '🏷️', label: 'Sem Categoria' }, { value: 'Contas Fixas', icon: '📅', label: 'Contas Fixas' }, { value: 'Renda Fixa', icon: '💰', label: 'Renda Fixa' }, { value: 'Renda', icon: '💵', label: 'Renda Variável' }, ...categorias.map(c => ({ value: c.nome, icon: c.tipo === 'investimento' ? '📈' : '💸', label: c.nome }))];
        const nCat = await modal.options(`3️⃣ CATEGORIA?\nAtual: ${t.categoria}`, opcoesCat, '🏷️ Editar'); if (!nCat) return;
        const nS = await modal.options(`4️⃣ STATUS?\nAtual: ${t.status.toUpperCase()}`, [{ value: 'pago', icon: '✔', label: 'PAGO' }, { value: 'pendente', icon: '⏳', label: 'PENDENTE' }], '🔄 Editar'); if (!nS) return;

        try { await fetch(`${API}/transacoes/${t.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: nS, valorParcela: novoValor, dataCompra: novaDataStr, categoria: nCat }) }); setTransacoes(prev => prev.map(tr => tr.id === t.id ? { ...tr, valorParcela: novoValor, dataCompra: novaDataStr, status: nS, categoria: nCat } : tr)); } catch (err) { modal.alert('Erro ao atualizar.', '❌ Erro'); }
    }, [API, getHeaders, modal, categorias, setTransacoes]);

    /** Lógica Multer -> Cloudinary de Mídias Estáticas */
    const anexarComprovante = useCallback(async (t) => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*,application/pdf';
        input.onchange = async (e) => {
            const arq = e.target.files[0]; if (!arq) return;
            const fd = new FormData(); fd.append('arquivo', arq);
            try { const res = await fetch(`${API}/transacoes/${t.id}/comprovante`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd }); const data = await res.json(); if (res.ok) { setTransacoes(prev => prev.map(tr => tr.id === t.id ? { ...tr, comprovante_url: data.comprovante_url, comprovante_public_id: data.comprovante_public_id } : tr)); modal.alert('Anexado!', '✅ Sucesso'); } else modal.alert('Erro', '❌ Erro'); } catch (err) { modal.alert('Erro conexão', '❌ Erro'); }
        };
        input.click();
    }, [API, token, modal, setTransacoes]);

    const removerComprovante = useCallback(async (t) => {
        const ok = await modal.confirm('Remover?', '🗑️ Remover'); if (!ok) return;
        try { const res = await fetch(`${API}/transacoes/${t.id}/comprovante`, { method: 'DELETE', headers: getHeaders() }); if (res.ok) { setTransacoes(prev => prev.map(tr => tr.id === t.id ? { ...tr, comprovante_url: null, comprovante_public_id: null } : tr)); modal.alert('Removido', '✅'); } } catch (err) { modal.alert('Erro', '❌'); }
    }, [API, getHeaders, modal, setTransacoes]);

    const verComprovante = useCallback((t) => {
        modal.setConfig({ type: 'comprovante', title: `📎 Comprovante`, url: t.comprovante_url, isPDF: t.comprovante_url.includes('/raw/'), onCancel: modal.close, onClose: modal.close, onRemover: () => { modal.close(); removerComprovante(t); } });
    }, [modal, removerComprovante]);

    return { addTransacao, executarAcaoEmMassa, deletarTransacao, alternarStatusTransacao, editarValor, anexarComprovante, removerComprovante, verComprovante };
}