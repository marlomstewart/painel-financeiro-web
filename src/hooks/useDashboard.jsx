import React, { useState, useMemo, useCallback } from 'react';
import { ehPagamentoCredito, resolverCartao } from '../utils/cartaoUtils';
import { obterDesdeISO } from '../utils/janelaTransacoes';
import { calcularFluxoProjetado } from '../utils/fluxoProjetado';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const getMeuValor = (t) => {
    const vp = Number(t.valorParcela);
    if (!t.isThirdParty) return vp;
    const vt = t.thirdPartyValue !== null && t.thirdPartyValue !== undefined ? Number(t.thirdPartyValue) : vp;
    return Math.max(0, vp - vt);
};

// Caixa real: enquanto o terceiro não devolveu, o dinheiro inteiro saiu da conta. Depois da
// devolução, só a sua fração continua pesando no saldo. Esta regra precisa ser idêntica tanto
// no mês visível quanto no saldo histórico carregado para o mês seguinte.
const getValorParaConta = (t) => {
    const valorIntegral = Number(t.valorParcela);
    return (t.isThirdParty && t.terceiro_recebido) ? getMeuValor(t) : valorIntegral;
};

const ehRenda = (t) => t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa';
const dataISO = (valor) => {
    const texto = String(valor || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : null;
};
const fimDaCompetenciaISO = (mes, ano) => `${ano}-${String(mes).padStart(2, '0')}-${String(new Date(ano, mes, 0).getDate()).padStart(2, '0')}`;
const inicioDaCompetenciaISO = (mes, ano) => `${ano}-${String(mes).padStart(2, '0')}-01`;
const arredondarCentavos = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100;

// 🔥 FUNÇÃO BLINDADA: Detecta se é um empréstimo oriundo do módulo de dívidas
const isDividaTerceiro = (t) => {
    // Motor atual (desde a correcao de 10/08): marca divida de terceiro via isThirdParty,
    // nao mais via categoria. Mantido restrito a categoria de dividas para nao capturar
    // compras normais divididas com alguem (split de restaurante, etc), que tambem usam isThirdParty.
    if (t.isThirdParty && t.thirdPartyName && t.categoria === 'Dívidas e Empréstimos') return true;
    if (!t.categoria) return false;
    // Compatibilidade com lancamentos antigos, gerados antes da correcao, que usavam essa categoria.
    return t.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'divida de terceiros';
};

const resumirMovimentosDeCaixa = (itens) => itens.reduce((resumo, t) => {
    if (isDividaTerceiro(t) || t.status !== 'pago') return resumo;
    const valor = getValorParaConta(t);
    if (ehRenda(t) || t.tipo === 'reembolso') resumo.rendas += valor;
    else if (t.tipo === 'investimento') resumo.investimentos += valor;
    else resumo.gastos += valor;
    return resumo;
}, { rendas: 0, gastos: 0, investimentos: 0 });

// 🔥 NOVO: Componente Acordeão Interno (Para faturas agrupadas)
const InnerAcordeao = ({ grupo }) => {
    const [aberto, setAberto] = useState(false);
    return (
        <div className="border border-slate-200/50 dark:border-slate-700/50 rounded my-1.5 bg-slate-100/50 dark:bg-slate-900/50 overflow-hidden shadow-sm">
            <div 
                className="flex justify-between items-center py-2 px-2.5 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={(e) => { e.stopPropagation(); setAberto(!aberto); }}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[10px] opacity-70 text-slate-600 dark:text-slate-400">{aberto ? '▼' : '▶'}</span>
                    <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 truncate">{grupo.descricao}</span>
                </div>
                <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 shrink-0">{grupo.valorStr}</span>
            </div>
            {aberto && (
                <div className="px-3 pb-2 space-y-1 mt-1 border-t border-slate-200/50 dark:border-slate-700/50 pt-1.5 bg-white/30 dark:bg-black/20">
                    {grupo.itens.map(subItem => (
                         <div key={subItem.id} className="flex justify-between items-center py-1 border-b border-slate-200/30 dark:border-slate-700/30 last:border-0 pl-1">
                             <div className="flex flex-col overflow-hidden">
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate pr-2" title={subItem.descricao}>{subItem.descricao}</span>
                                <span className="text-[9px] text-slate-400">{subItem.data}</span>
                             </div>
                             <span className={`text-[11px] font-bold shrink-0 ${subItem.isDestaque ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{subItem.isDestaque ? '+' : ''}{subItem.valorStr}</span>
                         </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const RowAcordeao = ({ titulo, valorStr, textColor, itens, sinal = '' }) => {
    const [aberto, setAberto] = useState(false);
    return (
        <div className="border-b border-slate-200 dark:border-slate-700">
            <div 
                className="flex justify-between items-center py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded transition-colors"
                onClick={() => setAberto(!aberto)}
                title="Clique para ver os lançamentos"
            >
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] opacity-70 ${textColor}`}>{aberto ? '▼' : '▶'}</span>
                    <span className="text-slate-600 dark:text-slate-300 text-sm select-none font-medium">{titulo}</span>
                </div>
                <span className={`font-bold select-none ${textColor}`}>{sinal} {valorStr}</span>
            </div>
            {aberto && (
                <div className="pb-2 px-2 space-y-1 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 rounded mt-1">
                     {itens.length === 0 ? <p className="text-[10px] text-center text-slate-500 py-2">Nenhum lançamento gerou este valor.</p> : itens.map(item => (
                         item.isGrupo ? (
                             <InnerAcordeao key={item.id} grupo={item} />
                         ) : (
                             <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-slate-200/50 dark:border-slate-700/50 last:border-0">
                                 <div className="flex flex-col overflow-hidden">
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate pr-2" title={item.descricao}>{item.descricao}</span>
                                    <span className="text-[9px] text-slate-500">{item.data}</span>
                                 </div>
                                 <span className={`text-[11px] font-bold shrink-0 ${item.isDestaque ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>{item.isDestaque ? '+' : ''}{item.valorStr}</span>
                             </div>
                         )
                     ))}
                </div>
            )}
        </div>
    )
}

const CardAcordeao = ({ titulo, valorStr, textColor, bgColor, borderColor, itens, sinal = '' }) => {
    const [aberto, setAberto] = useState(false);
    return (
        <div className={`rounded border ${borderColor} ${bgColor} overflow-hidden transition-all`}>
            <div 
                className="flex justify-between items-center p-3 cursor-pointer hover:brightness-95 transition-all"
                onClick={() => setAberto(!aberto)}
                title="Clique para ver os lançamentos"
            >
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] opacity-70 ${textColor}`}>{aberto ? '▼' : '▶'}</span>
                    <span className={`font-semibold text-sm select-none ${textColor}`}>{titulo}</span>
                </div>
                <span className={`font-bold select-none ${textColor}`}>{sinal}{valorStr}</span>
            </div>
            {aberto && (
                <div className="bg-white/50 dark:bg-slate-950/30 border-t border-black/5 dark:border-white/5 p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                     {itens.length === 0 ? <p className="text-[10px] text-center text-slate-500 py-2">Nenhum lançamento gerou este valor.</p> : itens.map(item => (
                         item.isGrupo ? (
                             <InnerAcordeao key={item.id} grupo={item} />
                         ) : (
                             <div key={item.id} className="flex justify-between items-center py-1.5 px-1 border-b border-slate-200/50 dark:border-slate-700/50 last:border-0">
                                 <div className="flex flex-col overflow-hidden">
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate pr-2" title={item.descricao}>{item.descricao}</span>
                                    <span className="text-[9px] text-slate-500">{item.data}</span>
                                 </div>
                                 <span className={`text-[11px] font-bold shrink-0 ${item.isDestaque ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{item.isDestaque ? '+' : ''}{item.valorStr}</span>
                             </div>
                         )
                     ))}
                </div>
            )}
        </div>
    )
}

/**
 * @file src/hooks/useDashboard.jsx
 */
export function useDashboard({ transacoes, setTransacoes, transacoesMes, categorias, dataVis, setDataVis, modal, API, getHeaders, temGaragem = false, garagem, cartoes = [], showToast, rendasFixas = [], contasFixas = [], dividas = [], saldoConciliado = null, saldoCaixaCanonico = null }) {

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
            if (isDividaTerceiro(t)) return; // IGNORA DÍVIDAS DE TERCEIROS NO SALDO HISTÓRICO
            
            const valorParaConta = getValorParaConta(t);
            if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') {
                if (t.status === 'pago') rendaPaga += valorParaConta;
            }
            else if (t.tipo === 'reembolso') {
                if (t.status === 'pago') gastoPago -= valorParaConta;
            }
            else {
                if (t.status === 'pago') gastoPago += valorParaConta;
            }
        });
        return rendaPaga - gastoPago;
    }, [transacoes]);

    const mesAntRef = useMemo(() => dataVis.mes === 1 ? { mes: 12, ano: dataVis.ano - 1 } : { mes: dataVis.mes - 1, ano: dataVis.ano }, [dataVis]);
    const marcoSaldoConciliado = useMemo(() => {
        const valor = Number(saldoConciliado?.valor);
        const data = dataISO(saldoConciliado?.data);
        return Number.isFinite(valor) && data ? { valor, data } : null;
    }, [saldoConciliado]);

    const dataInicioMesVisivel = inicioDaCompetenciaISO(dataVis.mes, dataVis.ano);
    const dataFimMesVisivel = fimDaCompetenciaISO(dataVis.mes, dataVis.ano);
    const marcoAplicaNoMes = Boolean(marcoSaldoConciliado && dataFimMesVisivel >= marcoSaldoConciliado.data);
    const marcoFoiInformadoNoMes = Boolean(marcoSaldoConciliado && marcoSaldoConciliado.data >= dataInicioMesVisivel && marcoSaldoConciliado.data <= dataFimMesVisivel);

    const dataDeCaixa = useCallback((t) => dataISO(t.data_pagamento) || dataISO(t.dataCompra), []);
    const calcularSaldoComMarcoAte = useCallback((mes, ano) => {
        if (!marcoSaldoConciliado) return null;
        const fim = fimDaCompetenciaISO(mes, ano);
        if (fim < marcoSaldoConciliado.data) return null;
        const movimentos = transacoes.filter(t => {
            const data = dataDeCaixa(t);
            return t.status === 'pago' && data && data > marcoSaldoConciliado.data && data <= fim;
        });
        const resumo = resumirMovimentosDeCaixa(movimentos);
        return arredondarCentavos(marcoSaldoConciliado.valor + resumo.rendas - resumo.gastos - resumo.investimentos);
    }, [marcoSaldoConciliado, transacoes, dataDeCaixa]);

    const mudarOrdenacao = useCallback((coluna) => {
        setOrdenacao(prev => ({ coluna, direcao: prev.coluna === coluna ? (prev.direcao === 'asc' ? 'desc' : 'asc') : 'asc' }));
    }, []);

    // Tabela: Deixamos TUDO visível aqui, para você ver os empréstimos e poder clicar em "Pago"
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

    let rendaPagaConta = 0, gastoPagoConta = 0, investidoPagoConta = 0;
    let totFaturaCreditoAberto = 0;
    let totRendaTotal = 0, totRendaPaga = 0, totRendaPendente = 0;
    let totGastoReal = 0, totGastoPago = 0, totGastoPendente = 0;
    let totInvestido = 0, totInvestidoPago = 0, totInvestidoPendente = 0;
    let gCat = {}; categorias.forEach(c => gCat[c.nome] = 0);
    let gastoSemCategoria = 0, gastoContasFixas = 0;

    transacoesMes.forEach(t => {
        // --- 1. MATEMÁTICA DO BANCO (Lê o valor total da nota) ---
        if (!isDividaTerceiro(t)) {
            const valorTotalIntegral = Number(t.valorParcela);

            if (ehPagamentoCredito(t.formaPagamento) && t.status === 'pendente') {
                if (t.tipo === 'reembolso') totFaturaCreditoAberto -= valorTotalIntegral;
                else if (t.tipo !== 'renda' && t.tipo !== 'investimento') totFaturaCreditoAberto += valorTotalIntegral;
            }

            if (t.status === 'pago') {
                // Se a parte do terceiro já foi devolvida (terceiro_recebido), só a sua fração
                // pesa no saldo real — senão, conta o valor cheio (o dinheiro saiu da conta
                // inteiro, mesmo que parte dele ainda esteja pra receber de volta).
                const valorParaConta = getValorParaConta(t);

                if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') rendaPagaConta += valorParaConta;
                else if (t.tipo === 'investimento') investidoPagoConta += valorParaConta;
                else if (t.tipo === 'reembolso') gastoPagoConta -= valorParaConta;
                else gastoPagoConta += valorParaConta;
            }
        }

        // --- 2. MATEMÁTICA DO ORÇAMENTO (Lê apenas a sua fração) ---
        if (isDividaTerceiro(t)) return; // IGNORA NO ORÇAMENTO

        const meuValor = getMeuValor(t);
        if (meuValor === 0) return; // Se for compra normal marcada como 100% terceiro, também ignora no orçamento.

        if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') {
            totRendaTotal += meuValor;
            if (t.status === 'pago') totRendaPaga += meuValor;
            else totRendaPendente += meuValor;
        }
        else {
            if (t.tipo === 'investimento') {
                totInvestido += meuValor;
                if (t.status === 'pago') totInvestidoPago += meuValor;
                else totInvestidoPendente += meuValor;
                
                if (t.categoria === 'Contas Fixas') gastoContasFixas += meuValor;
                else if (t.categoria === 'Sem Categoria' || gCat[t.categoria] === undefined) gastoSemCategoria += meuValor;
                else gCat[t.categoria] += meuValor;
            }
            else if (t.tipo === 'reembolso') {
                totGastoReal -= meuValor;
                if (t.status === 'pago') totGastoPago -= meuValor;
                else totGastoPendente -= meuValor; // Reembolso pendente abate do gasto pendente
                
                if (t.categoria === 'Contas Fixas') gastoContasFixas -= meuValor;
                else if (t.categoria === 'Sem Categoria' || gCat[t.categoria] === undefined) gastoSemCategoria -= meuValor;
                else gCat[t.categoria] -= meuValor;
            }
            else if (t.tipo === 'despesa') {
                totGastoReal += meuValor;
                if (t.status === 'pago') totGastoPago += meuValor;
                else totGastoPendente += meuValor;
                
                if (t.categoria === 'Contas Fixas') gastoContasFixas += meuValor;
                else if (t.categoria === 'Sem Categoria' || gCat[t.categoria] === undefined) gastoSemCategoria += meuValor;
                else gCat[t.categoria] += meuValor;
            }
        }
    });

    const competenciaPlano = `${dataVis.ano}-${String(dataVis.mes).padStart(2, '0')}`;
    const planoCombustivel = temGaragem && garagem?.planoMes?.competencia === competenciaPlano ? garagem.planoMes : null;
    const categoriasDinamicas = useMemo(() => {
        return categorias.map(c => c.id === planoCombustivel?.config.categoriaId
            ? { ...c, meta: planoCombustivel.resumo.planejadoCentavos / 100, planejamentoCombustivel: true } : c);
    }, [categorias, planoCombustivel]);

    let metaNaoComprometida = 0;
    categoriasDinamicas.forEach(c => {
        metaNaoComprometida += c.planejamentoCombustivel ? planoCombustivel.resumo.restanteCentavos / 100
            : Math.max(0, c.meta - (gCat[c.nome] || 0));
    });

    const transacoesDoCaixaNoMes = marcoAplicaNoMes
        ? transacoes.filter(t => {
            const data = dataDeCaixa(t);
            return t.status === 'pago' && data && data > marcoSaldoConciliado.data && data >= dataInicioMesVisivel && data <= dataFimMesVisivel;
        })
        : transacoesMes;
    const resumoCaixaNoMes = marcoAplicaNoMes ? resumirMovimentosDeCaixa(transacoesDoCaixaNoMes) : null;

    if (resumoCaixaNoMes) {
        rendaPagaConta = resumoCaixaNoMes.rendas;
        gastoPagoConta = resumoCaixaNoMes.gastos;
        investidoPagoConta = resumoCaixaNoMes.investimentos;
    }

    const saldoMesAnteriorLegado = useMemo(
        () => calcularSaldoAcumuladoAte(mesAntRef.mes, mesAntRef.ano),
        [calcularSaldoAcumuladoAte, mesAntRef]
    );
    const saldoMesAnteriorComMarco = useMemo(
        () => calcularSaldoComMarcoAte(mesAntRef.mes, mesAntRef.ano),
        [calcularSaldoComMarcoAte, mesAntRef]
    );
    const saldoMesAnterior = saldoMesAnteriorComMarco ?? saldoMesAnteriorLegado;
    const saldoMesAtual = rendaPagaConta - (gastoPagoConta + investidoPagoConta);
    const saldoAtualComMarco = marcoAplicaNoMes ? calcularSaldoComMarcoAte(dataVis.mes, dataVis.ano) : null;
    const saldoAtual = marcoAplicaNoMes && saldoCaixaCanonico?.ate === dataFimMesVisivel && Number.isFinite(Number(saldoCaixaCanonico?.valor))
        ? Number(saldoCaixaCanonico.valor)
        : (saldoAtualComMarco ?? (saldoMesAtual + (somarSaldoAnterior ? saldoMesAnterior : 0)));
    const despesasFuturas = totGastoPendente + totInvestidoPendente + metaNaoComprometida;
    const previstoFimMes = saldoAtual + totRendaPendente - despesasFuturas;

    // Fluxo de caixa projetado: usa o previsto de fim do mês atual como ponto de partida do
    // acumulado dos próximos 6 meses, com base só no que é recorrente/conhecido (rendas fixas,
    // contas fixas, parcelas de dívida restantes) — não prevê gastos avulsos ainda não lançados.
    const fluxoProjetado = useMemo(() => calcularFluxoProjetado({
        mesAtual: dataVis.mes, anoAtual: dataVis.ano, horizonteMeses: 6, saldoInicial: previstoFimMes,
        rendasFixas, contasFixas, dividas, cartoes, transacoes
    }), [dataVis.mes, dataVis.ano, previstoFimMes, rendasFixas, contasFixas, dividas, cartoes, transacoes]);

    const abrirDetalheMesProjetado = useCallback((mesProjetado) => {
        const { mes, ano, renda, contas, dividasParcelas, net, saldoAcumulado, detalhes } = mesProjetado;

        const linhaItem = (nome, valor, cor) => (
            <div key={nome} className="flex justify-between items-center text-sm py-1">
                <span className="text-slate-600 dark:text-slate-300 truncate pr-2">{nome}</span>
                <strong className={cor}>{formatarMoeda(valor)}</strong>
            </div>
        );

        const conteudo = (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                        <p className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold mb-1">Renda prevista</p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatarMoeda(renda)}</p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-800/50">
                        <p className="text-[10px] uppercase text-rose-600 dark:text-rose-400 font-bold mb-1">Contas + Dívidas</p>
                        <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{formatarMoeda(contas + dividasParcelas)}</p>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase mb-1">Saldo acumulado projetado</p>
                    <p className={`text-xl font-black ${saldoAcumulado >= 0 ? 'text-blue-900 dark:text-blue-200' : 'text-rose-700 dark:text-rose-400'}`}>{formatarMoeda(saldoAcumulado)}</p>
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-1">Resultado do mês: {net >= 0 ? '+' : ''}{formatarMoeda(net)}</p>
                </div>
                {detalhes.rendas.length > 0 && (
                    <div>
                        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">Rendas fixas</p>
                        {detalhes.rendas.map(r => linhaItem(r.nome, r.valor, 'text-emerald-600 dark:text-emerald-400'))}
                    </div>
                )}
                {detalhes.contas.length > 0 && (
                    <div>
                        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">Contas fixas</p>
                        {detalhes.contas.map(c => linhaItem(c.nome, c.valor, 'text-rose-600 dark:text-rose-400'))}
                    </div>
                )}
                {detalhes.dividas.length > 0 && (
                    <div>
                        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">Parcelas de dívidas</p>
                        {detalhes.dividas.map((d, i) => linhaItem(`${d.nome} (#${i + 1})`, d.valor, 'text-rose-600 dark:text-rose-400'))}
                    </div>
                )}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    Projeção baseada só no que já é recorrente/conhecido — não prevê gastos avulsos que você ainda vai lançar no dia a dia.
                </p>
            </div>
        );

        modal.alert(conteudo, `Projeção: ${nomesMeses[mes - 1]}/${ano}`);
    }, [modal]);

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
            const resT = await fetch(`${API}/transacoes?desde=${obterDesdeISO()}`, { headers: getHeaders() });
            if (resT.ok) { setTransacoes(await resT.json()); setDataVis({ mes: mesReal, ano: anoReal }); showToast('Pendências importadas!', 'success'); }
        } catch (err) { showToast('Erro de conexão.', 'error'); }
    }, [API, getHeaders, showToast, pendenciasPassadas, setTransacoes, setDataVis, anoReal, mesReal, dataHoje]);

    const abrirModalPendencias = useCallback(() => {
        modal.alert(<div className="space-y-3"><p className="text-sm"><b>{pendenciasPassadas.length}</b> pendência(s) antiga(s). Deseja importar para {nomesMeses[mesReal - 1]}?</p><div className="max-h-60 overflow-y-auto space-y-2 pr-2">{pendenciasPassadas.map(t => (<div key={t.id} className="border border-rose-200 bg-rose-50 p-3 rounded-lg flex justify-between"><div className="truncate"><p className="text-xs font-bold text-rose-800">{t.descricao}</p></div><span className="font-bold text-rose-700 text-sm">{formatarMoeda(t.valorParcela)}</span></div>))}</div><button type="button" onClick={() => { modal.close(); processarRolagemPendencias(); }} className="w-full mt-4 bg-rose-600 text-white font-bold py-3 rounded-lg shadow cursor-pointer">Importar</button></div>, '⚠️ Pendências');
    }, [modal, pendenciasPassadas, mesReal, processarRolagemPendencias]);

    const abrirDetalhesCategoria = useCallback((nCat, vGasto, vMeta, tCat) => {
        const ts = transacoes
            .filter(t => !isDividaTerceiro(t) && t.categoria === nCat && t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano && getMeuValor(t) > 0)
            .sort((a, b) => String(b.dataCompra || '').localeCompare(String(a.dataCompra || '')));

        const qtd = ts.length;
        const med = qtd > 0 ? vGasto / qtd : 0;
        
        const maior = qtd > 0 ? ts.reduce((max, t) => getMeuValor(t) > getMeuValor(max) ? t : max, ts[0]) : null;
        const menor = qtd > 0 ? ts.reduce((min, t) => getMeuValor(t) < getMeuValor(min) ? t : min, ts[0]) : null;

        let previsaoFimMesCat = vGasto;
        let analiseIA = "Análise preditiva disponível apenas para o mês atual.";

        const usaPlanoCombustivel = planoCombustivel?.categoriaNome === nCat;
        if (usaPlanoCombustivel) {
            previsaoFimMesCat = planoCombustivel.resumo.previstoCentavos / 100;
            analiseIA = `Previsão pelo planejamento: ${formatarMoeda(previsaoFimMesCat)} no mês. São ${formatarMoeda(planoCombustivel.resumo.registradoCentavos / 100)} já lançados na categoria e ${formatarMoeda(planoCombustivel.resumo.restanteCentavos / 100)} ainda a reservar. Abastecimentos vinculados ao Extrato não são contados novamente.`;
        } else if (dataVis.mes === dataHoje.getMonth() + 1 && dataVis.ano === dataHoje.getFullYear()) {
            const diasNoMes = new Date(dataVis.ano, dataVis.mes, 0).getDate();
            const diaHoje = dataHoje.getDate();
            previsaoFimMesCat = (vGasto / diaHoje) * diasNoMes;

            if (tCat === 'despesa' || tCat === 'Gasto' || tCat === 'gasto') {
                if (vGasto > vMeta) analiseIA = `🔴 Alerta! O limite de ${formatarMoeda(vMeta)} já foi estourado. Se mantiver o ritmo atual, fechará o mês com ${formatarMoeda(previsaoFimMesCat)} (gastando a mais ${formatarMoeda(previsaoFimMesCat - vMeta)}).`;
                else if (previsaoFimMesCat > vMeta) analiseIA = `⚠️ Cuidado! No ritmo atual, a previsão é fechar o mês com ${formatarMoeda(previsaoFimMesCat)}, estourando o limite de ${formatarMoeda(vMeta)} (gastando a mais ${formatarMoeda(previsaoFimMesCat - vMeta)}).`;
                else analiseIA = `✅ Ritmo controlado! A previsão é fechar o mês com ${formatarMoeda(previsaoFimMesCat)}, economizando ${formatarMoeda(vMeta - previsaoFimMesCat)} do seu limite de ${formatarMoeda(vMeta)}.`;
            } else {
                if (vGasto >= vMeta) analiseIA = `🏆 Meta alcançada! Você já atingiu os ${formatarMoeda(vMeta)}. Mantendo o ritmo, fechará o mês com ${formatarMoeda(previsaoFimMesCat)} (superando em ${formatarMoeda(previsaoFimMesCat - vMeta)}).`;
                else if (previsaoFimMesCat < vMeta) analiseIA = `⚠️ Ritmo lento! No ritmo atual, a previsão é guardar apenas ${formatarMoeda(previsaoFimMesCat)}, faltando ${formatarMoeda(vMeta - previsaoFimMesCat)} para atingir a sua meta de ${formatarMoeda(vMeta)}.`;
                else analiseIA = `✅ Excelente! A previsão é fechar o mês com ${formatarMoeda(previsaoFimMesCat)}, superando a sua meta de ${formatarMoeda(vMeta)} em ${formatarMoeda(previsaoFimMesCat - vMeta)}!`;
            }
        }

        const conteudo = (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Seu Total Atual vs Meta</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatarMoeda(vGasto)} <span className="text-slate-400 font-normal">/</span></p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5">{formatarMoeda(vMeta)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Média do Seu Gasto</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatarMoeda(med)}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5">em {qtd} {qtd === 1 ? 'transação' : 'transações'}</p>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase mb-2 flex items-center gap-1">🤖 Previsão Inteligente</p>
                    <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">{analiseIA}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-800/50">
                        <p className="text-[10px] uppercase text-rose-600 dark:text-rose-400 font-bold mb-1">Maior Gasto (Seu)</p>
                        {maior ? <>
                            <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{formatarMoeda(getMeuValor(maior))}</p>
                            <p className="text-[9px] text-rose-500 dark:text-rose-400 mt-1 truncate" title={maior.descricao}>{new Date(maior.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {maior.descricao}</p>
                        </> : <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Nenhum gasto no período.</p>}
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                        <p className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold mb-1">Menor Gasto (Seu)</p>
                        {menor ? <>
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatarMoeda(getMeuValor(menor))}</p>
                            <p className="text-[9px] text-emerald-500 dark:text-emerald-400 mt-1 truncate" title={menor.descricao}>{new Date(menor.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {menor.descricao}</p>
                        </> : <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Nenhum gasto no período.</p>}
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">Lançamentos desta categoria</p>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{qtd} {qtd === 1 ? 'lançamento' : 'lançamentos'}</span>
                    </div>
                    {qtd > 0 ? (
                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                            {ts.map(t => (
                                <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200" title={t.descricao}>{t.descricao}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} · {t.status === 'pago' ? 'Pago' : 'Pendente'}</p>
                                    </div>
                                    <span className="shrink-0 text-sm font-bold text-slate-800 dark:text-slate-100">{formatarMoeda(getMeuValor(t))}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">Nenhum lançamento nesta categoria no período.</p>
                    )}
                </div>
                {temGaragem && (usaPlanoCombustivel || (!planoCombustivel?.categoriaNome && nCat === 'Gasolina')) && (
                    <button type="button" onClick={(e) => garagem?.abrirCalendarioGasolina(e, dataVis.mes, dataVis.ano)} className="w-full mt-4 bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 text-white font-bold py-3 rounded-lg shadow-md cursor-pointer">
                        📅 Planejar abastecimentos do veículo
                    </button>
                )}
            </div>
        );
        modal.alert(conteudo, `Raio-X: ${nCat}`);
    }, [transacoes, dataVis, dataHoje, modal, temGaragem, garagem, planoCombustivel]);

    // 🔥 CORREÇÃO: A função agora exige que os cartões sejam passados direto do Dashboard (cartoesExternos)
    const abrirResumoCard = useCallback((tipo, cartoesExternos = []) => {
        let conteudo;
        let titulo;

        const mapAgrupado = (list, useMeuValor = true) => {
            const grupos = {};
            const itensSoltos = [];

            list.forEach(t => {
                const ehCredito = ehPagamentoCredito(t.formaPagamento);
                let valorCalculado = useMeuValor ? getMeuValor(t) : Number(t.valorParcela);
                const isReembolso = t.tipo === 'reembolso';
                
                const itemFormatado = {
                    id: t.id,
                    data: new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }),
                    descricao: t.descricao,
                    valor: isReembolso ? -valorCalculado : valorCalculado,
                    valorStr: formatarMoeda(valorCalculado),
                    isDestaque: isReembolso
                };

                if (ehCredito) {
                    if (!grupos[t.formaPagamento]) {
                        // 🔥 Busca o cartão na lista externa que veio direto do Dashboard
                        const cartao = resolverCartao(t.formaPagamento, cartoesExternos);
                        const nomeCartao = cartao ? cartao.nome : 'Cartão Excluído/Desconhecido';
                        
                        grupos[t.formaPagamento] = {
                            id: `grupo_${t.formaPagamento}`,
                            isGrupo: true,
                            descricao: `💳 Fatura ${nomeCartao}`,
                            valor: 0,
                            valorStr: '',
                            itens: []
                        };
                    }
                    grupos[t.formaPagamento].itens.push(itemFormatado);
                    grupos[t.formaPagamento].valor += itemFormatado.valor;
                } else {
                    itensSoltos.push(itemFormatado);
                }
            });

            const gruposArray = Object.values(grupos).map(g => {
                g.valorStr = formatarMoeda(Math.abs(g.valor));
                return g;
            });

            return [...gruposArray, ...itensSoltos].sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));
        };

        const listRendaPagaConta = transacoesDoCaixaNoMes.filter(t => !isDividaTerceiro(t) && t.status === 'pago' && ehRenda(t));
        const listGastoPagoConta = transacoesDoCaixaNoMes.filter(t => !isDividaTerceiro(t) && t.status === 'pago' && !ehRenda(t) && t.tipo !== 'investimento');
        const listInvestidoPagoConta = transacoesDoCaixaNoMes.filter(t => !isDividaTerceiro(t) && t.status === 'pago' && t.tipo === 'investimento');

        const listRendaPagaMeu = transacoesMes.filter(t => !isDividaTerceiro(t) && t.status === 'pago' && (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') && getMeuValor(t) > 0);
        const listRendaPendenteMeu = transacoesMes.filter(t => !isDividaTerceiro(t) && t.status === 'pendente' && (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') && getMeuValor(t) > 0);
        const listGastoPagoMeu = transacoesMes.filter(t => !isDividaTerceiro(t) && t.status === 'pago' && (t.tipo === 'despesa' || t.tipo === 'reembolso') && getMeuValor(t) > 0);
        const listGastoPendenteMeu = transacoesMes.filter(t => !isDividaTerceiro(t) && t.status === 'pendente' && (t.tipo === 'despesa' || t.tipo === 'reembolso') && getMeuValor(t) > 0);
        const listInvestidoPagoMeu = transacoesMes.filter(t => !isDividaTerceiro(t) && t.status === 'pago' && t.tipo === 'investimento' && getMeuValor(t) > 0);
        const listInvestidoPendenteMeu = transacoesMes.filter(t => !isDividaTerceiro(t) && t.status === 'pendente' && t.tipo === 'investimento' && getMeuValor(t) > 0);

        const ultimoDiaDoMes = new Date(dataVis.ano, dataVis.mes, 0).getDate();

        if (tipo === 'rendas') {
            titulo = 'Detalhamento de Rendas';
            conteudo = (
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">Total Bruto do Mês</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{formatarMoeda(totRendaTotal)}</span>
                    </div>
                    <CardAcordeao titulo="✔ Já Recebido (Paga)" valorStr={formatarMoeda(totRendaPaga)} textColor="text-emerald-800 dark:text-emerald-300" bgColor="bg-emerald-50 dark:bg-emerald-900/20" borderColor="border-emerald-200 dark:border-emerald-800/50" itens={mapAgrupado(listRendaPagaMeu, true)} />
                    <CardAcordeao titulo="⏳ A Receber (Pendente)" valorStr={formatarMoeda(totRendaPendente)} textColor="text-amber-800 dark:text-amber-300" bgColor="bg-amber-50 dark:bg-amber-900/20" borderColor="border-amber-200 dark:border-amber-800/50" itens={mapAgrupado(listRendaPendenteMeu, true)} />
                </div>
            );
        } 
        else if (tipo === 'gastos') {
            titulo = 'Detalhamento de Gastos (Despesas)';
            conteudo = (
                <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Gastos de terceiros e Reembolsos já foram abatidos da sua fração para exibir o seu custo real de vida.</p>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">Custo Líquido do Mês (Sua Parte)</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{formatarMoeda(totGastoReal)}</span>
                    </div>
                    <CardAcordeao titulo="✔ Já Descontado (Pago)" valorStr={formatarMoeda(Math.abs(totGastoPago))} textColor={totGastoPago >= 0 ? 'text-red-800 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-400'} bgColor="bg-red-50 dark:bg-red-900/20" borderColor="border-red-200 dark:border-red-800/50" sinal={totGastoPago >= 0 ? '' : '+ '} itens={mapAgrupado(listGastoPagoMeu, true)} />
                    <CardAcordeao titulo="⏳ A Descontar (Pendente)" valorStr={formatarMoeda(Math.abs(totGastoPendente))} textColor={totGastoPendente >= 0 ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400'} bgColor="bg-amber-50 dark:bg-amber-900/20" borderColor="border-amber-200 dark:border-amber-800/50" sinal={totGastoPendente >= 0 ? '' : '+ '} itens={mapAgrupado(listGastoPendenteMeu, true)} />
                </div>
            );
        }
        else if (tipo === 'investimentos') {
            titulo = 'Detalhamento de Investimentos';
            conteudo = (
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">Aportes Totais do Mês</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{formatarMoeda(totInvestido)}</span>
                    </div>
                    <CardAcordeao titulo="✔ Aportes Efetivados" valorStr={formatarMoeda(totInvestidoPago)} textColor="text-blue-800 dark:text-blue-300" bgColor="bg-blue-50 dark:bg-blue-900/20" borderColor="border-blue-200 dark:border-blue-800/50" itens={mapAgrupado(listInvestidoPagoMeu, true)} />
                    <CardAcordeao titulo="⏳ Aportes Pendentes" valorStr={formatarMoeda(totInvestidoPendente)} textColor="text-amber-800 dark:text-amber-300" bgColor="bg-amber-50 dark:bg-amber-900/20" borderColor="border-amber-200 dark:border-amber-800/50" itens={mapAgrupado(listInvestidoPendenteMeu, true)} />
                </div>
            );
        }
        else if (tipo === 'saldo') {
            titulo = 'Composição do Saldo em Conta';
            conteudo = (
                <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Este é o dinheiro real que deve estar no seu banco agora, considerando o que já sobrou e o que foi efetivamente pago neste mês.</p>
                    <RowAcordeao titulo="Rendas Pagas" valorStr={formatarMoeda(rendaPagaConta)} textColor="text-emerald-600 dark:text-emerald-400" sinal="+" itens={mapAgrupado(listRendaPagaConta, false)} />
                    <RowAcordeao titulo="Gastos Pagos (Totais)" valorStr={formatarMoeda(Math.abs(gastoPagoConta))} textColor={gastoPagoConta >= 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'} sinal={gastoPagoConta >= 0 ? '-' : '+'} itens={mapAgrupado(listGastoPagoConta, false)} />
                    <RowAcordeao titulo="Investimentos Efetivados" valorStr={formatarMoeda(Math.abs(investidoPagoConta))} textColor={investidoPagoConta >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'} sinal={investidoPagoConta >= 0 ? '-' : '+'} itens={mapAgrupado(listInvestidoPagoConta, false)} />
                    {marcoFoiInformadoNoMes ? (
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2">
                            <span className="text-slate-600 dark:text-slate-300 text-sm">Saldo conciliado em {new Date(`${marcoSaldoConciliado.data}T12:00:00`).toLocaleDateString('pt-BR')}</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{marcoSaldoConciliado.valor >= 0 ? '+' : '-'} {formatarMoeda(Math.abs(marcoSaldoConciliado.valor))}</span>
                        </div>
                    ) : somarSaldoAnterior && (
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2">
                            <span className="text-slate-600 dark:text-slate-300 text-sm">Saldo Mês Anterior</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{saldoMesAnterior >= 0 ? '+' : '-'} {formatarMoeda(Math.abs(saldoMesAnterior))}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center bg-slate-800 dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-700 mt-2">
                        <span className="text-slate-200 font-bold text-sm">Líquido na Conta</span>
                        <span className="font-bold text-white text-lg">{formatarMoeda(saldoAtual)}</span>
                    </div>
                </div>
            );
        }
        else if (tipo === 'previsao') {
            titulo = 'Composição da Previsão Fim Mês';
            
            conteudo = (
                <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Simulação estrita baseada no seu <b>caixa real atual</b>. Considera o dinheiro vivo que você tem nas mãos hoje e subtrai tudo o que ainda falta pagar ou atingir nas suas metas.</p>
                    
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2">
                        <span className="text-slate-600 dark:text-slate-300 text-sm">Saldo Líquido Atual</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{saldoAtual >= 0 ? '+' : '-'} {formatarMoeda(Math.abs(saldoAtual))}</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2">
                        <span className="text-slate-600 dark:text-slate-300 text-sm">Rendas Pendentes (A Receber)</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">+ {formatarMoeda(totRendaPendente)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2">
                        <span className="text-slate-600 dark:text-slate-300 text-sm">Despesas Pendentes a Pagar</span>
                        <span className="text-red-600 dark:text-red-400 font-bold">- {formatarMoeda(Math.abs(totGastoPendente) + Math.abs(totInvestidoPendente))}</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2">
                        <span className="text-slate-600 dark:text-slate-300 text-sm">Verba Restante das Metas</span>
                        <span className="text-orange-600 dark:text-orange-400 font-bold">- {formatarMoeda(Math.abs(metaNaoComprometida))}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mt-2">
                        <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">Sobra Estimada no dia {ultimoDiaDoMes}</span>
                        <span className={`font-bold text-lg ${previstoFimMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatarMoeda(previstoFimMes)}</span>
                    </div>
                </div>
            );
        }

        modal.alert(conteudo, titulo);
    }, [modal, dataVis, totRendaTotal, totRendaPaga, totRendaPendente, totGastoReal, totGastoPago, totGastoPendente, totInvestido, totInvestidoPago, totInvestidoPendente, saldoAtual, saldoMesAnterior, somarSaldoAnterior, previstoFimMes, metaNaoComprometida, rendaPagaConta, gastoPagoConta, investidoPagoConta, transacoesMes, transacoesDoCaixaNoMes, marcoFoiInformadoNoMes, marcoSaldoConciliado]);

    return {
        buscaTexto, setBuscaTexto, filtroStatus, setFiltroStatus, ordenacao, setOrdenacao,
        mostrarFiltrosAvancados, setMostrarFiltrosAvancados, filtrosAvancados, setFiltrosAvancados, somarSaldoAnterior, setSomarSaldoAnterior,
        mesAnterior, mesProximo, mudarOrdenacao, dadosTabela, 
        totRendaPaga, totGastoReal, totInvestido, totFaturaCreditoAberto,
        saldoMesAnterior, saldoAtual, saldoMesAtual, mesAntRef, previstoFimMes, fluxoProjetado,
        categoriasDinamicas, gCat, pendenciasPassadas,
        abrirModalPendencias, abrirDetalhesCategoria, abrirResumoCard, abrirDetalheMesProjetado
    };
}
