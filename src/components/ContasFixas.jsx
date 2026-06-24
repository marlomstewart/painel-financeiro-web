import React, { useState } from 'react';

export function ContasFixas({ contasFixas, addContaFixa, rendasFixas, addRendaFixa }) {
    const [nomeConta, setNomeConta] = useState('');
    const [valorConta, setValorConta] = useState('');
    const [diaVencimento, setDiaVencimento] = useState('');
    const [tipoRegistro, setTipoRegistro] = useState('despesa');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (tipoRegistro === 'despesa') {
            const sucesso = await addContaFixa({ nome: nomeConta, valor: valorConta, diaVencimento });
            if (sucesso) { setNomeConta(''); setValorConta(''); setDiaVencimento(''); }
        } else {
            const sucesso = await addRendaFixa({ nome: nomeConta, valor: valorConta, diaRecebimento: diaVencimento });
            if (sucesso) { setNomeConta(''); setValorConta(''); setDiaVencimento(''); }
        }
    };

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">🔄 Contas Fixas e Assinaturas</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Automatize o registro de contas que se repetem todos os meses.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm h-fit">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Nova Obrigação Mensal</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tipo da Conta</label><select value={tipoRegistro} onChange={(e) => setTipoRegistro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"><option value="despesa">Despesa (Água, Luz, Internet)</option><option value="renda">Renda (Salário, Aluguel Recebido)</option></select></div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descrição</label><input type="text" value={nomeConta} onChange={(e) => setNomeConta(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: Conta de Luz" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor Fixo (R$)</label><input type="number" step="0.01" min="0.01" value={valorConta} onChange={(e) => setValorConta(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="0.00" /></div>
                            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia do Mês</label><input type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" placeholder="Ex: 10" /></div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">Adicionar à Lista Fixa</button>
                    </form>
                </div>

                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
                    <div>
                        <h4 className="font-bold text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2"><span className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg">🔻</span> Despesas Recorrentes</h4>
                        <div className="space-y-3">
                            {contasFixas.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma despesa fixa.</p> : contasFixas.map(c => (
                                <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm flex justify-between items-center">
                                    <div><p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{c.nome}</p><p className="text-[10px] text-slate-500 uppercase">Dia {c.dia_vencimento}</p></div>
                                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{formatarMoeda(c.valor)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2"><span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">🚀</span> Rendas Recorrentes</h4>
                        <div className="space-y-3">
                            {rendasFixas.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma renda fixa.</p> : rendasFixas.map(r => (
                                <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm flex justify-between items-center">
                                    <div><p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{r.nome}</p><p className="text-[10px] text-slate-500 uppercase">Dia {r.dia_recebimento}</p></div>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatarMoeda(r.valor)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}