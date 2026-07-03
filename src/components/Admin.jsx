/* eslint-disable react/prop-types */
import React, { useState } from 'react';

export function Admin({ ModalComponent, modalConfig, modalClose, setTelaAtiva, criarUsuario, carregarUsuarios, usuarios, toggleAdmin, resetarSenha, deletarUsuario }) {

  const [atualizando, setAtualizando] = useState(false);

  const handleAtualizarLista = async () => {
    setAtualizando(true);
    await carregarUsuarios();
    setAtualizando(false);
  };

  const formatarUltimoAcesso = (dataString) => {
    if (!dataString) return <span className="text-slate-400 italic text-[10px]">Nunca acessou</span>;

    const data = new Date(dataString);
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{dataFormatada}</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">às {horaFormatada}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 text-slate-800 dark:text-slate-200 transition-colors duration-300 relative w-full overflow-x-hidden">
      <ModalComponent config={modalConfig} onClose={modalClose} />

      <div className="mx-auto max-w-5xl space-y-6">

        {/* CABEÇALHO FIXO (STICKY BLUR) */}
        <div className="sticky top-0 z-40 pt-4 md:pt-6 pb-2 -mt-4 md:-mt-6 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md mb-6 w-full">
          <header className="border-b border-slate-200 dark:border-slate-700 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-colors">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">👥 Gerenciamento de Usuários</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Super Admin — Acesso restrito e auditoria de sistema.</p>
            </div>
            <button type="button" onClick={() => setTelaAtiva('dashboard')} className="bg-slate-900 dark:bg-slate-700 text-white font-medium py-2 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors cursor-pointer shadow-sm shrink-0">Voltar</button>
          </header>
        </div>

        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-4">Criar Novo Usuário</h2>
          <form onSubmit={criarUsuario} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Nome de usuário</label>
              <input name="usuario" placeholder="Ex: joao.silva" required className="w-full border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors shadow-sm" />
            </div>
            <div className="flex items-center gap-2 pb-3 w-full md:w-auto justify-start md:justify-center shrink-0">
              <input type="checkbox" name="is_admin" id="is_admin_check" className="w-4 h-4 cursor-pointer accent-blue-600" />
              <label htmlFor="is_admin_check" className="text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">Conceder Super Admin?</label>
            </div>
            <button type="submit" className="w-full md:w-auto bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-sm transition-colors cursor-pointer shadow-md shrink-0">Criar Usuário</button>
          </form>
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
            <p className="text-[11px] text-blue-700 dark:text-blue-400">💡 A senha padrão gerada será <strong>admin123</strong>. O sistema forçará o utilizador a definir uma senha própria e segura logo no seu primeiro login.</p>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors flex flex-col w-full">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors w-full">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Auditoria e Controle de Acessos</h2>
            <button
              type="button"
              onClick={handleAtualizarLista}
              disabled={atualizando}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center justify-center gap-2 w-full sm:w-auto ${atualizando ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600 cursor-wait' : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer shadow-sm'}`}
            >
              {atualizando ? (
                <><svg className="animate-spin h-3 w-3 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sincronizando...</>
              ) : '🔄 Sincronizar Base'}
            </button>
          </div>

          {usuarios.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center gap-3">
              <span className="text-4xl opacity-50">📂</span>
              <p className="font-semibold">A base de utilizadores local ainda não foi carregada.</p>
              <button type="button" onClick={handleAtualizarLista} className="text-blue-500 hover:underline cursor-pointer">Clique aqui para sincronizar agora.</button>
            </div>
          ) : (
            <div className="w-full">

              {/* ========================================================================= */}
              {/* LAYOUT 1: CELULAR (CARDS EMPILHADOS) */}
              {/* ========================================================================= */}
              <div className="lg:hidden flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-950/50">
                {usuarios.map(u => (
                  <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-black uppercase text-lg border border-slate-200 dark:border-slate-700">
                          {u.usuario.charAt(0)}
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate text-base">{u.usuario}</h3>
                      </div>
                      <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm ${u.is_admin === 1 ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                        {u.is_admin === 1 ? '⭐ Admin' : 'Comum'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Última Sessão</p>
                        {formatarUltimoAcesso(u.ultimo_login)}
                      </div>
                      <div className={`p-2 rounded-lg border flex flex-col items-center justify-center ${u.precisa_trocar === 1 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30'}`}>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${u.precisa_trocar === 1 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>Credencial</p>
                        <span className={`text-[10px] font-black uppercase ${u.precisa_trocar === 1 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {u.precisa_trocar === 1 ? '⚠ VAZADA' : '✔ FORTE'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button type="button" onClick={() => toggleAdmin(u.id, u.usuario, u.is_admin === 1)} className="col-span-2 py-2 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-lg font-bold cursor-pointer transition-colors shadow-sm">
                        {u.is_admin === 1 ? '↓ Rebaixar Acesso' : '↑ Tornar Admin'}
                      </button>
                      <button type="button" onClick={() => resetarSenha(u.id, u.usuario)} className="py-2 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-lg font-bold cursor-pointer transition-colors shadow-sm">
                        🔑 Reset
                      </button>
                      <button type="button" onClick={() => deletarUsuario(u.id, u.usuario)} className="py-2 text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-lg font-bold cursor-pointer transition-colors shadow-sm">
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ========================================================================= */}
              {/* LAYOUT 2: COMPUTADOR (TABELA FIXA COM LIMITES ESTRITOS) */}
              {/* ========================================================================= */}
              <div className="hidden lg:block w-full">
                {/* Alterado para table-fixed para forçar os limites e impedir expansão indesejada */}
                <table className="w-full text-sm text-left table-fixed">
                  <thead className="bg-slate-100/50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-black transition-colors">
                    <tr>
                      {/* Larguras bem definidas em percentagem */}
                      <th className="px-4 py-4 w-3/12">Utilizador Registado</th>
                      <th className="px-2 py-4 text-center w-2/12">Nível</th>
                      <th className="px-2 py-4 text-center w-2/12">Última Sessão</th>
                      <th className="px-2 py-4 text-center w-2/12">Credencial</th>
                      <th className="px-4 py-4 text-center w-3/12">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {usuarios.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">

                        <td className="px-4 py-4 font-black text-slate-800 dark:text-slate-200 break-words">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold uppercase border border-slate-300 dark:border-slate-600">
                              {u.usuario.charAt(0)}
                            </div>
                            <span className="truncate" title={u.usuario}>{u.usuario}</span>
                          </div>
                        </td>

                        <td className="px-2 py-4 text-center">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-sm ${u.is_admin === 1 ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                            {u.is_admin === 1 ? '⭐ Admin' : 'Comum'}
                          </span>
                        </td>

                        <td className="px-2 py-4 text-center">
                          {formatarUltimoAcesso(u.ultimo_login)}
                        </td>

                        <td className="px-2 py-4 text-center">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-sm ${u.precisa_trocar === 1 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'}`}>
                            {u.precisa_trocar === 1 ? '⚠ VAZADA' : '✔ FORTE'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2 justify-center">
                            <button type="button" onClick={() => toggleAdmin(u.id, u.usuario, u.is_admin === 1)} title={u.is_admin === 1 ? 'Rebaixar para Visualizador' : 'Promover a Administrador'} className="text-[11px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors shadow-sm">
                              {u.is_admin === 1 ? '↓ Despromover' : '↑ Promover'}
                            </button>
                            <button type="button" onClick={() => resetarSenha(u.id, u.usuario)} title="Forçar a senha a voltar para 'admin123'" className="text-[11px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors shadow-sm">
                              🔑 Reset
                            </button>
                            <button type="button" onClick={() => deletarUsuario(u.id, u.usuario)} title="Apagar a conta permanentemente" className="text-[11px] bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors shadow-sm">
                              🗑️ Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}