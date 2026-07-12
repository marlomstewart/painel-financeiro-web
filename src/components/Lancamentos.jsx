import React, { useState } from 'react';

export function Lancamentos({
    modo = 'lancamentos',
    categorias, cartoes, addTransacao,
    filtroStatus, setFiltroStatus, buscaTexto, setBuscaTexto,
    mostrarFiltrosAvancados, setMostrarFiltrosAvancados, filtrosAvancados, setFiltrosAvancados,
    mudarOrdenacao, ordenacao, dadosTabela,
    alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa,
    modal, nomeUsuario, anexarComprovante, verComprovante,
    dataVis = { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() },
    mesAnterior = () => { },
    mesProximo = () => { },
    garagem = null
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [descricao, setDescricao] = useState('');
    const [valorStr, setValorStr] = useState('0');
    const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
    const [tipo, setTipo] = useState('despesa');
    const [status, setStatus] = useState('pendente');
    const [categoria, setCategoria] = useState('Sem Categoria');
    const [formaPagamento, setFormaPagamento] = useState('pix');
    const [parcelas, setParcelas] = useState(1);
    const [observacao, setObservacao] = useState('');
    const [kmMoto, setKmMoto] = useState('');

    // 🔥 NOVOS ESTADOS PARA A COMPRA DE TERCEIROS
    const [isThirdParty, setIsThirdParty] = useState(false);
    const [thirdPartyName, setThirdPartyName] = useState('');

    const [transacoesSelecionadas, setTransacoesSelecionadas] = useState([]);

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const ultimosCinco = [...dadosTabela].sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra)).slice(0, 5);

    const handleValorChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val === '') val = '0';
        setValorStr(val);
    };

    const displayValor = (parseInt(valorStr, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const sucesso = await addTransacao(e);

        if (sucesso) {
            setDescricao(''); setValorStr('0'); setObservacao(''); setKmMoto('');
            setDataCompra(new Date().toISOString().split('T')[0]);
            setTipo('despesa'); setStatus('pendente'); setCategoria('Sem Categoria');
            setFormaPagamento('pix'); setParcelas(1);
            // 🔥 RESETA OS TERCEIROS APÓS ENVIAR
            setIsThirdParty(false); setThirdPartyName('');
        }

        setIsSubmitting(false);
    };

    const toggleSelecao = (id) => {
        setTransacoesSelecionadas(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);
    };

    const selecionarTodas = () => {
        if (transacoesSelecionadas.length === dadosTabela.length) setTransacoesSelecionadas([]);
        else setTransacoesSelecionadas(dadosTabela.map(t => t.id));
    };

    const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const obterNomePagamento = (forma) => {
        if (!forma) return 'Desconhecido';
        if (forma.startsWith('credito_')) {
            const cartao = cartoes.find(c => String(c.id) === String(forma.split('_')[1]));
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
            isStewart: nomeUsuario?.toLowerCase() === 'stewart',
            onAlternarStatus: () => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra),
            onEditar: () => editarValor(t),
            onDeletar: () => deletarTransacao(t),
            onVerComprovante: () => verComprovante(t),
            onAnexarComprovante: () => anexarComprovante(t)
        });
    };

    const limparFiltros = () => {
        setFiltrosAvancados({ dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: '' });
    };

    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors shadow-sm";
    const labelCls = "block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider";

    if (modo === 'novo_lancamento') {
        return (
            <div className="p-4 md:p-8 space-y-6 w-full max-w-3xl mx-auto pb-24 overflow-x-hidden relative">

                {/* CABEÇALHO ORIGINAL */}
                <div className="sticky top-0 z-40 pt-4 md:pt-8 pb-4 -mt-4 md:-mt-8 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md">
                    <header className="border-b border-slate-200 dark:border-slate-800 pb-2">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">➕ Novo Lançamento</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Adicione uma nova despesa, receita ou investimento ao seu livro-razão.</p>
                    </header>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-8 rounded-xl shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={labelCls}>Descrição</label>
                            <input name="descricao" type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} required className={inputCls} placeholder="Ex: Supermercado, Abastecimento, Salário..." />
                        </div>

                        <div>
                            <label className={labelCls}>Observação (Opcional)</label>
                            <textarea name="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} className={`${inputCls} resize-none`} placeholder="Detalhes extras sobre a transação..." rows="2"></textarea>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Valor (R$)</label>
                                <input name="valor" type="text" value={displayValor} onChange={handleValorChange} required className={`${inputCls} font-bold text-blue-600 dark:text-blue-400`} />
                            </div>
                            <div>
                                <label className={labelCls}>Data da Transação</label>
                                <input name="dataCompra" type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} required className={inputCls} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Natureza</label>
                                <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
                                    <option value="despesa">🔻 Despesa (Saída)</option>
                                    <option value="renda">💰 Renda (Entrada)</option>
                                    <option value="investimento">📈 Investimento</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Status Atual</label>
                                <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                                    <option value="pendente">⏳ Pendente (A Pagar/Receber)</option>
                                    <option value="pago">✅ Liquidado (Pago/Recebido)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Categoria Orçamental</label>
                            <select name="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputCls}>
                                <option value="Sem Categoria">-- Selecione uma Categoria --</option>
                                <option value="Contas Fixas">Contas Fixas</option>
                                {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                            </select>
                        </div>

                        {(categoria === 'Gasolina' || categoria === 'Manutenção da moto') && nomeUsuario?.toLowerCase() === 'stewart' && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800/50 animate-fade-in">
                                <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1 uppercase tracking-wider">Odômetro Atual (KM) - Opcional</label>
                                <input
                                    name="kmMoto" type="number" value={kmMoto} onChange={(e) => setKmMoto(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="Ex: 81604 (Deixe em branco se não quiser registar)"
                                />
                            </div>
                        )}

                        {/* 🔥 BLOCO DA COMPRA DE TERCEIROS (TOGGLE + INPUT) */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="flex items-center gap-2 cursor-pointer mb-3">
                                <input type="checkbox" name="isThirdParty" checked={isThirdParty} onChange={(e) => setIsThirdParty(e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Compra para Terceiro</span>
                            </label>

                            {isThirdParty && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50 animate-fade-in-down mb-3">
                                    <label className="block text-xs font-bold text-amber-700 dark:text-amber-500 mb-1 uppercase tracking-wider">Nome da Pessoa (Terceiro)</label>
                                    <input
                                        name="thirdPartyName" type="text" required
                                        value={thirdPartyName} onChange={(e) => setThirdPartyName(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                                        placeholder="Ex: Mayara, Cunhado, João..."
                                    />
                                    <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-2 font-medium">Estes gastos serão abatidos dos seus gráficos e contabilizados separadamente na fatura.</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Forma de Pagamento</label>
                                <select name="formaPagamento" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className={inputCls}>
                                    <option value="pix">PIX / Dinheiro</option>
                                    <option value="debito">Cartão de Débito</option>
                                    {cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Cartão: {c.nome}</option>)}
                                </select>
                            </div>
                            {formaPagamento.startsWith('credito_') && (
                                <div>
                                    <label className={labelCls}>Parcelas</label>
                                    <input name="parcelas" type="number" min="1" max="48" value={parcelas} onChange={(e) => setParcelas(e.target.value)} className={inputCls} />
                                </div>
                            )}
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={isSubmitting} className={`w-full text-white font-bold py-3 rounded-lg text-sm transition-all shadow-md flex justify-center items-center gap-2 ${isSubmitting ? 'bg-blue-400 cursor-not-allowed opacity-90' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}>
                                {isSubmitting ? (
                                    <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processando...</>
                                ) : ('Registrar Transação')}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm mt-6 animate-fade-in-up">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex justify-between items-center">
                        <span>Últimos Lançamentos</span>
                        <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">{dataVis.ano}</span>
                    </h3>

                    <div className="space-y-3">
                        {ultimosCinco.map(t => (
                            <div key={t.id} onClick={() => abrirDetalhes(t)} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group">
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                        {t.descricao}
                                        {/* 🔥 BADGE NA LISTAGEM SE FOR TERCEIRO */}
                                        {t.isThirdParty && <span className="ml-2 text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 inline-block no-underline">🤝 {t.thirdPartyName}</span>}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mt-0.5 truncate">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} • {t.categoria}</p>
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
                        {ultimosCinco.length === 0 && <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4 italic">Nenhum lançamento registrado nesta competência.</p>}
                    </div>
                </div>
            </div>
        );
    }

    // EXTRATO VISÃO
    return (
        <div className="p-4 md:p-8 space-y-6 w-full max-w-7xl mx-auto pb-24 overflow-x-hidden relative">

            <div className="sticky top-0 z-40 pt-4 md:pt-8 pb-4 -mt-4 md:-mt-8 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md">
                <header className="border-b border-slate-200 dark:border-slate-800 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">📋 Extrato de Lançamentos</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Audite, pesquise e faça a gestão em lote de todas as movimentações.</p>
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-sm self-start md:self-auto shrink-0">
                        <button onClick={mesAnterior} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-slate-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg></button>
                        <div className="flex flex-col items-center min-w-[120px] justify-center px-2">
                            <span className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs">{meses[dataVis.mes - 1]}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest">{dataVis.ano}</span>
                        </div>
                        <button onClick={mesProximo} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-slate-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg></button>
                    </div>
                </header>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-5 rounded-xl shadow-sm flex flex-col w-full">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
                    <input
                        type="text" placeholder="Buscar lançamentos..."
                        value={buscaTexto} onChange={(e) => setBuscaTexto(e.target.value)}
                        className="w-full xl:w-80 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"
                    />

                    <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                        <select
                            value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
                            className="w-full sm:w-48 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none"
                        >
                            <option value="todos">Todos os Status</option>
                            <option value="pago">Apenas Pagos</option>
                            <option value="pendente">Apenas Pendentes</option>
                        </select>
                        <button
                            type="button" onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)}
                            className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${mostrarFiltrosAvancados ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            Filtros Avançados
                        </button>
                    </div>
                </div>

                {mostrarFiltrosAvancados && (
                    <div className="mb-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 transition-colors animate-fade-in-down">
                        <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Data Início</label><input type="date" value={filtrosAvancados.dataInicio} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataInicio: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Data Fim</label><input type="date" value={filtrosAvancados.dataFim} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataFim: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Categoria</label><select value={filtrosAvancados.categoria} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, categoria: e.target.value })} className={inputCls}><option value="">Todas</option><option value="Sem Categoria">Sem Categoria</option><option value="Contas Fixas">Contas Fixas</option>{categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select></div>
                        <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Pagamento</label><select value={filtrosAvancados.formaPagamento} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, formaPagamento: e.target.value })} className={inputCls}><option value="">Todos</option><option value="pix">PIX / Dinheiro</option><option value="debito">Débito</option>{cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}</select></div>
                        <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Valor Mínimo</label><input type="number" value={filtrosAvancados.valorMin} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMin: e.target.value })} placeholder="0.00" className={inputCls} /></div>
                        <div><label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Valor Máximo</label><input type="number" value={filtrosAvancados.valorMax} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMax: e.target.value })} placeholder="9999.00" className={inputCls} /></div>
                        <div className="sm:col-span-2 md:col-span-3 flex justify-end"><button onClick={limparFiltros} className="text-xs font-bold text-rose-500 hover:text-rose-700 uppercase cursor-pointer transition-colors bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-lg border border-rose-200 dark:border-rose-800">Limpar Tudo</button></div>
                    </div>
                )}

                {transacoesSelecionadas.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">{transacoesSelecionadas.length} itens selecionados</span>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <button type="button" onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'pago'); setTransacoesSelecionadas([]); }} className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 cursor-pointer transition shadow-sm">Marcar Pago</button>
                            <button type="button" onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'pendente'); setTransacoesSelecionadas([]); }} className="px-4 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 cursor-pointer transition shadow-sm">Marcar Pendente</button>
                            <button type="button" onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'excluir'); setTransacoesSelecionadas([]); }} className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 cursor-pointer transition shadow-sm border border-rose-700">Excluir</button>
                        </div>
                    </div>
                )}

                <div className="lg:hidden space-y-3 mt-2 w-full">
                    {dadosTabela.length > 0 && (
                        <div className="mb-4 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Ordenar Lista Por:</p>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => mudarOrdenacao('data')} className={`flex-1 min-w-[80px] px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1 shadow-sm ${ordenacao.coluna === 'data' ? 'bg-blue-600 text-white border border-blue-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>Data {ordenacao.coluna === 'data' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</button>
                                <button onClick={() => mudarOrdenacao('descricao')} className={`flex-1 min-w-[80px] px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1 shadow-sm ${ordenacao.coluna === 'descricao' ? 'bg-blue-600 text-white border border-blue-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>Nome {ordenacao.coluna === 'descricao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</button>
                                <button onClick={() => mudarOrdenacao('valor')} className={`flex-1 min-w-[80px] px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1 shadow-sm ${ordenacao.coluna === 'valor' ? 'bg-blue-600 text-white border border-blue-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>Valor {ordenacao.coluna === 'valor' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</button>
                                <button onClick={() => mudarOrdenacao('status')} className={`flex-1 min-w-[80px] px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1 shadow-sm ${ordenacao.coluna === 'status' ? 'bg-blue-600 text-white border border-blue-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>Status {ordenacao.coluna === 'status' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</button>
                            </div>
                        </div>
                    )}

                    {dadosTabela.length > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl mb-4 shadow-sm">
                            <input type="checkbox" onChange={selecionarTodas} checked={transacoesSelecionadas.length === dadosTabela.length} className="cursor-pointer w-4 h-4 accent-blue-600 shrink-0" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Selecionar Todos os {dadosTabela.length} itens</span>
                        </div>
                    )}

                    {dadosTabela.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                            Nenhum lançamento registado nesta competência.
                        </div>
                    ) : (
                        dadosTabela.map((t) => (
                            <div key={t.id} className={`bg-white dark:bg-slate-900 rounded-xl border transition-all shadow-sm relative overflow-hidden flex w-full ${transacoesSelecionadas.includes(t.id) ? 'border-blue-500 ring-1 ring-blue-500 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
                                <div className="w-12 shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800">
                                    <input type="checkbox" checked={transacoesSelecionadas.includes(t.id)} onChange={() => toggleSelecao(t.id)} className="cursor-pointer w-4 h-4 accent-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0 p-4 cursor-pointer" onClick={() => abrirDetalhes(t)}>
                                    <div className="flex justify-between items-start gap-3 mb-2">
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight truncate">
                                            {t.descricao}
                                            {/* 🔥 BADGE DE TERCEIRO NO EXTRATO MOBILE */}
                                            {t.isThirdParty && <span className="ml-1 text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 inline-block">🤝 {t.thirdPartyName}</span>}
                                            {t.observacao && <span className="ml-1 text-blue-500" title="Possui observação">💬</span>}
                                        </h4>
                                        <span className={`shrink-0 text-[9px] uppercase font-bold px-2 py-1 rounded-md ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>{t.status}</span>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <div className="min-w-0 pr-2">
                                            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-0.5">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate w-full">{t.categoria} • {obterNomePagamento(t.formaPagamento)}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`font-black text-[15px] ${t.tipo === 'renda' ? 'text-emerald-600 dark:text-emerald-400' : t.tipo === 'investimento' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>{formatarMoeda(t.valorParcela)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="hidden lg:block overflow-x-auto flex-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 mt-4">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider whitespace-nowrap">
                            <tr>
                                <th className="p-3 text-center w-10"><input type="checkbox" onChange={selecionarTodas} checked={dadosTabela.length > 0 && transacoesSelecionadas.length === dadosTabela.length} className="cursor-pointer accent-blue-600 w-4 h-4" /></th>
                                <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" onClick={() => mudarOrdenacao('descricao')}>Descrição {ordenacao.coluna === 'descricao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" onClick={() => mudarOrdenacao('data')}>Vencimento / Compra {ordenacao.coluna === 'data' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-center" onClick={() => mudarOrdenacao('status')}>Status da Conta {ordenacao.coluna === 'status' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                                <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-right" onClick={() => mudarOrdenacao('valor')}>Valor {ordenacao.coluna === 'valor' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {dadosTabela.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">Nenhum lançamento registado nesta competência.</td></tr>
                            ) : (
                                dadosTabela.map((t) => (
                                    <tr key={t.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${transacoesSelecionadas.includes(t.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                        <td className="p-3 text-center whitespace-nowrap"><input type="checkbox" checked={transacoesSelecionadas.includes(t.id)} onChange={() => toggleSelecao(t.id)} className="cursor-pointer accent-blue-600 w-4 h-4" /></td>
                                        <td className="p-3 min-w-[140px]">
                                            <span onClick={() => abrirDetalhes(t)} className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer inline-flex items-start gap-1 transition-colors break-words whitespace-normal" style={{ wordBreak: 'break-word' }}>
                                                {t.descricao}
                                                {/* 🔥 BADGE DE TERCEIRO NO EXTRATO DESKTOP */}
                                                {t.isThirdParty && <span className="ml-2 text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 inline-block no-underline">🤝 {t.thirdPartyName}</span>}
                                                {t.observacao && <svg title="Possui Observação" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors inline-block flex-shrink-0 mt-0.5 cursor-help"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337 4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785Z" clipRule="evenodd" /></svg>}
                                            </span>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{t.categoria} • {obterNomePagamento(t.formaPagamento)}</p>
                                        </td>
                                        <td className="p-3 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                        <td className="p-3 text-center whitespace-nowrap">
                                            <div className="flex flex-col items-center justify-center">
                                                <button type="button" onClick={() => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra)} className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition cursor-pointer hover:scale-105 active:scale-95 border ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}>{t.status}</button>
                                                {t.status === 'pago' && t.data_pagamento && <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-medium">Pago em: {new Date(t.data_pagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>}
                                            </div>
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
    );
}