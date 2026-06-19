import React, { useState } from 'react';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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

    // Intercepta o envio para limpar o campo visual da categoria após salvar
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
        if (sucesso) setSelecionados([]); // Limpa as seleções se der tudo certo
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
        <div className="min-h-screen bg-slate-50 p-2 md:p-8 text-slate-800 overflow-x-hidden">
            <ModalComponent config={modalConfig} onClose={modalClose} />
            <ModalComponent config={detalhesTransacao} onClose={() => setDetalhesTransacao(null)} />
            <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">

                <header className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
                    <div className="flex-shrink-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Painel Financeiro</h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium capitalize">Olá, {nomeUsuario}! 👋</p>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 bg-slate-50 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg border order-3 lg:order-2 w-full lg:w-auto justify-center">
                        <button onClick={mesAnterior} className="text-slate-400 hover:text-slate-700 text-lg md:text-xl font-bold flex-shrink-0">◀</button>
                        <span className="font-semibold text-slate-700 uppercase text-center text-[11px] sm:text-xs md:text-base whitespace-nowrap">{nomesMeses[dataVis.mes - 1]} {dataVis.ano}</span>
                        <button onClick={mesProximo} className="text-slate-400 hover:text-slate-700 text-lg md:text-xl font-bold flex-shrink-0">▶</button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2 order-2 lg:order-3 justify-end flex-1 lg:flex-none">
                        {isAdmin && (<button onClick={() => { setTelaAtiva('admin'); carregarUsuarios(); }} className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium border border-purple-200 transition-colors whitespace-nowrap">👥 <span className="hidden sm:inline">Usuários</span></button>)}
                        {nomeUsuario === 'stewart' && (<button onClick={() => setTelaAtiva('garagem')} className="bg-orange-50 hover:bg-orange-100 text-orange-700 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium border border-orange-200 transition-colors whitespace-nowrap">🏍️ <span className="hidden sm:inline">Garagem</span></button>)}
                        <button onClick={() => setTelaAtiva('setup')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium border transition-colors whitespace-nowrap">⚙ <span className="hidden sm:inline">Config</span></button>
                        <button onClick={fazerLogout} className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium border border-red-100 transition-colors whitespace-nowrap">Sair</button>
                    </div>
                </header>

                {/* ================================================================= */}
                {/* CARD INTELIGENTE DE PENDÊNCIAS */}
                {/* ================================================================= */}
                {pendenciasPassadas && pendenciasPassadas.length > 0 && (
                    <div
                        onClick={abrirModalPendencias}
                        className="bg-gradient-to-r from-rose-500 to-red-600 rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row items-center justify-between border border-rose-400 gap-4"
                    >
                        <div className="flex items-center gap-4 w-full">
                            <div className="bg-white/20 p-3 rounded-full flex-shrink-0">
                                <span className="text-2xl text-white">⚠️</span>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-base md:text-lg leading-tight">Atenção! Você tem pendências antigas.</h3>
                                <p className="text-rose-100 text-xs md:text-sm mt-1">Existem {pendenciasPassadas.length} lançamento(s) de meses anteriores aguardando resolução.</p>
                            </div>
                        </div>
                        <div className="w-full md:w-auto text-center md:text-left text-white font-semibold bg-black/10 px-4 py-2 rounded-lg backdrop-blur-sm whitespace-nowrap">
                            Resolver Agora ➔
                        </div>
                    </div>
                )}
                {/* ================================================================= */}

                <div className={`grid grid-cols-2 md:grid-cols-4 ${alertaMoto ? 'lg:grid-cols-8' : 'lg:grid-cols-7'} gap-2 md:gap-4`}>
                    <div onClick={() => abrirResumoCard('rendas')} className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-emerald-500 cursor-pointer hover:bg-emerald-50 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Rendas</h3>
                        <p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(totRendaPaga)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Clique para detalhes</p>
                    </div>
                    <div onClick={() => abrirResumoCard('gastos')} className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-red-500 cursor-pointer hover:bg-red-50 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Gastos</h3>
                        <p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(totGastoReal)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Clique para detalhes</p>
                    </div>
                    <div onClick={() => abrirResumoCard('investimentos')} className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-blue-500 cursor-pointer hover:bg-blue-50 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Investimentos</h3>
                        <p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(totInvestido)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Clique para detalhes</p>
                    </div>
                    <div onClick={verFaturasPorCartao} className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-purple-500 cursor-pointer hover:bg-purple-50 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Faturas Abertas</h3>
                        <p className="text-sm md:text-lg font-bold text-purple-700 mt-1">{formatarMoeda(totFaturaCreditoAberto)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Clique para ver por cartão</p>
                    </div>
                    <div className={`p-3 md:p-4 rounded-xl shadow-sm border-l-4 transition-colors ${saldoMesAnterior >= 0 ? 'bg-teal-50 border-teal-500' : 'bg-rose-50 border-rose-400'}`}>
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Saldo Mês Anterior</h3>
                        <p className={`text-sm md:text-lg font-bold mt-1 ${saldoMesAnterior >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>{formatarMoeda(saldoMesAnterior)}</p>
                        <p className="text-[9px] text-slate-400 mb-2">{nomesMeses[mesAntRef.mes - 1]} {mesAntRef.ano}</p>
                        <button onClick={(e) => { e.stopPropagation(); setSomarSaldoAnterior(v => !v); }} className={`w-full text-[9px] md:text-[10px] font-bold py-1 px-2 rounded transition-colors border ${somarSaldoAnterior ? 'bg-teal-500 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
                            {somarSaldoAnterior ? '✔ Somando ao Saldo' : '+ Somar ao Saldo'}
                        </button>
                    </div>
                    <div onClick={() => abrirResumoCard('saldo')} className="bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-slate-400 cursor-pointer hover:bg-slate-700 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-300 uppercase">Saldo em Conta</h3>
                        <p className="text-sm md:text-lg font-bold text-white mt-1">{formatarMoeda(saldoAtual)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Clique para ver o cálculo</p>
                    </div>
                    <div onClick={() => abrirResumoCard('previsao')} className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-amber-500 cursor-pointer hover:bg-amber-50 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Previsão Fim Mês</h3>
                        <p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(previstoFimMes)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Clique para ver o cálculo</p>
                    </div>
                    {/* CARD EXCLUSIVO DA MOTO */}
                    {alertaMoto && (
                        <div className={`p-3 md:p-4 rounded-xl shadow-sm border-l-4 transition-colors ${alertaMoto.alertaCritico ? 'bg-red-50 border-red-500' : 'bg-slate-800 border-yellow-500'}`}>
                            <h3 className={`text-[10px] md:text-xs font-semibold uppercase ${alertaMoto.alertaCritico ? 'text-red-700' : 'text-slate-300'}`}>Óleo da Biz 125</h3>
                            <p className={`text-sm md:text-lg font-bold mt-1 ${alertaMoto.alertaCritico ? 'text-red-600' : 'text-white'}`}>{alertaMoto.kmFaltantes} km</p>
                            <p className={`text-[9px] mt-0.5 ${alertaMoto.alertaCritico ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                                {alertaMoto.alertaCritico ? '⚠️ Troca Urgente!' : 'Para a próxima troca'}
                            </p>
                        </div>
                    )}
                </div>

                {categorias.length > 0 && (
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
                        <h2 className="text-xs md:text-sm font-bold text-slate-600 uppercase mb-4">Progresso das Metas</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {categorias.map(c => {
                                const gas = gCat[c.nome] || 0;
                                let por = Math.min((gas / c.meta) * 100, 100);
                                let corBarra = '';

                                // CORREÇÃO: O banco pode salvar como 'despesa', 'Gasto' ou 'gasto'
                                if (c.tipo === 'despesa' || c.tipo === 'Gasto' || c.tipo === 'gasto') {
                                    // Lógica para GASTOS
                                    if (por >= 95) corBarra = 'bg-red-500';
                                    else if (por >= 80) corBarra = 'bg-amber-400';
                                    else if (por >= 50) corBarra = 'bg-blue-500';
                                    else corBarra = 'bg-emerald-500';
                                } else {
                                    // Lógica para INVESTIMENTOS E SONHOS (Inversa)
                                    if (por >= 95) corBarra = 'bg-emerald-500';
                                    else if (por >= 80) corBarra = 'bg-blue-500';
                                    else if (por >= 50) corBarra = 'bg-amber-400';
                                    else corBarra = 'bg-red-500';
                                }

                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => abrirDetalhesCategoria(c.nome, gas, c.meta, c.tipo)}
                                        className="border p-3 md:p-4 rounded-lg bg-slate-50 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                                    >
                                        <h4 className="text-xs md:text-sm font-medium mb-2 truncate" title={c.nome}>{c.nome}</h4>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden"><div className={`${corBarra} h-1.5 rounded-full transition-all duration-700 ease-out`} style={{ width: `${por}%` }}></div></div>
                                        <div className="flex justify-between text-[10px] md:text-xs text-slate-500 font-medium"><span>{formatarMoeda(gas)}</span><span>{formatarMoeda(c.meta)}</span></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border lg:col-span-1 h-fit">
                        <h2 className="text-xs md:text-sm font-bold text-slate-600 uppercase mb-4">Novo Lançamento</h2>
                        <form onSubmit={handleAdicionar} className="space-y-3 md:space-y-4">
                            <input name="descricao" placeholder="Descrição" required className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500" />
                            <input name="valor" type="number" step="0.01" placeholder="Valor (R$)" required className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500" />
                            <input name="dataCompra" type="date" required className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm text-slate-600 outline-none focus:border-blue-500" />
                            <div className="grid grid-cols-2 gap-2">
                                <select name="tipo" required className="border p-2 md:p-2.5 rounded-lg text-xs md:text-sm bg-white outline-none focus:border-blue-500"><option value="despesa">Despesa</option><option value="renda">Renda</option><option value="investimento">Invest. / Meta</option></select>
                                <select name="status" className="border p-2 md:p-2.5 rounded-lg text-xs md:text-sm bg-white outline-none focus:border-blue-500"><option value="pendente">Pendente</option><option value="pago">Pago</option></select>
                            </div>

                            {/* Categoria Inteligente */}
                            <select name="categoria" value={catFormulario} onChange={e => setCatFormulario(e.target.value)} required className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm bg-white outline-none focus:border-blue-500">
                                <option value="Sem Categoria">Sem Categoria</option><option value="Contas Fixas">Contas Fixas</option><option value="Renda Fixa">Renda Fixa</option><option value="Renda">Renda Variável</option>
                                {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                            </select>

                            {/* Campo de KM (Aparece apenas para o stewart se for Manutenção da moto ou Gasolina) */}
                            {nomeUsuario.toLowerCase() === 'stewart' && (catFormulario === 'Gasolina' || catFormulario === 'Manutenção da moto') && (
                                <input name="kmMoto" type="number" placeholder="Km atual (deixe vazio se for veículo convidado)" className="w-full border-2 border-amber-400 bg-amber-50 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-amber-600" />
                            )}

                            <select name="formaPagamento" required className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm bg-white outline-none focus:border-blue-500"><option value="pix">PIX / Dinheiro</option><option value="debito">Débito</option>{cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito - {c.nome}</option>)}</select>
                            <input name="parcelas" type="number" min="1" placeholder="Qtd. Parcelas (Apenas Crédito)" className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500" />
                            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 md:py-3 rounded-lg text-xs md:text-sm transition-colors shadow-sm">Adicionar</button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border lg:col-span-2 flex flex-col overflow-hidden w-full">
                        <div className="p-3 md:p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 bg-slate-50 rounded-t-xl">
                            <div className="flex bg-white rounded-lg border p-1 w-full md:w-auto">
                                <button onClick={() => setFiltroStatus('todos')} className={`px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md flex-1 ${filtroStatus === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Todos</button>
                                <button onClick={() => setFiltroStatus('pendente')} className={`px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md flex-1 ${filtroStatus === 'pendente' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100'}`}>Pendentes</button>
                                <button onClick={() => setFiltroStatus('pago')} className={`px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md flex-1 ${filtroStatus === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>Pagos</button>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <input type="text" placeholder="🔍 Buscar..." value={buscaTexto} onChange={(e) => setBuscaTexto(e.target.value)} className="w-full md:w-48 lg:w-64 border border-slate-300 p-1.5 md:p-2 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500" />
                                <button onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)} className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg border text-[10px] md:text-sm font-bold transition-colors ${mostrarFiltrosAvancados ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                                    Filtros {mostrarFiltrosAvancados ? '▲' : '▼'}
                                </button>
                            </div>
                        </div>

                        {mostrarFiltrosAvancados && (
                            <div className="p-3 md:p-4 border-b bg-blue-50/50 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1">Período de Data</label>
                                    <div className="flex gap-2">
                                        <input type="date" value={filtrosAvancados.dataInicio} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataInicio: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                                        <input type="date" value={filtrosAvancados.dataFim} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataFim: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1">Faixa de Valor (R$)</label>
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="Mín." value={filtrosAvancados.valorMin} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMin: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                                        <input type="number" placeholder="Máx." value={filtrosAvancados.valorMax} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMax: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1">Pagamento e Categoria</label>
                                    <div className="flex gap-2">
                                        <select value={filtrosAvancados.formaPagamento} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, formaPagamento: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs bg-white">
                                            <option value="">Qualquer</option>
                                            <option value="pix">PIX / Dinheiro</option>
                                            <option value="debito">Débito</option>
                                            <option value="credito" className="font-bold">💳 Todos do Crédito</option>
                                            {cartoes.map(c => (
                                                <option key={c.id} value={`credito_${c.id}`}>&nbsp;&nbsp;↳ Só {c.nome}</option>
                                            ))}
                                        </select>
                                        <select value={filtrosAvancados.categoria} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, categoria: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs bg-white">
                                            <option value="">Qualquer</option>
                                            {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="md:col-span-3 flex justify-end">
                                    <button onClick={() => setFiltrosAvancados({ dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: '' })} className="text-[10px] md:text-xs text-red-500 hover:underline font-bold">Limpar Filtros</button>
                                </div>
                            </div>
                        )}

                        <div className="w-full">

                            {selecionados.length > 0 && (
                                <div className="bg-indigo-50 border-t border-b border-indigo-100 p-2 md:p-3 flex flex-col md:flex-row justify-between items-center gap-3 transition-all">
                                    <span className="text-xs md:text-sm font-bold text-indigo-700">☑ {selecionados.length} lançamento(s) selecionado(s)</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAcaoMassa('pago')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">✔ Marcar Pagos</button>
                                        <button onClick={() => handleAcaoMassa('pendente')} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">⏳ Marcar Pendentes</button>
                                        <button onClick={() => handleAcaoMassa('excluir')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">🗑️ Excluir</button>
                                    </div>
                                </div>
                            )}

                            {/* TABELA — DESKTOP */}
                            <div className="hidden md:block w-full">
                                <table className="w-full text-left text-slate-600 table-fixed">
                                    <thead className="bg-slate-50 text-xs uppercase font-semibold border-b select-none">
                                        <tr>
                                            <th className="px-3 py-3 w-10 text-center">
                                                <input type="checkbox" checked={todosSelecionados} onChange={toggleSelectAll} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-3 cursor-pointer hover:bg-slate-100" onClick={() => mudarOrdenacao('descricao')}>Descrição {ordenacao.coluna === 'descricao' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="px-3 py-3 w-32 cursor-pointer hover:bg-slate-100" onClick={() => mudarOrdenacao('categoria')}>Categoria {ordenacao.coluna === 'categoria' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="px-3 py-3 w-24 cursor-pointer hover:bg-slate-100" onClick={() => mudarOrdenacao('data')}>Data {ordenacao.coluna === 'data' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="px-3 py-3 w-24 cursor-pointer hover:bg-slate-100" onClick={() => mudarOrdenacao('status')}>Status {ordenacao.coluna === 'status' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="px-3 py-3 w-20 cursor-pointer hover:bg-slate-100" onClick={() => mudarOrdenacao('pagamento')}>Pgto. {ordenacao.coluna === 'pagamento' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="px-3 py-3 w-28 text-right cursor-pointer hover:bg-slate-100" onClick={() => mudarOrdenacao('valor')}>Valor {ordenacao.coluna === 'valor' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {dadosTabela.length === 0 && (
                                            <tr><td colSpan="7" className="py-12 text-center text-slate-400 text-sm">Nenhum lançamento encontrado.</td></tr>
                                        )}
                                        {dadosTabela.map(t => (
                                            <tr key={t.id} className={`hover:bg-indigo-50/30 transition-colors ${selecionados.includes(t.id) ? 'bg-indigo-50/50' : ''}`}>
                                                <td className="px-3 py-3 text-center">
                                                    <input type="checkbox" checked={selecionados.includes(t.id)} onChange={() => toggleSelect(t.id)} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <button onClick={() => abrirDetalhes(t)} className="text-left w-full group">
                                                        <span className="block font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate text-sm">{t.descricao}</span>
                                                        {t.grupo_id && <span className="text-[10px] text-blue-400 font-normal">🔗 parcelado</span>}
                                                        {t.comprovante_url && nomeUsuario === 'stewart' && <span className="text-[10px] text-emerald-500 font-normal ml-1">📎</span>}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full block truncate text-center" title={t.categoria}>{t.categoria}</span>
                                                </td>
                                                <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                    {new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <button onClick={() => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra)} className={`px-2 py-1 rounded-full text-xs font-bold uppercase w-full transition-transform hover:scale-105 ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {t.status}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="text-xs font-bold bg-slate-100 border px-2 py-1 rounded block text-center truncate" title={obterNomePagamento(t.formaPagamento)}>
                                                        {t.formaPagamento ? t.formaPagamento.split('_')[0].toUpperCase() : 'PIX'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 font-bold text-slate-800 text-right whitespace-nowrap text-sm">
                                                    {formatarMoeda(t.valorParcela)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* CARDS — MOBILE */}
                            <div className="md:hidden">
                                {/* Barra de ordenação mobile */}
                                <div className="px-3 py-2 bg-slate-50 border-b flex items-center gap-1.5 overflow-x-auto">
                                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">Ordenar:</span>
                                    {[
                                        { coluna: 'data', label: 'Data' },
                                        { coluna: 'valor', label: 'Valor' },
                                        { coluna: 'status', label: 'Status' },
                                        { coluna: 'descricao', label: 'Nome' },
                                        { coluna: 'categoria', label: 'Categ.' },
                                        { coluna: 'pagamento', label: 'Pgto.' },
                                    ].map(({ coluna, label }) => {
                                        const ativo = ordenacao.coluna === coluna;
                                        return (
                                            <button
                                                key={coluna}
                                                onClick={() => mudarOrdenacao(coluna)}
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors flex-shrink-0 ${ativo ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                            >
                                                {label} {ativo ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {dadosTabela.length === 0 && (
                                        <p className="py-10 text-center text-slate-400 text-sm">Nenhum lançamento encontrado.</p>
                                    )}
                                    {dadosTabela.map(t => (
                                        <div key={t.id} className={`p-3 transition-colors ${selecionados.includes(t.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                    <input type="checkbox" checked={selecionados.includes(t.id)} onChange={() => toggleSelect(t.id)} className="w-4 h-4 accent-indigo-600 cursor-pointer mt-0.5 flex-shrink-0" />
                                                    <button onClick={() => abrirDetalhes(t)} className="text-left min-w-0 group">
                                                        <p className="font-bold text-slate-800 text-sm leading-tight group-hover:text-indigo-600 transition-colors">{t.descricao}</p>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            {t.grupo_id && <span className="text-[10px] text-blue-400">🔗 parcelado</span>}
                                                            {t.comprovante_url && nomeUsuario === 'stewart' && <span className="text-[10px] text-emerald-500">📎</span>}
                                                        </div>
                                                    </button>
                                                </div>
                                                <p className="font-bold text-slate-800 text-sm whitespace-nowrap">{formatarMoeda(t.valorParcela)}</p>
                                            </div>
                                            <div className="flex items-center justify-between ml-6">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{t.categoria}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                </div>
                                                <button onClick={() => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra)} className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {t.status}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}