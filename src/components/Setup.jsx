import React, { useState } from 'react';

const API = 'https://painel-gestao-financeira-api.onrender.com/api';

export function Setup({ ModalComponent, modalConfig, modalClose, gerarMesManual, gerandoMes, exportarCSV, setTelaAtiva, addCartao, cartoes, setCartoes, removerSetup, addCategoria, categorias, setCategorias, addContaFixa, contasFixas, setContasFixas, addRendaFixa, rendasFixas, setRendasFixas, getHeaders }) {

  const [editando, setEditando] = useState(null); // { banco, item }

  // =========================================================================
  // SALVAR EDIÇÃO
  // =========================================================================
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

  // =========================================================================
  // MODAL DE EDIÇÃO
  // =========================================================================
  const renderModalEdicao = () => {
    if (!editando) return null;
    const { banco, item } = editando;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setEditando(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              {banco === 'cartoes' && '✏️ Editar Cartão'}
              {banco === 'categorias' && '✏️ Editar Categoria'}
              {banco === 'contasFixas' && '✏️ Editar Conta Fixa'}
              {banco === 'rendasFixas' && '✏️ Editar Renda Fixa'}
            </h3>
            <form onSubmit={salvarEdicao} className="space-y-3">
              {/* CARTÃO */}
              {banco === 'cartoes' && <>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Nome</label><input name="nome" defaultValue={item.nome} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 mb-1 block">Melhor Dia</label><input name="melhorDia" type="number" defaultValue={item.melhorDia} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 mb-1 block">Vencimento</label><input name="vencimento" type="number" defaultValue={item.vencimento} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                </div>
              </>}

              {/* CATEGORIA */}
              {banco === 'categorias' && <>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Nome</label><input name="nome" defaultValue={item.nome} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Meta (R$)</label><input name="meta" type="number" step="0.01" defaultValue={item.meta} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
                  <select name="tipo" defaultValue={item.tipo} className="w-full border p-2 rounded-lg text-sm bg-white outline-none focus:border-blue-500">
                    <option value="despesa">Gasto</option>
                    <option value="investimento">Investimento</option>
                  </select>
                </div>
              </>}

              {/* CONTA FIXA */}
              {banco === 'contasFixas' && <>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Nome</label><input name="nome" defaultValue={item.nome} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 mb-1 block">Valor (R$)</label><input name="valor" type="number" step="0.01" defaultValue={item.valorPadrao} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 mb-1 block">Dia Vencimento</label><input name="vencimento" type="number" defaultValue={item.vencimento} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                </div>
              </>}

              {/* RENDA FIXA */}
              {banco === 'rendasFixas' && <>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Nome</label><input name="nome" defaultValue={item.nome} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 mb-1 block">Valor (R$)</label><input name="valor" type="number" step="0.01" defaultValue={item.valorPadrao} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                  <div className="flex-1"><label className="text-xs font-medium text-slate-600 mb-1 block">Dia Recebimento</label><input name="diaRecebimento" type="number" min="1" max="31" defaultValue={item.diaRecebimento} required className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                </div>
              </>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-sm transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <ModalComponent config={modalConfig} onClose={modalClose} />
      {renderModalEdicao()}
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

          {/* 1. CARTÕES */}
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-bold uppercase text-slate-600 mb-4">1. Cartões de Crédito</h2>
            <form onSubmit={addCartao} className="space-y-3">
              <input name="nome" placeholder="Nome" required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" />
              <div className="flex gap-2">
                <input name="melhorDia" type="number" placeholder="Melhor dia" required className="w-1/2 border p-2 rounded text-sm outline-none focus:border-blue-500" />
                <input name="vencimento" type="number" placeholder="Vencimento" required className="w-1/2 border p-2 rounded text-sm outline-none focus:border-blue-500" />
              </div>
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600">Salvar Cartão</button>
            </form>
            <ul className="mt-4 space-y-2">
              {cartoes.map(c => (
                <li key={c.id} className="flex justify-between bg-slate-50 p-2 rounded border text-sm items-center">
                  <span>💳 {c.nome}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditando({ banco: 'cartoes', item: c })} className="text-blue-500 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs font-medium transition-colors">✏️</button>
                    <button onClick={() => removerSetup('cartoes', c.id)} className="text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs font-medium transition-colors">X</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 2. CATEGORIAS */}
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-bold uppercase text-slate-600 mb-4">2. Metas (Categorias)</h2>
            <form onSubmit={addCategoria} className="space-y-3">
              <input name="nome" placeholder="Nome" required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" />
              <input name="meta" type="number" step="0.01" placeholder="Meta" required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" />
              <select name="tipo" className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-blue-500">
                <option value="despesa">Gasto</option>
                <option value="investimento">Investimento</option>
              </select>
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600">Salvar Categoria</button>
            </form>
            <ul className="mt-4 space-y-2">
              {categorias.map(c => (
                <li key={c.id} className="flex justify-between bg-slate-50 p-2 rounded border text-sm items-center">
                  <span>🏷️ {c.nome} <span className="text-slate-400 text-xs">— {c.tipo === 'investimento' ? 'Invest.' : 'Gasto'}</span></span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditando({ banco: 'categorias', item: c })} className="text-blue-500 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs font-medium transition-colors">✏️</button>
                    <button onClick={() => removerSetup('categorias', c.id)} className="text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs font-medium transition-colors">X</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. CONTAS FIXAS */}
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-bold uppercase text-slate-600 mb-4">3. Contas Fixas</h2>
            <form onSubmit={addContaFixa} className="space-y-3">
              <input name="nome" placeholder="Nome" required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" />
              <div className="flex gap-2">
                <input name="valor" type="number" step="0.01" placeholder="Valor" required className="w-1/2 border p-2 rounded text-sm outline-none focus:border-blue-500" />
                <input name="vencimento" type="number" placeholder="Dia" required className="w-1/2 border p-2 rounded text-sm outline-none focus:border-blue-500" />
              </div>
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600">Salvar Conta Fixa</button>
            </form>
            <ul className="mt-4 space-y-2">
              {contasFixas.map(f => (
                <li key={f.id} className="flex justify-between bg-slate-50 p-2 rounded border text-sm items-center">
                  <span>📅 {f.nome} <span className="text-slate-400 text-xs">— dia {f.vencimento}</span></span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditando({ banco: 'contasFixas', item: f })} className="text-blue-500 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs font-medium transition-colors">✏️</button>
                    <button onClick={() => removerSetup('contasFixas', f.id)} className="text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs font-medium transition-colors">X</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. RENDAS FIXAS */}
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
            <ul className="mt-4 space-y-2">
              {rendasFixas.map(r => (
                <li key={r.id} className="flex justify-between bg-slate-50 p-2 rounded border text-sm items-center">
                  <span>💰 {r.nome} <span className="text-slate-400 text-xs">— dia {r.diaRecebimento}</span></span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditando({ banco: 'rendasFixas', item: r })} className="text-blue-500 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs font-medium transition-colors">✏️</button>
                    <button onClick={() => removerSetup('rendasFixas', r.id)} className="text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs font-medium transition-colors">X</button>
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