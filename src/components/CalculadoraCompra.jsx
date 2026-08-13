import React, { useState, useMemo } from 'react';
import { useInvestimentos } from '../hooks/useInvestimentos';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * @function formatarMoeda
 * @description Formatação segura de valores financeiros para BRL.
 */
const formatarMoeda = (valor) => {
    const v = Number(valor);
    return (isNaN(v) ? 0 : v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Tabela oficial de IOF do Governo (mesma referência usada no simulador de curto prazo de Investimentos)
const TABELA_IOF = [100, 96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3];

/**
 * @file src/components/CalculadoraCompra.jsx
 * @description Simulador de custo de oportunidade: compara pagar à vista com parcelar e deixar
 * o valor à vista rendendo (CDI) pelo prazo do parcelamento.
 */
export function CalculadoraCompra({ API, getHeaders, modal }) {
    const { dashboardData, loading } = useInvestimentos({ API, getHeaders, modal });

    const [precoAVistaStr, setPrecoAVistaStr] = useState('50000'); // R$ 500,00
    const precoAVista = Number(precoAVistaStr) / 100;

    const [valorParcelaStr, setValorParcelaStr] = useState('5500'); // R$ 55,00
    const valorParcela = Number(valorParcelaStr) / 100;

    const [numParcelas, setNumParcelas] = useState(10);
    const [caixinhaId, setCaixinhaId] = useState('base');

    const resultado = useMemo(() => {
        if (!dashboardData || !dashboardData.taxas || precoAVista <= 0 || valorParcela <= 0 || numParcelas <= 0) return null;

        const cdiAnual = dashboardData.taxas.cdiAnual;
        let percentualCdi = 100;
        if (caixinhaId !== 'base') {
            const caixinha = dashboardData.caixinhas.find(c => c.id === caixinhaId);
            if (caixinha) percentualCdi = Number(caixinha.percentual_cdi);
        }

        const totalParcelado = valorParcela * numParcelas;
        const diasCorridos = numParcelas * 30; // Aproximação: uma parcela por mês

        const taxaAnualDecimal = (cdiAnual * (percentualCdi / 100)) / 100;
        const taxaDiaria = Math.pow(1 + taxaAnualDecimal, 1 / 252) - 1;
        const diasUteis = Math.floor(diasCorridos * (252 / 365));

        const valorBruto = precoAVista * Math.pow(1 + taxaDiaria, diasUteis);
        const lucroBruto = valorBruto - precoAVista;

        let taxaIof = 0;
        if (diasCorridos < 30) taxaIof = TABELA_IOF[diasCorridos] / 100;
        const valorIof = lucroBruto * taxaIof;
        const lucroPosIof = lucroBruto - valorIof;

        let taxaIr = 0.225;
        if (diasCorridos > 180 && diasCorridos <= 360) taxaIr = 0.20;
        else if (diasCorridos > 360 && diasCorridos <= 720) taxaIr = 0.175;
        else if (diasCorridos > 720) taxaIr = 0.15;

        const valorIr = lucroPosIof * taxaIr;
        const lucroLiquido = lucroPosIof - valorIr;
        const valorLiquidoFinal = precoAVista + lucroLiquido;

        const diferenca = valorLiquidoFinal - totalParcelado;
        const compensaParcelar = diferenca > 0;

        return { totalParcelado, diasCorridos, lucroLiquido, valorLiquidoFinal, diferenca, compensaParcelar };
    }, [dashboardData, precoAVista, valorParcela, numParcelas, caixinhaId]);

    if (loading || !dashboardData) {
        return (
            <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Sincronizando com a B3 / BCB...</h2>
                <p className="text-sm text-slate-500">Buscando a taxa de CDI atual para simular o rendimento</p>
            </div>
        );
    }

    const { caixinhas } = dashboardData;

    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3.5 md:p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors shadow-sm";
    const labelCls = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 md:mb-1";

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-5xl mx-auto pb-24 animate-fade-in">

            <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Calculator className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">À Vista ou Parcelado?</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Compara pagar à vista com parcelar e deixar o dinheiro rendendo no seu CDB.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-8 rounded-3xl shadow-sm transition-colors">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

                    <div className="lg:col-span-3 space-y-5 bg-slate-50 dark:bg-slate-950 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                            <label className={labelCls}>Preço à Vista (R$)</label>
                            <input
                                type="text" inputMode="numeric"
                                value={precoAVista.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                onChange={(e) => { let val = e.target.value.replace(/\D/g, ''); if (!val) val = '0'; setPrecoAVistaStr(val); }}
                                className={`${inputCls} text-blue-700 dark:text-blue-400`}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Valor da Parcela (R$)</label>
                                <input
                                    type="text" inputMode="numeric"
                                    value={valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    onChange={(e) => { let val = e.target.value.replace(/\D/g, ''); if (!val) val = '0'; setValorParcelaStr(val); }}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Número de Parcelas</label>
                                <input
                                    type="number" min="1" max="48" step="1"
                                    value={numParcelas}
                                    onChange={(e) => setNumParcelas(Math.max(1, Math.min(48, Number(e.target.value) || 1)))}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Rendimento a considerar</label>
                            <select
                                value={caixinhaId}
                                onChange={(e) => setCaixinhaId(e.target.value)}
                                className={`${inputCls} cursor-pointer`}
                            >
                                <option value="base">Padrão da Economia: 100% do CDI</option>
                                {caixinhas.map(cx => (
                                    <option key={cx.id} value={cx.id}>
                                        {cx.instituicao} - {cx.nome_caixinha} ({cx.percentual_cdi}% do CDI)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                            Estimativa: considera a taxa de CDI atual e uma parcela por mês (~30 dias entre elas).
                            A taxa real pode variar até o fim do parcelamento.
                        </p>
                    </div>

                    <div className={`lg:col-span-2 p-6 rounded-2xl border relative overflow-hidden h-full flex flex-col justify-center ${resultado?.compensaParcelar
                        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-950/40 border-emerald-200 dark:border-emerald-800/50'
                        : 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-950/40 border-rose-200 dark:border-rose-800/50'
                        }`}>
                        {!resultado ? (
                            <p className="text-sm text-center text-slate-500 dark:text-slate-400">Preencha os valores para simular.</p>
                        ) : (
                            <>
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    {resultado.compensaParcelar ? (
                                        <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                                    ) : (
                                        <TrendingDown className="w-6 h-6 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                                    )}
                                    <p className={`text-lg font-black tracking-tight ${resultado.compensaParcelar ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                        {resultado.compensaParcelar ? 'Melhor Parcelar' : 'Melhor à Vista'}
                                    </p>
                                </div>

                                <p className="text-xs text-center text-slate-600 dark:text-slate-400 font-medium mb-5 leading-relaxed">
                                    {resultado.compensaParcelar
                                        ? <>Se você parcelar e deixar os {formatarMoeda(precoAVista)} rendendo, em {numParcelas}x você ganha <strong>{formatarMoeda(resultado.diferenca)}</strong> a mais do que pagando à vista.</>
                                        : <>Se você parcelar e deixar os {formatarMoeda(precoAVista)} rendendo, em {numParcelas}x ainda assim você perde <strong>{formatarMoeda(Math.abs(resultado.diferenca))}</strong> em relação à vista.</>
                                    }
                                </p>

                                <div className="flex justify-between items-center mb-2.5 pb-2.5 border-b border-slate-300/50 dark:border-slate-700/50">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Parcelado</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatarMoeda(resultado.totalParcelado)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2.5 pb-2.5 border-b border-slate-300/50 dark:border-slate-700/50">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">À Vista Rendendo ({resultado.diasCorridos}d)</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatarMoeda(resultado.valorLiquidoFinal)}</span>
                                </div>

                                <div className="text-center mt-5">
                                    <p className={`text-[10px] uppercase font-black tracking-wider mb-1 ${resultado.compensaParcelar ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                                        Diferença Final
                                    </p>
                                    <p className={`text-3xl md:text-4xl font-black tracking-tight ${resultado.compensaParcelar ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                        {resultado.compensaParcelar ? '+' : '-'}{formatarMoeda(Math.abs(resultado.diferenca))}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
