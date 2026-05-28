import React from 'react';

export function Login({ fazerLogin, usuarioLogin, setUsuarioLogin, senhaLogin, setSenhaLogin, erroLogin, modalConfig, modalClose, ModalComponent }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <ModalComponent config={modalConfig} onClose={modalClose} />
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Painel Financeiro</h1>
          <p className="text-sm text-slate-500 mt-1">Acesso Restrito</p>
        </div>
        <form onSubmit={fazerLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
            <input type="text" value={usuarioLogin} onChange={e => setUsuarioLogin(e.target.value)} required className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input type="password" value={senhaLogin} onChange={e => setSenhaLogin(e.target.value)} required className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:border-blue-500" />
          </div>
          {erroLogin && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded">{erroLogin}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">Entrar no Sistema</button>
        </form>
      </div>
    </div>
  );
}