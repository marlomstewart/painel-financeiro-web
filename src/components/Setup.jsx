import React from 'react';

export function Setup({ ModalComponent, modalConfig, modalClose, gerarMesManual, gerandoMes, exportarCSV, setTelaAtiva, addCartao, cartoes, removerSetup, addCategoria, categorias, addContaFixa, contasFixas, addRendaFixa, rendasFixas }) {
  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <ModalComponent config={modalConfig} onClose={modalClose} />
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900">Configuração Inicial</h1></div>
          <div className="flex gap-2">
            <button onClick={gerarMesManual} disabled={gerandoMes} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-2 px-4 rounded-lg flex items-center gap-2 border border-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{gerandoMes ? '⏳ Gerando...' : '🤖 Gerar Mês Atual'}</button>
            <button onClick={exportarCSV} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium py-2 px-4 rounded-lg flex items-center gap-2 border border-emerald-200 transition-colors">⬇️ Exportar Backup CSV</button>
            <button onClick={() => setTelaAtiva('dashboard')} className="bg-slate-900 text-white font-medium py-2 px-6 rounded-lg hover:bg-slate-800">Voltar</button>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-bold uppercase text-slate-600 mb-4">1. Cartões de Crédito</h2>
            <form onSubmit={addCartao} className="space-y-3"><input name="nome" placeholder="Nome" required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" /><div className="flex gap-2"><input name="melhorDia" type="number" placeholder="Melhor dia" required className="w-1/2 border p-2 rounded text-sm outline-none focus:border-blue-500" /><input name="vencimento" type="number" placeholder="Vencimento" required className="w-1/2 border p-2 rounded text-sm outline-none focus:border-blue-500" /></div><button type="submit" className="w-full bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600">Salvar Cartão</button></form>
            <ul className="mt-4 space-y-2">{cartoes.map(c => (<li key={c.id} className="flex justify-between bg-slate-50 p-2 rounded border text-sm items-center"><span>💳 {c.nome}</span><button onClick={() => removerSetup('cartoes', c.id)} className="text-red-500 bg-red-50 px-2 py-1 rounded">X</button></li>))}</ul>
          </section>
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-bold uppercase text-slate-600 mb-4">2. Metas (Categorias)</h2>
            <form onSubmit={addCategoria} className="space-y-3"><input name="nome" placeholder="Nome" required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" /><input name="meta" type="number" step="0.01" placeholder="Meta" required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" /><select name="tipo" className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-blue-500"><option value="despesa">Gasto</option><option value="investimento">Investimento</option></select><button type="submit" className="w-full bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600">Salvar Categoria</button></form>
            <ul className="mt-4 space-y-2">{categorias.map(c => (<li key={c.id} className="flex justify-between bg-slate-50 p-2 rounded border text-sm items-center"><span>🏷️ {c.nome}</span><button onClick={() => removerSetup('categorias', c.id)} className="text-red-500 bg-red-50 px-2 py-1 rounded">X</button></li>))}</ul>
          </section>
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-bold uppercase text-slate-600 mb-4">3. Contas Fixas</h2>
            <form onSubmit={addContaFixa} className="space-y-3"><input name="nome" placeholder="Nome" required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" /><div className="flex gap-2"><input name="valor" type="number" step="0.01" placeholder="Valor" required className="w-1/2 border p-2 rounded text-sm outline-none focus:border-blue-500" /><input name="vencimento" type="number" placeholder="Dia" required className="w-1/2 border p-2 rounded text-sm outline-none focus:border-blue-500" /></div><button type="submit" className="w-full bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600">Salvar Conta Fixa</button></form>
            <ul className="mt-4 space-y-2">{contasFixas.map(f => (<li key={f.id} className="flex justify-between bg-slate-50 p-2 rounded border text-sm items-center"><span>📅 {f.nome}</span><button onClick={() => removerSetup('contasFixas', f.id)} className="text-red-500 bg-red-50 px-2 py-1 rounded">X</button></li>))}</ul>
          </section>
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-bold uppercase text-slate-600 mb-4">4. Rendas Fixas</h2>
            <form onSubmit={addRendaFixa} className="space-y-3">
              <input name="nome" placeholder="Ex: Salário, Parceria..." required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" />
              <div className="flex gap-2">
                <input name="valor" type="number" step="0.01" placeholder="Valor" required className="w-1/2 border p-2 rounded text-sm outline-none focus:border-blue-500" />
                <input name="diaRecebimento" type="number" placeholder="Dia Recebimento" min="1" max="31" required className="w-1/2 border p-2 rounded text-sm outline-none focus:border-blue-500" />
              </div>
              <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded text-sm hover:bg-emerald-600">Salvar Renda Fixa</button>
            </form>
            <ul className="mt-4 space-y-2">{rendasFixas.map(r => (<li key={r.id} className="flex justify-between bg-slate-50 p-2 rounded border text-sm items-center"><span>💰 {r.nome}</span><button onClick={() => removerSetup('rendasFixas', r.id)} className="text-red-500 bg-red-50 px-2 py-1 rounded">X</button></li>))}</ul>
          </section>
        </div>
      </div>
    </div>
  );
}