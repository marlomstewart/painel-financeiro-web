import React, { useState, useEffect, useRef } from 'react';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Modal({ config, onClose }) {
  const [inputValue, setInputValue] = useState(config?.defaultValue || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (config) {
      setInputValue(config.defaultValue || '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [config]);

  if (!config) return null;

  const { type, title, message, options, onConfirm, onCancel, confirmLabel, cancelLabel, confirmColor } = config;

  const handleConfirm = () => { onConfirm(type === 'prompt' ? inputValue : true); onClose(); };
  const handleCancel = () => { if (onCancel) onCancel(); onClose(); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') handleCancel(); };

  const btnConfirm = confirmColor || 'bg-slate-800 hover:bg-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={handleCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {title && <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>}
          {message && <p className="text-sm text-slate-600 mb-4 whitespace-pre-line">{message}</p>}

          {type === 'alert' && (
            <button onClick={handleConfirm} className={`w-full ${btnConfirm} text-white font-bold py-2.5 rounded-lg text-sm transition-colors`}>{confirmLabel || 'OK'}</button>
          )}

          {type === 'confirm' && (
            <div className="flex gap-3 mt-2">
              <button onClick={handleCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-sm transition-colors">{cancelLabel || 'Cancelar'}</button>
              <button onClick={handleConfirm} className={`flex-1 ${btnConfirm} text-white font-bold py-2.5 rounded-lg text-sm transition-colors`}>{confirmLabel || 'Confirmar'}</button>
            </div>
          )}

          {type === 'prompt' && (
            <>
              <input ref={inputRef} type={config.inputType || 'text'} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 mb-4" placeholder={config.placeholder || ''} />
              <div className="flex gap-3">
                <button onClick={handleCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-sm transition-colors">{cancelLabel || 'Cancelar'}</button>
                <button onClick={handleConfirm} className={`flex-1 ${btnConfirm} text-white font-bold py-2.5 rounded-lg text-sm transition-colors`}>{confirmLabel || 'Confirmar'}</button>
              </div>
            </>
          )}

          {type === 'options' && (
            <div className="space-y-2 mt-2">
              {options.map((opt) => (
                <button key={opt.value} onClick={() => { onConfirm(opt.value); onClose(); }} className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm font-medium text-slate-700 flex items-center gap-3">
                  <span className="text-lg">{opt.icon}</span>
                  <div><p className="font-semibold text-slate-800">{opt.label}</p>{opt.desc && <p className="text-xs text-slate-400 font-normal">{opt.desc}</p>}</div>
                </button>
              ))}
              <button onClick={handleCancel} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-lg text-sm transition-colors mt-1">{cancelLabel || 'Cancelar'}</button>
            </div>
          )}

          {type === 'comprovante' && (
            <div className="mt-1">
              {config.isPDF ? (
                <a href={config.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 px-4 py-6 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                  <span className="text-3xl">📄</span>
                  <div><p className="font-bold text-slate-700 text-sm">Abrir PDF</p><p className="text-xs text-slate-400">Clique para visualizar em nova aba</p></div>
                </a>
              ) : (
                <a href={config.url} target="_blank" rel="noopener noreferrer">
                  <img src={config.url} alt="Comprovante" className="w-full rounded-lg border object-contain max-h-80 hover:opacity-90 transition-opacity" />
                  <p className="text-xs text-slate-400 text-center mt-1">Clique para abrir em tamanho completo</p>
                </a>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={config.onRemover} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-lg text-sm border border-red-200 transition-colors">🗑️ Remover</button>
                <button onClick={handleCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-lg text-sm transition-colors">Fechar</button>
              </div>
            </div>
          )}

          {type === 'faturas' && (
            <div className="space-y-2 mt-1">
              {config.itens.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum gasto no crédito neste mês.</p>
              ) : (
                <>
                  {config.itens.map((item, i) => (
                    <div key={i} className="px-3 py-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-800">💳 {item.nome}</span>
                        <div className="flex gap-2">
                          {item.pendente > 0 && (
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); // Impede o clique de vazar para o fundo
                                config.pagarFatura(config.cartaoIds[item.nome]); 
                              }} 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-colors cursor-pointer"
                            >
                              Pagar Fatura
                            </button>
                          )}
                          {item.pago > 0 && (
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); // Impede o clique de vazar para o fundo
                                config.reverterFatura(config.cartaoIds[item.nome]); 
                              }} 
                              className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-colors cursor-pointer"
                            >
                              Reverter
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium flex-1 text-center">✔ {formatarMoeda(item.pago)}</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium flex-1 text-center">⏳ {formatarMoeda(item.pendente)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-3 py-2.5 bg-purple-50 rounded-lg border border-purple-200 mt-1">
                    <span className="text-sm font-bold text-slate-700">Total Geral</span>
                    <span className="text-sm font-bold text-purple-700">{formatarMoeda(config.itens.reduce((s, i) => s + i.total, 0))}</span>
                  </div>
                </>
              )}
              <button type="button" onClick={handleCancel} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-lg text-sm transition-colors mt-2">Fechar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}