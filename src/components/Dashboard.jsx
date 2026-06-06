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
    ModalComponent, modalConfig, modalClose, executarAcaoEmMassa
}) {

    const [selecionados, setSelecionados] = useState([]);
    const [catFormulario, setCatFormulario] = useState('Sem Categoria'); // Rastreia a categoria escolhida
    const todosSelecionados = dadosTabela.length > 0 && selecionados.length === dadosTabela.length;

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
            <div className="mx-auto max-w-6xl space-y-4 md:space-y-6">

                <header className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
                    <div><h1 className="text-xl md:text-2xl font-bold text-slate-900">Painel Financeiro</h1><p className="text-xs md:text-sm text-slate-500 font-medium capitalize">Olá, {nomeUsuario}! 👋</p></div>
                    <div className="flex items-center gap-2 md:gap-4 mt-4 md:mt-0 bg-slate-50 px-4 py-2 rounded-lg border">
                        <button onClick={mesAnterior} className="text-slate-400 hover:text-slate-700 text-lg md:text-xl font-bold">◀</button>
                        <span className="font-semibold text-slate-700 uppercase min-w-24 md:min-w-30 text-center text-xs md:text-base">{nomesMeses[dataVis.mes - 1]} {dataVis.ano}</span>
                        <button onClick={mesProximo} className="text-slate-400 hover:text-slate-700 text-lg md:text-xl font-bold">▶</button>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto">
                        {isAdmin && (<button onClick={() => { setTelaAtiva('admin'); carregarUsuarios(); }} className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-xs md:text-sm font-medium border border-purple-200 transition-colors flex-1 md:flex-none">👥 Usuários</button>)}
                        <button onClick={() => setTelaAtiva('setup')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs md:text-sm font-medium border transition-colors flex-1 md:flex-none">⚙ Config</button>
                        <button onClick={fazerLogout} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-xs md:text-sm font-medium border border-red-100 transition-colors flex-1 md:flex-none">Sair</button>
                    </div>
                </header>

                <div className={`grid grid-cols-2 md:grid-cols-4 ${alertaMoto ? 'lg:grid-cols-8' : 'lg:grid-cols-7'} gap-2 md:gap-4`}>
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-emerald-500"><h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Rendas</h3><p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(totRendaPaga)}</p></div>
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-red-500"><h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Gastos</h3><p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(totGastoReal)}</p></div>
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-blue-500"><h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Investimentos</h3><p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(totInvestido)}</p></div>
                    <div onClick={verFaturasPorCartao} className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-purple-500 cursor-pointer hover:bg-purple-50 transition-colors">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Faturas Abertas</h3>
                        <p className="text-sm md:text-lg font-bold text-purple-700 mt-1">{formatarMoeda(totFaturaCreditoAberto)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Clique para ver por cartão</p>
                    </div>
                    <div className={`p-3 md:p-4 rounded-xl shadow-sm border-l-4 transition-colors ${saldoMesAnterior >= 0 ? 'bg-teal-50 border-teal-500' : 'bg-rose-50 border-rose-400'}`}>
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Saldo Mês Anterior</h3>
                        <p className={`text-sm md:text-lg font-bold mt-1 ${saldoMesAnterior >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>{formatarMoeda(saldoMesAnterior)}</p>
                        <p className="text-[9px] text-slate-400 mb-2">{nomesMeses[mesAntRef.mes - 1]} {mesAntRef.ano}</p>
                        <button onClick={() => setSomarSaldoAnterior(v => !v)} className={`w-full text-[9px] md:text-[10px] font-bold py-1 px-2 rounded transition-colors border ${somarSaldoAnterior ? 'bg-teal-500 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
                            {somarSaldoAnterior ? '✔ Somando ao Saldo' : '+ Somar ao Saldo'}
                        </button>
                    </div>
                    <div className="bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-slate-400">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-300 uppercase">Saldo em Conta</h3>
                        <p className="text-sm md:text-lg font-bold text-white mt-1">{formatarMoeda(saldoAtual)}</p>
                        {somarSaldoAnterior ? <p className="text-[9px] text-slate-400 mt-0.5">Mês: {formatarMoeda(saldoMesAtual)} + Ant.: {formatarMoeda(saldoMesAnterior)}</p> : <p className="text-[9px] text-slate-500 mt-0.5">Apenas mês atual</p>}
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-amber-500">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Previsão Fim Mês</h3>
                        <p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(previstoFimMes)}</p>
                        {somarSaldoAnterior && <p className="text-[9px] text-amber-600 font-medium mt-0.5">+ Inclui Saldo Ant.</p>}
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
                                <input name="kmMoto" type="number" placeholder="Km atual do painel da Biz" required className="w-full border-2 border-amber-400 bg-amber-50 p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-amber-600" />
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

                            {/* BARRA DE FERRAMENTAS FLUTUANTE (Aparece ao selecionar) */}
                            {selecionados.length > 0 && (
                                <div className="bg-indigo-50 border-t border-b border-indigo-100 p-2 md:p-3 flex flex-col md:flex-row justify-between items-center gap-3 transition-all">
                                    <span className="text-xs md:text-sm font-bold text-indigo-700">
                                        ☑ {selecionados.length} lançamento(s) selecionado(s)
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAcaoMassa('pago')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">✔ Marcar Pagos</button>
                                        <button onClick={() => handleAcaoMassa('pendente')} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">⏳ Marcar Pendentes</button>
                                        <button onClick={() => handleAcaoMassa('excluir')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">🗑️ Excluir</button>
                                    </div>
                                </div>
                            )}

                            <table className="w-full text-left text-[9px] sm:text-[10px] md:text-sm text-slate-600 table-fixed">
                                <thead className="bg-white text-[8px] sm:text-[9px] md:text-xs uppercase font-semibold border-b select-none">
                                    <tr>
                                        <th className="p-1 sm:p-2 md:p-4 w-[5%] text-center">
                                            <input type="checkbox" checked={todosSelecionados} onChange={toggleSelectAll} className="w-3 h-3 md:w-4 md:h-4 accent-indigo-600 cursor-pointer" />
                                        </th>
                                        <th className="p-1 sm:p-2 md:p-4 w-[25%] cursor-pointer hover:bg-slate-50" onClick={() => mudarOrdenacao('descricao')}>Desc. {ordenacao.coluna === 'descricao' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-1 sm:p-2 md:p-4 w-[15%] cursor-pointer hover:bg-slate-50" onClick={() => mudarOrdenacao('categoria')}>Categ. {ordenacao.coluna === 'categoria' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-1 sm:p-2 md:p-4 w-[10%] cursor-pointer hover:bg-slate-50" onClick={() => mudarOrdenacao('data')}>Data {ordenacao.coluna === 'data' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-1 sm:p-2 md:p-4 w-[12%] cursor-pointer hover:bg-slate-50" onClick={() => mudarOrdenacao('status')}>Status {ordenacao.coluna === 'status' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-1 sm:p-2 md:p-4 w-[11%] cursor-pointer hover:bg-slate-50" onClick={() => mudarOrdenacao('pagamento')}>Pgto. {ordenacao.coluna === 'pagamento' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-1 sm:p-2 md:p-4 w-[13%] cursor-pointer hover:bg-slate-50 text-right" onClick={() => mudarOrdenacao('valor')}>Valor {ordenacao.coluna === 'valor' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-1 sm:p-2 md:p-4 w-[9%] text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dadosTabela.length === 0 && (<tr><td colSpan="8" className="p-4 md:p-8 text-center text-slate-400 font-medium text-xs">Nenhum lançamento encontrado.</td></tr>)}
                                    {dadosTabela.map(t => (
                                        <tr key={t.id} className={`hover:bg-indigo-50/30 transition-colors ${selecionados.includes(t.id) ? 'bg-indigo-50/50' : ''}`}>

                                            <td className="p-1 sm:p-2 md:p-4 text-center">
                                                <input type="checkbox" checked={selecionados.includes(t.id)} onChange={() => toggleSelect(t.id)} className="w-3 h-3 md:w-4 md:h-4 accent-indigo-600 cursor-pointer" />
                                            </td>

                                            <td className="p-1 sm:p-2 md:p-4 font-bold text-slate-800 break-words leading-tight" title={t.descricao}>
                                                {t.descricao}
                                                {t.grupo_id && <span className="ml-1 text-[7px] text-blue-400 font-normal cursor-help" title="Compra parcelada.">🔗</span>}
                                            </td>

                                            <td className="p-1 sm:p-2 md:p-4"><span className="text-[7px] sm:text-[9px] md:text-xs bg-slate-100 px-1 py-0.5 md:px-2 md:py-1 rounded block truncate w-full cursor-help" title={`Categoria: ${t.categoria}`}>{t.categoria}</span></td>
                                            <td className="p-1 sm:p-2 md:p-4"><span className="text-[8px] md:text-xs text-slate-400 font-medium break-words cursor-help" title={`Lançado no dia: ${new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`}>{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span></td>
                                            <td className="p-1 sm:p-2 md:p-4"><button onClick={() => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra)} className={`px-1 py-0.5 md:px-2 md:py-1 rounded text-[7px] md:text-[10px] font-bold uppercase transition-transform hover:scale-105 w-full truncate ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`} title={t.status === 'pago' ? 'Status: PAGO' : 'Status: PENDENTE'}>{t.status}</button></td>
                                            <td className="p-1 sm:p-2 md:p-4"><span className="text-[7px] md:text-[10px] uppercase text-slate-500 font-bold bg-slate-100 border px-1 py-0.5 md:px-2 md:py-1 rounded block w-full truncate text-center cursor-help" title={obterNomePagamento(t.formaPagamento)}>{t.formaPagamento ? t.formaPagamento.split('_')[0] : 'PIX'}</span></td>
                                            <td className="p-1 sm:p-2 md:p-4 font-bold text-slate-800 text-right text-[9px] md:text-sm break-words" title={`Valor: ${formatarMoeda(t.valorParcela)}`}>{formatarMoeda(t.valorParcela)}</td>
                                            <td className="p-1 sm:p-2 md:p-4">
                                                <div className="flex flex-col lg:flex-row justify-center items-center gap-1">
                                                    <button onClick={() => editarValor(t)} className="bg-white border text-slate-500 hover:bg-slate-100 px-1.5 py-1 md:px-2 md:py-1 rounded text-[8px] md:text-xs transition-colors w-full md:w-auto" title="Editar">✏️</button>
                                                    <button onClick={() => deletarTransacao(t)} className="bg-red-50 text-red-500 hover:bg-red-100 px-1.5 py-1 md:px-2 md:py-1 rounded text-[8px] md:text-xs transition-colors w-full md:w-auto" title="Excluir">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}