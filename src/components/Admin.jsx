import React from 'react';

export function Admin({ ModalComponent, modalConfig, modalClose, setTelaAtiva, criarUsuario, carregarUsuarios, usuarios, toggleAdmin, resetarSenha, deletarUsuario }) {
  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <ModalComponent config={modalConfig} onClose={modalClose} />
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="border-b border-slate-200 pb-4 flex justify-between items-center">
          <div><h1 className="text-2xl font-bold text-slate-900">👥 Gerenciamento de Usuários</h1><p className="text-sm text-slate-500 mt-1">Super Admin — acesso restrito</p></div>
          <button onClick={() => setTelaAtiva('dashboard')} className="bg-slate-900 text-white font-medium py-2 px-6 rounded-lg hover:bg-slate-800">Voltar</button>
        </header>
        <section className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-sm font-bold uppercase text-slate-600 mb-4">Criar Novo Usuário</h2>
          <form onSubmit={criarUsuario} className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1"><label className="block text-xs font-medium text-slate-600 mb-1">Nome de usuário</label><input name="usuario" placeholder="Ex: joao" required className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
            <div className="flex items-center gap-2 pb-2.5"><input type="checkbox" name="is_admin" id="is_admin_check" className="w-4 h-4" /><label htmlFor="is_admin_check" className="text-sm text-slate-600">Super Admin?</label></div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors">Criar Usuário</button>
          </form>
          <p className="text-xs text-slate-400 mt-2">A senha padrão será <strong>admin123</strong>. O usuário será obrigado a trocar no primeiro acesso.</p>
        </section>
        <section className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase text-slate-600">Usuários Cadastrados</h2>
            <button onClick={carregarUsuarios} className="text-xs text-blue-600 hover:underline font-medium">🔄 Atualizar lista</button>
          </div>
          {usuarios.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm"><p>Clique em "Atualizar lista" para carregar os usuários.</p></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b text-xs uppercase text-slate-500 font-semibold">
                <tr><th className="p-4">Usuário</th><th className="p-4">Permissão</th><th className="p-4">Status Senha</th><th className="p-4 text-center">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{u.usuario}</td>
                    <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded ${u.is_admin === 1 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{u.is_admin === 1 ? '⭐ Super Admin' : 'Usuário'}</span></td>
                    <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded ${u.precisa_trocar === 1 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{u.precisa_trocar === 1 ? '⚠ Senha Padrão' : '✔ Senha Própria'}</span></td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => toggleAdmin(u.id, u.usuario, u.is_admin === 1)} className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded font-medium">{u.is_admin === 1 ? '⭐ Remover Admin' : '⭐ Tornar Admin'}</button>
                        <button onClick={() => resetarSenha(u.id, u.usuario)} className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded font-medium">🔑 Resetar Senha</button>
                        <button onClick={() => deletarUsuario(u.id, u.usuario)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2 py-1 rounded font-medium">🗑️ Deletar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}