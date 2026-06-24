import React, { useState } from 'react';

export function Lancamentos({
    categorias, cartoes, addTransacao,
    filtroStatus, setFiltroStatus, buscaTexto, setBuscaTexto,
    mostrarFiltrosAvancados, setMostrarFiltrosAvancados, filtrosAvancados, setFiltrosAvancados,
    mudarOrdenacao, ordenacao, dadosTabela,
    alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa
}) {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
    const [tipo, setTipo] = useState('despesa');
    const [status, setStatus] = useState('pendente');
    const [categoria, setCategoria] = useState('Sem Categoria');
    const [formaPagamento, setFormaPagamento] = useState('pix');
    const [parcelas, setParcelas] = useState(1);
    const [transacoesSelecionadas, setTransacoesSelecionadas] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const sucesso = await addTransacao({ descricao, valor, dataCompra, tipo, status, categoria, formaPagamento, parcelas });
        if (sucesso) {
            setDescricao(''); setValor(''); setDataCompra(new Date().toISOString().split('T')[0]); setTipo('despesa'); setStatus('pendente'); setCategoria('Sem Categoria'); setFormaPagamento('pix'); setParcelas(1);
        }
    };

    const toggleSelecao = (id) => {
        setTransacoesSelecionadas(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);
    };
    const selecionarTodas = () => {
        if (transacoesSelecionadas.length === dadosTabela.length) setTransacoesSelecionadas([]);
        else setTransacoesSelecionadas(dadosTabela.map(t => t.id));
    };

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">💸 Lançamentos e Extrato</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Registre novas movimentações e audite seu histórico mensal.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm h-fit">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Novo Lançamento</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descrição</label><input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="Ex: Supermercado" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor (R$)</label><input type="number" step="0.01" min="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="0.00" /></div>
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Data</label><input type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tipo</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"><option value="despesa">Despesa</option><option value="renda">Renda</option><option value="investimento">Investimento</option></select></div>
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"><option value="pendente">Pendente</option><option value="pago">Pago / Recebido</option></select></div>
                        </div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Categoria</label><select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"><option value="Sem Categoria">Sem Categoria</option><option value="Contas Fixas">Contas Fixas</option>{categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Pagamento</label><select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"><option value="pix">PIX / Dinheiro</option><option value="debito">Cartão de Débito</option>{cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}</select></div>
                        {formaPagamento.startsWith('credito_') && (
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Parcelas</label><input type="number" min="1" max="48" value={parcelas} onChange={(e) => setParcelas(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" /></div>
                        )}
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">Adicionar Lançamento</button>
                    </form>
                </div>

                <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                        <input type="text" placeholder="Buscar lançamentos..." value={buscaTexto} onChange={(e) => setBuscaTexto(e.target.value)} className="w-full sm:w-64 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" />
                        <div className="flex gap-2 w-full sm:w-auto">
                            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-200 outline-none">
                                <option value="todos">Todos os Status</option>
                                <option value="pago">Apenas Pagos</option>
                                <option value="pendente">Apenas Pendentes</option>
                            </select>
                        </div>
                    </div>

                    {transacoesSelecionadas.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 mb-4 flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">{transacoesSelecionadas.length} selecionados</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'pago'); setTransacoesSelecionadas([]); }} className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 cursor-pointer transition">Pagar</button>
                                <button type="button" onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'pendente'); setTransacoesSelecionadas([]); }} className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded hover:bg-amber-600 cursor-pointer transition">Pendente</button>
                                <button type="button" onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'excluir'); setTransacoesSelecionadas([]); }} className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700 cursor-pointer transition">Excluir</button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto flex-1 rounded-lg border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                                <tr>
                                    <th className="p-3 text-center w-10"><input type="checkbox" onChange={selecionarTodas} checked={dadosTabela.length > 0 && transacoesSelecionadas.length === dadosTabela.length} className="cursor-pointer" /></th>
                                    <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" onClick={() => mudarOrdenacao('descricao')}>Descrição {ordenacao.coluna === 'descricao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                    <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 hidden sm:table-cell" onClick={() => mudarOrdenacao('data')}>Data {ordenacao.coluna === 'data' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                    <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-center" onClick={() => mudarOrdenacao('status')}>Status {ordenacao.coluna === 'status' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                    <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-right" onClick={() => mudarOrdenacao('valor')}>Valor {ordenacao.coluna === 'valor' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                    <th className="p-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {dadosTabela.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400">Nenhum lançamento.</td></tr>
                                ) : (
                                    dadosTabela.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="p-3 text-center"><input type="checkbox" checked={transacoesSelecionadas.includes(t.id)} onChange={() => toggleSelecao(t.id)} className="cursor-pointer" /></td>
                                            <td className="p-3">
                                                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-xs">{t.descricao}</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{t.categoria} • {t.formaPagamento.replace('credito_', 'Crédito ')}</p>
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-400 text-xs hidden sm:table-cell">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                            <td className="p-3 text-center">
                                                <button type="button" onClick={() => alternarStatusTransacao(t.id, t.status)} className={`px-2 py-1 text-[10px] font-bold uppercase rounded cursor-pointer transition ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{t.status}</button>
                                            </td>
                                            <td className={`p-3 text-right font-bold ${t.tipo === 'renda' ? 'text-emerald-600 dark:text-emerald-400' : t.tipo === 'investimento' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{formatarMoeda(t.valorParcela)}</td>
                                            <td className="p-3 text-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={() => editarValor(t.id, t.valorParcela)} className="text-blue-500 hover:text-blue-700 cursor-pointer">✏️</button>
                                                <button type="button" onClick={() => deletarTransacao(t.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer">🗑️</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}