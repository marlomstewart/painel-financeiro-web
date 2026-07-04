import React, { useState } from 'react';

export function ContasFixas({ contasFixas, addContaFixa, editarSetup, removerSetup, modal }) {
    const [valorPadrao, setValorPadrao] = useState('0,00');

    // MÁSCARA BANCÁRIA
    const handleCurrency = (e, setter) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value === '') value = '0';
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) return;
        const stringValue = numericValue.toString().padStart(3, '0');
        const inteiros = stringValue.slice(0, -2);
        const centavos = stringValue.slice(-2);
        const inteirosFormatados = inteiros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        setter(`${inteirosFormatados},${centavos}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (valorPadrao === '0,00') {
            modal.alert('O valor não pode ser zero.', 'Aviso');
            return;
        }
        await addContaFixa(e);
        e.target.reset();
        setValorPadrao('0,00');
    };

    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta Conta Fixa?', '🗑️ Excluir', { confirmLabel: 'Sim', confirmColor: 'bg-rose-600 hover:bg-rose-700' });
        if (ok) removerSetup('contasFixas', id); // AGORA ELE APAGA SÓ DA TABELA DE CONTAS FIXAS
    };

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 animate-fade-in relative">
            <div className="sticky top-0 z-40 pt-4 md:pt-6 pb-2 -mt-4 md:-mt-6 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md mb-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">🔄 Contas Fixas</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Automatize despesas recorrentes (Internet, Água, Condomínio).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm h-fit lg:sticky top-32 z-10">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Nova Despesa</h3>

                    {/* 🔥 NÃO TEM MAIS SELECTOR DE TIPO AQUI! */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
                            <input name="nome" type="text" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500" placeholder="Ex: Conta de Luz" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor Padrão (R$)</label>
                            <input name="valorPadrao" type="text" inputMode="numeric" value={valorPadrao} onChange={(e) => handleCurrency(e, setValorPadrao)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia Vencimento</label>
                            <input name="vencimento" type="number" min="1" max="31" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500" placeholder="Ex: 5" />
                        </div>
                        <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md mt-2">
                            Salvar Conta Fixa
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Despesas Automatizadas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contasFixas.length === 0 ? (
                            <div className="md:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">Nenhuma conta fixa registrada.</div>
                        ) : (
                            contasFixas.map(c => (
                                <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative group hover:border-rose-300 dark:hover:border-rose-800/50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            <span className="text-rose-500">🔻</span> {c.nome}
                                        </h4>
                                        <button onClick={() => handleExcluir(c.id)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer opacity-100 md:opacity-0 group-hover:opacity-100">🗑️</button>
                                    </div>
                                    <div className="flex justify-between items-end bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-0.5">Valor Padrão</p>
                                            <p className="text-lg font-bold text-rose-700 dark:text-rose-400">{formatarMoeda(c.valorPadrao || c.valorpadrao)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-0.5">Vencimento</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Dia {c.vencimento}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}