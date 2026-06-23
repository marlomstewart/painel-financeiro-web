/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from 'react';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/**
 * Componente Presentational: Dashboard
 * Fornece a interface analítica principal, gerenciamento de transações diárias e meta-controles.
 * Incorpora paginação infinita baseada em IntersectionObserver com pre-fetching inteligente de rolagem.
 */
export function Dashboard({
    nomeUsuario, alertaMoto, abrirDetalhesCategoria, dataVis, mesAnterior, mesProximo, isAdmin, setTelaAtiva, carregarUsuarios, fazerLogout,
    totRendaPaga, totGastoReal, totInvestido, verFaturasPorCartao, totFaturaCreditoAberto,
    saldoMesAnterior, somarSaldoAnterior, setSomarSaldoAnterior, saldoAtual, saldoMesAtual, mesAntRef, previstoFimMes,
    categorias, gCat, addTransacao, cartoes,
    filtroStatus, setFiltroStatus, buscaTexto, setBuscaTexto,
    mostrarFiltrosAvancados, setMostrarFiltrosAvancados, filtrosAvancados, setFiltrosAvancados,
    mudarOrdenacao, ordenacao, dadosTabela, alternarStatusTransacao, editarValor, deletarTransacao,
    ModalComponent, modalConfig, modalClose, executarAcaoEmMassa, pendenciasPassadas, abrirModalPendencias, pagarFaturaCartao, anexarComprovante, removerComprovante, verComprovante, abrirResumoCard
}) {

    const [selecionados, setSelecionados] = useState([]);
    const [detalhesTransacao, setDetalhesTransacao] = useState(null);
    const [catFormulario, setCatFormulario] = useState('Sem Categoria');
    const todosSelecionados = dadosTabela.length > 0 && selecionados.length === dadosTabela.length;

    // =========================================================================
    // ARQUITETURA DE PAGINAÇÃO INFINITA (LAZY LOAD / INTERSECTION OBSERVER)
    // =========================================================================
    const [limiteExibicao, setLimiteExibicao] = useState(30);
    const elementoSentinelaRef = useRef(null);

    // Reseta o limite de exibição sempre que o usuário trocar de mês ou aplicar filtros/buscas
    useEffect(() => {
        setLimiteExibicao(30);
    }, [dataVis, filtroStatus, buscaTexto, filtrosAvancados]);

    // Configura o observador para injetar mais 30 itens de forma antecipada (Pre-fetching)
    useEffect(() => {
        const sentinela = elementoSentinelaRef.current;
        if (!sentinela) return;

        const observer = new IntersectionObserver((entries) => {
            // Se o elemento sentinela entrar na margem de visão e ainda houver dados a carregar
            if (entries[0].isIntersecting && limiteExibicao < dadosTabela.length) {
                setLimiteExibicao(prev => prev + 30);
            }
        }, {
            root: null,
            rootMargin: '250px', // Gatilho acionado 250px antes de tocar o fundo da lista (Garante o Pre-fetching sem Delay)
            threshold: 0.1
        });

        observer.observe(sentinela);
        return () => {
            if (sentinela) observer.unobserve(sentinela);
        };
    }, [limiteExibicao, dadosTabela.length]);

    // Clona e fatia a matriz original de dados para poupar a renderização do React DOM
    const dadosExibidos = dadosTabela.slice(0, limiteExibicao);

    const abrirDetalhes = (t) => {
        setDetalhesTransacao({
            type: 'detalhes',
            title: t.descricao + (t.grupo_id ? ' 🔗' : ''),
            transacao: t,
            nomePagamento: obterNomePagamento(t.formaPagamento),
            isStewart: nomeUsuario === 'stewart',
            onAlternarStatus: () => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra),
            onEditar: () => editarValor(t),
            onVerComprovante: () => verComprovante(t),
            onAnexarComprovante: () => anexarComprovante(t),
            onDeletar: () => deletarTransacao(t),
            onCancel: () => setDetalhesTransacao(null),
            onClose: () => setDetalhesTransacao(null),
        });
    };

    const handleAdicionar = (e) => {
        addTransacao(e);
        setCatFormulario('Sem Categoria');
    };

    const toggleSelectAll = () => {
        if (todosSelecionados) setSelecionados([]);
        else setSelecionados(dadosTabela.map(t => t.id));
    };

    const toggleSelect = (id) => {
        setSelecionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleAcaoMassa = async (acao) => {
        const sucesso = await executarAcaoEmMassa(acao, selecionados);
        if (sucesso) setSelecionados([]);
    };

    const obterNomePagamento = (forma) => {
        if (!forma || forma === 'pix') return 'PIX / Dinheiro';
        if (forma === 'debito') return 'Cartão de Débito';
        if (forma.startsWith('credito_')) {
            const id = forma.split('_')[1];
            const cartao = cartoes.find(c => c.id === id);
            return cartao ? `Crédito: ${cartao.nome}` : 'Cartão de Crédito';
        }
        return forma;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-2 md:p-8 text-slate-800 dark:text-slate-200 overflow-x-hidden transition-colors duration-300">
            <ModalComponent config={modalConfig} onClose={modalClose} />
            <ModalComponent config={detalhesTransacao} onClose={() => setDetalhesTransacao(null)} />
            <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">

                <header className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                    <div className="flex-shrink-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">Painel Financeiro</h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium capitalize">Olá, {nomeUsuario}! 👋</p>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 bg-slate-50 dark:bg-slate-900 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700 order-3 lg:order-2 w-full lg:w-auto justify-center transition-colors">
                        <button type="button" onClick={mesAnterior} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-lg md:text-xl font-bold flex-shrink-0 transition-colors">◀</button>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase text-center text-[11px] sm:text-xs md:text-base whitespace-nowrap">{nomesMeses[dataVis.mes - 1]} {dataVis.ano}</span>
                        <button type="button" onClick={mesProximo} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-lg md:text-xl font-bold flex-shrink-0 transition-colors">▶</button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2 order-2 lg:order-3 justify-end flex-1 lg:flex-none">
                        {isAdmin && (<button type="button" onClick={() => { setTelaAtiva('admin'); carregarUsuarios(); }} className="bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium border border-purple-200 dark:border-purple-800 transition-colors whitespace-nowrap">👥 <span className="hidden sm:inline">Usuários</span></button>)}
                        {nomeUsuario === 'stewart' && (<button type="button" onClick={() => setTelaAtiva('garagem')} className="bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium border border-orange-200 dark:border-orange-800 transition-colors whitespace-nowrap">🏍️ <span className="hidden sm:inline">Garagem</span></button>)}
                        <button type="button" onClick={() => setTelaAtiva('setup')} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium border border-slate-200 dark:border-slate-600 transition-colors whitespace-nowrap">⚙ <span className="hidden sm:inline">Config</span></button>
                        <button type="button" onClick={fazerLogout} className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium border border-red-100 dark:border-red-800 transition-colors whitespace-nowrap">Sair</button>
                    </div>
                </header>

                {pendenciasPassadas && pendenciasPassadas.length > 0 && (
                    <div role="button" tabIndex={0} onClick={abrirModalPendencias} className="bg-gradient-to-r from-rose-500 to-red-600 dark:from-rose-600 dark:to-red-800 rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row items-center justify-between border border-rose-400 dark:border-rose-700 gap-4">
                        <div className="flex items-center gap-4 w-full">
                            <div className="bg-white/20 p-3 rounded-full flex-shrink-0"><span className="text-2xl text-white">⚠️</span></div>
                            <div>
                                <h3 className="text-white font-bold text-base md:text-lg leading-tight">Atenção! Você tem pendências antigas.</h3>
                                <p className="text-rose-100 text-xs md:text-sm mt-1">Existem {pendenciasPassadas.length} lançamento(s) de meses anteriores aguardando resolution.</p>
                            </div>
                        </div>
                        <div className="w-full md:w-auto text-center md:text-left text-white font-semibold bg-black/10 dark:bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm whitespace-nowrap">
                            Resolver Agora ➔
                        </div>
                    </div>
                )}

                <div className={`grid grid-cols-2 md:grid-cols-4 ${alertaMoto ? 'lg:grid-cols-8' : 'lg:grid-cols-7'} gap-2 md:gap-4`}>
                    <div role="button" tabIndex={0} onClick={() => abrirResumoCard('rendas')} className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500 dark:border-l-emerald-500 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Rendas</h3>
                        <p className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{formatarMoeda(totRendaPaga)}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Clique para detalhes</p>
                    </div>
                    <div role="button" tabIndex={0} onClick={() => abrirResumoCard('gastos')} className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-red-500 dark:border-l-red-500 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Gastos</h3>
                        <p className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{formatarMoeda(totGastoReal)}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Clique para detalhes</p>
                    </div>
                    <div role="button" tabIndex={0} onClick={() => abrirResumoCard('investimentos')} className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-500 dark:border-l-blue-500 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Investimentos</h3>
                        <p className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{formatarMoeda(totInvestido)}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Clique para detalhes</p>
                    </div>
                    <div role="button" tabIndex={0} onClick={verFaturasPorCartao} className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 dark:border-l-purple-500 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Faturas Abertas</h3>
                        <p className="text-sm md:text-lg font-bold text-purple-700 dark:text-purple-400 mt-1">{formatarMoeda(totFaturaCreditoAberto)}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Clique para ver por cartão</p>
                    </div>
                    <div className={`p-3 md:p-4 rounded-xl shadow-sm border border-l-4 transition-colors ${saldoMesAnterior >= 0 ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50 border-l-teal-500 dark:border-l-teal-500' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 border-l-rose-400 dark:border-l-rose-500'}`}>
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Saldo Mês Anterior</h3>
                        <p className={`text-sm md:text-lg font-bold mt-1 ${saldoMesAnterior >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatarMoeda(saldoMesAnterior)}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-2">{nomesMeses[mesAntRef.mes - 1]} {mesAntRef.ano}</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSomarSaldoAnterior(v => !v); }} className={`w-full text-[9px] md:text-[10px] font-bold py-1 px-2 rounded transition-colors border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer`}>
                            {somarSaldoAnterior ? '✔ Somando ao Saldo' : '+ Somar ao Saldo'}
                        </button>
                    </div>
                    <div role="button" tabIndex={0} onClick={() => abrirResumoCard('saldo')} className="bg-slate-800 dark:bg-slate-900 p-3 md:p-4 rounded-xl shadow-sm border border-slate-700 border-l-4 border-l-slate-400 dark:border-l-slate-500 cursor-pointer hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-300 dark:text-slate-400 uppercase">Saldo em Conta</h3>
                        <p className="text-sm md:text-lg font-bold text-white mt-1">{formatarMoeda(saldoAtual)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Clique para ver o cálculo</p>
                    </div>
                    <div role="button" tabIndex={0} onClick={() => abrirResumoCard('previsao')} className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 dark:border-l-amber-500 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Previsão Fim Mês</h3>
                        <p className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{formatarMoeda(previstoFimMes)}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Clique para ver o cálculo</p>
                    </div>

                    {alertaMoto && (
                        <div className={`p-3 md:p-4 rounded-xl shadow-sm border border-l-4 transition-colors ${alertaMoto.alertaCritico ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 border-l-red-500' : 'bg-slate-800 dark:bg-slate-900 border-slate-700 border-l-yellow-500'}`}>
                            <h3 className={`text-[10px] md:text-xs font-semibold uppercase ${alertaMoto.alertaCritico ? 'text-red-700 dark:text-red-400' : 'text-slate-300 dark:text-slate-400'}`}>Óleo da Biz 125</h3>
                            <p className={`text-sm md:text-lg font-bold mt-1 ${alertaMoto.alertaCritico ? 'text-red-600 dark:text-red-400' : 'text-white'}`}>{alertaMoto.kmFaltantes} km</p>
                            <p className={`text-[9px] mt-0.5 ${alertaMoto.alertaCritico ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-400'}`}>
                                {alertaMoto.alertaCritico ? '⚠️ Troca Urgente!' : 'Para a próxima troca'}
                            </p>
                        </div>
                    )}
                </div>

                {categorias.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h2 className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-4">Progresso das Metas</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {categorias.map(c => {
                                const gas = gCat[c.nome] || 0;
                                let por = Math.min((gas / c.meta) * 100, 100);
                                let corBarra = '';

                                if (c.tipo === 'despesa' || c.tipo === 'Gasto' || c.tipo === 'gasto') {
                                    if (por >= 95) corBarra = 'bg-red-500 dark:bg-red-600';
                                    else if (por >= 80) corBarra = 'bg-amber-400 dark:bg-amber-500';
                                    else if (por >= 50) corBarra = 'bg-blue-500 dark:bg-blue-600';
                                    else corBarra = 'bg-emerald-500 dark:bg-emerald-600';
                                } else {
                                    if (por >= 95) corBarra = 'bg-emerald-500 dark:bg-emerald-600';
                                    else if (por >= 80) corBarra = 'bg-blue-500 dark:bg-blue-600';
                                    else if (por >= 50) corBarra = 'bg-amber-400 dark:bg-amber-500';
                                    else corBarra = 'bg-red-500 dark:bg-red-600';
                                }

                                return (
                                    <div
                                        key={c.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => abrirDetalhesCategoria(c.nome, gas, c.meta, c.tipo)}
                                        className="border border-slate-200 dark:border-slate-700 p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                                    >
                                        <h4 className="text-xs md:text-sm font-medium mb-2 truncate text-slate-800 dark:text-slate-200" title={c.nome}>{c.nome}</h4>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-2 overflow-hidden"><div className={`${corBarra} h-1.5 rounded-full transition-all duration-700 ease-out`} style={{ width: `${por}%` }}></div></div>
                                        <div className="flex justify-between text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium"><span>{formatarMoeda(gas)}</span><span>{formatarMoeda(c.meta)}</span></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-1 h-fit transition-colors">
                        <h2 className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-4">Novo Lançamento</h2>
                        <form onSubmit={handleAdicionar} className="space-y-3 md:space-y-4">
                            <input name="descricao" placeholder="Descrição" required className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors" />
                            <input name="valor" type="number" step="0.01" placeholder="Valor (R$)" required className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors" />
                            <input name="dataCompra" type="date" required className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors" />
                            <div className="grid grid-cols-2 gap-2">
                                <select name="tipo" required className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"><option value="despesa">Despesa</option><option value="renda">Renda</option><option value="investimento">Invest. / Meta</option></select>
                                <select name="status" className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"><option value="pendente">Pendente</option><option value="pago">Pago</option></select>
                            </div>

                            <select name="categoria" value={catFormulario} onChange={e => setCatFormulario(e.target.value)} required className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors">
                                <option value="Sem Categoria">Sem Categoria</option><option value="Contas Fixas">Contas Fixas</option><option value="Renda Fixa">Renda Fixa</option><option value="Renda">Renda Variável</option>
                                {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                            </select>

                            {nomeUsuario.toLowerCase() === 'stewart' && (catFormulario === 'Gasolina' || catFormulario === 'Manutenção da moto') && (
                                <input name="kmMoto" type="number" placeholder="Km atual (deixe vazio se convidado)" className="w-full border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-slate-800 dark:text-slate-100 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-amber-600 dark:focus:border-amber-400 transition-colors" />
                            )}

                            <select name="formaPagamento" required className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"><option value="pix">PIX / Dinheiro</option><option value="debito">Débito</option>{cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito - {c.nome}</option>)}</select>
                            <input name="parcelas" type="number" min="1" placeholder="Qtd. Parcelas (Apenas Crédito)" className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors" />
                            <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold py-2.5 md:py-3 rounded-lg text-xs md:text-sm transition-colors shadow-sm cursor-pointer">Adicionar</button>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2 flex flex-col overflow-hidden w-full transition-colors">
                        <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-t-xl transition-colors">
                            <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 w-full md:w-auto">
                                <button type="button" onClick={() => setFiltroStatus('todos')} className={`px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md flex-1 cursor-pointer transition-colors ${filtroStatus === 'todos' ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>Todos</button>
                                <button type="button" onClick={() => setFiltroStatus('pendente')} className={`px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md flex-1 cursor-pointer transition-colors ${filtroStatus === 'pendente' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>Pendentes</button>
                                <button type="button" onClick={() => setFiltroStatus('pago')} className={`px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md flex-1 cursor-pointer transition-colors ${filtroStatus === 'pago' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>Pagos</button>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <input type="text" placeholder="🔍 Buscar..." value={buscaTexto} onChange={(e) => setBuscaTexto(e.target.value)} className="w-full md:w-48 lg:w-64 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1.5 md:p-2 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors" />
                                <button type="button" onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)} className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg border text-[10px] md:text-sm font-bold transition-colors cursor-pointer ${mostrarFiltrosAvancados ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                    Filtros {mostrarFiltrosAvancados ? '▲' : '▼'}
                                </button>
                            </div>
                        </div>

                        {mostrarFiltrosAvancados && (
                            <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 transition-colors">
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Período de Data</label>
                                    <div className="flex gap-2">
                                        <input type="date" value={filtrosAvancados.dataInicio} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataInicio: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                                        <input type="date" value={filtrosAvancados.dataFim} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataFim: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Faixa de Valor (R$)</label>
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="Mín." value={filtrosAvancados.valorMin} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMin: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                                        <input type="number" placeholder="Máx." value={filtrosAvancados.valorMax} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMax: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Pagamento e Categoria</label>
                                    <div className="flex gap-2">
                                        <select value={filtrosAvancados.formaPagamento} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, formaPagamento: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1 md:p-1.5 rounded text-[10px] md:text-xs">
                                            <option value="">Qualquer</option><option value="pix">PIX / Dinheiro</option><option value="debito">Débito</option><option value="credito" className="font-bold">💳 Todos do Crédito</option>
                                            {cartoes.map(c => (<option key={c.id} value={`credito_${c.id}`}>&nbsp;&nbsp;↳ Só {c.nome}</option>))}
                                        </select>
                                        <select value={filtrosAvancados.categoria} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, categoria: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1 md:p-1.5 rounded text-[10px] md:text-xs">
                                            <option value="">Qualquer</option>{categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="md:col-span-3 flex justify-end">
                                    <button type="button" onClick={() => setFiltrosAvancados({ dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: '' })} className="text-[10px] md:text-xs text-red-500 hover:text-red-400 hover:underline font-bold cursor-pointer">Limpar Filtros</button>
                                </div>
                            </div>
                        )}

                        <div className="w-full">
                            {selecionados.length > 0 && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 border-t border-b border-indigo-100 dark:border-indigo-800/50 p-2 md:p-3 flex flex-col md:flex-row justify-between items-center gap-3 transition-all">
                                    <span className="text-xs md:text-sm font-bold text-indigo-700 dark:text-indigo-400">☑ {selecionados.length} lançamento(s) selecionado(s)</span>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => handleAcaoMassa('pago')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer">✔ Pagos</button>
                                        <button type="button" onClick={() => handleAcaoMassa('pendente')} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer">⏳ Pendentes</button>
                                        <button type="button" onClick={() => handleAcaoMassa('excluir')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer">🗑️ Excluir</button>
                                    </div>
                                </div>
                            )}

                            {/* TABELA — DESKTOP */}
                            <div className="hidden md:block w-full">
                                <table className="w-full text-left text-slate-600 dark:text-slate-400 table-fixed">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-700 select-none transition-colors">
                                        <tr>
                                            <th className="px-3 py-3 w-10 text-center"><input type="checkbox" checked={todosSelecionados} onChange={toggleSelectAll} className="w-4 h-4 accent-indigo-600 dark:accent-indigo-500 cursor-pointer" /></th>
                                            <th className="px-3 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => mudarOrdenacao('descricao')}>Descrição {ordenacao.coluna === 'descricao' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="px-3 py-3 w-32 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => mudarOrdenacao('categoria')}>Categoria {ordenacao.coluna === 'categoria' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="px-3 py-3 w-24 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => mudarOrdenacao('data')}>Data {ordenacao.coluna === 'data' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="px-3 py-3 w-24 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => mudarOrdenacao('status')}>Status {ordenacao.coluna === 'status' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="px-3 py-3 w-20 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => mudarOrdenacao('pagamento')}>Pgto. {ordenacao.coluna === 'pagamento' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="px-3 py-3 w-28 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => mudarOrdenacao('valor')}>Valor {ordenacao.coluna === 'valor' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {dadosExibidos.length === 0 && (
                                            <tr><td colSpan="7" className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">Nenhum lançamento encontrado.</td></tr>
                                        )}
                                        {dadosExibidos.map(t => (
                                            <tr key={t.id} className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-colors ${selecionados.includes(t.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : ''}`}>
                                                <td className="px-3 py-3 text-center"><input type="checkbox" checked={selecionados.includes(t.id)} onChange={() => toggleSelect(t.id)} className="w-4 h-4 accent-indigo-600 dark:accent-indigo-500 cursor-pointer" /></td>
                                                <td className="px-3 py-3">
                                                    <button type="button" onClick={() => abrirDetalhes(t)} className="text-left w-full group cursor-pointer">
                                                        <span className="block font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate text-sm">{t.descricao}</span>
                                                        {t.grupo_id && <span className="text-[10px] text-blue-400 font-normal">🔗 parcelado</span>}
                                                        {t.comprovante_url && nomeUsuario === 'stewart' && <span className="text-[10px] text-emerald-500 font-normal ml-1">📎</span>}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3"><span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full block truncate text-center transition-colors" title={t.categoria}>{t.categoria}</span></td>
                                                <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                                <td className="px-3 py-3"><button type="button" onClick={() => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra)} className={`px-2 py-1 rounded-full text-xs font-bold uppercase w-full transition-transform hover:scale-105 cursor-pointer ${t.status === 'pago' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>{t.status}</button></td>
                                                <td className="px-3 py-3"><span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-transparent dark:border-slate-600 px-2 py-1 rounded block text-center truncate transition-colors" title={obterNomePagamento(t.formaPagamento)}>{t.formaPagamento ? t.formaPagamento.split('_')[0].toUpperCase() : 'PIX'}</span></td>
                                                <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-200 text-right whitespace-nowrap text-sm transition-colors">{formatarMoeda(t.valorParcela)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* CARDS — MOBILE */}
                            <div className="md:hidden">
                                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto transition-colors">
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">Ordenar:</span>
                                    {[
                                        { coluna: 'data', label: 'Data' }, { coluna: 'valor', label: 'Valor' }, { coluna: 'status', label: 'Status' },
                                        { coluna: 'descricao', label: 'Nome' }, { coluna: 'categoria', label: 'Categ.' }, { coluna: 'pagamento', label: 'Pgto.' },
                                    ].map(({ coluna, label }) => {
                                        const ativo = ordenacao.coluna === coluna;
                                        return (
                                            <button key={coluna} type="button" onClick={() => mudarOrdenacao(coluna)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${ativo ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                                {label} {ativo ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700/50 transition-colors">
                                    {dadosExibidos.length === 0 && <p className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">Nenhum lançamento encontrado.</p>}
                                    {dadosExibidos.map(t => (
                                        <div key={t.id} className={`p-3 transition-colors ${selecionados.includes(t.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                    <input type="checkbox" checked={selecionados.includes(t.id)} onChange={() => toggleSelect(t.id)} className="w-4 h-4 accent-indigo-600 dark:accent-indigo-500 cursor-pointer mt-0.5 flex-shrink-0" />
                                                    <button type="button" onClick={() => abrirDetalhes(t)} className="text-left min-w-0 group cursor-pointer">
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t.descricao}</p>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            {t.grupo_id && <span className="text-[10px] text-blue-400">🔗 parcelado</span>}
                                                            {t.comprovante_url && nomeUsuario === 'stewart' && <span className="text-[10px] text-emerald-500">📎</span>}
                                                        </div>
                                                    </button>
                                                </div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap transition-colors">{formatarMoeda(t.valorParcela)}</p>
                                            </div>
                                            <div className="flex items-center justify-between ml-6">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full transition-colors">{t.categoria}</span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                </div>
                                                <button type="button" onClick={() => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra)} className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer transition-colors ${t.status === 'pago' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                                    {t.status}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CONTAINER SENTINELA INVISÍVEL PARA TRIGGER DA PAGINAÇÃO INFINITA ANTECIPADA */}
                            <div ref={elementoSentinelaRef} className="h-4 w-full clear-both" />

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}