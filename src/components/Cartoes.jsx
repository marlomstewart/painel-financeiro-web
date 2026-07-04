import React, { useState } from 'react';

export function Cartoes({ transacoes = [], cartoes, addCartao, editarSetup, removerSetup, modal }) {
    const [nomeCartao, setNomeCartao] = useState('');
    const [limite, setLimite] = useState('');
    const [diaFechamento, setDiaFechamento] = useState('');
    const [diaVencimento, setDiaVencimento] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        await addCartao(e);
        setNomeCartao('');
        setLimite('');
        setDiaFechamento('');
        setDiaVencimento('');
    };

    const handleEditar = async (c) => {
        const nNome = await modal.prompt(`1️⃣ Novo NOME do Cartão?`, c.nome, '✏️ Editar Cartão', { confirmLabel: 'Próximo' });
        if (!nNome) return;

        const nLim = await modal.prompt(`2️⃣ Novo LIMITE (R$)?`, String(c.limite || ''), '✏️ Editar Cartão', { inputType: 'number', confirmLabel: 'Próximo' });
        if (!nLim || isNaN(Number(nLim))) return modal.alert('Valor de limite inválido. Edição cancelada.', 'Erro');

        const nF = await modal.prompt(`3️⃣ Novo Dia de FECHAMENTO?`, String(c.melhorDia || ''), '✏️ Editar Cartão', { inputType: 'number', confirmLabel: 'Próximo' });
        if (!nF || isNaN(Number(nF))) return modal.alert('Dia de fechamento inválido. Edição cancelada.', 'Erro');

        const nV = await modal.prompt(`4️⃣ Novo Dia de VENCIMENTO?`, String(c.vencimento || ''), '✏️ Editar Cartão', { inputType: 'number', confirmLabel: 'Salvar' });
        if (!nV || isNaN(Number(nV))) return modal.alert('Dia de vencimento inválido. Edição cancelada.', 'Erro');

        const sucesso = await editarSetup('cartoes', c.id, {
            nome: nNome,
            limite: Number(nLim),
            melhorDia: Number(nF),
            vencimento: Number(nV)
        });

        if (sucesso) modal.alert('Cartão atualizado com sucesso!', '✅ Editado');
    };

    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Atenção: Excluir este cartão pode quebrar faturas vinculadas. Tem certeza?', '🗑️ Excluir', { confirmLabel: 'Excluir', confirmColor: 'bg-red-600 hover:bg-red-700' });
        if (ok) removerSetup('cartoes', id);
    };

    const formatarMoeda = (valor) => {
        const numero = Number(valor);
        const valorSeguro = isNaN(numero) ? 0 : numero;
        return valorSeguro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 animate-fade-in relative">

            <div className="sticky top-0 z-40 pt-4 md:pt-6 pb-2 -mt-4 md:-mt-6 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md mb-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">💳 Meus Cartões de Crédito</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seus limites, uso em tempo real e dias de faturamento.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm h-fit">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Novo Cartão</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome do Cartão</label>
                            <input name="nome" type="text" value={nomeCartao} onChange={(e) => setNomeCartao(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: Nubank, Itaú" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Limite Total (R$)</label>
                            <input name="limite" type="number" step="any" min="0.01" value={limite} onChange={(e) => setLimite(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="0.00" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia Fechamento</label>
                                <input name="melhorDia" type="number" min="1" max="31" value={diaFechamento} onChange={(e) => setDiaFechamento(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia Vencimento</label>
                                <input name="vencimento" type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md flex justify-center items-center gap-2"
                        >
                            Cadastrar Cartão
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
                    {cartoes.length === 0 ? (
                        <div className="md:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">Nenhum cartão cadastrado.</div>
                    ) : (
                        cartoes.map(c => {
                            const transacoesCartao = transacoes.filter(t => t.status === 'pendente' && String(t.formaPagamento) === `credito_${c.id}`);
                            const limiteUtilizado = transacoesCartao.reduce((acc, t) => acc + Number(t.valorParcela || t.valor || 0), 0);
                            const limiteTotal = Number(c.limite || 0);
                            const limiteRestante = limiteTotal - limiteUtilizado;

                            let pctUtilizado = limiteTotal > 0 ? (limiteUtilizado / limiteTotal) * 100 : 0;
                            const isEstourado = limiteRestante < 0;

                            return (
                                <div key={c.id} className="bg-gradient-to-tr from-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none"></div>
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <h4 className="text-lg font-black tracking-widest uppercase">{c.nome}</h4>
                                        <div className="flex items-center gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditar(c)} className="text-slate-400 hover:text-white transition-colors cursor-pointer" title="Editar">✏️</button>
                                            <button onClick={() => handleExcluir(c.id)} className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer" title="Excluir">🗑️</button>
                                            <span className="text-xl opacity-50 ml-1">💳</span>
                                        </div>
                                    </div>

                                    <div className="mb-5 relative z-10 space-y-3">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1">Limite Disponível</p>
                                                <p className={`text-2xl font-black ${isEstourado ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {formatarMoeda(limiteRestante)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1">Limite Total</p>
                                                <p className="text-sm font-bold text-slate-300">{formatarMoeda(limiteTotal)}</p>
                                            </div>
                                        </div>

                                        <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-1000 ${isEstourado ? 'bg-rose-500' : pctUtilizado > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(pctUtilizado, 100)}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
                                            <span>Utilizado: <strong className="text-slate-200">{formatarMoeda(limiteUtilizado)}</strong></span>
                                            <span>{pctUtilizado.toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-[10px] text-slate-400 relative z-10 border-t border-slate-700/50 pt-3 uppercase tracking-wider">
                                        <p>Fechamento: <strong className="text-white">Dia {c.melhorDia || '--'}</strong></p>
                                        <p>Vencimento: <strong className="text-white">Dia {c.vencimento || '--'}</strong></p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}