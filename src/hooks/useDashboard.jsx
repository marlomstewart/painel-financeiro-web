import React, { useState, useMemo, useCallback } from 'react';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/**
 * Hook Customizado: useDashboard
 * Abstrai a lógica matemática pesada do painel principal (cálculo de metas, raio-x,
 * rolagem de pendências e filtragem da tabela).
 */
export function useDashboard({ transacoes, setTransacoes, transacoesMes, categorias, dataVis, setDataVis, modal, API, getHeaders, nomeUsuario, garagem }) {

    const [buscaTexto, setBuscaTexto] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [ordenacao, setOrdenacao] = useState({ coluna: 'data', direcao: 'desc' });
    const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
    const [filtrosAvancados, setFiltrosAvancados] = useState({ dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: '' });
    const [somarSaldoAnterior, setSomarSaldoAnterior] = useState(true);

    const mesAnterior = useCallback(() => setDataVis(prev => prev.mes === 1 ? { mes: 12, ano: prev.ano - 1 } : { ...prev, mes: prev.mes - 1 }), [setDataVis]);
    const mesProximo = useCallback(() => setDataVis(prev => prev.mes === 12 ? { mes: 1, ano: prev.ano + 1 } : { ...prev, mes: prev.mes + 1 }), [setDataVis]);

    const calcularSaldoAcumuladoAte = useCallback((mes, ano) => {
        const todasAteOMes = transacoes.filter(t => t.anoReferencia < ano || (t.anoReferencia === ano && t.mesReferencia <= mes));
        let rendaPaga = 0, gastoPago = 0;
        todasAteOMes.forEach(t => {
            const v = Number(t.valorParcela);
            if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') { if (t.status === 'pago') rendaPaga += v; }
            else { if (t.status === 'pago') gastoPago += v; }
        });
        return rendaPaga - gastoPago;
    }, [transacoes]);

    const mesAntRef = useMemo(() => dataVis.mes === 1 ? { mes: 12, ano: dataVis.ano - 1 } : { mes: dataVis.mes - 1, ano: dataVis.ano }, [dataVis]);
    const saldoMesAnterior = useMemo(() => calcularSaldoAcumuladoAte(mesAntRef.mes, mesAntRef.ano), [calcularSaldoAcumuladoAte, mesAntRef]);

    const mudarOrdenacao = useCallback((coluna) => {
        setOrdenacao(prev => ({ coluna, direcao: prev.coluna === coluna ? (prev.direcao === 'asc' ? 'desc' : 'asc') : 'asc' }));
    }, []);

    let dadosTabela = useMemo(() => {
        let filtrados = transacoesMes.filter(t => {
            const atendeStatus = filtroStatus === 'todos' || t.status === filtroStatus;
            const atendeBusca = t.descricao.toLowerCase().includes(buscaTexto.toLowerCase());
            let atendeAvancado = true;
            if (mostrarFiltrosAvancados) {
                if (filtrosAvancados.categoria && t.categoria !== filtrosAvancados.categoria) atendeAvancado = false;
                if (filtrosAvancados.formaPagamento && !t.formaPagamento.includes(filtrosAvancados.formaPagamento)) atendeAvancado = false;
                if (filtrosAvancados.valorMin && Number(t.valorParcela) < Number(filtrosAvancados.valorMin)) atendeAvancado = false;
                if (filtrosAvancados.valorMax && Number(t.valorParcela) > Number(filtrosAvancados.valorMax)) atendeAvancado = false;
                if (filtrosAvancados.dataInicio && new Date(t.dataCompra) < new Date(filtrosAvancados.dataInicio + 'T00:00:00')) atendeAvancado = false;
                if (filtrosAvancados.dataFim && new Date(t.dataCompra) > new Date(filtrosAvancados.dataFim + 'T23:59:59')) atendeAvancado = false;
            }
            return atendeStatus && atendeBusca && atendeAvancado;
        });

        if (ordenacao.coluna) {
            filtrados.sort((a, b) => {
                let vA, vB;
                switch (ordenacao.coluna) {
                    case 'descricao': vA = a.descricao.toLowerCase(); vB = b.descricao.toLowerCase(); break;
                    case 'categoria': vA = a.categoria.toLowerCase(); vB = b.categoria.toLowerCase(); break;
                    case 'data': vA = new Date(a.dataCompra).getTime(); vB = new Date(b.dataCompra).getTime(); break;
                    case 'status': vA = a.status; vB = b.status; break;
                    case 'pagamento': vA = a.formaPagamento; vB = b.formaPagamento; break;
                    case 'valor': vA = Number(a.valorParcela); vB = Number(b.valorParcela); break;
                    default: return 0;
                }
                return vA < vB ? (ordenacao.direcao === 'asc' ? -1 : 1) : (vA > vB ? (ordenacao.direcao === 'asc' ? 1 : -1) : 0);
            });
        }
        return filtrados;
    }, [transacoesMes, filtroStatus, buscaTexto, mostrarFiltrosAvancados, filtrosAvancados, ordenacao]);

    let totRendaTotal = 0, totRendaPaga = 0, totGastoReal = 0, totInvestido = 0, totGastoPago = 0, totFaturaCreditoAberto = 0;
    let gCat = {}; categorias.forEach(c => gCat[c.nome] = 0);
    let gastoSemCategoria = 0, gastoContasFixas = 0;

    transacoesMes.forEach(t => {
        const v = Number(t.valorParcela);
        if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') { totRendaTotal += v; if (t.status === 'pago') totRendaPaga += v; }
        else {
            if (t.tipo === 'despesa') totGastoReal += v;
            if (t.tipo === 'investimento') totInvestido += v;
            if (t.status === 'pago') totGastoPago += v;
            if (t.formaPagamento && t.formaPagamento.startsWith('credito_') && t.status === 'pendente') totFaturaCreditoAberto += v;
            if (t.categoria === 'Contas Fixas') gastoContasFixas += v;
            else if (t.categoria === 'Sem Categoria') gastoSemCategoria += v;
            else if (gCat[t.categoria] !== undefined) gCat[t.categoria] += v;
        }
    });

    const categoriasDinamicas = useMemo(() => {
        return categorias.map(c => c.nome === 'Gasolina' && nomeUsuario.toLowerCase() === 'stewart' ? { ...c, meta: garagem.calcularMetaGasolina(dataVis.mes, dataVis.ano) } : c);
    }, [categorias, nomeUsuario, garagem, dataVis]);

    let custoPrevisto = gastoSemCategoria + gastoContasFixas;
    categoriasDinamicas.forEach(c => custoPrevisto += Math.max(c.meta, gCat[c.nome] || 0));

    const saldoMesAtual = totRendaPaga - totGastoPago;
    const saldoAtual = saldoMesAtual + (somarSaldoAnterior ? saldoMesAnterior : 0);
    const previstoFimMes = totRendaTotal - custoPrevisto + (somarSaldoAnterior ? saldoMesAnterior : 0);

    const dataHoje = new Date();
    const mesReal = dataHoje.getMonth() + 1;
    const anoReal = dataHoje.getFullYear();

    const pendenciasPassadas = useMemo(() => {
        return transacoes.filter(t => t.status === 'pendente' && (t.anoReferencia < anoReal || (t.anoReferencia === anoReal && t.mesReferencia < mesReal)));
    }, [transacoes, anoReal, mesReal]);

    const processarRolagemPendencias = useCallback(async () => {
        try {
            const promessas = pendenciasPassadas.flatMap((t, index) => {
                const reqUpdate = fetch(`${API}/transacoes/${t.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: 'transferido', valorParcela: t.valorParcela }) });
                const reqCreate = fetch(`${API}/transacoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id: (Date.now() + index).toString(), descricao: `[Pendência ${nomesMeses[t.mesReferencia - 1]}] ${t.descricao}`, categoria: t.categoria, valorParcela: t.valorParcela, dataCompra: new Date(anoReal, mesReal - 1, dataHoje.getDate()).toISOString(), tipo: t.tipo, formaPagamento: t.formaPagamento, status: 'pendente', mesReferencia: mesReal, anoReferencia: anoReal, kmMoto: t.kmMoto || null, grupo_id: null }) });
                return [reqUpdate, reqCreate];
            });
            await Promise.all(promessas);
            const resT = await fetch(`${API}/transacoes`, { headers: getHeaders() });
            if (resT.ok) { setTransacoes(await resT.json()); setDataVis({ mes: mesReal, ano: anoReal }); modal.alert(`Importado!`, '✅ Concluído'); }
        } catch (err) { modal.alert('Erro de conexão.', '❌ Erro'); }
    }, [API, getHeaders, modal, pendenciasPassadas, setTransacoes, setDataVis, anoReal, mesReal, dataHoje]);

    const abrirModalPendencias = useCallback(() => {
        modal.alert(<div className="space-y-3"><p className="text-sm"><b>{pendenciasPassadas.length}</b> pendência(s) antiga(s). Deseja importar para {nomesMeses[mesReal - 1]}?</p><div className="max-h-60 overflow-y-auto space-y-2 pr-2">{pendenciasPassadas.map(t => (<div key={t.id} className="border border-rose-200 bg-rose-50 p-3 rounded-lg flex justify-between"><div className="truncate"><p className="text-xs font-bold text-rose-800">{t.descricao}</p></div><span className="font-bold text-rose-700 text-sm">{formatarMoeda(t.valorParcela)}</span></div>))}</div><button onClick={() => { modal.close(); processarRolagemPendencias(); }} className="w-full mt-4 bg-rose-600 text-white font-bold py-3 rounded-lg shadow">Importar</button></div>, '⚠️ Pendências');
    }, [modal, pendenciasPassadas, mesReal, processarRolagemPendencias]);

    /**
     * ✅ BUG FIX: Cálculo seguro de numéricos usando `Number()` na lógica de reduce (linha 115) 
     * garante que se o Banco retornar o valor como "100.00" ele não use comparação lexicográfica em Strings.
     */
    const abrirDetalhesCategoria = useCallback((nCat, vGasto, vMeta, tCat) => {
        const ts = transacoes.filter(t => t.categoria === nCat && t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano);
        if (ts.length === 0) return;

        const qtd = ts.length;
        const med = vGasto / qtd;
        const maior = ts.reduce((max, t) => Number(t.valorParcela) > Number(max.valorParcela) ? t : max, ts[0]);
        const menor = ts.reduce((min, t) => Number(t.valorParcela) < Number(min.valorParcela) ? t : min, ts[0]);
        let prev = vGasto;
        let analise = "Indisponível fora do mês atual.";

        if (dataVis.mes === dataHoje.getMonth() + 1 && dataVis.ano === dataHoje.getFullYear()) {
            prev = (vGasto / dataHoje.getDate()) * new Date(dataVis.ano, dataVis.mes, 0).getDate();
            if (tCat === 'despesa' || tCat === 'Gasto' || tCat === 'gasto') {
                analise = prev > vMeta ? `⚠️ Alerta: Estouro de limite projetado de ${formatarMoeda(prev - vMeta)}.` : `✅ Controlado. Economia projetada: ${formatarMoeda(vMeta - prev)}.`;
            } else {
                analise = prev < vMeta ? `⚠️ Ritmo lento. Faltam ${formatarMoeda(vMeta - prev)} para a meta.` : `✅ Excelente! Superando a meta em ${formatarMoeda(prev - vMeta)}.`;
            }
        }

        const conteudo = (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg border"><p className="text-[10px] font-bold mb-1">Atual vs Meta</p><p className="text-lg font-bold">{formatarMoeda(vGasto)}<span className="text-xs font-normal"> / {formatarMoeda(vMeta)}</span></p></div>
                    <div className="bg-slate-50 p-3 rounded-lg border"><p className="text-[10px] font-bold mb-1">Média</p><p className="text-lg font-bold">{formatarMoeda(med)}<span className="text-xs font-normal"> em {qtd}x</span></p></div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border text-blue-900 text-sm font-medium">{analise}</div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-rose-50 p-3 rounded-lg border border-rose-100"><p className="text-[10px] uppercase text-rose-600 font-bold mb-1">Maior Valor</p><p className="text-sm font-bold text-rose-700">{formatarMoeda(maior.valorParcela)}</p><p className="text-[9px] text-rose-500 mt-1 truncate" title={maior.descricao}>{new Date(maior.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {maior.descricao}</p></div>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100"><p className="text-[10px] uppercase text-emerald-600 font-bold mb-1">Menor Valor</p><p className="text-sm font-bold text-emerald-700">{formatarMoeda(menor.valorParcela)}</p><p className="text-[9px] text-emerald-500 mt-1 truncate" title={menor.descricao}>{new Date(menor.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {menor.descricao}</p></div>
                </div>
                {nCat === 'Gasolina' && nomeUsuario === 'stewart' && (
                    <button onClick={(e) => garagem.abrirCalendarioGasolina(e, dataVis.mes, dataVis.ano)} className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg shadow-md">📅 Ajustar Dias Não Rodados</button>
                )}
            </div>
        );
        modal.alert(conteudo, `Raio-X: ${nCat}`);
    }, [transacoes, dataVis, dataHoje, modal, nomeUsuario, garagem]);

    const abrirResumoCard = useCallback((tipo) => {
        modal.alert(<div>Resumo em tela: clique em exportar para visualização contábil global ou avalie os painéis diretos expandindo as categorias.</div>, 'Raio-X Resumido');
    }, [modal]);

    return {
        buscaTexto, setBuscaTexto, filtroStatus, setFiltroStatus, ordenacao, setOrdenacao,
        mostrarFiltrosAvancados, setMostrarFiltrosAvancados, filtrosAvancados, setFiltrosAvancados, somarSaldoAnterior, setSomarSaldoAnterior,
        mesAnterior, mesProximo, mudarOrdenacao, dadosTabela,
        totRendaPaga, totGastoReal, totInvestido, totFaturaCreditoAberto,
        saldoMesAnterior, saldoAtual, saldoMesAtual, mesAntRef, previstoFimMes,
        categoriasDinamicas, gCat, pendenciasPassadas,
        abrirModalPendencias, abrirDetalhesCategoria, abrirResumoCard
    };
}