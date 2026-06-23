/* eslint-disable react/prop-types */
import React from 'react';

export function Admin({ ModalComponent, modalConfig, modalClose, setTelaAtiva, criarUsuario, carregarUsuarios, usuarios, toggleAdmin, resetarSenha, deletarUsuario }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <ModalComponent config={modalConfig} onClose={modalClose} />
      <div className="mx-auto max-w-3xl space-y-6">
        
        <header className="border-b border-slate-200 dark:border-slate-700 pb-4 flex justify-between items-center transition-colors">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">👥 Gerenciamento de Usuários</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Super Admin — acesso restrito</p>
          </div>
          <button type="button" onClick={() => setTelaAtiva('dashboard')} className="bg-slate-900 dark:bg-slate-700 text-white font-medium py-2 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors cursor-pointer">Voltar</button>
        </header>

        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
          <h2 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-300 mb-4">Criar Novo Usuário</h2>
          <form onSubmit={criarUsuario} className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nome de usuário</label>
                <input name="usuario" placeholder="Ex: joao" required className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors" />
            </div>
            <div className="flex items-center gap-2 pb-2.5">
                <input type="checkbox" name="is_admin" id="is_admin_check" className="w-4 h-4 cursor-pointer" />
                <label htmlFor="is_admin_check" className="text-sm text-slate-600 dark:text-slate-300">Super Admin?</label>
            </div>
            <button type="submit" className="bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors cursor-pointer">Criar Usuário</button>
          </form>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">A senha padrão será <strong>admin123</strong>. O usuário será obrigado a trocar no primeiro acesso.</p>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center transition-colors">
            <h2 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-300">Usuários Cadastrados</h2>
            <button type="button" onClick={carregarUsuarios} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer">🔄 Atualizar lista</button>
          </div>
          {usuarios.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm"><p>Clique em "Atualizar lista" para carregar os usuários.</p></div>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold transition-colors">
                    <tr><th className="p-4">Usuário</th><th className="p-4">Permissão</th><th className="p-4">Status Senha</th><th className="p-4 text-center">Ações</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{u.usuario}</td>
                        <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded ${u.is_admin === 1 ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{u.is_admin === 1 ? '⭐ Super Admin' : 'Usuário'}</span></td>
                        <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded ${u.precisa_trocar === 1 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'}`}>{u.precisa_trocar === 1 ? '⚠ Senha Padrão' : '✔ Senha Própria'}</span></td>
                        <td className="p-4">
                        <div className="flex gap-2 justify-center">
                            <button type="button" onClick={() => toggleAdmin(u.id, u.usuario, u.is_admin === 1)} className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 px-2 py-1 rounded font-medium cursor-pointer">{u.is_admin === 1 ? '⭐ Remover Admin' : '⭐ Tornar Admin'}</button>
                            <button type="button" onClick={() => resetarSenha(u.id, u.usuario)} className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded font-medium cursor-pointer">🔑 Resetar Senha</button>
                            <button type="button" onClick={() => deletarUsuario(u.id, u.usuario)} className="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 px-2 py-1 rounded font-medium cursor-pointer">🗑️ Deletar</button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}