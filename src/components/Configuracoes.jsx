import React from 'react';

export function Configuracoes({ exportarCSV, gerarMesManual, gerandoMes, removerSetup, nomeUsuario }) {
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">⚙️ Configurações do Sistema</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Preferências, exportação de dados e ações estruturais da sua conta: <strong className="text-slate-700 dark:text-slate-300">{nomeUsuario}</strong>.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Ferramentas de Dados</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Exporte seu livro-razão financeiro completo para abrir no Excel ou processar manualmente em Mês Fechado.</p>
                    <div className="flex flex-col gap-3">
                        <button type="button" onClick={exportarCSV} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer">📥 Fazer Backup de Lançamentos (CSV)</button>
                        <button type="button" onClick={gerarMesManual} disabled={gerandoMes} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer">
                            {gerandoMes ? '⏳ Injetando contas na base...' : '⚡ Lançar Contas Fixas deste Mês Agora'}
                        </button>
                    </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 p-6 rounded-xl shadow-sm space-y-4">
                    <h3 className="font-bold text-rose-800 dark:text-rose-400">Zona de Perigo</h3>
                    <p className="text-sm text-rose-600 dark:text-rose-500">Ações destrutivas. Não é possível desfazer exclusões massivas no Banco de Dados.</p>
                    <div className="grid grid-cols-1 gap-3">
                        <button type="button" onClick={() => removerSetup('categoria')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer">Excluir Todas as Metas/Categorias</button>
                        <button type="button" onClick={() => removerSetup('contaFixa')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer">Excluir Todas as Contas Fixas</button>
                        <button type="button" onClick={() => removerSetup('cartao')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer">Excluir Todos os Cartões</button>
                    </div>
                </div>
            </div>
        </div>
    );
}