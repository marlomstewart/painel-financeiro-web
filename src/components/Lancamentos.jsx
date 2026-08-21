import React, { useState, useRef } from 'react';
import {
    Sparkles, ClipboardList, ChevronLeft, ChevronRight, Search, SlidersHorizontal,
    Users, MessageSquare, Lightbulb, ChevronUp, ChevronDown, Loader2, Info
} from 'lucide-react';
import { nomeCartao } from '../utils/cartaoUtils';

/**
 * @function IconeOrdenacao
 * @description Ícone de seta ativo/inativo para a coluna atualmente ordenada.
 */
const IconeOrdenacao = ({ ordenacao, coluna }) => {
    if (ordenacao.coluna !== coluna) return null;
    return ordenacao.direcao === 'asc'
        ? <ChevronUp className="w-3 h-3 inline-block ml-0.5" strokeWidth={3} />
        : <ChevronDown className="w-3 h-3 inline-block ml-0.5" strokeWidth={3} />;
};

/**
 * @file src/components/Lancamentos.jsx
 * @description Módulo de gestão de transações.
 * Permite adicionar novas transações (receitas, despesas, investimentos) e auditar o extrato completo
 * com suporte a ações em lote, filtros avançados e visualização responsiva em cards no mobile.
 */
export function Lancamentos({
    modo = 'lancamentos',
    categorias, cartoes, addTransacao,
    filtroStatus, setFiltroStatus, buscaTexto, setBuscaTexto,
    mostrarFiltrosAvancados, setMostrarFiltrosAvancados, filtrosAvancados, setFiltrosAvancados,
    mudarOrdenacao, ordenacao, dadosTabela,
    alternarStatusTransacao, editarValor, deletarTransacao, executarAcaoEmMassa,
    modal, showToast, nomeUsuario, temGaragem = false, temComprovante = false, anexarComprovante, verComprovante,
    dataVis = { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() },
    mesAnterior = () => { },
    mesProximo = () => { },
    garagem = null
}) {
    // ==========================================
    // ESTADOS DO FORMULÁRIO (NOVO LANÇAMENTO)
    // ==========================================
    const inputComprovanteRef = useRef(null);
    const transacaoParaAnexoRef = useRef(null);
    const handleArquivoComprovanteSelecionado = (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = ''; // permite selecionar o mesmo arquivo de novo depois, se precisar
        if (file && transacaoParaAnexoRef.current) anexarComprovante(transacaoParaAnexoRef.current, file);
    };

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

    // Estados para Controle de Terceiros (Divisão de despesas)
    const [isThirdParty, setIsThirdParty] = useState(false);
    const [thirdPartyName, setThirdPartyName] = useState('');
    const [thirdPartyValueStr, setThirdPartyValueStr] = useState('0');
    const [thirdPartyPhone, setThirdPartyPhone] = useState('');

    // Estados de Seleção em Lote (Extrato)
    const [transacoesSelecionadas, setTransacoesSelecionadas] = useState([]);

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const ultimosCinco = [...dadosTabela].sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra)).slice(0, 5);

    // ==========================================
    // FUNÇÕES AUXILIARES E HIGIENIZAÇÃO
    // ==========================================

    /**
     * @function handleValorChange
     * @description Limpa e atualiza o input de valor principal, aceitando apenas números.
     */
    const handleValorChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val === '') val = '0';
        setValorStr(val);
    };

    /**
     * @function handleThirdValueChange
     * @description Limpa e atualiza o input de valor do terceiro, aceitando apenas números.
     */
    const handleThirdValueChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val === '') val = '0';
        setThirdPartyValueStr(val);
    };

    // Valores formatados para exibição no formulário (Real time currency formating)
    const displayValor = (parseInt(valorStr, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const displayThirdValue = (parseInt(thirdPartyValueStr, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    /**
     * @function handleSubmit
     * @description Processa a submissão do formulário, valida regras de negócio (como limite de terceiro)
     * e limpa os estados após a persistência.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const numericValue = parseInt(valorStr, 10) / 100;
        let numericThirdValue = parseInt(thirdPartyValueStr, 10) / 100;

        // Regra de Negócio: Terceiro não pode dever mais que o valor total da compra
        if (isThirdParty && numericThirdValue > numericValue) {
            showToast('O valor do terceiro não pode ser maior que o valor total da compra.', 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            const resultado = await addTransacao(e);

            if (resultado === 'sucesso' || resultado === 'offline') {
                setDescricao(''); setValorStr('0'); setObservacao(''); setKmMoto('');
                setDataCompra(new Date().toISOString().split('T')[0]);
                setTipo('despesa'); setStatus('pendente'); setCategoria('Sem Categoria');
                setFormaPagamento('pix'); setParcelas(1);
                setIsThirdParty(false); setThirdPartyName(''); setThirdPartyValueStr('0'); setThirdPartyPhone('');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * @function toggleSelecao
     * @description Alterna o estado de seleção de uma transação isolada para ações em lote.
     * @param {string|number} id - ID da transação.
     */
    const toggleSelecao = (id) => setTransacoesSelecionadas(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);

    /**
     * @function selecionarTodas
     * @description Marca ou desmarca todas as transações renderizadas na tabela atual.
     */
    const selecionarTodas = () => {
        if (transacoesSelecionadas.length === dadosTabela.length) setTransacoesSelecionadas([]);
        else setTransacoesSelecionadas(dadosTabela.map(t => t.id));
    };

    const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    /**
     * @function obterNomePagamento
     * @description Converte o slug do meio de pagamento para um label legível em tela.
     * @param {string} forma - Ex: 'credito_123', 'pix', 'debito'.
     * @returns {string} Label formatado (Ex: 'Crédito Nubank').
     */
    const obterNomePagamento = (forma) => {
        if (!forma) return 'Desconhecido';
        if (forma.startsWith('credito_')) {
            return `Crédito ${nomeCartao(forma, cartoes, '(Excluído)')}`;
        }
        if (forma === 'pix') return 'PIX / Dinheiro';
        if (forma === 'debito') return 'Débito';
        return forma;
    };

    /**
     * @function abrirDetalhes
     * @description Dispara o modal de visualização profunda (Raio-X) de um lançamento específico.
     * @param {Object} t - Objeto completo da transação selecionada.
     */
    const abrirDetalhes = (t) => {
        modal.setConfig({
            type: 'detalhes',
            transacao: t,
            nomePagamento: obterNomePagamento(t.formaPagamento),
            temComprovante,
            onAlternarStatus: () => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra),
            onEditar: () => editarValor(t),
            onDeletar: () => deletarTransacao(t),
            onVerComprovante: () => verComprovante(t),
            onAnexarComprovante: () => { transacaoParaAnexoRef.current = t; inputComprovanteRef.current?.click(); }
        });
    };

    const limparFiltros = () => setFiltrosAvancados({ dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: '' });

    const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors shadow-sm";
    const labelCls = "block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 md:mb-1 uppercase tracking-wider";

    // ==========================================
    // RENDER: NOVO LANÇAMENTO
    // ==========================================
    if (modo === 'novo_lancamento') {
        return (
            <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 relative animate-fade-in">

                {/* CABEÇALHO PADRÃO (SÓLIDO E ROLÁVEL) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            <Sparkles className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                                Novo Lançamento
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                Adicione uma nova despesa, receita, investimento ou reembolso.
                            </p>
                        </div>
                    </div>
                    <div className="w-full md:w-auto shrink-0 flex items-center justify-end mt-2 md:mt-0">
                        <button type="button" onClick={() => {
                            setDescricao(''); setValorStr('0'); setObservacao(''); setKmMoto('');
                            setDataCompra(new Date().toISOString().split('T')[0]);
                            setTipo('despesa'); setStatus('pendente'); setCategoria('Sem Categoria');
                            setFormaPagamento('pix'); setParcelas(1);
                            setIsThirdParty(false); setThirdPartyName(''); setThirdPartyValueStr('0'); setThirdPartyPhone('');
                        }} className="w-full md:w-auto text-sm font-bold text-slate-500 hover:text-rose-500 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-4 py-3 md:py-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            Limpar Dados
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-8 rounded-2xl shadow-sm">
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
                                        <option value="despesa">Despesa (Saída)</option>
                                        <option value="renda">Renda (Entrada)</option>
                                        <option value="investimento">Investimento</option>
                                        <option value="reembolso">Reembolso / Estorno</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Status Atual</label>
                                    <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                                        <option value="pendente">Pendente (A Pagar/Receber)</option>
                                        <option value="pago">Liquidado (Pago/Recebido)</option>
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

                            {temGaragem && categorias.find(c => c.nome === categoria)?.is_garagem ? (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800/50 animate-fade-in">
                                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1.5 uppercase tracking-wider">Odômetro Atual (KM) - Opcional</label>
                                    <input
                                        name="kmMoto" type="number" value={kmMoto} onChange={(e) => setKmMoto(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="Ex: 81604 (Deixe em branco se não quiser registar)"
                                    />
                                </div>
                            ) : null}

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="flex items-center gap-3 cursor-pointer mb-3 py-1">
                                    <input type="checkbox" name="isThirdParty" checked={isThirdParty} onChange={(e) => setIsThirdParty(e.target.checked)} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Compra Compartilhada / Terceiro</span>
                                </label>

                                {isThirdParty && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50 animate-fade-in-down mb-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-amber-700 dark:text-amber-500 mb-1.5 uppercase tracking-wider">Pessoa / Terceiro</label>
                                                <input
                                                    name="thirdPartyName" type="text" required
                                                    value={thirdPartyName} onChange={(e) => setThirdPartyName(e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                                                    placeholder="Ex: Maria, João..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-amber-700 dark:text-amber-500 mb-1.5 uppercase tracking-wider">Valor TOTAL da Pessoa (R$)</label>
                                                <input
                                                    name="thirdPartyValue" type="text"
                                                    value={displayThirdValue} onChange={handleThirdValueChange}
                                                    className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 rounded-lg p-3.5 md:p-3 text-sm font-bold text-amber-700 dark:text-amber-500 outline-none focus:border-amber-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-xs font-bold text-amber-700 dark:text-amber-500 mb-1.5 uppercase tracking-wider">WhatsApp da Pessoa (opcional)</label>
                                            <input
                                                name="thirdPartyPhone" type="tel"
                                                value={thirdPartyPhone} onChange={(e) => setThirdPartyPhone(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                                                placeholder="Ex: 11987654321 (com DDD)"
                                            />
                                            <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1.5">Salvando o número, a cobrança em "A Receber" abre o WhatsApp direto pra essa pessoa.</p>
                                        </div>
                                        <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-3 font-medium leading-tight flex items-start gap-1.5">
                                            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                                            Se a compra for parcelada, informe a dívida TOTAL da pessoa. O sistema fará a divisão por parcelas automaticamente. Deixe R$ 0,00 se a compra for 100% dela.
                                        </p>
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
                                <button type="submit" disabled={isSubmitting} className={`w-full text-white font-bold py-4 md:py-3 rounded-lg text-sm transition-all shadow-md flex justify-center items-center gap-2 ${isSubmitting ? 'bg-blue-400 cursor-not-allowed opacity-90' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] cursor-pointer'}`}>
                                    {isSubmitting ? (
                                        <><Loader2 className="animate-spin w-4 h-4" strokeWidth={2.5} />Processando...</>
                                    ) : ('Registrar Transação')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Resumo de Últimos Lançamentos ao final do formulário */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 md:p-5 rounded-2xl shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex justify-between items-center">
                            <span>Últimos Lançamentos</span>
                            <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">{dataVis.ano}</span>
                        </h3>

                        <div className="space-y-3">
                            {ultimosCinco.map(t => (
                                <div key={t.id} onClick={() => abrirDetalhes(t)} className="flex justify-between items-center p-3 md:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group shadow-sm active:scale-[0.98]">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate flex items-center gap-1.5">
                                            <span className="truncate">{t.descricao}</span>
                                            {t.isThirdParty && (
                                                <span className="inline-flex items-center gap-1 shrink-0 text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                                    <Users className="w-2.5 h-2.5" strokeWidth={2.5} /> {t.thirdPartyName}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mt-0.5 truncate">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} • {t.categoria}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end shrink-0">
                                        <p className={`font-bold text-sm ${t.tipo === 'renda' ? 'text-emerald-600 dark:text-emerald-400' : t.tipo === 'investimento' ? 'text-blue-600 dark:text-blue-400' : t.tipo === 'despesa' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
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
            </div>
        );
    }

    // ==========================================
    // RENDER: EXTRATO (Gestão e Listagem)
    // ==========================================
    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 relative animate-fade-in">

            {/* Input de arquivo oculto, acionado pelo botão "Anexar Comprovante" do modal de detalhes */}
            <input
                type="file"
                ref={inputComprovanteRef}
                onChange={handleArquivoComprovanteSelecionado}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
            />

            {/* CABEÇALHO PADRÃO (SÓLIDO E ROLÁVEL) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                        <ClipboardList className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                            Extrato de Lançamentos
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Audite, pesquise e faça a gestão em lote de todas as movimentações.
                        </p>
                    </div>
                </div>
                <div className="w-full md:w-auto shrink-0 flex items-center justify-between md:justify-end bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button type="button" onClick={mesAnterior} aria-label="Mês anterior" className="p-3 md:p-2 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer touch-manipulation">
                        <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <div className="flex flex-col items-center px-4">
                        <span className="font-bold uppercase text-sm text-slate-700 dark:text-slate-200 tracking-wider">
                            {meses[dataVis.mes - 1]}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest">{dataVis.ano}</span>
                    </div>
                    <button type="button" onClick={mesProximo} aria-label="Próximo mês" className="p-3 md:p-2 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer touch-manipulation">
                        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-5 rounded-2xl shadow-sm flex flex-col w-full">

                {/* BARRA DE PESQUISA E FILTROS RÁPIDOS */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
                    <div className="relative w-full xl:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={2} />
                        <input
                            type="text" placeholder="Buscar lançamentos..."
                            value={buscaTexto} onChange={(e) => setBuscaTexto(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3.5 py-3.5 md:py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full xl:w-auto">
                        <select
                            value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
                            className="w-full sm:w-48 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 md:p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none"
                        >
                            <option value="todos">Todos os Status</option>
                            <option value="pago">Apenas Pagos</option>
                            <option value="pendente">Apenas Pendentes</option>
                        </select>
                        <button
                            type="button" onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)}
                            className={`w-full sm:w-auto px-4 py-3 md:py-2.5 rounded-lg text-sm font-bold border transition-colors cursor-pointer inline-flex items-center justify-center gap-2 ${mostrarFiltrosAvancados ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            <SlidersHorizontal className="w-4 h-4" strokeWidth={2} /> Filtros Avançados
                        </button>
                    </div>
                </div>

                {/* FILTROS AVANÇADOS */}
                {mostrarFiltrosAvancados && (
                    <div className="mb-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 transition-colors animate-fade-in-down">
                        <div><label className={labelCls}>Data Início</label><input type="date" value={filtrosAvancados.dataInicio} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataInicio: e.target.value })} className={inputCls} /></div>
                        <div><label className={labelCls}>Data Fim</label><input type="date" value={filtrosAvancados.dataFim} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataFim: e.target.value })} className={inputCls} /></div>
                        <div><label className={labelCls}>Categoria</label><select value={filtrosAvancados.categoria} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, categoria: e.target.value })} className={inputCls}><option value="">Todas</option><option value="Sem Categoria">Sem Categoria</option><option value="Contas Fixas">Contas Fixas</option>{categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select></div>
                        <div><label className={labelCls}>Pagamento</label><select value={filtrosAvancados.formaPagamento} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, formaPagamento: e.target.value })} className={inputCls}><option value="">Todos</option><option value="pix">PIX / Dinheiro</option><option value="debito">Débito</option>{cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}</select></div>
                        <div><label className={labelCls}>Valor Mínimo</label><input type="number" value={filtrosAvancados.valorMin} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMin: e.target.value })} placeholder="0.00" className={inputCls} /></div>
                        <div><label className={labelCls}>Valor Máximo</label><input type="number" value={filtrosAvancados.valorMax} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMax: e.target.value })} placeholder="9999.00" className={inputCls} /></div>
                        <div className="sm:col-span-2 md:col-span-3 flex justify-end mt-2 md:mt-0">
                            <button onClick={limparFiltros} className="w-full md:w-auto text-xs font-bold text-rose-500 hover:text-rose-700 uppercase cursor-pointer transition-colors bg-rose-50 dark:bg-rose-900/20 px-4 py-3 md:py-2 rounded-lg border border-rose-200 dark:border-rose-800">
                                Limpar Tudo
                            </button>
                        </div>
                    </div>
                )}

                {/* AÇÕES EM LOTE */}
                {transacoesSelecionadas.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 md:p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">{transacoesSelecionadas.length} itens selecionados</span>
                        <div className="flex flex-wrap gap-2 justify-center w-full sm:w-auto">
                            <button type="button" onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'pago'); setTransacoesSelecionadas([]); }} className="flex-1 sm:flex-none px-4 py-2.5 md:py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 cursor-pointer transition shadow-sm">Marcar Pago</button>
                            <button type="button" onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'pendente'); setTransacoesSelecionadas([]); }} className="flex-1 sm:flex-none px-4 py-2.5 md:py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 cursor-pointer transition shadow-sm">Marcar Pendente</button>
                            <button type="button" onClick={() => { executarAcaoEmMassa(transacoesSelecionadas, 'excluir'); setTransacoesSelecionadas([]); }} className="w-full sm:w-auto px-4 py-2.5 md:py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 cursor-pointer transition shadow-sm border border-rose-700">Excluir</button>
                        </div>
                    </div>
                )}

                {/* ========================================== */}
                {/* VISÃO MOBILE: LISTA DE CARDS */}
                {/* ========================================== */}
                <div className="lg:hidden space-y-3 mt-2 w-full">
                    {dadosTabela.length > 0 && (
                        <div className="mb-4 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">Ordenar Lista Por:</p>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => mudarOrdenacao('data')} className={`flex-1 min-w-[80px] px-2 py-2.5 md:py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-center shadow-sm ${ordenacao.coluna === 'data' ? 'bg-blue-600 text-white border border-blue-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>Data<IconeOrdenacao ordenacao={ordenacao} coluna="data" /></button>
                                <button onClick={() => mudarOrdenacao('descricao')} className={`flex-1 min-w-[80px] px-2 py-2.5 md:py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-center shadow-sm ${ordenacao.coluna === 'descricao' ? 'bg-blue-600 text-white border border-blue-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>Nome<IconeOrdenacao ordenacao={ordenacao} coluna="descricao" /></button>
                                <button onClick={() => mudarOrdenacao('valor')} className={`flex-1 min-w-[80px] px-2 py-2.5 md:py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-center shadow-sm ${ordenacao.coluna === 'valor' ? 'bg-blue-600 text-white border border-blue-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>Valor<IconeOrdenacao ordenacao={ordenacao} coluna="valor" /></button>
                                <button onClick={() => mudarOrdenacao('status')} className={`flex-1 min-w-[80px] px-2 py-2.5 md:py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-center shadow-sm ${ordenacao.coluna === 'status' ? 'bg-blue-600 text-white border border-blue-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>Status<IconeOrdenacao ordenacao={ordenacao} coluna="status" /></button>
                            </div>
                        </div>
                    )}

                    {dadosTabela.length > 0 && (
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl mb-4 shadow-sm cursor-pointer" onClick={selecionarTodas}>
                            <input type="checkbox" readOnly checked={transacoesSelecionadas.length === dadosTabela.length} className="cursor-pointer w-5 h-5 accent-blue-600 shrink-0 pointer-events-none" />
                            <span className="text-sm md:text-xs font-bold text-slate-700 dark:text-slate-300 select-none">Selecionar Todos os {dadosTabela.length} itens</span>
                        </div>
                    )}

                    {dadosTabela.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                            Nenhum lançamento registado nesta competência.
                        </div>
                    ) : (
                        dadosTabela.map((t) => (
                            <div key={t.id} className={`bg-white dark:bg-slate-900 rounded-xl border transition-all shadow-sm relative overflow-hidden flex w-full active:scale-[0.98] ${transacoesSelecionadas.includes(t.id) ? 'border-blue-500 ring-1 ring-blue-500 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
                                {/* Área de seleção do checkbox expandida (w-14) para não errar o dedo */}
                                <div className="w-14 shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800 cursor-pointer" onClick={() => toggleSelecao(t.id)}>
                                    <input type="checkbox" readOnly checked={transacoesSelecionadas.includes(t.id)} className="cursor-pointer w-5 h-5 accent-blue-600 pointer-events-none" />
                                </div>
                                <div className="flex-1 min-w-0 p-4 cursor-pointer" onClick={() => abrirDetalhes(t)}>
                                    <div className="flex justify-between items-start gap-3 mb-2">
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight truncate flex items-center gap-1.5">
                                            <span className="truncate">{t.descricao}</span>
                                            {t.isThirdParty && (
                                                <span className="inline-flex items-center gap-1 shrink-0 text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                                    <Users className="w-2.5 h-2.5" strokeWidth={2.5} /> {t.thirdPartyName}
                                                </span>
                                            )}
                                            {t.observacao && <MessageSquare className="w-3 h-3 text-blue-500 shrink-0" strokeWidth={2} aria-label="Possui observação" />}
                                            {t._pendingSync && (
                                                <span className="inline-flex items-center gap-1 shrink-0 text-[9px] uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200" title="Guardado localmente, ainda não enviado ao servidor">
                                                    Pendente de sincronização
                                                </span>
                                            )}
                                        </h4>
                                        <span className={`shrink-0 text-[9px] uppercase font-bold px-2 py-1 rounded-md ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>{t.status}</span>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <div className="min-w-0 pr-2">
                                            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-0.5">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate w-full">{t.categoria} • {obterNomePagamento(t.formaPagamento)}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`font-extrabold text-[15px] ${t.tipo === 'renda' ? 'text-emerald-600 dark:text-emerald-400' : t.tipo === 'investimento' ? 'text-blue-600 dark:text-blue-400' : t.tipo === 'despesa' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>{formatarMoeda(t.valorParcela)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ========================================== */}
                {/* VISÃO DESKTOP: TABELA TRADICIONAL */}
                {/* ========================================== */}
                <div className="hidden lg:block overflow-x-auto flex-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 mt-4">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider whitespace-nowrap">
                            <tr>
                                <th className="p-3 text-center w-10"><input type="checkbox" onChange={selecionarTodas} checked={dadosTabela.length > 0 && transacoesSelecionadas.length === dadosTabela.length} className="cursor-pointer accent-blue-600 w-4 h-4" /></th>
                                <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" onClick={() => mudarOrdenacao('descricao')}>Descrição<IconeOrdenacao ordenacao={ordenacao} coluna="descricao" /></th>
                                <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" onClick={() => mudarOrdenacao('data')}>Vencimento / Compra<IconeOrdenacao ordenacao={ordenacao} coluna="data" /></th>
                                <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-center" onClick={() => mudarOrdenacao('status')}>Status da Conta<IconeOrdenacao ordenacao={ordenacao} coluna="status" /></th>
                                <th className="p-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-right" onClick={() => mudarOrdenacao('valor')}>Valor<IconeOrdenacao ordenacao={ordenacao} coluna="valor" /></th>
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
                                                {t.isThirdParty && (
                                                    <span className="inline-flex items-center gap-1 ml-1 text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 no-underline shrink-0">
                                                        <Users className="w-2.5 h-2.5" strokeWidth={2.5} /> {t.thirdPartyName}
                                                    </span>
                                                )}
                                                {t.observacao && <Info aria-label="Possui observação" className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors inline-block shrink-0 mt-0.5 cursor-help" strokeWidth={2} />}
                                                {t._pendingSync && (
                                                    <span className="inline-flex items-center gap-1 ml-1 text-[9px] uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200 no-underline shrink-0" title="Guardado localmente, ainda não enviado ao servidor">
                                                        Pendente de sincronização
                                                    </span>
                                                )}
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
                                        <td className={`p-3 text-right font-bold whitespace-nowrap ${t.tipo === 'renda' ? 'text-emerald-600 dark:text-emerald-400' : t.tipo === 'investimento' ? 'text-blue-600 dark:text-blue-400' : t.tipo === 'despesa' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>{formatarMoeda(t.valorParcela)}</td>
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
