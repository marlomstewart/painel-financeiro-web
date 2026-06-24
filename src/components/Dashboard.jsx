import React from 'react';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function Dashboard({
    dataVis, mesAnterior, mesProximo,
    totRendaPaga, totGastoReal, totInvestido, totFaturaCreditoAberto,
    saldoAtual, previstoFimMes, somarSaldoAnterior, setSomarSaldoAnterior,
    categorias, gCat, abrirDetalhesCategoria, pendenciasPassadas, abrirModalPendencias, abrirResumoCard
}) {

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto pb-24">

            {/* HEAD & CONTROLES TÊMPORO-ESPACIAIS */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Painel Executivo</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Resumo financeiro de {nomesMeses[dataVis.mes - 1]} de {dataVis.ano}</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button type="button" onClick={mesAnterior} className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-800 rounded shadow-sm text-slate-600 dark:text-slate-300 transition cursor-pointer">◀</button>
                    <span className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-sm w-32 text-center">{nomesMeses[dataVis.mes - 1]} {dataVis.ano}</span>
                    <button type="button" onClick={mesProximo} className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-800 rounded shadow-sm text-slate-600 dark:text-slate-300 transition cursor-pointer">▶</button>
                </div>
            </div>

            {/* AVISOS DO SISTEMA */}
            {pendenciasPassadas.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-4 rounded-xl flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div><p className="text-sm font-bold text-rose-800 dark:text-rose-400">Você tem {pendenciasPassadas.length} conta(s) atrasada(s) de meses anteriores!</p><p className="text-xs text-rose-600 dark:text-rose-500">Isso compromete a previsão analítica do seu saldo.</p></div>
                    </div>
                    <button type="button" onClick={abrirModalPendencias} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition cursor-pointer">Resolver</button>
                </div>
            )}

            {/* PAINEL DE CARDS (MÉTRICAS CORE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
                <div onClick={() => abrirResumoCard('rendas')} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition group">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-emerald-500 transition">Rendas Pagas</p>
                    <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatarMoeda(totRendaPaga)}</h3>
                </div>

                <div onClick={() => abrirResumoCard('gastos')} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-red-400 dark:hover:border-red-500 transition group">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-red-500 transition">Gastos (Real)</p>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{formatarMoeda(totGastoReal)}</h3>
                </div>

                <div onClick={() => abrirResumoCard('investimentos')} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 transition group">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-blue-500 transition">Investimentos</p>
                    <h3 className="text-xl font-black text-blue-600 dark:text-blue-400">{formatarMoeda(totInvestido)}</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-purple-400 transition group">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-purple-500 transition">Faturas Abertas</p>
                    <h3 className="text-xl font-black text-purple-600 dark:text-purple-400">{formatarMoeda(totFaturaCreditoAberto)}</h3>
                </div>

                <div onClick={() => abrirResumoCard('saldo')} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-400 transition group relative">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-indigo-500 transition">Saldo Líquido</p>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{formatarMoeda(saldoAtual)}</h3>
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        <input type="checkbox" checked={somarSaldoAnterior} onChange={(e) => { e.stopPropagation(); setSomarSaldoAnterior(e.target.checked); }} className="cursor-pointer scale-75" title="Somar Mês Anterior?" />
                        <span className="text-[8px] font-bold text-slate-500">Mês Ant.</span>
                    </div>
                </div>

                <div onClick={() => abrirResumoCard('previsao')} className={`p-5 rounded-xl shadow-sm border cursor-pointer transition group ${previstoFimMes >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:border-red-400'}`}>
                    <p className={`text-[10px] uppercase font-bold mb-1 transition ${previstoFimMes >= 0 ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-700 dark:text-red-500'}`}>Previsão Mês</p>
                    <h3 className={`text-xl font-black ${previstoFimMes >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'}`}>{formatarMoeda(previstoFimMes)}</h3>
                </div>
            </div>

            {/* PAINEL DE METAS E CATEGORIAS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">🎯 Progresso Estratégico</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Clique na categoria para Inteligência Preditiva</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categorias.map(c => {
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
                            <div key={c.id} onClick={() => abrirDetalhesCategoria(c.nome, gasto, c.meta, c.tipo)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-lg cursor-pointer hover:shadow-md transition hover:-translate-y-0.5">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate pr-2">{c.nome}</p>
                                    <span className="text-[10px] font-black text-slate-500 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">{Math.round(pct)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                                    <div className={`${corBarra} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatarMoeda(gasto)}</span>
                                    <span className="text-slate-400">{formatarMoeda(c.meta)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {categorias.length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <p className="text-slate-500 dark:text-slate-400">Nenhuma meta tática configurada no Setup.</p>
                    </div>
                )}
            </div>
        </div>
    );
}