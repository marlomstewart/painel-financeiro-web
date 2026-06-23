import React, { useState, useEffect, useRef } from 'react';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Componente: Modal Universal
 * Centraliza e renderiza diálogos customizados do sistema com suporte integral a temas escuros.
 */
export function Modal({ config, onClose }) {
  const [inputValue, setInputValue] = useState(config?.defaultValue || '');
  const inputRef = useRef(null);
  const [localMarcados, setLocalMarcados] = useState([]);

  useEffect(() => {
    if (config) {
      setInputValue(config.defaultValue || '');
      setTimeout(() => inputRef.current?.focus(), 50);
      if (config.type === 'calendario') setLocalMarcados(config.diasMarcados || []);
    }
  }, [config]);

  if (!config) return null;
  const { type, title, message, options, onConfirm, onCancel, confirmLabel, cancelLabel, confirmColor } = config;

  const handleConfirm = () => { onConfirm(type === 'prompt' ? inputValue : true); onClose(); };
  const handleCancel = () => { if (onCancel) onCancel(); onClose(); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') handleCancel(); };

  const handleToggleCalendario = async (dataStr) => {
    const wasMarcado = localMarcados.includes(dataStr);
    setLocalMarcados(prev => wasMarcado ? prev.filter(d => d !== dataStr) : [...prev, dataStr]);
    if (config.onToggle) {
        const success = await config.onToggle(dataStr);
        if (!success) setLocalMarcados(prev => wasMarcado ? [...prev, dataStr] : prev.filter(d => d !== dataStr));
    }
  };

  const btnConfirm = confirmColor || 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={handleCancel}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-300 border border-transparent dark:border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {title && <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>}
          
          {message && (
            typeof message === 'string' 
                ? <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-line">{message}</p> 
                : <div className="w-full mb-4 text-slate-800 dark:text-slate-200">{message}</div>
          )}

          {type === 'alert' && <button onClick={handleConfirm} className={`w-full ${btnConfirm} text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer`}>{confirmLabel || 'OK'}</button>}

          {type === 'confirm' && (
            <div className="flex gap-3 mt-2">
              <button onClick={handleCancel} className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer">{cancelLabel || 'Cancelar'}</button>
              <button onClick={handleConfirm} className={`flex-1 ${btnConfirm} text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer`}>{confirmLabel || 'Confirmar'}</button>
            </div>
          )}

          {type === 'prompt' && (
            <>
              <input ref={inputRef} type={config.inputType || 'text'} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 mb-4 transition-colors" placeholder={config.placeholder || ''} />
              <div className="flex gap-3">
                <button onClick={handleCancel} className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer">{cancelLabel || 'Cancelar'}</button>
                <button onClick={handleConfirm} className={`flex-1 ${btnConfirm} text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer`}>{confirmLabel || 'Confirmar'}</button>
              </div>
            </>
          )}

          {type === 'options' && (
            <div className="space-y-2 mt-2">
              {options.map((opt) => (
                <button key={opt.value} onClick={() => { onConfirm(opt.value); onClose(); }} className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors text-sm flex items-center gap-3 cursor-pointer">
                  <span className="text-lg">{opt.icon}</span>
                  <div><p className="font-semibold text-slate-800 dark:text-slate-200">{opt.label}</p>{opt.desc && <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">{opt.desc}</p>}</div>
                </button>
              ))}
              <button onClick={handleCancel} className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-lg text-sm transition-colors mt-1 cursor-pointer">{cancelLabel || 'Cancelar'}</button>
            </div>
          )}

          {type === 'comprovante' && (
            <div className="mt-1">
              {config.isPDF ? (
                <a href={config.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 px-4 py-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><span className="text-3xl">📄</span><div><p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Abrir PDF</p><p className="text-xs text-slate-400 dark:text-slate-500">Clique para visualizar em nova aba</p></div></a>
              ) : (
                <a href={config.url} target="_blank" rel="noopener noreferrer"><img src={config.url} alt="Comprovante" className="w-full rounded-lg border dark:border-slate-700 object-contain max-h-80 hover:opacity-90 transition-opacity" /><p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1">Clique para abrir em tamanho completo</p></a>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={config.onRemover} className="flex-1 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-lg text-sm border border-red-200 dark:border-red-800 transition-colors cursor-pointer">🗑️ Remover</button>
                <button onClick={handleCancel} className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer">Fechar</button>
              </div>
            </div>
          )}

          {type === 'faturas' && (
            <div className="space-y-2 mt-1">
              {config.itens.length === 0 ? <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Nenhum gasto no crédito neste mês.</p> : (
                <>
                  {config.itens.map((item, i) => (
                    <div key={i} className="px-3 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">💳 {item.nome}</span>
                        <div className="flex gap-2">
                          {item.pendente > 0 && <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); config.pagarFatura(config.cartaoIds[item.nome]); }} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-colors cursor-pointer"> Pagar Fatura </button>}
                          {item.pago > 0 && <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); config.reverterFatura(config.cartaoIds[item.nome]); }} className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-colors cursor-pointer"> Reverter </button>}
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-medium flex-1 text-center">✔ {formatarMoeda(item.pago)}</span>
                        <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded font-medium flex-1 text-center">⏳ {formatarMoeda(item.pendente)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-3 py-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 mt-1"><span className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Geral</span><span className="text-sm font-bold text-purple-700 dark:text-purple-400">{formatarMoeda(config.itens.reduce((s, i) => s + i.total, 0))}</span></div>
                </>
              )}
              <button type="button" onClick={handleCancel} className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-bold py-2.5 rounded-lg text-sm transition-colors mt-2 cursor-pointer">Fechar</button>
            </div>
          )}

          {type === 'calendario' && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded border dark:border-slate-700">
                Marque os dias em que você <b>NÃO utilizou a moto</b>. O sistema descontará <b className="dark:text-slate-200">R$ 23,00</b> do seu orçamento automático.
              </p>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1">{d}</div>)}
                {Array.from({ length: new Date(config.ano, config.mes - 1, 1).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: new Date(config.ano, config.mes, 0).getDate() }).map((_, i) => {
                  const dia = i + 1; const dataAtual = new Date(config.ano, config.mes - 1, dia); const diaSemana = dataAtual.getDay();
                  const dataStr = `${config.ano}-${String(config.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                  const isDiaAlvo = diaSemana === 1 || diaSemana === 3 || diaSemana === 5;
                  const isMarcado = localMarcados.includes(dataStr);

                  let bgClass = "bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700";
                  if (isDiaAlvo) { bgClass = isMarcado ? "bg-rose-500 text-white border-rose-600 shadow-inner" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900/70 cursor-pointer"; } 
                  else if (isMarcado) { bgClass = "bg-rose-500 text-white border-rose-600 cursor-pointer shadow-inner"; } 
                  else { bgClass += " hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-400"; }

                  return (<div key={dia} onClick={() => handleToggleCalendario(dataStr)} className={`py-2 rounded flex items-center justify-center text-sm font-bold select-none transition-colors ${bgClass}`}>{dia}</div>);
                })}
              </div>
              <button onClick={handleCancel} className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-3 rounded-lg text-sm transition-colors mt-4 shadow-md cursor-pointer">Concluído</button>
            </div>
          )}

          {type === 'detalhes' && (
            <div className="mt-1 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border dark:border-slate-700/50"><p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Categoria</p><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{config.transacao.categoria}</p></div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border dark:border-slate-700/50"><p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Data</p><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{new Date(config.transacao.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p></div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border dark:border-slate-700/50"><p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Pagamento</p><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{config.nomePagamento}</p></div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border dark:border-slate-700/50"><p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Valor</p><p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatarMoeda(config.transacao.valorParcela)}</p></div>
              </div>

              <button onClick={() => { config.onAlternarStatus(); onClose(); }} className={`w-full py-2.5 rounded-lg text-sm font-bold uppercase transition-colors cursor-pointer ${config.transacao.status === 'pago' ? 'bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400'}`}>
                {config.transacao.status === 'pago' ? '✔ PAGO — clique para marcar como Pendente' : '⏳ PENDENTE — clique para marcar como Pago'}
              </button>

              <div className="flex gap-2 pt-1">
                <button onClick={() => { config.onEditar(); onClose(); }} className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer">✏️ Editar</button>
                {config.isStewart && (
                  config.transacao.comprovante_url
                    ? <button onClick={() => { config.onVerComprovante(); onClose(); }} className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 font-bold py-2.5 rounded-lg text-sm border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer">📎 Comprovante</button>
                    : <button onClick={() => { config.onAnexarComprovante(); onClose(); }} className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold py-2.5 rounded-lg text-sm border border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer">📎 Anexar</button>
                )}
                <button onClick={() => { config.onDeletar(); onClose(); }} className="flex-1 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer">🗑️ Excluir</button>
              </div>
              <button onClick={handleCancel} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">Fechar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}