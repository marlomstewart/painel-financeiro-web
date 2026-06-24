import React, { useState } from 'react';
import { format } from 'date-fns';

export function Dashboard({
    nomeUsuario, alertaMoto, abrirDetalhesCategoria, dataVis, mesAnterior, mesProximo,
    isAdmin, setTelaAtiva, carregarUsuarios, fazerLogout,
    totRendaPaga, totGastoReal, totInvestido, verFaturasPorCartao, totFaturaCreditoAberto,
    saldoMesAnterior, somarSaldoAnterior, setSomarSaldoAnterior, saldoAtual, saldoMesAtual,
    mesAntRef, previstoFimMes, categorias, gCat, cartoes,
    filtroStatus, setFiltroStatus, buscaTexto, setBuscaTexto,
    mostrarFiltrosAvancados, setMostrarFiltrosAvancados, filtrosAvancados, setFiltrosAvancados,
    mudarOrdenacao, ordenacao, dadosTabela,
    pendenciasPassadas, abrirModalPendencias, abrirResumoCard, ModalComponent, modalConfig, modalClose,
    addTransacao, alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa,
    anexarComprovante, removerComprovante, verComprovante, pagarFaturaCartao
}) {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [dataCompra, setDataCompra] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [tipo, setTipo] = useState('despesa');
    const [status, setStatus] = useState('pendente');
    const [categoria, setCategoria] = useState('Sem Categoria');
    const [formaPagamento, setFormaPagamento] = useState('pix');
    const [parcelas, setParcelas] = useState(1);
    const [transacoesSelecionadas, setTransacoesSelecionadas] = useState([]);

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        const sucesso = await addTransacao({ descricao, valor, dataCompra, tipo, status, categoria, formaPagamento, parcelas });
        if (sucesso) {
            setDescricao(''); setValor(''); setDataCompra(format(new Date(), 'yyyy-MM-dd')); setTipo('despesa'); setStatus('pendente'); setCategoria('Sem Categoria'); setFormaPagamento('pix'); setParcelas(1);
        }
    };

    const toggleSelecao = (id) => { setTransacoesSelecionadas(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]); };
    const selecionarTodas = () => { if (transacoesSelecionadas.length === dadosTabela.length) setTransacoesSelecionadas([]); else setTransacoesSelecionadas(dadosTabela.map(t => t.id)); };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] pb-20 transition-colors duration-300">
            {/* HEADER SUPERIOR */}
            <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500 text-2xl">⚡</span>
                        <h1 className="text-xl font-black tracking-tight">Financeiro</h1>
                        <span className="ml-2 text-sm text-slate-400 border-l border-slate-700 pl-2 hidden md:block">Olá, <span className="text-slate-200 font-bold">{nomeUsuario}</span></span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {isAdmin && <button onClick={() => setTelaAtiva('admin')} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer">👥 Admin</button>}
                        <button onClick={() => setTelaAtiva('setup')} className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer">⚙️ Setup</button>
                        <button onClick={() => setTelaAtiva('garagem')} className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold rounded flex items-center gap-1 transition relative cursor-pointer">
                            🚗 Garagem {alertaMoto && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>}
                        </button>
                        <button onClick={fazerLogout} className="px-3 py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer">🚪 Sair</button>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
                {/* CONTROLES E AVISOS */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <button type="button" onClick={mesAnterior} className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-800 rounded shadow-sm text-slate-600 dark:text-slate-300 transition cursor-pointer">◀</button>
                        <span className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-sm w-32 text-center">{nomesMeses[dataVis.mes - 1]} {dataVis.ano}</span>
                        <button type="button" onClick={mesProximo} className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-800 rounded shadow-sm text-slate-600 dark:text-slate-300 transition cursor-pointer">▶</button>
                    </div>
                </div>

                {pendenciasPassadas.length > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-4 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div><p className="text-sm font-bold text-rose-800 dark:text-rose-400">Você tem {pendenciasPassadas.length} conta(s) atrasada(s)!</p></div>
                        </div>
                        <button type="button" onClick={abrirModalPendencias} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition cursor-pointer">Resolver</button>
                    </div>
                )}

                {/* CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <div onClick={() => abrirResumoCard('rendas')} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 transition group">
                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-emerald-500 transition">Rendas Pagas</p>
                        <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatarMoeda(totRendaPaga)}</h3>
                    </div>
                    <div onClick={() => abrirResumoCard('gastos')} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-red-400 transition group">
                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-red-500 transition">Gastos (Real)</p>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{formatarMoeda(totGastoReal)}</h3>
                    </div>
                    <div onClick={() => abrirResumoCard('investimentos')} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 transition group">
                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-blue-500 transition">Investimentos</p>
                        <h3 className="text-xl font-black text-blue-600 dark:text-blue-400">{formatarMoeda(totInvestido)}</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition group">
                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Faturas Abertas</p>
                        <h3 className="text-xl font-black text-purple-600 dark:text-purple-400">{formatarMoeda(totFaturaCreditoAberto)}</h3>
                    </div>
                    <div onClick={() => abrirResumoCard('saldo')} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-400 transition group relative">
                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-indigo-500 transition">Saldo em Conta</p>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{formatarMoeda(saldoAtual)}</h3>
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            <input type="checkbox" checked={somarSaldoAnterior} onChange={(e) => { e.stopPropagation(); setSomarSaldoAnterior(e.target.checked); }} className="cursor-pointer scale-75" />
                            <span className="text-[8px] font-bold text-slate-500">Mês Ant.</span>
                        </div>
                    </div>
                    <div onClick={() => abrirResumoCard('previsao')} className={`p-5 rounded-xl shadow-sm border cursor-pointer transition group ${previstoFimMes >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                        <p className={`text-[10px] uppercase font-bold mb-1 transition ${previstoFimMes >= 0 ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-700 dark:text-red-500'}`}>Previsão Fim Mês</p>
                        <h3 className={`text-xl font-black ${previstoFimMes >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'}`}>{formatarMoeda(previstoFimMes)}</h3>
                    </div>
                </div>

                {/* METAS */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">🎯 Progresso das Metas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {categorias.map(c => {
                            const gasto = gCat[c.nome] || 0;
                            let pct = c.meta > 0 ? (gasto / c.meta) * 100 : 0;
                            if (pct > 100) pct = 100;
                            let corBarra = c.tipo === 'despesa' ? (pct < 50 ? "bg-emerald-500" : pct < 85 ? "bg-amber-500" : "bg-rose-500") : (pct >= 100 ? "bg-emerald-500" : pct > 50 ? "bg-blue-500" : "bg-slate-400");
                            return (
                                <div key={c.id} onClick={() => abrirDetalhesCategoria(c.nome, gasto, c.meta, c.tipo)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-lg cursor-pointer hover:-translate-y-0.5 transition">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate pr-2">{c.nome}</p>
                                        <span className="text-[10px] font-black text-slate-500 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">{Math.round(pct)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                                        <div className={`${corBarra} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatarMoeda(gasto)}</span>
                                        <span className="text-slate-400">{formatarMoeda(c.meta)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FORMULÁRIO E TABELA */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm h-fit">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Novo Lançamento</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-xs font-semibold mb-1 dark:text-slate-400">Descrição</label><input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-xs font-semibold mb-1 dark:text-slate-400">Valor</label><input type="number" step="0.01" min="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                <div><label className="block text-xs font-semibold mb-1 dark:text-slate-400">Data</label><input type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-xs font-semibold mb-1 dark:text-slate-400">Tipo</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm dark:text-slate-200 outline-none"><option value="despesa">Despesa</option><option value="renda">Renda</option><option value="investimento">Investimento</option></select></div>
                                <div><label className="block text-xs font-semibold mb-1 dark:text-slate-400">Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm dark:text-slate-200 outline-none"><option value="pendente">Pendente</option><option value="pago">Pago</option></select></div>
                            </div>
                            <div><label className="block text-xs font-semibold mb-1 dark:text-slate-400">Categoria</label><select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm dark:text-slate-200 outline-none"><option value="Sem Categoria">Sem Categoria</option><option value="Contas Fixas">Contas Fixas</option>{categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select></div>
                            <div><label className="block text-xs font-semibold mb-1 dark:text-slate-400">Pagamento</label><select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm dark:text-slate-200 outline-none"><option value="pix">PIX / Dinheiro</option><option value="debito">Cartão de Débito</option>{cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}</select></div>
                            {formaPagamento.startsWith('credito_') && (
                                <div><label className="block text-xs font-semibold mb-1 dark:text-slate-400">Parcelas</label><input type="number" min="1" max="48" value={parcelas} onChange={(e) => setParcelas(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm dark:text-slate-200 outline-none" /></div>
                            )}
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm shadow-md cursor-pointer transition">Adicionar Lançamento</button>
                        </form>
                    </div>

                    <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <input type="text" placeholder="Buscar..." value={buscaTexto} onChange={(e) => setBuscaTexto(e.target.value)} className="w-full sm:w-64 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        {transacoesSelecionadas.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 mb-4 flex justify-between items-center rounded-lg border border-blue-200 dark:border-blue-800">
                                <span className="text-sm font-bold text-blue-800 dark:text-blue-300">{transacoesSelecionadas.length} selecionados</span>
                                <div className="flex gap-2">
                                    <button onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'pago'); setTransacoesSelecionadas([]); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-bold rounded cursor-pointer">Pagar</button>
                                    <button onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'excluir'); setTransacoesSelecionadas([]); }} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 text-xs font-bold rounded cursor-pointer">Excluir</button>
                                </div>
                            </div>
                        )}
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg flex-1">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold">
                                    <tr>
                                        <th className="p-3 w-10 text-center"><input type="checkbox" onChange={selecionarTodas} checked={dadosTabela.length > 0 && transacoesSelecionadas.length === dadosTabela.length} className="cursor-pointer" /></th>
                                        <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" onClick={() => mudarOrdenacao('descricao')}>Descrição</th>
                                        <th className="p-3 cursor-pointer hidden sm:table-cell hover:text-slate-700 dark:hover:text-slate-200" onClick={() => mudarOrdenacao('data')}>Data</th>
                                        <th className="p-3 cursor-pointer text-center hover:text-slate-700 dark:hover:text-slate-200" onClick={() => mudarOrdenacao('status')}>Status</th>
                                        <th className="p-3 cursor-pointer text-right hover:text-slate-700 dark:hover:text-slate-200" onClick={() => mudarOrdenacao('valor')}>Valor</th>
                                        <th className="p-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {dadosTabela.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                                            <td className="p-3 text-center"><input type="checkbox" checked={transacoesSelecionadas.includes(t.id)} onChange={() => toggleSelecao(t.id)} className="cursor-pointer" /></td>
                                            <td className="p-3"><p className="font-semibold text-slate-800 dark:text-slate-200">{t.descricao}</p><p className="text-[10px] text-slate-500">{t.categoria}</p></td>
                                            <td className="p-3 text-slate-600 dark:text-slate-400 text-xs hidden sm:table-cell">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                            <td className="p-3 text-center"><button onClick={() => alternarStatusTransacao(t.id, t.status)} className={`px-2 py-1 text-[10px] font-bold uppercase rounded cursor-pointer transition ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200'}`}>{t.status}</button></td>
                                            <td className={`p-3 text-right font-bold ${t.tipo === 'renda' ? 'text-emerald-600 dark:text-emerald-400' : t.tipo === 'investimento' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{formatarMoeda(t.valorParcela)}</td>
                                            <td className="p-3 text-center space-x-2">
                                                <button onClick={() => editarValor(t.id, t.valorParcela)} className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer">✏️</button>
                                                <button onClick={() => deletarTransacao(t.id)} className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer">🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}