import React from 'react';

export function TrocaSenha({ enviarNovaSenha, novaSenha, setNovaSenha, confirmarSenha, setConfirmarSenha, erroTrocaSenha, fazerLogout }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-slate-800">Crie sua Senha Definitiva</h1>
          <p className="text-sm text-slate-500 mt-2">Por segurança, não é permitido manter a senha padrão.</p>
        </div>
        <form onSubmit={enviarNovaSenha} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
            <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required className="w-full border p-2.5 rounded-lg outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirme a Nova Senha</label>
            <input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} required className="w-full border p-2.5 rounded-lg outline-none focus:border-emerald-500" />
          </div>
          {erroTrocaSenha && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded">{erroTrocaSenha}</p>}
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors">Salvar e Acessar Painel</button>
          <button type="button" onClick={fazerLogout} className="w-full mt-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">Cancelar e Sair</button>
        </form>
      </div>
    </div>
  );
}