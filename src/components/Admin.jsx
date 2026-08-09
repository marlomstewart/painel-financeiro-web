/* eslint-disable react/prop-types */
import React, { useState } from 'react';

/**
 * @file src/components/Admin.jsx
 * @description Módulo de gerenciamento de permissões e usuários do sistema (Super Admin).
 */
export function Admin({ ModalComponent, modalConfig, modalClose, setTelaAtiva, criarUsuario, carregarUsuarios, usuarios, toggleAdmin, resetarSenha, deletarUsuario, toggleGaragem, toggleComprovante }) {

  const [atualizando, setAtualizando] = useState(false);

  const handleAtualizarLista = async () => {
    setAtualizando(true);
    await carregarUsuarios();
    setAtualizando(false);
  };

  const formatarUltimoAcesso = (dataString) => {
    if (!dataString) return <span className="text-slate-400 dark:text-slate-500 font-medium text-[10px] uppercase tracking-wider">Nunca acessou</span>;

    const data = new Date(dataString);
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
      <div className="flex flex-col">
        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{dataFormatada}</span>
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">às {horaFormatada}</span>
      </div>
    );
  };

  // UI Constantes
  const inputCls = "w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-3.5 md:p-3 rounded-xl text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors shadow-sm";
  const btnSalvarCls = "w-full md:w-auto bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white font-bold py-4 md:py-3 px-8 rounded-xl text-sm transition-all cursor-pointer shadow-md active:scale-[0.98] shrink-0";

  return (
    <div className="p-4 md:p-6 text-slate-800 dark:text-slate-200 transition-colors duration-300 relative w-full overflow-x-hidden animate-fade-in">
      <ModalComponent config={modalConfig} onClose={modalClose} />

      <div className="w-full max-w-7xl mx-auto space-y-6 pb-24">

        {/* 🌟 CABEÇALHO PADRÃO (SÓLIDO E ROLÁVEL) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              👥 Gerenciamento de Usuários
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Super Admin — Acesso restrito e auditoria de sistema.
            </p>
          </div>
          <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
            <button type="button" onClick={() => setTelaAtiva('dashboard')} className="w-full sm:w-auto bg-slate-900 dark:bg-slate-700 text-white font-bold py-3.5 md:py-2.5 px-6 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors cursor-pointer shadow-sm active:scale-[0.98]">
              Voltar ao Painel
            </button>
          </div>
        </div>

        <section className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">Criar Novo Usuário</h2>
          <form onSubmit={criarUsuario} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 md:mb-1">Nome de usuário</label>
              <input name="usuario" placeholder="Ex: joao.silva" required className={inputCls} />
            </div>
            <div className="flex items-center gap-3 pb-4 md:pb-3 w-full md:w-auto justify-start md:justify-center shrink-0">
              <input type="checkbox" name="is_admin" id="is_admin_check" className="w-5 h-5 cursor-pointer accent-blue-600" />
              <label htmlFor="is_admin_check" className="text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">Conceder Super Admin?</label>
            </div>
            <button type="submit" className={btnSalvarCls}>Criar Usuário</button>
          </form>
          <div className="mt-5 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30 shadow-sm">
            <p className="text-[11px] md:text-xs text-blue-700 dark:text-blue-400 font-medium leading-relaxed">💡 A senha padrão gerada será <strong>admin123</strong>. O sistema forçará o utilizador a definir uma senha própria e segura logo no seu primeiro login. Por padrão, novos usuários não têm acesso ao Módulo Garagem.</p>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors flex flex-col w-full">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors w-full">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Auditoria e Controle de Acessos</h2>
            <button
              type="button"
              onClick={handleAtualizarLista}
              disabled={atualizando}
              className={`text-xs font-bold px-4 py-3 md:py-2 rounded-xl border transition-all flex items-center justify-center gap-2 w-full sm:w-auto active:scale-95 ${atualizando ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 cursor-wait' : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer shadow-sm'}`}
            >
              {atualizando ? (
                <><svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sincronizando...</>
              ) : '🔄 Sincronizar Base'}
            </button>
          </div>

          {usuarios.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center gap-4">
              <span className="text-5xl opacity-50 block mb-2">📂</span>
              <p className="font-bold text-lg">A base de utilizadores local ainda não foi carregada.</p>
              <button type="button" onClick={handleAtualizarLista} className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">Clique aqui para sincronizar agora.</button>
            </div>
          ) : (
            <div className="w-full">

              {/* ========================================================================= */}
              {/* LAYOUT 1: CELULAR (CARDS EMPILHADOS) */}
              {/* ========================================================================= */}
              <div className="lg:hidden flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-950/50">
                {usuarios.map(u => (
                  <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black uppercase text-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                          {u.usuario.charAt(0)}
                        </div>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 truncate text-lg">{u.usuario}</h3>
                      </div>
                      <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm ${u.is_admin === 1 ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                        {u.is_admin === 1 ? '⭐ Admin' : 'Comum'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sessão</p>
                        {formatarUltimoAcesso(u.ultimo_login)}
                      </div>
                      <div className={`p-3 rounded-xl border flex flex-col items-center justify-center shadow-sm ${u.precisa_trocar === 1 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30'}`}>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${u.precisa_trocar === 1 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>Senha</p>
                        <span className={`text-xs font-black uppercase tracking-wider ${u.precisa_trocar === 1 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {u.precisa_trocar === 1 ? '⚠ VAZADA' : '✔ FORTE'}
                        </span>
                      </div>
                      <div className={`p-3 rounded-xl border flex flex-col items-center justify-center shadow-sm ${u.tem_garagem === 1 ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800/30' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50'}`}>
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Garagem</p>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${u.tem_garagem === 1 ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}>
                          {u.tem_garagem === 1 ? '🏍️ LIBERADA' : 'BLOQUEADA'}
                        </span>
                      </div>
                      <div className={`p-3 rounded-xl border flex flex-col items-center justify-center shadow-sm ${u.tem_comprovante === 1 ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/10 dark:border-teal-800/30' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50'}`}>
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Comprovante</p>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${u.tem_comprovante === 1 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`}>
                          {u.tem_comprovante === 1 ? '📎 LIBERADO' : 'BLOQUEADO'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button type="button" onClick={() => toggleAdmin(u.id, u.usuario, u.is_admin === 1)} className="py-3.5 text-xs bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50 rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-[0.98]">
                        {u.is_admin === 1 ? '↓ Rebaixar' : '↑ Promover Admin'}
                      </button>
                      <button type="button" onClick={() => toggleGaragem && toggleGaragem(u.id, u.usuario, u.tem_garagem === 1)} className="py-3.5 text-xs bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-[0.98]">
                        {u.tem_garagem === 1 ? '🚫 Tira Garagem' : '🏍️ Dar Garagem'}
                      </button>
                      <button type="button" onClick={() => toggleComprovante && toggleComprovante(u.id, u.usuario, u.tem_comprovante === 1)} className="py-3.5 text-xs bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50 rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-[0.98]">
                        {u.tem_comprovante === 1 ? '🚫 Tira Comprovante' : '📎 Dar Comprovante'}
                      </button>
                      <button type="button" onClick={() => resetarSenha(u.id, u.usuario)} className="py-3.5 text-xs bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-[0.98]">
                        🔑 Forçar Reset
                      </button>
                      <button type="button" onClick={() => deletarUsuario(u.id, u.usuario)} className="py-3.5 text-xs bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-[0.98]">
                        🗑️ Excluir Conta
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ========================================================================= */}
              {/* LAYOUT 2: COMPUTADOR (TABELA FIXA COM LIMITES ESTRITOS) */}
              {/* ========================================================================= */}
              <div className="hidden lg:block w-full">
                <table className="w-full text-sm text-left table-fixed">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-black transition-colors">
                    <tr>
                      <th className="px-5 py-5 w-3/12">Utilizador Registado</th>
                      <th className="px-3 py-5 text-center w-1/12">Nível</th>
                      <th className="px-3 py-5 text-center w-2/12">Última Sessão</th>
                      <th className="px-3 py-5 text-center w-1/12">Senha</th>
                      <th className="px-3 py-5 text-center w-1/12">Garagem</th>
                      <th className="px-3 py-5 text-center w-1/12">Comprovante</th>
                      <th className="px-5 py-5 text-center w-3/12">Ações Administrativas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {usuarios.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">

                        <td className="px-5 py-4 font-black text-slate-800 dark:text-slate-200 break-words">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-black uppercase text-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                              {u.usuario.charAt(0)}
                            </div>
                            <span className="truncate text-base" title={u.usuario}>{u.usuario}</span>
                          </div>
                        </td>

                        <td className="px-3 py-4 text-center">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm ${u.is_admin === 1 ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                            {u.is_admin === 1 ? '⭐ Admin' : 'Comum'}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-center">
                          {formatarUltimoAcesso(u.ultimo_login)}
                        </td>

                        <td className="px-3 py-4 text-center">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm ${u.precisa_trocar === 1 ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'}`}>
                            {u.precisa_trocar === 1 ? '⚠ VAZADA' : '✔ FORTE'}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-center">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm ${u.tem_garagem === 1 ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                            {u.tem_garagem === 1 ? '🏍️ ATIVA' : 'INATIVA'}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-center">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm ${u.tem_comprovante === 1 ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                            {u.tem_comprovante === 1 ? '📎 ATIVO' : 'INATIVO'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2 justify-center">
                            <button type="button" onClick={() => toggleAdmin(u.id, u.usuario, u.is_admin === 1)} title={u.is_admin === 1 ? 'Rebaixar para Visualizador' : 'Promover a Administrador'} className="text-xs bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50 px-3 py-2 rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-95">
                              {u.is_admin === 1 ? '↓ Despromover' : '↑ Promover'}
                            </button>
                            <button type="button" onClick={() => toggleGaragem && toggleGaragem(u.id, u.usuario, u.tem_garagem === 1)} title={u.tem_garagem === 1 ? 'Revogar acesso à Garagem' : 'Liberar acesso à Garagem'} className="text-xs bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 px-3 py-2 rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-95">
                              {u.tem_garagem === 1 ? '🚫 Garagem' : '🏍️ Garagem'}
                            </button>
                            <button type="button" onClick={() => toggleComprovante && toggleComprovante(u.id, u.usuario, u.tem_comprovante === 1)} title={u.tem_comprovante === 1 ? 'Revogar anexo de comprovantes' : 'Liberar anexo de comprovantes'} className="text-xs bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50 px-3 py-2 rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-95">
                              {u.tem_comprovante === 1 ? '🚫 Comprovante' : '📎 Comprovante'}
                            </button>
                            <button type="button" onClick={() => resetarSenha(u.id, u.usuario)} title="Forçar a senha a voltar para 'admin123'" className="text-xs bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2 rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-95">
                              🔑 Reset
                            </button>
                            <button type="button" onClick={() => deletarUsuario(u.id, u.usuario)} title="Apagar a conta permanentemente" className="text-xs bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 px-3 py-2 rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-95">
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