import React, { useState, useMemo, useCallback } from 'react';

/**
 * Formata um valor numérico para o padrão monetário brasileiro (BRL).
 * @param {number|string} valor 
 * @returns {string} Valor formatado como moeda (ex: R$ 1.500,00).
 */
const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/**
 * Hook Customizado: useDashboard
 * Motor cognitivo e matemático da tela principal.
 * Processa saldos acumulados, filtragem de tabelas, rolagem de pendências e as 
 * previsões de inteligência artificial (Raio-X de categorias e Resumos de Cards).
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

    // =========================================================================
    // MATEMÁTICA GERAL DO DASHBOARD (CARDS)
    // =========================================================================
    let totRendaTotal = 0, totRendaPaga = 0, totRendaPendente = 0;
    let totGastoReal = 0, totGastoPago = 0, totGastoPendente = 0;
    let totInvestido = 0, totInvestidoPago = 0, totInvestidoPendente = 0;
    let totFaturaCreditoAberto = 0;
    let gCat = {}; categorias.forEach(c => gCat[c.nome] = 0);
    let gastoSemCategoria = 0, gastoContasFixas = 0;

    transacoesMes.forEach(t => {
        const v = Number(t.valorParcela);
        if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') {
            totRendaTotal += v;
            if (t.status === 'pago') totRendaPaga += v;
            else totRendaPendente += v;
        }
        else {
            if (t.tipo === 'investimento') {
                totInvestido += v;
                if (t.status === 'pago') totInvestidoPago += v;
                else totInvestidoPendente += v;
            }
            if (t.tipo === 'despesa') {
                totGastoReal += v;
                if (t.status === 'pago') totGastoPago += v;
                else totGastoPendente += v;
            }
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

    const saldoMesAtual = totRendaPaga - (totGastoPago + totInvestidoPago);
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
        modal.alert(<div className="space-y-3"><p className="text-sm"><b>{pendenciasPassadas.length}</b> pendência(s) antiga(s). Deseja importar para {nomesMeses[mesReal - 1]}?</p><div className="max-h-60 overflow-y-auto space-y-2 pr-2">{pendenciasPassadas.map(t => (<div key={t.id} className="border border-rose-200 bg-rose-50 p-3 rounded-lg flex justify-between"><div className="truncate"><p className="text-xs font-bold text-rose-800">{t.descricao}</p></div><span className="font-bold text-rose-700 text-sm">{formatarMoeda(t.valorParcela)}</span></div>))}</div><button type="button" onClick={() => { modal.close(); processarRolagemPendencias(); }} className="w-full mt-4 bg-rose-600 text-white font-bold py-3 rounded-lg shadow cursor-pointer">Importar</button></div>, '⚠️ Pendências');
    }, [modal, pendenciasPassadas, mesReal, processarRolagemPendencias]);

    // =========================================================================
    // UI PREDITIVA E JANELAS DO DASHBOARD (Raio-X e Cards)
    // =========================================================================
    const abrirDetalhesCategoria = useCallback((nCat, vGasto, vMeta, tCat) => {
        const ts = transacoes.filter(t => t.categoria === nCat && t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano);
        if (ts.length === 0) return;

        const qtd = ts.length;
        const med = vGasto / qtd;
        const maior = ts.reduce((max, t) => Number(t.valorParcela) > Number(max.valorParcela) ? t : max, ts[0]);
        const menor = ts.reduce((min, t) => Number(t.valorParcela) < Number(min.valorParcela) ? t : min, ts[0]);

        let previsaoFimMes = vGasto;
        let analiseIA = "Análise preditiva disponível apenas para o mês atual.";

        if (dataVis.mes === dataHoje.getMonth() + 1 && dataVis.ano === dataHoje.getFullYear()) {
            const diasNoMes = new Date(dataVis.ano, dataVis.mes, 0).getDate();
            const diaHoje = dataHoje.getDate();
            previsaoFimMes = (vGasto / diaHoje) * diasNoMes;

            if (tCat === 'despesa' || tCat === 'Gasto' || tCat === 'gasto') {
                if (vGasto > vMeta) analiseIA = `🔴 Alerta! O limite de ${formatarMoeda(vMeta)} já foi estourado. Se mantiver o ritmo atual, fechará o mês com ${formatarMoeda(previsaoFimMes)} (gastando a mais ${formatarMoeda(previsaoFimMes - vMeta)}).`;
                else if (previsaoFimMes > vMeta) analiseIA = `⚠️ Cuidado! No ritmo atual, a previsão é fechar o mês com ${formatarMoeda(previsaoFimMes)}, estourando o limite de ${formatarMoeda(vMeta)} (gastando a mais ${formatarMoeda(previsaoFimMes - vMeta)}).`;
                else analiseIA = `✅ Ritmo controlado! A previsão é fechar o mês com ${formatarMoeda(previsaoFimMes)}, economizando ${formatarMoeda(vMeta - previsaoFimMes)} do seu limite de ${formatarMoeda(vMeta)}.`;
            } else {
                if (vGasto >= vMeta) analiseIA = `🏆 Meta alcançada! Você já atingiu os ${formatarMoeda(vMeta)}. Mantendo o ritmo, fechará o mês com ${formatarMoeda(previsaoFimMes)} (superando em ${formatarMoeda(previsaoFimMes - vMeta)}).`;
                else if (previsaoFimMes < vMeta) analiseIA = `⚠️ Ritmo lento! No ritmo atual, a previsão é guardar apenas ${formatarMoeda(previsaoFimMes)}, faltando ${formatarMoeda(vMeta - previsaoFimMes)} para atingir a sua meta de ${formatarMoeda(vMeta)}.`;
                else analiseIA = `✅ Excelente! A previsão é fechar o mês com ${formatarMoeda(previsaoFimMes)}, superando a sua meta de ${formatarMoeda(vMeta)} em ${formatarMoeda(previsaoFimMes - vMeta)}!`;
            }
        }

        const conteudo = (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Total Atual vs Meta</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatarMoeda(vGasto)} <span className="text-slate-400 font-normal">/</span></p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5">{formatarMoeda(vMeta)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Média por Lançamento</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatarMoeda(med)}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5">em {qtd}x</p>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase mb-2 flex items-center gap-1">🤖 Previsão Inteligente</p>
                    <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">{analiseIA}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-800/50">
                        <p className="text-[10px] uppercase text-rose-600 dark:text-rose-400 font-bold mb-1">Maior Valor</p>
                        <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{formatarMoeda(maior.valorParcela)}</p>
                        <p className="text-[9px] text-rose-500 dark:text-rose-400 mt-1 truncate" title={maior.descricao}>{new Date(maior.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {maior.descricao}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                        <p className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold mb-1">Menor Valor</p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatarMoeda(menor.valorParcela)}</p>
                        <p className="text-[9px] text-emerald-500 dark:text-emerald-400 mt-1 truncate" title={menor.descricao}>{new Date(menor.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {menor.descricao}</p>
                    </div>
                </div>
                {nCat === 'Gasolina' && nomeUsuario === 'stewart' && (
                    <button type="button" onClick={(e) => garagem.abrirCalendarioGasolina(e, dataVis.mes, dataVis.ano)} className="w-full mt-4 bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 text-white font-bold py-3 rounded-lg shadow-md cursor-pointer">
                        📅 Ajustar Dias Não Rodados
                    </button>
                )}
            </div>
        );
        modal.alert(conteudo, `Raio-X: ${nCat}`);
    }, [transacoes, dataVis, dataHoje, modal, nomeUsuario, garagem]);


    // =========================================================================
    // EXIBIÇÃO DE RELATÓRIO ANALÍTICO DOS CARDS SUPERIORES
    // =========================================================================
    const abrirResumoCard = useCallback((tipo) => {
        let conteudo;
        let titulo;

        if (tipo === 'rendas') {
            titulo = 'Detalhamento de Rendas';
            conteudo = (
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-700"><span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">Total Bruto do Mês</span><span className="font-bold text-slate-800 dark:text-slate-100">{formatarMoeda(totRendaTotal)}</span></div>
                    <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded border border-emerald-200 dark:border-emerald-800/50"><span className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm">✔ Já Recebido (Paga)</span><span className="font-bold text-emerald-800 dark:text-emerald-300">{formatarMoeda(totRendaPaga)}</span></div>
                    <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800/50"><span className="text-amber-700 dark:text-amber-400 font-semibold text-sm">⏳ A Receber (Pendente)</span><span className="font-bold text-amber-800 dark:text-amber-300">{formatarMoeda(totRendaPendente)}</span></div>
                </div>
            );
        }
        else if (tipo === 'gastos') {
            titulo = 'Detalhamento de Gastos (Despesas)';
            conteudo = (
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-700"><span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">Custo Total do Mês</span><span className="font-bold text-slate-800 dark:text-slate-100">{formatarMoeda(totGastoReal)}</span></div>
                    <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800/50"><span className="text-red-700 dark:text-red-400 font-semibold text-sm">✔ Já Descontado (Pago)</span><span className="font-bold text-red-800 dark:text-red-300">{formatarMoeda(totGastoPago)}</span></div>
                    <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800/50"><span className="text-amber-700 dark:text-amber-400 font-semibold text-sm">⏳ A Descontar (Pendente)</span><span className="font-bold text-amber-800 dark:text-amber-300">{formatarMoeda(totGastoPendente)}</span></div>
                </div>
            );
        }
        else if (tipo === 'investimentos') {
            titulo = 'Detalhamento de Investimentos';
            conteudo = (
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-700"><span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">Aportes Totais do Mês</span><span className="font-bold text-slate-800 dark:text-slate-100">{formatarMoeda(totInvestido)}</span></div>
                    <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800/50"><span className="text-blue-700 dark:text-blue-400 font-semibold text-sm">✔ Aportes Efetivados</span><span className="font-bold text-blue-800 dark:text-blue-300">{formatarMoeda(totInvestidoPago)}</span></div>
                    <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800/50"><span className="text-amber-700 dark:text-amber-400 font-semibold text-sm">⏳ Aportes Pendentes</span><span className="font-bold text-amber-800 dark:text-amber-300">{formatarMoeda(totInvestidoPendente)}</span></div>
                </div>
            );
        }
        else if (tipo === 'saldo') {
            titulo = 'Composição do Saldo em Conta';
            conteudo = (
                <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Este é o dinheiro real que deve estar no seu banco agora, considerando o que já sobrou e o que foi efetivamente pago neste mês.</p>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2"><span className="text-slate-600 dark:text-slate-300 text-sm">Rendas Pagas</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">+ {formatarMoeda(totRendaPaga)}</span></div>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2"><span className="text-slate-600 dark:text-slate-300 text-sm">Gastos Pagos</span><span className="text-red-600 dark:text-red-400 font-bold">- {formatarMoeda(totGastoPago)}</span></div>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2"><span className="text-slate-600 dark:text-slate-300 text-sm">Investimentos Efetivados</span><span className="text-blue-600 dark:text-blue-400 font-bold">- {formatarMoeda(totInvestidoPago)}</span></div>
                    {somarSaldoAnterior && (
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2"><span className="text-slate-600 dark:text-slate-300 text-sm">Saldo Mês Anterior</span><span className="text-indigo-600 dark:text-indigo-400 font-bold">{saldoMesAnterior >= 0 ? '+' : '-'} {formatarMoeda(Math.abs(saldoMesAnterior))}</span></div>
                    )}
                    <div className="flex justify-between items-center bg-slate-800 dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-700 mt-2">
                        <span className="text-slate-200 font-bold text-sm">Líquido na Conta</span><span className="font-bold text-white text-lg">{formatarMoeda(saldoAtual)}</span>
                    </div>
                </div>
            );
        }
        else if (tipo === 'previsao') {
            titulo = 'Composição da Previsão Fim Mês';
            conteudo = (
                <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Simulação inteligente: considera todo o seu teto orçamentário (metas estipuladas e contas fixas), abatendo da sua renda bruta para prever se sobrará dinheiro ou se você fechará o mês no negativo.</p>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2"><span className="text-slate-600 dark:text-slate-300 text-sm">Rendas (Pagas + Pendentes)</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">+ {formatarMoeda(totRendaTotal)}</span></div>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2"><span className="text-slate-600 dark:text-slate-300 text-sm">Custo de Vida Previsto (Teto)</span><span className="text-red-600 dark:text-red-400 font-bold">- {formatarMoeda(custoPrevisto)}</span></div>
                    {somarSaldoAnterior && (
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2"><span className="text-slate-600 dark:text-slate-300 text-sm">Acúmulo de Meses Anteriores</span><span className="text-indigo-600 dark:text-indigo-400 font-bold">{saldoMesAnterior >= 0 ? '+' : '-'} {formatarMoeda(Math.abs(saldoMesAnterior))}</span></div>
                    )}
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mt-2">
                        <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">Sobra Estimada no dia 31</span><span className={`font-bold text-lg ${previstoFimMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatarMoeda(previstoFimMes)}</span>
                    </div>
                </div>
            );
        }

        modal.alert(conteudo, titulo);
    }, [modal, totRendaTotal, totRendaPaga, totRendaPendente, totGastoReal, totGastoPago, totGastoPendente, totInvestido, totInvestidoPago, totInvestidoPendente, saldoAtual, saldoMesAnterior, somarSaldoAnterior, previstoFimMes, custoPrevisto]);

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