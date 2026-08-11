import React, { useState } from 'react';
import { PiggyBank, Pencil, Trash2, TrendingUp } from 'lucide-react';

/**
 * @file src/components/RendasFixas.jsx
 * @description Módulo para gestão de entradas de caixa automatizadas (Salários, Pensões, Mesadas).
 * Alimenta o motor de lançamentos automáticos no início do mês.
 */
export function RendasFixas({ rendasFixas, addRendaFixa, editarSetup, removerSetup, modal }) {
    const [editandoId, setEditandoId] = useState(null);
    const [nome, setNome] = useState('');
    const [valorPadrao, setValorPadrao] = useState('0,00');
    const [diaRecebimento, setDiaRecebimento] = useState('');

    /**
     * @function handleCurrency
     * @description Formatação real-time para inputs monetários (BRL).
     */
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

    const handleEditar = (r) => {
        setEditandoId(r.id);
        setNome(r.nome);
        setValorPadrao(Number(r.valorPadrao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setDiaRecebimento(r.diaRecebimento);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelarEdicao = () => {
        setEditandoId(null);
        setNome('');
        setValorPadrao('0,00');
        setDiaRecebimento('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (valorPadrao === '0,00') {
            modal.alert('O valor não pode ser zero.', 'Aviso');
            return;
        }

        if (editandoId) {
            const parseCurrency = (val) => Number(String(val).replace(/\./g, '').replace(',', '.'));
            const sucesso = await editarSetup('rendas_fixas', editandoId, {
                nome,
                valorPadrao: parseCurrency(valorPadrao),
                diaRecebimento: Number(diaRecebimento)
            });
            if (sucesso) {
                cancelarEdicao();
                modal.alert('Renda Fixa atualizada com sucesso!', 'Editado');
            }
        } else {
            await addRendaFixa(e);
            cancelarEdicao();
        }
    };

    const handleExcluir = async (id) => {
        const ok = await modal.confirm('Deseja excluir esta Renda Fixa?', 'Excluir', { confirmLabel: 'Sim', confirmColor: 'bg-emerald-600 hover:bg-emerald-700' });
        if (ok) removerSetup('rendas_fixas', id);
    };

    const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // UI Constantes (Mobile-First)
    const inputCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors shadow-sm";
    const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 md:mb-1 tracking-wide";

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 animate-fade-in relative">

            {/* CABEÇALHO PADRÃO (SÓLIDO E ROLÁVEL) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <PiggyBank className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                            Rendas Fixas
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Automatize entradas recorrentes de caixa (Salário, Mesada, Pensão).
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">

                {/* COLUNA ESQUERDA: FORMULÁRIO */}
                <div className={`lg:col-span-1 border p-5 md:p-6 rounded-2xl shadow-sm h-fit lg:sticky top-6 z-10 transition-colors ${editandoId ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-5 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                        {editandoId ? <span className="inline-flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" strokeWidth={2.25} /> Editar Renda</span> : 'Nova Renda'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={labelCls}>Descrição</label>
                            <input name="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} required className={inputCls} placeholder="Ex: Salário Hospital" />
                        </div>
                        <div>
                            <label className={labelCls}>Valor Padrão (R$)</label>
                            <input name="valorPadrao" type="text" inputMode="numeric" value={valorPadrao} onChange={(e) => handleCurrency(e, setValorPadrao)} required className={`${inputCls} font-bold text-emerald-600 dark:text-emerald-400`} />
                        </div>
                        <div>
                            <label className={labelCls}>Dia do Recebimento</label>
                            <input name="diaRecebimento" type="number" min="1" max="31" value={diaRecebimento} onChange={e => setDiaRecebimento(e.target.value)} required className={inputCls} placeholder="Ex: 20" />
                        </div>

                        <div className="pt-2">
                            {editandoId ? (
                                <div className="flex gap-3">
                                    <button type="button" onClick={cancelarEdicao} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 md:py-3 rounded-lg text-sm transition-colors cursor-pointer active:scale-[0.98]">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 md:py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md active:scale-[0.98]">
                                        Salvar Edição
                                    </button>
                                </div>
                            ) : (
                                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 md:py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md mt-2 active:scale-[0.98]">
                                    Salvar Renda Fixa
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* COLUNA DIREITA: LISTAGEM EM CARDS */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 pl-1">Entradas Automatizadas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        {rendasFixas.length === 0 ? (
                            <div className="md:col-span-2 text-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30">
                                <PiggyBank className="w-8 h-8 mx-auto mb-3 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                                <span className="font-semibold text-sm">Nenhuma renda fixa registrada.</span>
                            </div>
                        ) : (
                            rendasFixas.map(r => (
                                <div key={r.id} className={`bg-white dark:bg-slate-900 border p-4 md:p-5 rounded-2xl shadow-sm relative group transition-colors flex flex-col hover:shadow-md ${editandoId === r.id ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800/50'}`}>
                                    <div className="flex justify-between items-start mb-4 gap-2">
                                        <h4 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 leading-tight truncate">
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.25} /> {r.nome}
                                        </h4>
                                        {/* Pílula de ações explícita e elegante, sempre visível no celular */}
                                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0 shadow-sm">
                                            <button onClick={() => handleEditar(r)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Editar"><Pencil className="w-3.5 h-3.5" strokeWidth={2} /></button>
                                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-600"></div>
                                            <button onClick={() => handleExcluir(r.id)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Excluir"><Trash2 className="w-3.5 h-3.5" strokeWidth={2} /></button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 mt-auto">
                                        <div>
                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Valor Padrão</p>
                                            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 truncate">{formatarMoeda(r.valorPadrao)}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Recebe em</p>
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">Dia {r.diaRecebimento}</p>
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