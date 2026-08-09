import React from 'react';
import { AlertasDashboard } from './AlertasDashboard';

/**
 * @function formatarMoeda
 * @description Converte um número para o padrão monetário BRL.
 * @param {number|string} valor 
 * @returns {string} Valor formatado em Reais.
 */
const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/**
 * @file src/components/Dashboard.jsx
 * @description Componente principal do sistema. Exibe KPIs financeiros, progresso de metas, 
 * lista de últimos lançamentos e alertas preditivos (contas e garagem).
 * @version Mobile-Optimized
 */
export function Dashboard({
    dataVis, mesAnterior, mesProximo,
    totRendaPaga, totGastoReal, totInvestido, totFaturaCreditoAberto,
    saldoAtual, previstoFimMes, somarSaldoAnterior, setSomarSaldoAnterior,
    categorias, gCat, abrirDetalhesCategoria, pendenciasPassadas, abrirModalPendencias, abrirResumoCard,
    verFaturasPorCartao, transacoesMes = [], transacoesGlobais = [], cartoes = [], dividas = [], garagem = null, temGaragem = false
}) {

    const ultimosCinco = [...transacoesMes]
        .sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra))
        .slice(0, 5);

    // Lógica de Extração de Alertas da Garagem (para quem tiver o módulo liberado)
    const alertasGaragem = [];
    if (temGaragem && garagem && garagem.veiculosGaragem && garagem.itensGaragem) {
        garagem.veiculosGaragem.forEach(veiculo => {
            if (veiculo.ativo === 0) return;
            const itensDoVeiculo = garagem.itensGaragem.filter(i => i.veiculo_id === veiculo.id);
            itensDoVeiculo.forEach(item => {
                const kmProximaTroca = Number(item.km_ultima_troca) + Number(item.intervalo_km);
                const kmRestante = kmProximaTroca - Number(veiculo.km_atual);
                if (kmRestante <= 500) {
                    alertasGaragem.push({ id: item.id, veiculoNome: veiculo.modelo, itemNome: item.nome, kmRestante, atrasado: kmRestante < 0 });
                }
            });
        });
    }

    const showGarageAlerts = temGaragem && alertasGaragem.length > 0;

    // Filtra apenas categorias que possuem meta maior que zero para exibir no Dashboard
    const categoriasEstrategicas = categorias.filter(c => Number(c.meta) > 0);

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 animate-fade-in relative">

            {/* 🌟 CABEÇALHO PADRÃO (SÓLIDO E ROLÁVEL) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        📊 Painel Executivo
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Resumo financeiro de {nomesMeses[dataVis.mes - 1]} de {dataVis.ano}
                    </p>
                </div>
                {/* 🔥 MOBILE FIX: Áreas de toque maiores nos botões do mês e padding ajustado */}
                <div className="w-full md:w-auto shrink-0 flex items-center justify-between md:justify-end bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button type="button" onClick={mesAnterior} className="p-3 md:p-2 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer touch-manipulation">◀</button>
                    <span className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-sm px-4 text-center shrink-0">{nomesMeses[dataVis.mes - 1]} {dataVis.ano}</span>
                    <button type="button" onClick={mesProximo} className="p-3 md:p-2 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer touch-manipulation">▶</button>
                </div>
            </div>

            {/* 🔥 MOBILE FIX: Empilhamento inteligente em telas menores usando flex-col sm:flex-row */}
            {pendenciasPassadas.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">⚠️</span>
                        <div>
                            <p className="text-sm font-bold text-rose-800 dark:text-rose-400">Você tem {pendenciasPassadas.length} conta(s) atrasada(s)!</p>
                            <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">Isso compromete a previsão analítica do seu saldo.</p>
                        </div>
                    </div>
                    <button type="button" onClick={abrirModalPendencias} className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow transition cursor-pointer">Resolver</button>
                </div>
            )}

            {/* 🔥 MOBILE FIX: Paddings reduzidos (p-4 md:p-5) e gaps otimizados para encaixar melhor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 md:gap-4">
                <div onClick={() => abrirResumoCard('rendas', cartoes)} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition group active:scale-[0.98]">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-emerald-500 transition">Rendas Pagas</p>
                    <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatarMoeda(totRendaPaga)}</h3>
                </div>
                <div onClick={() => abrirResumoCard('gastos', cartoes)} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-red-400 dark:hover:border-red-500 transition group active:scale-[0.98]">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-red-500 transition">Gastos (Real)</p>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{formatarMoeda(totGastoReal)}</h3>
                </div>
                <div onClick={() => abrirResumoCard('investimentos', cartoes)} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 transition group active:scale-[0.98]">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-blue-500 transition">Investimentos</p>
                    <h3 className="text-xl font-black text-blue-600 dark:text-blue-400">{formatarMoeda(totInvestido)}</h3>
                </div>
                <div onClick={verFaturasPorCartao} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-purple-400 transition group cursor-pointer active:scale-[0.98]">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-purple-500 transition">Faturas Abertas</p>
                    <h3 className="text-xl font-black text-purple-600 dark:text-purple-400">{formatarMoeda(totFaturaCreditoAberto)}</h3>
                </div>
                <div onClick={() => abrirResumoCard('saldo', cartoes)} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-400 transition group flex flex-col justify-between active:scale-[0.98]">
                    <div className="flex justify-between items-start w-full mb-1">
                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition mt-1">Saldo Líquido</p>
                        {/* 🔥 MOBILE FIX: Checkbox com touch target expandido indiretamente */}
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm z-10 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={somarSaldoAnterior} onChange={(e) => setSomarSaldoAnterior(e.target.checked)} className="cursor-pointer w-4 h-4 accent-indigo-600" />
                            <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 select-none cursor-pointer whitespace-nowrap" onClick={() => setSomarSaldoAnterior(!somarSaldoAnterior)}>+ Mês Ant.</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{formatarMoeda(saldoAtual)}</h3>
                </div>
                <div onClick={() => abrirResumoCard('previsao', cartoes)} className={`p-4 md:p-5 rounded-xl shadow-sm border cursor-pointer transition group active:scale-[0.98] ${previstoFimMes >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:border-red-400'}`}>
                    <p className={`text-[10px] uppercase font-bold mb-1 transition ${previstoFimMes >= 0 ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-700 dark:text-red-500'}`}>Previsão Mês</p>
                    <h3 className={`text-xl font-black ${previstoFimMes >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'}`}>{formatarMoeda(previstoFimMes)}</h3>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-5 md:mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 md:pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">🎯 Progresso Estratégico</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Acompanhamento das categorias com Teto de Gastos ou Alvo Mensal definidos.</p>
                    </div>
                </div>

                {categoriasEstrategicas.length === 0 ? (
                    <div className="text-center py-8 md:py-10 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <span className="text-3xl opacity-50 mb-2 block">🏷️</span>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Nenhuma meta estratégica definida.</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 px-4">Vá na aba "Categorias" e crie uma categoria com valor maior que zero para rastreá-la aqui.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {categoriasEstrategicas.map(c => {
                            const gasto = gCat[c.nome] || 0;
                            let pct = c.meta > 0 ? (gasto / c.meta) * 100 : 0;
                            if (pct > 100) pct = 100;

                            let corBarra = "bg-blue-500";
                            if (c.tipo === 'despesa') {
                                if (pct < 50) corBarra = "bg-emerald-500";
                                else if (pct < 85) corBarra = "bg-amber-500";
                                else corBarra = "bg-rose-500";
                            } else {
                                if (pct >= 100) corBarra = "bg-emerald-500";
                                else if (pct > 50) corBarra = "bg-blue-500";
                                else corBarra = "bg-slate-400 dark:bg-slate-600";
                            }

                            return (
                                <div key={c.id} onClick={() => abrirDetalhesCategoria(c.nome, gasto, c.meta, c.tipo)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-lg cursor-pointer hover:shadow-md transition hover:-translate-y-0.5 active:scale-[0.98]">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate pr-2">{c.nome}</p>
                                        <span className="text-[10px] font-black text-slate-500 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm">{Math.round(pct)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden shadow-inner">
                                        <div className={`${corBarra} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatarMoeda(gasto)}</span>
                                        <span className="text-slate-400">{formatarMoeda(c.meta)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <AlertasDashboard transacoesMes={transacoesMes} transacoesGlobais={transacoesGlobais} cartoes={cartoes} dividas={dividas} dataVis={dataVis} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-xl shadow-sm flex flex-col ${showGarageAlerts ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <div className="flex justify-between items-center mb-4 border-b border-transparent md:border-slate-100 md:dark:border-slate-800 md:pb-2">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">⏱️ Últimos Lançamentos</h3>
                        <span className="text-[10px] sm:text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{nomesMeses[dataVis.mes - 1]}</span>
                    </div>
                    <div className="space-y-3 flex-1">
                        {ultimosCinco.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800/50 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors">
                                <div className="flex-1 min-w-0 pr-3">
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{t.descricao}</p>
                                    <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mt-0.5 truncate">
                                        {new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} • {t.categoria}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end shrink-0">
                                    <p className={`font-bold text-sm ${t.tipo === 'renda' ? 'text-emerald-600 dark:text-emerald-400' : t.tipo === 'investimento' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{formatarMoeda(t.valorParcela)}</p>
                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded mt-1 inline-block ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{t.status}</span>
                                </div>
                            </div>
                        ))}
                        {ultimosCinco.length === 0 && (
                            <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl h-full flex items-center justify-center">
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum lançamento registrado nesta competência.</p>
                            </div>
                        )}
                    </div>
                </div>

                {showGarageAlerts && (
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-xl shadow-sm flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">🔧 Alertas do Veículo</h3>
                        <div className="space-y-3 flex-1">
                            {alertasGaragem.map((alerta, i) => (
                                <div key={i} className={`p-4 rounded-xl border transition-colors ${alerta.atrasado ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{alerta.atrasado ? '🚨' : '⚠️'}</span>
                                        <p className={`font-bold text-sm truncate ${alerta.atrasado ? 'text-rose-800 dark:text-rose-400' : 'text-amber-800 dark:text-amber-400'}`} title={alerta.itemNome}>{alerta.itemNome}</p>
                                    </div>
                                    <p className={`text-xs font-semibold truncate ${alerta.atrasado ? 'text-rose-600 dark:text-rose-500' : 'text-amber-700 dark:text-amber-500'}`}>{alerta.veiculoNome}</p>
                                    <p className={`text-[10px] uppercase font-black mt-3 inline-block px-2 py-1 rounded-md shadow-sm ${alerta.atrasado ? 'bg-rose-600 text-white dark:bg-rose-500' : 'bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-900'}`}>{alerta.atrasado ? `Atrasado ${Math.abs(alerta.kmRestante)} KM` : `Troca em ${alerta.kmRestante} KM`}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}