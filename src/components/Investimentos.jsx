import React, { useState, useMemo } from 'react';
import { useInvestimentos } from '../hooks/useInvestimentos';
import { useBolsa } from '../hooks/useBolsa';
import { LineChart, Timer, Hourglass, Rocket, Landmark, Plus, Trash2, ArrowDownToLine, AlertTriangle, Building2 } from 'lucide-react';

/**
 * @function formatarMoeda
 * @description Formatação segura de valores financeiros para BRL.
 */
const formatarMoeda = (valor) => {
    const v = Number(valor);
    return (isNaN(v) ? 0 : v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Tabela oficial de IOF do Governo para simulações client-side
const TABELA_IOF = [100, 96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3];

/**
 * @file src/components/Investimentos.jsx
 * @description Módulo de gestão de Renda Fixa (CDBs), simuladores de curto/longo prazo e cálculos tributários (IR/IOF).
 */
export function Investimentos({ API, getHeaders, modal }) {
    const { dashboardData, loading, criarCaixinha, criarAporte, excluirCaixinha, excluirAporte } = useInvestimentos({ API, getHeaders, modal });
    const bolsa = useBolsa({ API, getHeaders, modal });

    const [abaAtiva, setAbaAtiva] = useState('renda_fixa');

    // 🎛️ Estados para o Simulador de Longo Prazo
    const [metaSimulador, setMetaSimulador] = useState(100000);
    const [aporteSimulador, setAporteSimulador] = useState(500);
    const [caixinhaSimuladorId, setCaixinhaSimuladorId] = useState('base');

    // 🎛️ Estados para a Calculadora de Promoções (Curto Prazo)
    const dataPadraoFuturo = new Date();
    dataPadraoFuturo.setMonth(dataPadraoFuturo.getMonth() + 1);

    const [simCurtoValorStr, setSimCurtoValorStr] = useState('500000'); // Equivale a R$ 5.000,00
    const simCurtoValor = Number(simCurtoValorStr) / 100;

    const [simCurtoTaxa, setSimCurtoTaxa] = useState(150);
    const [simCurtoData, setSimCurtoData] = useState(dataPadraoFuturo.toISOString().split('T')[0]);

    const simulacao = useMemo(() => {
        if (!dashboardData || !dashboardData.taxas) return { anos: 0, meses: 0, investido: 0, juros: 0, taxaUsada: 100 };

        const cdiAnual = dashboardData.taxas.cdiAnual;
        let percentualCdiSimulador = 100;
        let nomeReferencia = 'Taxa Selic Base';

        if (caixinhaSimuladorId !== 'base') {
            const caixinhaEscolhida = dashboardData.caixinhas.find(c => c.id === caixinhaSimuladorId);
            if (caixinhaEscolhida) {
                percentualCdiSimulador = Number(caixinhaEscolhida.percentual_cdi);
                nomeReferencia = caixinhaEscolhida.nome_caixinha;
            }
        }

        const taxaAnualEfetiva = cdiAnual * (percentualCdiSimulador / 100);
        const taxaMensal = Math.pow(1 + (taxaAnualEfetiva / 100), 1 / 12) - 1;
        const nMeses = Math.log((metaSimulador * taxaMensal / aporteSimulador) + 1) / Math.log(1 + taxaMensal);
        const totalMeses = Math.ceil(nMeses);

        if (isNaN(totalMeses) || totalMeses <= 0 || totalMeses > 1200) {
            return { anos: '+99', meses: 0, investido: metaSimulador, juros: 0, taxaUsada: percentualCdiSimulador, nomeReferencia };
        }

        const anos = Math.floor(totalMeses / 12);
        const meses = totalMeses % 12;
        const investido = totalMeses * aporteSimulador;
        const juros = metaSimulador - investido;

        return { anos, meses, investido, juros, taxaUsada: percentualCdiSimulador, nomeReferencia };
    }, [metaSimulador, aporteSimulador, caixinhaSimuladorId, dashboardData]);

    const simulacaoCurto = useMemo(() => {
        if (!dashboardData || !dashboardData.taxas || !simCurtoData || simCurtoValor <= 0) {
            return { valorBruto: 0, lucroBruto: 0, iof: 0, ir: 0, valorLiquido: 0, lucroLiquido: 0, diasCorridos: 0, erro: false };
        }

        const cdiAnual = dashboardData.taxas.cdiAnual;
        const dataResgate = new Date(`${simCurtoData}T12:00:00`);
        const hoje = new Date();
        hoje.setHours(12, 0, 0, 0);

        if (dataResgate <= hoje) {
            return { valorBruto: simCurtoValor, lucroBruto: 0, iof: 0, ir: 0, valorLiquido: simCurtoValor, lucroLiquido: 0, diasCorridos: 0, erro: true };
        }

        const diffMilisegundos = Math.abs(dataResgate - hoje);
        const diasCorridos = Math.floor(diffMilisegundos / (1000 * 60 * 60 * 24));
        const diasUteis = Math.floor(diasCorridos * (252 / 365));

        const taxaAnualDecimal = (cdiAnual * (simCurtoTaxa / 100)) / 100;
        const taxaDiaria = Math.pow(1 + taxaAnualDecimal, 1 / 252) - 1;

        const valorBruto = simCurtoValor * Math.pow(1 + taxaDiaria, diasUteis);
        const lucroBruto = valorBruto - simCurtoValor;

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

        return { valorBruto, lucroBruto, iof: valorIof, ir: valorIr, valorLiquido: simCurtoValor + lucroLiquido, lucroLiquido, diasCorridos, erro: false };
    }, [simCurtoValor, simCurtoTaxa, simCurtoData, dashboardData]);

    const handleNovaCaixinha = async () => {
        const banco = await modal.prompt('Passo 1 de 3 — Nome da Instituição/Corretora?', '', 'Nova Caixinha', { placeholder: 'Ex: Nubank, Inter', confirmLabel: 'Próximo' });
        if (!banco) return;

        const nome = await modal.prompt('Passo 2 de 3 — Nome/Apelido deste Investimento?', '', 'Nova Caixinha', { placeholder: 'Ex: Caixinha Turbo, Reserva', confirmLabel: 'Próximo' });
        if (!nome) return;

        const taxa = await modal.prompt('Passo 3 de 3 — Percentual do CDI? (Apenas números)', '100', 'Nova Caixinha', { inputType: 'number', confirmLabel: 'Criar' });
        if (!taxa || isNaN(Number(taxa))) return modal.alert('Taxa inválida.');

        criarCaixinha(banco, nome, Number(taxa));
    };

    const handleNovoAporte = async (caixinhaId, nomeCaixinha) => {
        const valor = await modal.prompt(`Qual o valor do aporte para "${nomeCaixinha}"?`, '', 'Novo Aporte', { inputType: 'currency', confirmLabel: 'Próximo' });
        if (!valor || valor <= 0) return;

        const dataAporte = await modal.prompt(`Qual foi a data deste aporte?`, new Date().toISOString().split('T')[0], 'Novo Aporte', { inputType: 'date', confirmLabel: 'Registrar' });
        if (!dataAporte) return;

        criarAporte(caixinhaId, valor, dataAporte);
    };

    const handleResgate = async (caixinhaId, nomeCaixinha, saldoTotal) => {
        const valor = await modal.prompt(`Quanto deseja resgatar? Seu saldo livre de impostos é de ${formatarMoeda(saldoTotal)}.`, '', `Resgatar de ${nomeCaixinha}`, { inputType: 'currency', confirmLabel: 'Próximo' });
        if (!valor || valor <= 0) return;

        if (valor > saldoTotal) {
            return modal.alert(`Você não pode resgatar ${formatarMoeda(valor)} pois o saldo disponível hoje é de ${formatarMoeda(saldoTotal)}.`, 'Saldo Insuficiente');
        }

        const dataResgate = await modal.prompt(`Qual foi a data exata deste resgate?`, new Date().toISOString().split('T')[0], 'Confirmar Data', { inputType: 'date', confirmLabel: 'Aprovar Resgate' });
        if (!dataResgate) return;

        criarAporte(caixinhaId, -Math.abs(valor), dataResgate);
    };

    const handleRegistrarOperacaoBolsa = async () => {
        const ticker = await modal.prompt('Passo 1 de 4 — Qual o ticker do ativo?', '', 'Registrar Operação', { placeholder: 'Ex: PETR4, MXRF11', confirmLabel: 'Próximo' });
        if (!ticker) return;

        const tipo = await modal.options('Passo 2 de 4 — Compra ou venda?', [
            { label: '📈 Compra', value: 'compra' },
            { label: '📉 Venda', value: 'venda' }
        ], 'Registrar Operação');
        if (!tipo) return;

        const quantidade = await modal.prompt('Passo 3 de 4 — Quantidade de cotas/ações?', '', 'Registrar Operação', { inputType: 'number', confirmLabel: 'Próximo' });
        if (!quantidade || isNaN(Number(quantidade)) || Number(quantidade) <= 0) return modal.alert('Quantidade inválida.');

        const preco = await modal.prompt('Passo 4 de 4 — Preço por unidade?', '', 'Registrar Operação', { inputType: 'currency', confirmLabel: 'Próximo' });
        if (!preco || preco <= 0) return;

        const data = await modal.prompt('Data da operação?', new Date().toISOString().split('T')[0], 'Registrar Operação', { inputType: 'date', confirmLabel: 'Registrar' });
        if (!data) return;

        const quantidadeFinal = tipo === 'venda' ? -Math.abs(Number(quantidade)) : Math.abs(Number(quantidade));
        bolsa.criarCompra(ticker, quantidadeFinal, preco, data);
    };

    if (loading || !dashboardData) {
        return (
            <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Sincronizando com a B3 / BCB...</h2>
                <p className="text-sm text-slate-500">Calculando juros diários, IOF e Imposto de Renda</p>
            </div>
        );
    }

    const { resumo, taxas, caixinhas } = dashboardData;
    const taxaDiariaReal = Math.pow(1 + (taxas.cdiAnual / 100), 1 / 252) - 1;
    const rendimentoDiarioBruto = resumo.aplicadoTotal * taxaDiariaReal;

    // UI Constantes (Mobile-First)
    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3.5 md:p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors shadow-sm";
    const labelCls = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 md:mb-1";

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 animate-fade-in relative">

            {/* CABEÇALHO PADRÃO (SÓLIDO E ROLÁVEL) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                        <LineChart className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                            Renda Fixa e Investimentos
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Acompanhe a rentabilidade real diária, simule metas e faça aportes.
                        </p>
                    </div>
                </div>
            </div>

            {/* ALTERNADOR DE ABAS: RENDA FIXA / AÇÕES & FIIS */}
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl w-full sm:w-fit">
                <button
                    type="button" onClick={() => setAbaAtiva('renda_fixa')}
                    className={`flex-1 sm:flex-none px-4 py-2.5 md:py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${abaAtiva === 'renda_fixa' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Renda Fixa
                </button>
                <button
                    type="button" onClick={() => setAbaAtiva('bolsa')}
                    className={`flex-1 sm:flex-none px-4 py-2.5 md:py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${abaAtiva === 'bolsa' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Ações & FIIs
                </button>
            </div>

            {abaAtiva === 'bolsa' ? (
                <SecaoBolsa bolsa={bolsa} onRegistrarOperacao={handleRegistrarOperacaoBolsa} formatarMoeda={formatarMoeda} />
            ) : (
            <>

            {/* 🌟 HERO: PATRIMÔNIO LÍQUIDO */}
            <div className="bg-gradient-to-tr from-blue-900 to-indigo-950 p-6 md:p-8 rounded-3xl shadow-xl border border-blue-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-6 mb-6">
                    <div>
                        <p className="text-blue-300 text-sm font-bold tracking-widest uppercase mb-1">Patrimônio Líquido Total</p>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{formatarMoeda(resumo.patrimonioTotal)}</h1>
                        <p className="text-blue-200 text-xs mt-2 font-medium">Livre de impostos (IR e IOF) se resgatado hoje.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3.5 md:p-3 rounded-xl flex items-center justify-between md:justify-center gap-4 w-full md:w-auto">
                        <div className="text-center flex-1 md:flex-none">
                            <p className="text-[10px] text-blue-300 uppercase tracking-wider font-bold mb-0.5">Taxa CDI Hoje</p>
                            <p className="text-lg font-black text-emerald-400">{taxas.cdiAnual.toFixed(2)}% <span className="text-[10px] font-normal text-emerald-300">a.a</span></p>
                        </div>
                        <div className="w-px h-10 bg-white/20"></div>
                        <div className="text-center flex-1 md:flex-none">
                            <p className="text-[10px] text-blue-300 uppercase tracking-wider font-bold mb-0.5">Selic Oficial</p>
                            <p className="text-lg font-black text-white">{(taxas.cdiAnual + 0.10).toFixed(2)}% <span className="text-[10px] font-normal text-blue-200">a.a</span></p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] uppercase font-bold text-blue-300 mb-1">Total Aplicado</p>
                        <p className="text-xl md:text-lg font-bold">{formatarMoeda(resumo.aplicadoTotal)}</p>
                    </div>
                    <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-500/30">
                        <p className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Lucro Líquido Real</p>
                        <p className="text-xl md:text-lg font-bold text-emerald-400">+{formatarMoeda(resumo.lucroLiquidoTotal)}</p>
                    </div>
                    <div className="bg-rose-900/40 p-4 rounded-2xl border border-rose-500/30">
                        <p className="text-[10px] uppercase font-bold text-rose-400 mb-1">Impostos Retidos (Leão)</p>
                        <p className="text-xl md:text-lg font-bold text-rose-400">-{formatarMoeda(resumo.impostosTotal)}</p>
                    </div>
                    <div className="bg-blue-800/40 p-4 rounded-2xl border border-blue-400/30">
                        <p className="text-[10px] uppercase font-bold text-blue-300 mb-1">Rendimento Diário Base</p>
                        <p className="text-xl md:text-lg font-bold text-blue-200">+{formatarMoeda(rendimentoDiarioBruto)}<span className="text-[10px] ml-1">/dia útil</span></p>
                    </div>
                </div>
            </div>

            {/* ⏱️ CALCULADORA DE CURTO PRAZO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-8 rounded-3xl shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Timer className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">Calculadora de Curto Prazo (Promoções)</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Simule um aporte numa taxa promocional para saber exatamente o valor líquido de resgate.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                    <div className="lg:col-span-3 space-y-5 bg-slate-50 dark:bg-slate-950 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Valor do Aporte (R$)</label>
                                <input
                                    type="text" inputMode="numeric"
                                    value={simCurtoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (!val) val = '0';
                                        setSimCurtoValorStr(val);
                                    }}
                                    className={`${inputCls} text-blue-700 dark:text-blue-400`}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Rendimento (% do CDI)</label>
                                <div className="relative">
                                    <input
                                        type="number" min="0" step="1"
                                        value={simCurtoTaxa} onChange={(e) => setSimCurtoTaxa(Number(e.target.value))}
                                        className={`${inputCls} pr-8`}
                                    />
                                    <span className="absolute right-3.5 top-3.5 md:top-2.5 text-sm font-bold text-slate-400 pointer-events-none">%</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Data final do Resgate</label>
                            <input
                                type="date"
                                value={simCurtoData} onChange={(e) => setSimCurtoData(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 relative overflow-hidden h-full flex flex-col justify-center">
                        {simulacaoCurto.erro ? (
                            <div className="flex flex-col items-center justify-center text-slate-500 py-6">
                                <Hourglass className="w-9 h-9 mb-2 opacity-50" strokeWidth={1.5} />
                                <p className="font-bold text-sm">A data precisa ser no futuro.</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-5">Resultado em {simulacaoCurto.diasCorridos} dias corridos</p>

                                <div className="flex justify-between items-center mb-2.5 pb-2.5 border-b border-slate-300 dark:border-slate-700">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Rendimento Bruto</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">+{formatarMoeda(simulacaoCurto.lucroBruto)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2.5 pb-2.5 border-b border-slate-300 dark:border-slate-700">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">Imposto de Renda</span>
                                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">-{formatarMoeda(simulacaoCurto.ir)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-slate-300 dark:border-slate-700">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">IOF (Nos 30 primeiros dias)</span>
                                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">-{formatarMoeda(simulacaoCurto.iof)}</span>
                                </div>

                                <div className="text-center mt-6">
                                    <p className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-500 tracking-wider mb-1">Valor Líquido de Resgate</p>
                                    <p className="text-3xl md:text-4xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">{formatarMoeda(simulacaoCurto.valorLiquido)}</p>
                                    <p className="text-xs font-bold text-emerald-600/70 dark:text-emerald-500/70 mt-1">Lucro Livre: +{formatarMoeda(simulacaoCurto.lucroLiquido)}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 🚀 PROJETOR DE INDEPENDÊNCIA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-8 rounded-3xl shadow-sm transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Rocket className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">Projetor de Independência</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Calcule sua jornada considerando os juros compostos da sua taxa mensal.</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6 md:mb-8 bg-slate-50 dark:bg-slate-950 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <label className={labelCls}>Simular rendimento usando a taxa de qual fundo?</label>
                    <select
                        value={caixinhaSimuladorId}
                        onChange={(e) => setCaixinhaSimuladorId(e.target.value)}
                        className={`${inputCls} w-full md:w-1/2 cursor-pointer font-bold`}
                    >
                        <option value="base">Padrão da Economia: 100% do CDI (Selic Base)</option>
                        {caixinhas.map(cx => (
                            <option key={cx.id} value={cx.id}>
                                {cx.instituicao} - {cx.nome_caixinha} ({cx.percentual_cdi}% do CDI)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Qual a sua meta financeira?</label>
                                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatarMoeda(metaSimulador)}</span>
                            </div>
                            <div className="px-1">
                                <input
                                    type="range" min="10000" max="1000000" step="10000"
                                    value={metaSimulador} onChange={(e) => setMetaSimulador(Number(e.target.value))}
                                    className="w-full h-3 md:h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Quanto pode investir por mês?</label>
                                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatarMoeda(aporteSimulador)}</span>
                            </div>
                            <div className="px-1">
                                <input
                                    type="range" min="100" max="10000" step="100"
                                    value={aporteSimulador} onChange={(e) => setAporteSimulador(Number(e.target.value))}
                                    className="w-full h-3 md:h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden text-center">
                        {caixinhaSimuladorId !== 'base' && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-bl-lg shadow-sm">
                                Simulando com {simulacao.taxaUsada}% CDI
                            </div>
                        )}
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-6 mt-2 uppercase tracking-widest">Você atingirá sua meta em:</p>

                        <div className="flex justify-center items-end gap-2 text-blue-600 dark:text-blue-400 mb-8">
                            <span className="text-6xl md:text-7xl font-black leading-none tracking-tighter">{simulacao.anos}</span>
                            <span className="text-lg md:text-xl font-bold pb-1 md:pb-2">Anos e</span>
                            <span className="text-6xl md:text-7xl font-black leading-none tracking-tighter">{simulacao.meses}</span>
                            <span className="text-lg md:text-xl font-bold pb-1 md:pb-2">Meses</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-200 dark:border-slate-800 pt-6">
                            <div>
                                <p className="text-[10px] md:text-xs uppercase font-bold text-slate-500 mb-1">Saiu do seu bolso</p>
                                <p className="font-bold text-base md:text-lg text-slate-700 dark:text-slate-300">{formatarMoeda(simulacao.investido)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs uppercase font-bold text-emerald-600 dark:text-emerald-500 mb-1">Dinheiro Trabalhou</p>
                                <p className="font-bold text-base md:text-lg text-emerald-600 dark:text-emerald-400">+{formatarMoeda(simulacao.juros)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🏦 GESTOR DE CAIXINHAS E APORTES */}
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">Minhas Caixinhas (CDB)</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Controle individualizado por instituição e metrificação de lucro.</p>
                    </div>
                    <button onClick={handleNovaCaixinha} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 md:py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]">
                        <Plus className="w-4 h-4" strokeWidth={2.5} /> Criar Caixinha
                    </button>
                </div>

                {caixinhas.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center">
                        <Landmark className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Nenhum investimento registrado</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Crie sua primeira caixinha para começar a acompanhar os juros diários.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {caixinhas.map(cx => (
                            <div key={cx.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-start gap-2">
                                    <div className="min-w-0 pr-2">
                                        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1 truncate">{cx.instituicao}</p>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight truncate">{cx.nome_caixinha}</h3>
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1">
                                            <span>Rende {cx.percentual_cdi}% do CDI</span>
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Saldo Líquido</p>
                                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{formatarMoeda(cx.totalLiquido)}</p>
                                        <p className="text-[10px] font-bold text-emerald-500 mt-1">Lucro: {cx.lucroLiquido >= 0 ? '+' : ''}{formatarMoeda(cx.lucroLiquido)}</p>
                                    </div>
                                </div>

                                <div className="p-4 md:p-5 flex-1 max-h-80 overflow-y-auto custom-scrollbar space-y-3">
                                    {cx.aportes.length === 0 ? (
                                        <p className="text-xs text-center text-slate-400 my-4 font-medium">Nenhum aporte registrado nesta caixinha.</p>
                                    ) : (
                                        cx.aportes.map(ap => {
                                            const isResgate = ap.valorOriginal < 0;

                                            return (
                                                <div key={ap.id} className={`border rounded-xl p-3.5 md:p-4 flex flex-col group transition-colors ${isResgate ? 'bg-rose-50/30 dark:bg-rose-900/10 border-rose-200/50 dark:border-rose-800/30' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>

                                                    <div className="flex justify-between items-start mb-3 gap-2">
                                                        <div className="min-w-0 pr-2">
                                                            <span className={`text-xs md:text-sm font-bold truncate block leading-tight ${isResgate ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                {isResgate ? 'Saída (Resgate)' : 'Aporte Original'}
                                                            </span>
                                                            <span className="text-[10px] block text-slate-400 uppercase tracking-widest mt-1 font-semibold">{new Date(ap.data_aporte).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className={`text-sm md:text-base font-black tracking-tight ${isResgate ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                {formatarMoeda(ap.valorOriginal)}
                                                            </span>
                                                            {/* 🔥 MOBILE FIX: Pílula de ação para exclusão do aporte (Sem depender de Hover no celular) */}
                                                            <button onClick={() => excluirAporte(ap.id)} className="p-1.5 text-slate-400 hover:text-rose-500 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer active:scale-95" title="Excluir Aporte">
                                                                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {!isResgate ? (
                                                        <div className="flex justify-between items-center border-t border-slate-200/50 dark:border-slate-800/50 pt-3 mt-1 gap-2">
                                                            <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                                                <div>
                                                                    <span className="text-[9px] block uppercase font-bold text-slate-400 mb-0.5">Bruto</span>
                                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{formatarMoeda(ap.lucroBruto)}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[9px] block uppercase font-bold text-rose-400 mb-0.5">IR ({((ap.valorIr / ap.lucroBruto) * 100 || 0).toFixed(1)}%)</span>
                                                                    <span className="text-xs font-bold text-rose-500">-{formatarMoeda(ap.valorIr)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <span className="text-[9px] block uppercase font-black text-emerald-500 mb-0.5">Líquido Atual</span>
                                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatarMoeda(ap.valorLiquido)}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-between items-center border-t border-rose-100/50 dark:border-rose-800/50 pt-2 mt-1">
                                                            <span className="text-[9px] text-rose-500/70 dark:text-rose-400/70 font-bold uppercase tracking-wider">Frenagem de Juros Compostos.</span>
                                                            <span className="text-[9px] uppercase font-black text-rose-600 dark:text-rose-500 tracking-wider">Curva Abatida: {formatarMoeda(ap.valorLiquido)}</span>
                                                        </div>
                                                    )}

                                                    {/* ALERTA DE IOF (Apenas para aportes recentes e positivos) */}
                                                    {!isResgate && ap.diasCorridos < 30 && ap.lucroBruto > 0 && (
                                                        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3 rounded-lg flex items-start gap-2.5 shadow-sm">
                                                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-0.5">Trava de IOF Ativa (-{formatarMoeda(ap.valorIof)})</p>
                                                                <p className="text-[10px] font-medium text-amber-700 dark:text-amber-500 leading-tight">Se resgatar hoje, você perde <strong className="font-bold">{((ap.valorIof / ap.lucroBruto) * 100).toFixed(0)}%</strong> do lucro. Aguarde mais <strong className="font-bold">{30 - ap.diasCorridos}</strong> dias.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap sm:flex-nowrap gap-2.5">
                                    <button onClick={() => excluirCaixinha(cx.id)} className="w-full sm:w-auto px-4 py-3 md:py-2 text-sm font-bold text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-900/20 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-2" title="Apagar Caixinha">
                                        <Trash2 className="w-4 h-4" strokeWidth={2} /> <span className="sm:hidden">Apagar</span>
                                    </button>
                                    <button onClick={() => handleResgate(cx.id, cx.nome_caixinha, cx.totalLiquido)} className="flex-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 py-3 md:py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2">
                                        <ArrowDownToLine className="w-4 h-4" strokeWidth={2} /> Resgatar
                                    </button>
                                    <button onClick={() => handleNovoAporte(cx.id, cx.nome_caixinha)} className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 py-3 md:py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" strokeWidth={2.25} /> Aporte
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            </>
            )}
        </div>
    );
}

/**
 * @component SecaoBolsa
 * @description Aba de Ações e FIIs dentro de Investimentos: posições agregadas por ticker com
 * cotação ao vivo (via useBolsa), lucro/prejuízo e o wizard de registro de operações.
 */
function SecaoBolsa({ bolsa, onRegistrarOperacao, formatarMoeda }) {
    const { dashboardData, loading } = bolsa;

    if (loading || !dashboardData) {
        return (
            <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[40vh] animate-pulse">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Buscando cotações...</h2>
                <p className="text-sm text-slate-500">Consultando o preço atual dos seus ativos na B3</p>
            </div>
        );
    }

    const { posicoes, resumo } = dashboardData;
    const lucroPositivo = resumo.lucroTotal >= 0;

    return (
        <div className="space-y-6">
            {/* HERO: RESUMO DA CARTEIRA */}
            <div className="bg-gradient-to-tr from-blue-900 to-indigo-950 p-6 md:p-8 rounded-3xl shadow-xl border border-blue-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] uppercase font-bold text-blue-300 mb-1">Valor Investido</p>
                        <p className="text-xl font-black">{formatarMoeda(resumo.valorInvestidoTotal)}</p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] uppercase font-bold text-blue-300 mb-1">Valor Atual</p>
                        <p className="text-xl font-black">{formatarMoeda(resumo.valorAtualTotal)}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${lucroPositivo ? 'bg-emerald-900/40 border-emerald-500/30' : 'bg-rose-900/40 border-rose-500/30'}`}>
                        <p className={`text-[10px] uppercase font-bold mb-1 ${lucroPositivo ? 'text-emerald-400' : 'text-rose-400'}`}>Lucro / Prejuízo</p>
                        <p className={`text-xl font-black ${lucroPositivo ? 'text-emerald-400' : 'text-rose-400'}`}>{lucroPositivo ? '+' : ''}{formatarMoeda(resumo.lucroTotal)}</p>
                    </div>
                </div>
            </div>

            {/* POSIÇÕES */}
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">Minhas Posições</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Preço médio e cotação atual por ativo.</p>
                    </div>
                    <button onClick={onRegistrarOperacao} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 md:py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]">
                        <Plus className="w-4 h-4" strokeWidth={2.5} /> Registrar Operação
                    </button>
                </div>

                {posicoes.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center">
                        <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Nenhum ativo cadastrado ainda</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Registre sua primeira compra para acompanhar a cotação.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {posicoes.map(pos => {
                            const posLucroPositivo = (pos.lucro ?? 0) >= 0;
                            return (
                                <div key={pos.ticker} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-start gap-2">
                                        <div className="min-w-0 pr-2">
                                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight truncate">{pos.ticker}</h3>
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{pos.quantidade} cotas/ações • PM {formatarMoeda(pos.precoMedio)}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Valor Atual</p>
                                            <p className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                                {pos.valorAtual != null ? formatarMoeda(pos.valorAtual) : 'Indisponível'}
                                            </p>
                                            {pos.lucro != null && (
                                                <p className={`text-[10px] font-bold mt-1 ${posLucroPositivo ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {posLucroPositivo ? '+' : ''}{formatarMoeda(pos.lucro)} ({pos.lucroPercentual}%)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Cotação: {pos.cotacaoAtual != null ? formatarMoeda(pos.cotacaoAtual) : 'indisponível'}
                                        </span>
                                        <span className="text-xs text-slate-400">Investido: {formatarMoeda(pos.valorInvestido)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}