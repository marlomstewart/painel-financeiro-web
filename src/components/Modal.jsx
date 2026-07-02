import React, { useState, useEffect } from 'react';

/**
 * Componente Interno: FormularioEdicao
 * Renderiza o formulário completo de edição de transação dentro do Modal
 * com a Máscara Bancária de digitação progressiva (direita para esquerda).
 */
function FormularioEdicao({ config, onConfirm, onCancel }) {
  const { transacao, categorias = [], cartoes = [] } = config;

  const initValorStr = Math.round((transacao.valorParcela || 0) * 100).toString();
  const [valorStr, setValorStr] = useState(initValorStr);

  const [descricao, setDescricao] = useState(transacao.descricao || '');
  const [dataCompra, setDataCompra] = useState(transacao.dataCompra ? transacao.dataCompra.split('T')[0] : '');
  const [tipo, setTipo] = useState(transacao.tipo || 'despesa');
  const [status, setStatus] = useState(transacao.status || 'pendente');
  const [categoria, setCategoria] = useState(transacao.categoria || 'Sem Categoria');
  const [formaPagamento, setFormaPagamento] = useState(transacao.formaPagamento || 'pix');
  const [observacao, setObservacao] = useState(transacao.observacao || '');

  const handleValorChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') val = '0';
    setValorStr(val);
  };

  const displayValor = (parseInt(valorStr, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericValue = parseInt(valorStr, 10) / 100;
    if (numericValue <= 0) {
      alert('O valor deve ser maior que zero.');
      return;
    }
    onConfirm({ descricao, valorParcela: numericValue, dataCompra, tipo, status, categoria, formaPagamento, observacao });
  };

  const inputCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors";
  const labelCls = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Valor (R$)</label>
        <input
          type="text"
          value={displayValor}
          onChange={handleValorChange}
          autoFocus
          className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4 text-3xl font-black text-blue-700 dark:text-blue-400 text-center outline-none focus:border-blue-500 transition-colors shadow-inner"
        />
      </div>

      <div><label className={labelCls}>Descrição</label><input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} required className={inputCls} /></div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Data</label><input type="date" value={dataCompra} onChange={e => setDataCompra(e.target.value)} required className={inputCls} /></div>
        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago / Recebido</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Natureza</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className={inputCls}>
            <option value="despesa">Despesa (Saída)</option>
            <option value="renda">Renda (Entrada)</option>
            <option value="investimento">Investimento</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Categoria</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)} className={inputCls}>
            <option value="Sem Categoria">Sem Categoria</option>
            <option value="Contas Fixas">Contas Fixas</option>
            {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Forma de Pagamento</label>
        <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className={inputCls}>
          <option value="pix">PIX / Dinheiro</option>
          <option value="debito">Cartão de Débito</option>
          {cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}
        </select>
      </div>

      <div><label className={labelCls}>Observação</label><textarea value={observacao} onChange={e => setObservacao(e.target.value)} className={`${inputCls} resize-none`} rows="2"></textarea></div>

      <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">Cancelar</button>
        <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-md cursor-pointer">Salvar Alterações</button>
      </div>
    </form>
  );
}

/**
 * Componente: Modal (Orquestrador Global)
 * Centraliza e renderiza todos os Pop-ups do sistema.
 */
