import React, { useState } from 'react';

export function Cartoes({ cartoes, addCartao }) {
    const [nomeCartao, setNomeCartao] = useState('');
    const [limite, setLimite] = useState('');
    const [diaFechamento, setDiaFechamento] = useState('');
    const [diaVencimento, setDiaVencimento] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const sucesso = await addCartao({ nome: nomeCartao, limite, diaFechamento, diaVencimento });
        if (sucesso) { setNomeCartao(''); setLimite(''); setDiaFechamento(''); setDiaVencimento(''); }
    };

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">💳 Meus Cartões de Crédito</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seus limites e dias de fechamento para faturas inteligentes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm h-fit">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Novo Cartão</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome do Cartão</label><input type="text" value={nomeCartao} onChange={(e) => setNomeCartao(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: Nubank, Itaú" /></div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Limite Total (R$)</label><input type="number" step="0.01" min="0.01" value={limite} onChange={(e) => setLimite(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="0.00" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia Fechamento</label><input type="number" min="1" max="31" value={diaFechamento} onChange={(e) => setDiaFechamento(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" /></div>
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia Vencimento</label><input type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" /></div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">Cadastrar Cartão</button>
                    </form>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
                    {cartoes.length === 0 ? (
                        <div className="md:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">Nenhum cartão cadastrado.</div>
                    ) : (
                        cartoes.map(c => (
                            <div key={c.id} className="bg-gradient-to-tr from-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <h4 className="text-lg font-black tracking-widest uppercase">{c.nome}</h4>
                                    <span className="text-xl opacity-50">💳</span>
                                </div>
                                <div className="mb-4 relative z-10">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Limite Total</p>
                                    <p className="text-xl font-bold text-emerald-400">{formatarMoeda(c.limite)}</p>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 relative z-10">
                                    <p>Fecha dia <strong className="text-white">{c.diaFechamento}</strong></p>
                                    <p>Vence dia <strong className="text-white">{c.diaVencimento}</strong></p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}