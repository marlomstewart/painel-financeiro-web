import React, { useState } from 'react';

export function ContasFixas({ contasFixas, addContaFixa, editarSetup, removerSetup, modal }) {
    const [editandoId, setEditandoId] = useState(null);
    const [nome, setNome] = useState('');
    const [valorPadrao, setValorPadrao] = useState('0,00');
    const [vencimento, setVencimento] = useState('');

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

    const handleEditar = (c) => {
        setEditandoId(c.id);
        setNome(c.nome);
        setValorPadrao(Number(c.valorPadrao || c.valorpadrao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setVencimento(c.vencimento);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelarEdicao = () => {
        setEditandoId(null);
        setNome('');
        setValorPadrao('0,00');
        setVencimento('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (valorPadrao === '0,00') {
            modal.alert('O valor não pode ser zero.', 'Aviso');
            return;
        }

        if (editandoId) {
            const parseCurrency = (val) => Number(String(val).replace(/\./g, '').replace(',', '.'));
            const sucesso = await editarSetup('contasFixas', editandoId, {
                nome,
                valorPadrao: parseCurrency(valorPadrao),
                vencimento: Number(vencimento)
            });
            if (sucesso) {
                cancelarEdicao();
                modal.alert('Conta Fixa atualizada com sucesso!', '✅ Editado');
            }
        } else {
            await addContaFixa(e);
            cancelarEdicao();
        }
    };

    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta Conta Fixa?', '🗑️ Excluir', { confirmLabel: 'Sim', confirmColor: 'bg-rose-600 hover:bg-rose-700' });
        if (ok) removerSetup('contasFixas', id);
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
                <div className={`lg:col-span-1 border p-5 rounded-xl shadow-sm h-fit lg:sticky top-32 z-10 transition-colors ${editandoId ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                        {editandoId ? '✏️ Editar Despesa' : 'Nova Despesa'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
                            <input name="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500" placeholder="Ex: Conta de Luz" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor Padrão (R$)</label>
                            <input name="valorPadrao" type="text" inputMode="numeric" value={valorPadrao} onChange={(e) => handleCurrency(e, setValorPadrao)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dia Vencimento</label>
                            <input name="vencimento" type="number" min="1" max="31" value={vencimento} onChange={e => setVencimento(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500" placeholder="Ex: 5" />
                        </div>
                        
                        {editandoId ? (
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={cancelarEdicao} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">
                                    Salvar Edição
                                </button>
                            </div>
                        ) : (
                            <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md mt-2">
                                Salvar Conta Fixa
                            </button>
                        )}
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Despesas Automatizadas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contasFixas.length === 0 ? (
                            <div className="md:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">Nenhuma conta fixa registrada.</div>
                        ) : (
                            contasFixas.map(c => (
                                <div key={c.id} className={`bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-sm relative group transition-colors ${editandoId === c.id ? 'border-blue-400' : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800/50'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            <span className="text-rose-500">🔻</span> {c.nome}
                                        </h4>
                                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditar(c)} className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer" title="Editar">✏️</button>
                                            <button onClick={() => handleExcluir(c.id)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer" title="Excluir">🗑️</button>
                                        </div>
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