import React, { useState, useEffect, useRef } from 'react';

/**
 * Formata um valor numérico para o padrão monetário brasileiro (BRL).
 * @param {number|string} valor - O valor a ser formatado.
 * @returns {string} Valor formatado como moeda (ex: R$ 1.500,00).
 */
const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Componente de Modal Universal.
 * Gerencia alertas, confirmações, inputs de dados (prompts), seleção de opções,
 * visualização de comprovantes e o calendário interativo da garagem.
 * 
 * @param {Object} props
 * @param {Object} props.config - Objeto de configuração do modal (tipo, título, mensagem, ações).
 * @param {Function} props.onClose - Função para fechar o modal limpando o estado global.
 */
export function Modal({ config, onClose }) {
  // Estado para capturar dados em modais do tipo 'prompt'
  const [inputValue, setInputValue] = useState(config?.defaultValue || '');
  const inputRef = useRef(null);

  // =========================================================================
  // LÓGICA DO CALENDÁRIO (Módulo Garagem)
  // =========================================================================
  /**
   * Armazena localmente os dias marcados como "não rodados".
   * Utilizado para garantir que a interface reaja instantaneamente ao clique,
   * enquanto o estado global e a API são atualizados em segundo plano.
   */
  const [localMarcados, setLocalMarcados] = useState([]);

  useEffect(() => {
    if (config) {
      setInputValue(config.defaultValue || '');
      // Foca automaticamente no input se for um modal de prompt
      setTimeout(() => inputRef.current?.focus(), 50);
      
      // Sincroniza os dias marcados quando o modal do tipo calendário é aberto
      if (config.type === 'calendario') {
        setLocalMarcados(config.diasMarcados || []);
      }
    }
  }, [config]);

  if (!config) return null;

  // Desestruturação das propriedades recebidas no objeto de configuração
  const { type, title, message, options, onConfirm, onCancel, confirmLabel, cancelLabel, confirmColor } = config;

  /**
   * Manipula a confirmação padrão do modal.
   * Em prompts, retorna o valor digitado. Em outros, retorna true.
   */
  const handleConfirm = () => { 
    onConfirm(type === 'prompt' ? inputValue : true); 
    onClose(); 
  };

  /**
   * Manipula o cancelamento/fechamento do modal.
   */
  const handleCancel = () => { 
    if (onCancel) onCancel(); 
    onClose(); 
  };

  /**
   * Permite o uso de atalhos de teclado (Enter para confirmar, Esc para cancelar).
   */
  const handleKeyDown = (e) => { 
    if (e.key === 'Enter') handleConfirm(); 
    if (e.key === 'Escape') handleCancel(); 
  };

  /**
   * Alterna o status de um dia no calendário interativo.
   * Adiciona ou remove a data do array local e dispara a função de atualização global/API.
   * @param {string} dataStr - Data no formato YYYY-MM-DD.
   */
  const toggleLocal = async (dataStr) => {
    const isMarcado = localMarcados.includes(dataStr);
    setLocalMarcados(prev => isMarcado ? prev.filter(d => d !== dataStr) : [...prev, dataStr]);
    if (config.onToggle) await config.onToggle(dataStr);
  };

  const btnConfirm = confirmColor || 'bg-slate-800 hover:bg-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={handleCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Cabeçalho do Modal */}
          {title && <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>}
          {message && <p className="text-sm text-slate-600 mb-4 whitespace-pre-line">{message}</p>}

          {/* TIPO: Alert (Apenas confirmação de leitura) */}
          {type === 'alert' && (
            <button onClick={handleConfirm} className={`w-full ${btnConfirm} text-white font-bold py-2.5 rounded-lg text-sm transition-colors`}>{confirmLabel || 'OK'}</button>
          )}

          {/* TIPO: Confirm (Decisão Sim/Não) */}
          {type === 'confirm' && (
            <div className="flex gap-3 mt-2">
              <button onClick={handleCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-sm transition-colors">{cancelLabel || 'Cancelar'}</button>
              <button onClick={handleConfirm} className={`flex-1 ${btnConfirm} text-white font-bold py-2.5 rounded-lg text-sm transition-colors`}>{confirmLabel || 'Confirmar'}</button>
            </div>
          )}

          {/* TIPO: Prompt (Entrada de texto/número) */}
          {type === 'prompt' && (
            <>
              <input ref={inputRef} type={config.inputType || 'text'} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 mb-4" placeholder={config.placeholder || ''} />
              <div className="flex gap-3">
                <button onClick={handleCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-sm transition-colors">{cancelLabel || 'Cancelar'}</button>
                <button onClick={handleConfirm} className={`flex-1 ${btnConfirm} text-white font-bold py-2.5 rounded-lg text-sm transition-colors`}>{confirmLabel || 'Confirmar'}</button>
              </div>
            </>
          )}

          {/* TIPO: Options (Lista de escolhas rápidas) */}
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

          {/* TIPO: Comprovante (Visualização de Imagem/PDF) */}
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

          {/* TIPO: Faturas (Resumo de cartões de crédito) */}
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
                                e.stopPropagation();
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
                                e.stopPropagation();
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

          {/* TIPO: Calendario (Seleção de dias não rodados para ajuste de meta) */}
          {type === 'calendario' && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed bg-slate-50 p-3 rounded border">
                Marque os dias em que você <b>NÃO utilizou a moto</b>. O sistema descontará <b>R$ 23,00</b> do seu orçamento previsto automaticamente para cada Seg, Qua ou Sex marcada.
              </p>
              
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {/* Cabeçalho dos dias da semana */}
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="text-[10px] font-bold text-slate-400 py-1">{d}</div>)}
                
                {/* Calcula espaços vazios no início do mês baseado no dia da semana do dia 1 */}
                {Array.from({ length: new Date(config.ano, config.mes - 1, 1).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
                
                {/* Renderiza os dias do Mês */}
                {Array.from({ length: new Date(config.ano, config.mes, 0).getDate() }).map((_, i) => {
                  const dia = i + 1;
                  const dataAtual = new Date(config.ano, config.mes - 1, dia);
                  const diaSemana = dataAtual.getDay();
                  const dataStr = `${config.ano}-${String(config.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                  
                  const isDiaAlvo = diaSemana === 1 || diaSemana === 3 || diaSemana === 5; // Seg, Qua, Sex
                  const isMarcado = localMarcados.includes(dataStr);

                  let bgClass = "bg-slate-50 border border-slate-100 text-slate-300"; // Padrão: dias neutros (Ter, Qui, Sáb, Dom)
                  
                  if (isDiaAlvo) {
                      bgClass = isMarcado
                        ? "bg-rose-500 text-white border-rose-600 shadow-inner" // Foi marcado que NÃO rodou (desconto aplicado)
                        : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 cursor-pointer"; // Rodou (Cobrança normal)
                  } else if (isMarcado) {
                      bgClass = "bg-rose-400 text-white border-rose-500 cursor-pointer shadow-inner"; // Marcou um dia neutro
                  } else {
                      bgClass += " hover:bg-slate-100 cursor-pointer text-slate-600";
                  }

                  return (
                    <div
                      key={dia}
                      onClick={() => toggleLocal(dataStr)}
                      className={`py-2 rounded flex items-center justify-center text-sm font-bold select-none transition-colors ${bgClass}`}
                    >
                      {dia}
                    </div>
                  );
                })}
              </div>
              
              {/* Legenda e Resumo */}
              <div className="flex justify-between items-center bg-slate-50 border p-3 rounded-lg mt-4">
                 <div className="flex flex-col items-start gap-1 text-[10px] text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Dias de Uso (R$23)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Não Rodou (-R$23)</span>
                 </div>
                 <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Dias Marcados</span>
                    <p className="text-lg font-bold text-rose-600 leading-none">{localMarcados.length}</p>
                 </div>
              </div>

              <button onClick={handleCancel} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg text-sm transition-colors mt-4 shadow-md">Concluído</button>
            </div>
          )}

          {/* TIPO: Detalhes (Visualização completa de transação com ações) */}
          {type === 'detalhes' && (
            <div className="mt-1 space-y-3">
              {/* Informações detalhadas do lançamento */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Categoria</p>
                  <p className="text-sm font-medium text-slate-700">{config.transacao.categoria}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Data</p>
                  <p className="text-sm font-medium text-slate-700">{new Date(config.transacao.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Pagamento</p>
                  <p className="text-sm font-medium text-slate-700">{config.nomePagamento}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Valor</p>
                  <p className="text-sm font-bold text-slate-800">{formatarMoeda(config.transacao.valorParcela)}</p>
                </div>
              </div>

              {/* Botão para alternância rápida de Status (Pago <-> Pendente) */}
              <button
                onClick={() => { config.onAlternarStatus(); onClose(); }}
                className={`w-full py-2.5 rounded-lg text-sm font-bold uppercase transition-colors ${config.transacao.status === 'pago' ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}
              >
                {config.transacao.status === 'pago' ? '✔ PAGO — clique para marcar como Pendente' : '⏳ PENDENTE — clique para marcar como Pago'}
              </button>

              {/* Ações operacionais */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { config.onEditar(); onClose(); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-sm transition-colors">✏️ Editar</button>
                {config.isStewart && (
                  config.transacao.comprovante_url
                    ? <button onClick={() => { config.onVerComprovante(); onClose(); }} className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold py-2.5 rounded-lg text-sm border border-emerald-300 transition-colors">📎 Comprovante</button>
                    : <button onClick={() => { config.onAnexarComprovante(); onClose(); }} className="flex-1 bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 font-bold py-2.5 rounded-lg text-sm border border-dashed border-slate-300 hover:border-blue-400 transition-colors">📎 Anexar</button>
                )}
                <button onClick={() => { config.onDeletar(); onClose(); }} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-lg text-sm transition-colors">🗑️ Excluir</button>
              </div>

              <button onClick={handleCancel} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-medium py-2 rounded-lg text-sm transition-colors">Fechar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}