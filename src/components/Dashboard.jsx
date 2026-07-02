import React from 'react';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function Dashboard({
    dataVis, mesAnterior, mesProximo,
    totRendaPaga, totGastoReal, totInvestido, totFaturaCreditoAberto,
    saldoAtual, previstoFimMes, somarSaldoAnterior, setSomarSaldoAnterior,
    categorias, gCat, abrirDetalhesCategoria, pendenciasPassadas, abrirModalPendencias, abrirResumoCard,
    verFaturasPorCartao,
    transacoesMes = [],
    garagem = null,
    nomeUsuario = ''
}) {

    const isStewart = nomeUsuario?.toLowerCase() === 'stewart';

    const ultimosCinco = [...transacoesMes]
        .sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra))
        .slice(0, 5);

    const alertasGaragem = [];
    if (isStewart && garagem && garagem.veiculos && garagem.itens) {
        garagem.veiculos.forEach(veiculo => {
            if (veiculo.ativo === 0) return;

            const itensDoVeiculo = garagem.itens.filter(i => i.veiculo_id === veiculo.id);
            itensDoVeiculo.forEach(item => {
                const kmProximaTroca = Number(item.km_ultima_troca) + Number(item.intervalo_km);
                const kmRestante = kmProximaTroca - Number(veiculo.km_atual);

                if (kmRestante <= 500) {
                    alertasGaragem.push({
                        id: item.id,
                        veiculoNome: veiculo.modelo,
                        itemNome: item.nome,
                        kmRestante,
                        atrasado: kmRestante < 0
                    });
                }
            });
        });
    }

    return (
        <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto pb-24 relative">

            {/* ----------------------------------------------------------------------------------- */}
            {/* CABEÇALHO FIXO (STICKY HEADER COM EFEITO BLUR) */}
            {/* ----------------------------------------------------------------------------------- */}
            <div className="sticky top-0 z-40 pt-4 md:pt-6 pb-2 -mt-4 md:-mt-6 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm transition-colors">
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
            </div>

            {pendenciasPassadas.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-4 rounded-xl flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div><p className="text-sm font-bold text-rose-800 dark:text-rose-400">Você tem {pendenciasPassadas.length} conta(s) atrasada(s)!</p><p className="text-xs text-rose-600 dark:text-rose-500">Isso compromete a previsão analítica do seu saldo.</p></div>
                    </div>
                    <button type="button" onClick={abrirModalPendencias} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition cursor-pointer">Resolver</button>
                </div>
            )}

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

                <div onClick={verFaturasPorCartao} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-purple-400 transition group cursor-pointer">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-purple-500 transition">Faturas Abertas</p>
                    <h3 className="text-xl font-black text-purple-600 dark:text-purple-400">{formatarMoeda(totFaturaCreditoAberto)}</h3>
                </div>

                <div onClick={() => abrirResumoCard('saldo')} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-400 transition group flex flex-col justify-between">
                    <div className="flex justify-between items-start w-full mb-1">
                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition mt-1">Saldo Líquido</p>

                        <div
                            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm z-10 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            title="Somar saldo que sobrou do mês anterior?"
                        >
                            <input type="checkbox" checked={somarSaldoAnterior} onChange={(e) => setSomarSaldoAnterior(e.target.checked)} className="cursor-pointer w-3.5 h-3.5 accent-indigo-600" />
                            <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 select-none cursor-pointer whitespace-nowrap" onClick={() => setSomarSaldoAnterior(!somarSaldoAnterior)}>
                                + Mês Ant.
                            </span>
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{formatarMoeda(saldoAtual)}</h3>
                </div>

                <div onClick={() => abrirResumoCard('previsao')} className={`p-5 rounded-xl shadow-sm border cursor-pointer transition group ${previstoFimMes >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:border-red-400'}`}>
                    <p className={`text-[10px] uppercase font-bold mb-1 transition ${previstoFimMes >= 0 ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-700 dark:text-red-500'}`}>Previsão Mês</p>
                    <h3 className={`text-xl font-black ${previstoFimMes >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'}`}>{formatarMoeda(previstoFimMes)}</h3>
                </div>
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col ${isStewart ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">⏱️ Últimos Lançamentos</h3>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full font-bold uppercase tracking-wider">{nomesMeses[dataVis.mes - 1]}</span>
                    </div>

                    <div className="space-y-3 flex-1">
                        {ultimosCinco.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800/50 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors">
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{t.descricao}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mt-0.5 truncate">
                                        {new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} • {t.categoria}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end shrink-0">
                                    <p className={`font-bold text-sm ${t.tipo === 'renda' ? 'text-emerald-600 dark:text-emerald-400' : t.tipo === 'investimento' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {formatarMoeda(t.valorParcela)}
                                    </p>
                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded mt-1 inline-block ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                        {t.status}
                                    </span>
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

                {isStewart && (
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">🔧 Alertas do Veículo</h3>

                        {alertasGaragem.length === 0 ? (
                            <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl h-full flex flex-col items-center justify-center gap-2">
                                <span className="text-3xl">🚀</span>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Manutenção em dia!</p>
                            </div>
                        ) : (
                            <div className="space-y-3 flex-1">
                                {alertasGaragem.map((alerta, i) => (
                                    <div key={i} className={`p-4 rounded-xl border transition-colors ${alerta.atrasado ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{alerta.atrasado ? '🚨' : '⚠️'}</span>
                                            <p className={`font-bold text-sm truncate ${alerta.atrasado ? 'text-rose-800 dark:text-rose-400' : 'text-amber-800 dark:text-amber-400'}`} title={alerta.itemNome}>{alerta.itemNome}</p>
                                        </div>
                                        <p className={`text-xs font-semibold truncate ${alerta.atrasado ? 'text-rose-600 dark:text-rose-500' : 'text-amber-700 dark:text-amber-500'}`}>
                                            {alerta.veiculoNome}
                                        </p>
                                        <p className={`text-[10px] uppercase font-black mt-3 inline-block px-2 py-1 rounded-md shadow-sm ${alerta.atrasado ? 'bg-rose-600 text-white dark:bg-rose-500' : 'bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-900'}`}>
                                            {alerta.atrasado ? `Atrasado ${Math.abs(alerta.kmRestante)} KM` : `Troca em ${alerta.kmRestante} KM`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}