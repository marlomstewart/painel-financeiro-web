/* eslint-disable react/prop-types */
import React, { useState } from 'react';

const API = 'https://painel-gestao-financeira-api.onrender.com/api';

export function Setup({ ModalComponent, modalConfig, modalClose, gerarMesManual, gerandoMes, exportarCSV, setTelaAtiva, addCartao, cartoes, setCartoes, removerSetup, addCategoria, categorias, setCategorias, addContaFixa, contasFixas, setContasFixas, addRendaFixa, rendasFixas, setRendasFixas, getHeaders }) {

  const [editando, setEditando] = useState(null);

  const salvarEdicao = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { banco, item } = editando;
    let rota, body, updater;

    if (banco === 'cartoes') {
      body = { nome: fd.get('nome'), melhorDia: Number(fd.get('melhorDia')), vencimento: Number(fd.get('vencimento')) };
      rota = `cartoes/${item.id}`;
      updater = () => setCartoes(prev => prev.map(c => c.id === item.id ? { ...c, ...body } : c));
    } else if (banco === 'categorias') {
      body = { nome: fd.get('nome'), meta: Number(fd.get('meta')), tipo: fd.get('tipo') };
      rota = `categorias/${item.id}`;
      updater = () => setCategorias(prev => prev.map(c => c.id === item.id ? { ...c, ...body } : c));
    } else if (banco === 'contasFixas') {
      body = { nome: fd.get('nome'), valorPadrao: Number(fd.get('valor')), vencimento: Number(fd.get('vencimento')) };
      rota = `contas-fixas/${item.id}`;
      updater = () => setContasFixas(prev => prev.map(c => c.id === item.id ? { ...c, ...body, valorPadrao: body.valorPadrao } : c));
    } else if (banco === 'rendasFixas') {
      body = { nome: fd.get('nome'), valorPadrao: Number(fd.get('valor')), diaRecebimento: Number(fd.get('diaRecebimento')) };
      rota = `rendas-fixas/${item.id}`;
      updater = () => setRendasFixas(prev => prev.map(r => r.id === item.id ? { ...r, ...body } : r));
    }

    try {
      const res = await fetch(`${API}/${rota}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) });
      if (res.ok) { updater(); setEditando(null); }
      else alert('Erro ao salvar. Tente novamente.');
    } catch (err) { alert('Erro de conexão.'); }
  };

  const inputCls = "w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors";

  const renderModalEdicao = () => {
    if (!editando) return null;
    const { banco, item } = editando;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setEditando(null)}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-transparent dark:border-slate-700 transition-colors duration-300" onClick={e => e.stopPropagation()}>
          <div className="p-6">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
              {banco === 'cartoes' && '✏️ Editar Cartão'}
              {banco === 'categorias' && '✏️ Editar Categoria'}
              {banco === 'contasFixas' && '✏️ Editar Conta Fixa'}
              {banco === 'rendasFixas' && '✏️ Editar Renda Fixa'}
            </h3>
            <form onSubmit={salvarEdicao} className="space-y-3">
              {banco === 'cartoes' && <>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Nome</label><input name="nome" defaultValue={item.nome} required className={inputCls} /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Melhor Dia</label><input name="melhorDia" type="number" defaultValue={item.melhorDia} required className={inputCls} /></div>
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Vencimento</label><input name="vencimento" type="number" defaultValue={item.vencimento} required className={inputCls} /></div>
                </div>
              </>}

              {banco === 'categorias' && <>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Nome</label><input name="nome" defaultValue={item.nome} required className={inputCls} /></div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Meta (R$)</label><input name="meta" type="number" step="0.01" defaultValue={item.meta} required className={inputCls} /></div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Tipo</label>
                  <select name="tipo" defaultValue={item.tipo} className={inputCls}>
                    <option value="despesa">Gasto</option>
                    <option value="investimento">Investimento</option>
                  </select>
                </div>
              </>}

              {banco === 'contasFixas' && <>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Nome</label><input name="nome" defaultValue={item.nome} required className={inputCls} /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Valor (R$)</label><input name="valor" type="number" step="0.01" defaultValue={item.valorPadrao} required className={inputCls} /></div>
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Dia Vencimento</label><input name="vencimento" type="number" defaultValue={item.vencimento} required className={inputCls} /></div>
                </div>
              </>}

              {banco === 'rendasFixas' && <>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Nome</label><input name="nome" defaultValue={item.nome} required className={inputCls} /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Valor (R$)</label><input name="valor" type="number" step="0.01" defaultValue={item.valorPadrao} required className={inputCls} /></div>
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Dia Recebimento</label><input name="diaRecebimento" type="number" min="1" max="31" defaultValue={item.diaRecebimento} required className={inputCls} /></div>
                </div>
              </>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <ModalComponent config={modalConfig} onClose={modalClose} />
      {renderModalEdicao()}
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="border-b border-slate-200 dark:border-slate-700 pb-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
          <div><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configuração Inicial</h1></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={gerarMesManual} disabled={gerandoMes} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 font-medium py-2 px-4 rounded-lg flex items-center gap-2 border border-indigo-200 dark:border-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">{gerandoMes ? '⏳ Gerando...' : '🤖 Gerar Mês Atual'}</button>
            <button type="button" onClick={exportarCSV} className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 font-medium py-2 px-4 rounded-lg flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer">⬇️ Exportar Backup CSV</button>
            <button type="button" onClick={() => setTelaAtiva('dashboard')} className="bg-slate-900 dark:bg-slate-800 text-white font-medium py-2 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 cursor-pointer transition-colors">Voltar</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 1. CARTÕES */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h2 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-300 mb-4">1. Cartões de Crédito</h2>
            <form onSubmit={addCartao} className="space-y-3">
              <input name="nome" placeholder="Nome" required className={inputCls} />
              <div className="flex gap-2">
                <input name="melhorDia" type="number" placeholder="Melhor dia" required className={inputCls} />
                <input name="vencimento" type="number" placeholder="Vencimento" required className={inputCls} />
              </div>
              <button type="submit" className="w-full bg-blue-500 dark:bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer transition-colors">Salvar Cartão</button>
            </form>
            <ul className="mt-4 space-y-2">
              {cartoes.map(c => (
                <li key={c.id} className="flex justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-700 text-sm items-center transition-colors">
                  <span className="text-slate-800 dark:text-slate-200">💳 {c.nome}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditando({ banco: 'cartoes', item: c })} className="text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer">✏️</button>
                    <button type="button" onClick={() => removerSetup('cartoes', c.id)} className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer">X</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 2. CATEGORIAS */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h2 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-300 mb-4">2. Metas (Categorias)</h2>
            <form onSubmit={addCategoria} className="space-y-3">
              <input name="nome" placeholder="Nome" required className={inputCls} />
              <input name="meta" type="number" step="0.01" placeholder="Meta" required className={inputCls} />
              <select name="tipo" className={inputCls}>
                <option value="despesa">Gasto</option>
                <option value="investimento">Investimento</option>
              </select>
              <button type="submit" className="w-full bg-blue-500 dark:bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer transition-colors">Salvar Categoria</button>
            </form>
            <ul className="mt-4 space-y-2">
              {categorias.map(c => (
                <li key={c.id} className="flex justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-700 text-sm items-center transition-colors">
                  <span className="text-slate-800 dark:text-slate-200">🏷️ {c.nome} <span className="text-slate-400 dark:text-slate-500 text-xs">— {c.tipo === 'investimento' ? 'Invest.' : 'Gasto'}</span></span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditando({ banco: 'categorias', item: c })} className="text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer">✏️</button>
                    <button type="button" onClick={() => removerSetup('categorias', c.id)} className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer">X</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. CONTAS FIXAS */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h2 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-300 mb-4">3. Contas Fixas</h2>
            <form onSubmit={addContaFixa} className="space-y-3">
              <input name="nome" placeholder="Nome" required className={inputCls} />
              <div className="flex gap-2">
                <input name="valor" type="number" step="0.01" placeholder="Valor" required className={inputCls} />
                <input name="vencimento" type="number" placeholder="Dia" required className={inputCls} />
              </div>
              <button type="submit" className="w-full bg-blue-500 dark:bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer transition-colors">Salvar Conta Fixa</button>
            </form>
            <ul className="mt-4 space-y-2">
              {contasFixas.map(f => (
                <li key={f.id} className="flex justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-700 text-sm items-center transition-colors">
                  <span className="text-slate-800 dark:text-slate-200">📅 {f.nome} <span className="text-slate-400 dark:text-slate-500 text-xs">— dia {f.vencimento}</span></span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditando({ banco: 'contasFixas', item: f })} className="text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer">✏️</button>
                    <button type="button" onClick={() => removerSetup('contasFixas', f.id)} className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer">X</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. RENDAS FIXAS */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h2 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-300 mb-4">4. Rendas Fixas</h2>
            <form onSubmit={addRendaFixa} className="space-y-3">
              <input name="nome" placeholder="Ex: Salário, Parceria..." required className={inputCls} />
              <div className="flex gap-2">
                <input name="valor" type="number" step="0.01" placeholder="Valor" required className={inputCls} />
                <input name="diaRecebimento" type="number" placeholder="Dia Recebimento" min="1" max="31" required className={inputCls} />
              </div>
              <button type="submit" className="w-full bg-emerald-500 dark:bg-emerald-600 text-white py-2 rounded text-sm hover:bg-emerald-600 dark:hover:bg-emerald-700 cursor-pointer transition-colors">Salvar Renda Fixa</button>
            </form>
            <ul className="mt-4 space-y-2">
              {rendasFixas.map(r => (
                <li key={r.id} className="flex justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-700 text-sm items-center transition-colors">
                  <span className="text-slate-800 dark:text-slate-200">💰 {r.nome} <span className="text-slate-400 dark:text-slate-500 text-xs">— dia {r.diaRecebimento}</span></span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditando({ banco: 'rendasFixas', item: r })} className="text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer">✏️</button>
                    <button type="button" onClick={() => removerSetup('rendasFixas', r.id)} className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer">X</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}