export function Modal({ config, onClose }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (config?.type === 'prompt' && config.inputType !== 'editar_transacao') {
      setInputValue(config.defaultValue || '');
    }
  }, [config]);

  if (!config) return null;

  const { type, title, message, onConfirm, onCancel, options, inputType } = config;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel || onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">

        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{title || 'Aviso'}</h3>
          <button onClick={onCancel || onClose} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">

          {type === 'alert' && (
            <div className="space-y-4">
              <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{message}</div>
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={onConfirm} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">OK, Entendido</button>
              </div>
            </div>
          )}

          {type === 'confirm' && (
            <div className="space-y-4">
              <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{message}</div>
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={onCancel} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">Cancelar</button>
                <button onClick={onConfirm} className={`px-5 py-2.5 text-white font-bold rounded-lg transition-colors cursor-pointer ${config.confirmColor || 'bg-blue-600 hover:bg-blue-700'}`}>{config.confirmLabel || 'Confirmar'}</button>
              </div>
            </div>
          )}

          {type === 'prompt' && inputType !== 'editar_transacao' && (
            <div className="space-y-4">
              <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{message}</div>
              <input
                type={inputType || 'text'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={onCancel} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">Cancelar</button>
                <button onClick={() => onConfirm(inputValue)} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">{config.confirmLabel || 'Confirmar'}</button>
              </div>
            </div>
          )}

          {type === 'prompt' && inputType === 'editar_transacao' && (
            <FormularioEdicao config={config} onConfirm={onConfirm} onCancel={onCancel} />
          )}

          {type === 'options' && (
            <div className="space-y-4">
              <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{message}</div>
              <div className="flex flex-col gap-2">
                {options.map((opt, i) => (
                  <button key={i} onClick={() => onConfirm(opt.value)} className="w-full p-3 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={onCancel} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">Cancelar</button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------------------- */}
          {/* RENDERIZAÇÃO: MODAL DE FATURAS DE CARTÃO DE CRÉDITO */}
          {/* ----------------------------------------------------------------------------------- */}
          {type === 'faturas' && config.itens && (
            <div className="space-y-4">
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Gerencie as faturas fechadas ou em aberto deste mês. Apenas transações pendentes podem ser pagas em lote.</p>

              {config.itens.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <p className="text-slate-500 dark:text-slate-400 font-bold">Nenhum gasto no crédito nesta competência.</p>
                </div>
              ) : (
                config.itens.map((item, i) => {
                  const cId = config.cartaoIds[item.nome];
                  return (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-base mb-3 uppercase tracking-wider flex items-center gap-2">💳 {item.nome}</h4>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Total Fatura</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{Number(item.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/30 shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="block text-[9px] uppercase font-bold text-emerald-500 mb-0.5">Já Pago</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{Number(item.pago).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-100 dark:border-amber-800/30 shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="block text-[9px] uppercase font-bold text-amber-500 mb-0.5">Pendente</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">{Number(item.pendente).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => config.pagarFatura(cId)} disabled={item.pendente <= 0} className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1 ${item.pendente > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-70'}`}>
                          ✅ Pagar Fatura
                        </button>
                        <button onClick={() => config.reverterFatura(cId)} disabled={item.pago <= 0} className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1 ${item.pago > 0 ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-400 cursor-pointer border border-amber-200 dark:border-amber-800' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-70'}`}>
                          ↩️ Reverter
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------------------------- */}
          {/* RENDERIZAÇÃO: MODAL DO CALENDÁRIO DA GARAGEM */}
          {/* ----------------------------------------------------------------------------------- */}
          {type === 'calendario' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                <p className="text-sm text-indigo-800 dark:text-indigo-300 text-center font-medium leading-tight">
                  Selecione os dias em que você <strong>NÃO</strong> utilizou a moto para trabalhar. Isso abaterá a meta de gasolina automaticamente.
                </p>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: new Date(config.ano, config.mes, 0).getDate() }).map((_, i) => {
                  const dia = i + 1;
                  const dataStr = `${config.ano}-${String(config.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                  const isMarcado = config.diasMarcados?.includes(dataStr);

                  // Verifica qual é o dia da semana no mês exibido
                  const diaSemana = new Date(config.ano, config.mes - 1, dia).getDay();
                  // Dias de trabalho na moto: Segunda(1), Quarta(3), Sexta(5)
                  const isDiaTrabalho = diaSemana === 1 || diaSemana === 3 || diaSemana === 5;

                  return (
                    <button
                      key={dia}
                      onClick={() => config.onToggle(dataStr)}
                      className={`p-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${isMarcado ? 'bg-rose-500 text-white shadow-inner scale-95 border border-rose-600' : isDiaTrabalho ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/50' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border border-transparent'}`}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button onClick={onCancel} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-md w-full">Concluir Ajustes</button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------------------- */}
          {/* RENDERIZAÇÃO: MODAL DE DETALHES DE TRANSAÇÃO */}
          {/* ----------------------------------------------------------------------------------- */}
          {type === 'detalhes' && config.transacao && (
            <div className="space-y-6">
              <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{config.transacao.categoria}</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">{config.transacao.descricao}</h4>
                <p className={`text-3xl font-black ${config.transacao.tipo === 'renda' ? 'text-emerald-500' : config.transacao.tipo === 'investimento' ? 'text-blue-500' : 'text-slate-800 dark:text-white'}`}>
                  {Number(config.transacao.valorParcela).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Data Competência</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(config.transacao.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Status</span>
                  <span className={`font-semibold uppercase ${config.transacao.status === 'pago' ? 'text-emerald-600' : 'text-amber-600'}`}>{config.transacao.status}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm col-span-2 flex justify-between items-center">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Forma de Pagamento</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{config.nomePagamento}</span>
                  </div>
                  {config.transacao.data_pagamento && config.transacao.status === 'pago' && (
                    <div className="text-right">
                      <span className="block text-[10px] text-emerald-500 uppercase font-bold mb-1">Liquidado em</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">{new Date(config.transacao.data_pagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                    </div>
                  )}
                </div>
                {config.transacao.observacao && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-3 rounded-lg col-span-2">
                    <span className="block text-[10px] text-amber-600 dark:text-amber-500 uppercase font-bold mb-1">Observação Adicional</span>
                    <span className="font-medium text-amber-800 dark:text-amber-300">{config.transacao.observacao}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => { onClose(); config.onAlternarStatus(); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
                  🔄 {config.transacao.status === 'pago' ? 'Tornar Pendente' : 'Marcar Pago'}
                </button>
                <button onClick={() => config.onEditar()} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition cursor-pointer border border-blue-200 dark:border-blue-800">
                  ✏️ Editar Tudo
                </button>
                <button onClick={() => config.onDeletar()} className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-bold rounded hover:bg-rose-200 dark:hover:bg-rose-900/50 transition cursor-pointer">
                  🗑️ Excluir
                </button>
                <button onClick={() => config.onAnexarComprovante()} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
                  📎 Anexar
                </button>
                <button onClick={() => { onClose(); config.onVerComprovante(); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
                  📄 Ver Anexo
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}