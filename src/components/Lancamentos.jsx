import React, { useState } from 'react';

export function Lancamentos({
    categorias, cartoes, addTransacao,
    filtroStatus, setFiltroStatus, buscaTexto, setBuscaTexto,
    mostrarFiltrosAvancados, setMostrarFiltrosAvancados, filtrosAvancados, setFiltrosAvancados,
    mudarOrdenacao, ordenacao, dadosTabela,
    alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa,
    modal, nomeUsuario, anexarComprovante, verComprovante
}) {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
    const [tipo, setTipo] = useState('despesa');
    const [status, setStatus] = useState('pendente');
    const [categoria, setCategoria] = useState('Sem Categoria');
    const [formaPagamento, setFormaPagamento] = useState('pix');
    const [parcelas, setParcelas] = useState(1);
    const [observacao, setObservacao] = useState('');

    // Novo State para capturar o Hodômetro da Moto
    const [kmMoto, setKmMoto] = useState('');

    const [transacoesSelecionadas, setTransacoesSelecionadas] = useState([]);

    const handleSubmit = async (e) => {
        const sucesso = await addTransacao(e);
        if (sucesso) {
            setDescricao(''); setValor(''); setObservacao(''); setKmMoto(''); setDataCompra(new Date().toISOString().split('T')[0]); setTipo('despesa'); setStatus('pendente'); setCategoria('Sem Categoria'); setFormaPagamento('pix'); setParcelas(1);
        }
    };

    const toggleSelecao = (id) => { setTransacoesSelecionadas(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]); };
    const selecionarTodas = () => { if (transacoesSelecionadas.length === dadosTabela.length) setTransacoesSelecionadas([]); else setTransacoesSelecionadas(dadosTabela.map(t => t.id)); };

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const obterNomePagamento = (forma) => {
        if (!forma) return 'Desconhecido';
        if (forma.startsWith('credito_')) {
            const idCartao = forma.split('_')[1];
            const cartao = cartoes.find(c => c.id === idCartao);
            return cartao ? `Crédito ${cartao.nome}` : 'Crédito (Excluído)';
        }
        if (forma === 'pix') return 'PIX / Dinheiro';
        if (forma === 'debito') return 'Débito';
        return forma;
    };

    const abrirDetalhes = (t) => {
        modal.setConfig({
            type: 'detalhes',
            transacao: t,
            nomePagamento: obterNomePagamento(t.formaPagamento),
            isStewart: nomeUsuario.toLowerCase() === 'stewart',
            onAlternarStatus: () => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra),
            onEditar: () => editarValor(t),
            onDeletar: () => deletarTransacao(t),
            onVerComprovante: () => verComprovante(t),
            onAnexarComprovante: () => anexarComprovante(t)
        });
    };

    const limparFiltros = () => { setFiltrosAvancados({ dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: '' }); };

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
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descrição</label><input name="descricao" type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="Ex: Supermercado" /></div>

                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Observação (Opcional)</label><textarea name="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors resize-none" placeholder="Detalhes extras..." rows="2"></textarea></div>

                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor (R$)</label><input name="valor" type="number" step="0.01" min="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="0.00" /></div>
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Data</label><input name="dataCompra" type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tipo</label><select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"><option value="despesa">Despesa</option><option value="renda">Renda</option><option value="investimento">Investimento</option></select></div>
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label><select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"><option value="pendente">Pendente</option><option value="pago">Pago / Recebido</option></select></div>
                        </div>

                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Categoria</label><select name="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"><option value="Sem Categoria">Sem Categoria</option><option value="Contas Fixas">Contas Fixas</option>{categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select></div>

                        {/* INJEÇÃO AUTOMÁTICA: Janela flutuante do KM da Moto baseada na Categoria Escohida */}
                        {(categoria === 'Gasolina' || categoria === 'Manutenção da moto') && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/50 transition-colors animate-fade-in-down">
                                <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                                    Odômetro Atual (KM)
                                </label>
                                <input
                                    name="kmMoto"
                                    type="number"
                                    value={kmMoto}
                                    onChange={(e) => setKmMoto(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                                    placeholder="Ex: 15200 (Vazio se for veículo emprestado)"
                                />
                            </div>
                        )}

                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Pagamento</label><select name="formaPagamento" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"><option value="pix">PIX / Dinheiro</option><option value="debito">Cartão de Débito</option>{cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}</select></div>
                        {formaPagamento.startsWith('credito_') && (
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Parcelas</label><input name="parcelas" type="number" min="1" max="48" value={parcelas} onChange={(e) => setParcelas(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors" /></div>
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
                            <button type="button" onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${mostrarFiltrosAvancados ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                Filtros ⚙️
                            </button>
                        </div>
                    </div>

                    {mostrarFiltrosAvancados && (
                        <div className="mb-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 transition-colors">
                            <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Data Início</label><input type="date" value={filtrosAvancados.dataInicio} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataInicio: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm p-2 rounded outline-none focus:border-blue-500 transition-colors" /></div>
                            <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Data Fim</label><input type="date" value={filtrosAvancados.dataFim} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataFim: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm p-2 rounded outline-none focus:border-blue-500 transition-colors" /></div>
                            <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Categoria</label><select value={filtrosAvancados.categoria} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, categoria: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm p-2 rounded outline-none focus:border-blue-500 transition-colors"><option value="">Todas</option><option value="Sem Categoria">Sem Categoria</option><option value="Contas Fixas">Contas Fixas</option>{categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select></div>
                            <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Pagamento</label><select value={filtrosAvancados.formaPagamento} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, formaPagamento: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm p-2 rounded outline-none focus:border-blue-500 transition-colors"><option value="">Todos</option><option value="pix">PIX / Dinheiro</option><option value="debito">Débito</option>{cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}</select></div>
                            <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Valor Mínimo</label><input type="number" value={filtrosAvancados.valorMin} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMin: e.target.value })} placeholder="0.00" className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm p-2 rounded outline-none focus:border-blue-500 transition-colors" /></div>
                            <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Valor Máximo</label><input type="number" value={filtrosAvancados.valorMax} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMax: e.target.value })} placeholder="9999.00" className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm p-2 rounded outline-none focus:border-blue-500 transition-colors" /></div>
                            <div className="sm:col-span-2 md:col-span-3 flex justify-end">
                                <button onClick={limparFiltros} className="text-xs font-bold text-rose-500 hover:text-rose-700 uppercase cursor-pointer transition-colors">Limpar Tudo</button>
                            </div>
                        </div>
                    )}

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
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider whitespace-nowrap">
                                <tr>
                                    <th className="p-3 text-center w-10"><input type="checkbox" onChange={selecionarTodas} checked={dadosTabela.length > 0 && transacoesSelecionadas.length === dadosTabela.length} className="cursor-pointer" /></th>
                                    <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" onClick={() => mudarOrdenacao('descricao')}>Descrição {ordenacao.coluna === 'descricao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                    <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 hidden sm:table-cell" onClick={() => mudarOrdenacao('data')}>Data {ordenacao.coluna === 'data' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                    <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-center" onClick={() => mudarOrdenacao('status')}>Status {ordenacao.coluna === 'status' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                    <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-right" onClick={() => mudarOrdenacao('valor')}>Valor {ordenacao.coluna === 'valor' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {dadosTabela.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">Nenhum lançamento.</td></tr>
                                ) : (
                                    dadosTabela.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="p-3 text-center whitespace-nowrap">
                                                <input type="checkbox" checked={transacoesSelecionadas.includes(t.id)} onChange={() => toggleSelecao(t.id)} className="cursor-pointer" />
                                            </td>
                                            <td className="p-3 min-w-[140px]">
                                                <span
                                                    onClick={() => abrirDetalhes(t)}
                                                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer inline-flex items-start gap-1 transition-colors break-words whitespace-normal"
                                                    style={{ wordBreak: 'break-word' }}
                                                >
                                                    {t.descricao}
                                                    {t.observacao && (
                                                        <svg title="Possui Observação" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors inline-block flex-shrink-0 mt-0.5 cursor-help">
                                                            <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337 4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785Z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </span>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{t.categoria} • {obterNomePagamento(t.formaPagamento)}</p>
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-400 text-xs hidden sm:table-cell whitespace-nowrap">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                            <td className="p-3 text-center whitespace-nowrap">
                                                <button type="button" onClick={() => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra)} className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition cursor-pointer hover:scale-105 active:scale-95 ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{t.status}</button>
                                            </td>
                                            <td className={`p-3 text-right font-bold whitespace-nowrap ${t.tipo === 'renda' ? 'text-emerald-600 dark:text-emerald-400' : t.tipo === 'investimento' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{formatarMoeda(t.valorParcela)}</td>
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