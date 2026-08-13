import React, { useState } from 'react';
import {
  X, Users, Lightbulb, Undo2, CheckCircle2, RotateCcw, Pencil,
  Paperclip, Trash2, FileText, CreditCard
} from 'lucide-react';

/**
 * Componente Interno: FormularioEdicao
 * Renderiza o formulário completo de edição de transação dentro do Modal.
 */
function FormularioEdicao({ config, onConfirm, onCancel }) {
  const { transacao, categorias = [], cartoes = [], infoParcelamento, acaoEdicao } = config;

  const initValorStr = Math.round((transacao.valorParcela || 0) * 100).toString();
  const [valorStr, setValorStr] = useState(initValorStr);

  const [descricao, setDescricao] = useState(transacao.descricao || '');
  const [dataCompra, setDataCompra] = useState(transacao.dataCompra ? transacao.dataCompra.split('T')[0] : '');
  const [tipo, setTipo] = useState(transacao.tipo || 'despesa');
  const [status, setStatus] = useState(transacao.status || 'pendente');
  const [categoria, setCategoria] = useState(transacao.categoria || 'Sem Categoria');
  const [formaPagamento, setFormaPagamento] = useState(transacao.formaPagamento || 'pix');
  const [observacao, setObservacao] = useState(transacao.observacao || '');

  const [isThirdParty, setIsThirdParty] = useState(transacao.isThirdParty || false);
  const [thirdPartyName, setThirdPartyName] = useState(transacao.thirdPartyName || '');
  const [thirdPartyPhone, setThirdPartyPhone] = useState(transacao.thirdPartyPhone || '');

  const initThirdValueStr = transacao.thirdPartyValue ? Math.round(Number(transacao.thirdPartyValue) * 100).toString() : '0';
  const [thirdPartyValueStr, setThirdPartyValueStr] = useState(initThirdValueStr);

  const handleValorChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') val = '0';
    setValorStr(val);
  };

  const handleThirdValueChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') val = '0';
    setThirdPartyValueStr(val);
  };

  const formatarMoedaLocal = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const displayValor = (parseInt(valorStr, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayThirdValue = (parseInt(thirdPartyValueStr, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericValue = parseInt(valorStr, 10) / 100;

    let numericThirdValue = null;
    if (isThirdParty) {
      numericThirdValue = parseInt(thirdPartyValueStr, 10) / 100;
      if (numericThirdValue === 0) numericThirdValue = null;
    }

    if (numericValue <= 0) {
      alert('O valor deve ser maior que zero.');
      return;
    }

    if (numericThirdValue !== null && numericThirdValue > numericValue) {
      alert('O valor do terceiro não pode ser maior que o valor total da parcela.');
      return;
    }

    onConfirm({
      descricao, valorParcela: numericValue, dataCompra, tipo, status,
      categoria, formaPagamento, observacao,
      isThirdParty, thirdPartyName: isThirdParty ? thirdPartyName : null,
      thirdPartyValue: numericThirdValue,
      thirdPartyPhone: isThirdParty ? (thirdPartyPhone || null) : null
    });
  };

  // UI Constantes (Mobile-First)
  const inputCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors shadow-sm";
  const labelCls = "block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 md:mb-1 uppercase tracking-wider";

  const editandoEmLote = infoParcelamento && acaoEdicao && acaoEdicao !== 'unica';
  const labelTerceiroValor = editandoEmLote ? 'VALOR DA PESSOA (POR PARCELA)' : 'VALOR DA PESSOA (NESTA PARCELA)';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {infoParcelamento && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 p-4 rounded-xl flex justify-between items-center shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400 tracking-wider mb-0.5">Compra Parcelada</p>
            <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">Parcela {infoParcelamento.atual} de {infoParcelamento.total}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400 tracking-wider mb-0.5">Valor Original Total</p>
            <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">{formatarMoedaLocal(infoParcelamento.valorTotal)}</p>
            {infoParcelamento.valorTerceiroTotal > 0 && (
              <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 uppercase tracking-wider inline-flex items-center gap-1">
                <Users className="w-3 h-3" strokeWidth={2.5} /> Terceiros: {formatarMoedaLocal(infoParcelamento.valorTerceiroTotal)}
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>{infoParcelamento ? 'Valor DESTA Parcela (R$)' : 'Valor (R$)'}</label>
        <input
          type="text" inputMode="numeric"
          value={displayValor}
          onChange={handleValorChange}
          autoFocus
          className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-700/50 rounded-xl p-4 text-3xl md:text-4xl font-black text-blue-700 dark:text-blue-400 text-center outline-none focus:border-blue-500 transition-colors shadow-inner"
        />
        {infoParcelamento && (
          <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold mt-2 text-center leading-tight flex items-center justify-center gap-1">
            <Lightbulb className="w-3 h-3 shrink-0" strokeWidth={2.5} /> Só edite o valor se esta parcela específica sofreu juros ou desconto.
          </p>
        )}
      </div>

      <div><label className={labelCls}>Descrição</label><input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} required className={inputCls} /></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Data</label>
          <input type="date" value={dataCompra} onChange={e => setDataCompra(e.target.value)} required className={inputCls} />
          {editandoEmLote && (
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 leading-tight">O mês/ano das outras parcelas serão preservados.</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago / Recebido</option>
          </select>
          {editandoEmLote && (
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 leading-tight">O status das outras parcelas NÃO será alterado.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Natureza</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className={inputCls}>
            <option value="despesa">Despesa (Saída)</option>
            <option value="renda">Renda (Entrada)</option>
            <option value="investimento">Investimento</option>
            <option value="reembolso">Reembolso / Estorno</option>
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

      <div className="pt-2">
        <label className="flex items-center gap-3 cursor-pointer mb-3 py-1">
          <input type="checkbox" checked={isThirdParty} onChange={(e) => setIsThirdParty(e.target.checked)} className="w-5 h-5 accent-blue-600 cursor-pointer" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Compra de Terceiro</span>
        </label>

        {isThirdParty && (
          <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-800/50 animate-fade-in-down mb-1 mt-3 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-amber-700 dark:text-amber-500 mb-1.5 uppercase tracking-wider">Nome da Pessoa (Terceiro)</label>
                <input
                  type="text" required
                  value={thirdPartyName} onChange={(e) => setThirdPartyName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700/50 rounded-xl p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 shadow-sm"
                  placeholder="Ex: Maiara, Irmão..."
                />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-amber-700 dark:text-amber-500 mb-1.5 uppercase tracking-wider">{labelTerceiroValor}</label>
                <input
                  type="text" inputMode="numeric" required
                  value={displayThirdValue} onChange={handleThirdValueChange}
                  className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700/50 rounded-xl p-3.5 md:p-3 text-sm font-bold text-amber-700 dark:text-amber-500 outline-none focus:border-amber-500 shadow-sm"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[10px] md:text-xs font-bold text-amber-700 dark:text-amber-500 mb-1.5 uppercase tracking-wider">WhatsApp da Pessoa (opcional)</label>
              <input
                type="tel"
                value={thirdPartyPhone} onChange={(e) => setThirdPartyPhone(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700/50 rounded-xl p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 shadow-sm"
                placeholder="Ex: 11987654321 (com DDD)"
              />
            </div>

            {editandoEmLote ? (
              <p className="text-[10px] text-amber-700 dark:text-amber-500 mt-3 font-medium leading-relaxed flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2.5} />
                <span><strong>Atenção:</strong> Como você está a editar em lote, o valor de R$ {displayThirdValue} será aplicado a <strong>cada uma</strong> das parcelas selecionadas.</span>
              </p>
            ) : (
              <p className="text-[10px] text-amber-700 dark:text-amber-500 mt-3 font-medium leading-relaxed">
                Se você deixar R$ 0,00 o sistema assumirá que 100% desta parcela pertence ao terceiro.
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>Forma de Pagamento</label>
        <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className={inputCls}>
          <option value="pix">PIX / Dinheiro</option>
          <option value="debito">Cartão de Débito</option>
          {cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito: {c.nome}</option>)}
        </select>
      </div>

      <div><label className={labelCls}>Observação</label><textarea value={observacao} onChange={e => setObservacao(e.target.value)} className={`${inputCls} resize-none`} rows="3"></textarea></div>

      <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 md:py-3.5 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-[0.98] order-2 sm:order-1 border border-transparent dark:border-slate-700">Cancelar</button>
        <button type="submit" className="flex-1 bg-blue-600 text-white py-4 md:py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md cursor-pointer active:scale-[0.98] order-1 sm:order-2">Salvar Alterações</button>
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
  const [localDiasMarcados, setLocalDiasMarcados] = useState([]);

  // Sincroniza (durante a renderização, sem efeito) o estado local sempre que um NOVO config
  // chega (cada chamada de modal.alert/prompt/etc. cria um objeto novo), sem precisar de useEffect.
  const [configSincronizado, setConfigSincronizado] = useState(config);
  if (config !== configSincronizado) {
    setConfigSincronizado(config);
    if (config?.type === 'prompt' && config.inputType !== 'editar_transacao') {
      setInputValue(config.inputType === 'currency' ? '0' : (config.defaultValue || ''));
    }
    if (config?.type === 'calendario') {
      setLocalDiasMarcados(config.diasMarcados || []);
    }
  }

  if (!config) return null;

  const { type, title, message, onConfirm, onCancel, options, inputType } = config;

  // Botões Padrões
  const btnCancelCls = "w-full sm:w-auto px-6 py-4 md:py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-95 border border-transparent dark:border-slate-700";
  const btnConfirmCls = `w-full sm:w-auto px-6 py-4 md:py-3 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-md active:scale-95 ${config.confirmColor || 'bg-blue-600 hover:bg-blue-700'}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel || onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">

        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{title || 'Aviso'}</h3>
          <button onClick={onCancel || onClose} className="text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-full p-2 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors cursor-pointer active:scale-95">
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1">

          {type === 'alert' && (
            <div className="space-y-5">
              <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">{message}</div>
              <div className="flex justify-end pt-5 border-t border-slate-100 dark:border-slate-800">
                <button onClick={onConfirm} className="w-full sm:w-auto px-8 py-4 md:py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-md active:scale-95">OK, Entendido</button>
              </div>
            </div>
          )}

          {type === 'confirm' && (
            <div className="space-y-5">
              <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">{message}</div>
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-5 border-t border-slate-100 dark:border-slate-800">
                <button onClick={onCancel} className={`${btnCancelCls} order-2 sm:order-1`}>Cancelar</button>
                <button onClick={onConfirm} className={`${btnConfirmCls} order-1 sm:order-2`}>{config.confirmLabel || 'Confirmar'}</button>
              </div>
            </div>
          )}

          {type === 'prompt' && inputType !== 'editar_transacao' && (
            <div className="space-y-5">
              <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">{message}</div>

              {inputType === 'currency' ? (
                <input
                  type="text" inputMode="numeric"
                  value={(Number(inputValue || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (!val) val = '0';
                    setInputValue(val);
                  }}
                  className="w-full bg-blue-50/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-4xl font-black text-blue-700 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors text-center shadow-inner"
                  autoFocus
                />
              ) : (
                <input
                  type={inputType || 'text'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={config.placeholder || ''}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors shadow-sm"
                  autoFocus
                />
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-5 border-t border-slate-100 dark:border-slate-800">
                <button onClick={onCancel} className={`${btnCancelCls} order-2 sm:order-1`}>Cancelar</button>
                <button onClick={() => {
                  if (inputType === 'currency') onConfirm(Number(inputValue) / 100);
                  else onConfirm(inputValue);
                }} className={`${btnConfirmCls} order-1 sm:order-2`}>{config.confirmLabel || 'Confirmar'}</button>
              </div>
            </div>
          )}

          {type === 'prompt' && inputType === 'editar_transacao' && (
            <FormularioEdicao config={config} onConfirm={onConfirm} onCancel={onCancel} />
          )}

          {type === 'options' && (
            <div className="space-y-5">
              <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">{message}</div>
              <div className="flex flex-col gap-3">
                {options.map((opt, i) => (
                  <button key={i} onClick={() => onConfirm(opt.value)} className="w-full p-4 md:p-3 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-sm flex items-center gap-3 active:scale-[0.98]">
                    {opt.icon && <span className="shrink-0 text-slate-500 dark:text-slate-400">{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-5 border-t border-slate-100 dark:border-slate-800">
                <button onClick={onCancel} className={btnCancelCls}>Cancelar</button>
              </div>
            </div>
          )}

          {type === 'faturas' && config.itens && (
            <div className="space-y-5">
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 font-medium leading-relaxed">Gerencie as faturas fechadas ou em aberto deste mês. Apenas transações pendentes podem ser pagas em lote.</p>

              {config.itens.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/30">
                  <CreditCard className="w-9 h-9 mx-auto mb-3 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                  <p className="text-slate-600 dark:text-slate-400 font-bold">Nenhum gasto no crédito nesta competência.</p>
                </div>
              ) : (
                config.itens.map((item, i) => {
                  const cId = config.cartaoIds[item.nome];
                  return (
                    <div key={i} className="bg-white dark:bg-slate-800/80 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-base md:text-lg mb-4 uppercase tracking-wider flex items-center gap-2 truncate"><CreditCard className="w-4.5 h-4.5 shrink-0" strokeWidth={2} /> {item.nome}</h4>

                      <div className="grid grid-cols-3 gap-2 mb-5">
                        <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Total Fatura</span>
                          <span className="font-black text-slate-800 dark:text-slate-200 text-xs md:text-sm truncate w-full">{Number(item.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="block text-[9px] uppercase font-bold text-emerald-600 mb-1">Já Pago</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs md:text-sm truncate w-full">{Number(item.pago).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded-xl border border-amber-100 dark:border-amber-800/30 shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="block text-[9px] uppercase font-bold text-amber-600 mb-1">Pendente</span>
                          <span className="font-black text-amber-600 dark:text-amber-400 text-xs md:text-sm truncate w-full">{Number(item.pendente).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      </div>

                      <div className="mb-5 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Meus Gastos (Pessoais):</span>
                          <strong className="text-slate-800 dark:text-slate-200 text-sm">{Number(item.gastoPessoal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </div>
                        {item.listaTerceiros && item.listaTerceiros.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 space-y-2">
                            <span className="block font-black text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-1">Gastos de Terceiros:</span>
                            {item.listaTerceiros.map((terceiro, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                <span className="text-amber-700 dark:text-amber-400 font-bold truncate pr-2 inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} /> {terceiro.nome}</span>
                                <strong className="text-amber-700 dark:text-amber-400 shrink-0">{Number(terceiro.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => config.reverterFatura(cId)} disabled={item.pago <= 0} className={`w-full sm:flex-1 py-3.5 md:py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border active:scale-95 ${item.pago > 0 ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:text-amber-400 cursor-pointer border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 cursor-not-allowed border-slate-200 dark:border-slate-800'}`}>
                          <Undo2 className="w-4 h-4" strokeWidth={2} /> Reverter
                        </button>
                        <button onClick={() => config.pagarFatura(cId)} disabled={item.pendente <= 0} className={`w-full sm:flex-[1.5] py-3.5 md:py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${item.pendente > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer border-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border-transparent dark:border-slate-700'}`}>
                          <CheckCircle2 className="w-4 h-4" strokeWidth={2} /> Pagar Fatura
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {type === 'calendario' && (
            <div className="space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/30 shadow-sm">
                <p className="text-xs md:text-sm text-indigo-800 dark:text-indigo-300 text-center font-medium leading-relaxed">
                  Ajuste sua rotina (Padrão: Seg, Qua, Sex).<br />
                  Clique para registrar <strong className="font-bold text-rose-600 dark:text-rose-400">faltas</strong> ou <strong className="font-bold text-blue-600 dark:text-blue-400">dias extras</strong> rodados.
                </p>
              </div>
              <div className="grid grid-cols-7 gap-1.5 md:gap-2 text-center mb-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => <div key={i} className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">

                {Array.from({ length: new Date(config.ano, config.mes - 1, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}

                {Array.from({ length: new Date(config.ano, config.mes, 0).getDate() }).map((_, i) => {
                  const dia = i + 1;
                  const dataStr = `${config.ano}-${String(config.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

                  const isMarcado = localDiasMarcados.includes(dataStr);

                  const diaSemana = new Date(config.ano, config.mes - 1, dia).getDay();
                  const isDiaTrabalho = diaSemana === 1 || diaSemana === 3 || diaSemana === 5;

                  let btnClass;
                  let titleHint;

                  if (isDiaTrabalho) {
                    if (isMarcado) {
                      btnClass = 'bg-rose-500 text-white shadow-inner scale-95 border border-rose-600';
                      titleHint = 'Faltou (Abate R$ 23)';
                    } else {
                      btnClass = 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/50';
                      titleHint = 'Rodou (Padrão)';
                    }
                  } else {
                    if (isMarcado) {
                      btnClass = 'bg-blue-600 text-white shadow-inner scale-95 border border-blue-700';
                      titleHint = 'Rodou Extra (Soma R$ 23)';
                    } else {
                      btnClass = 'bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/80';
                      titleHint = 'Folga (Padrão)';
                    }
                  }

                  return (
                    <button
                      key={dia}
                      title={titleHint}
                      onClick={async () => {
                        const jaEstavaMarcado = localDiasMarcados.includes(dataStr);

                        setLocalDiasMarcados(prev =>
                          jaEstavaMarcado
                            ? prev.filter(d => d !== dataStr)
                            : [...prev, dataStr]
                        );

                        const sucesso = await config.onToggle(dataStr);

                        if (!sucesso) {
                          setLocalDiasMarcados(prev =>
                            jaEstavaMarcado
                              ? [...prev, dataStr]
                              : prev.filter(d => d !== dataStr)
                          );
                        }
                      }}
                      className={`py-3 md:py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer active:scale-90 ${btnClass}`}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end pt-5 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button onClick={onCancel} className="px-6 py-4 md:py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-md w-full active:scale-[0.98]">Concluir Ajustes do Calendário</button>
              </div>
            </div>
          )}

          {type === 'detalhes' && config.transacao && (
            <div className="space-y-6">
              <div className="text-center bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-slate-100 dark:bg-slate-800 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 pointer-events-none"></div>
                <p className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 relative z-10">{config.transacao.categoria}</p>
                <h4 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-3 relative z-10 leading-tight">{config.transacao.descricao}</h4>
                <p className={`text-4xl font-black tracking-tight relative z-10 ${config.transacao.tipo === 'renda' ? 'text-emerald-500' : config.transacao.tipo === 'investimento' ? 'text-blue-500' : config.transacao.tipo === 'despesa' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                  {Number(config.transacao.valorParcela).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {config.transacao.isThirdParty && (
                  <span className="inline-flex items-center mt-4 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800/50 shadow-sm relative z-10">
                    <Users className="w-3 h-3 shrink-0 mr-1.5" strokeWidth={2.5} />
                    Terceiro: {config.transacao.thirdPartyName}
                    <br className="sm:hidden" />
                    <span className="hidden sm:inline">&nbsp;—&nbsp;</span>
                    Responsável por {config.transacao.thirdPartyValue ? Number(config.transacao.thirdPartyValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '100%'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 md:p-3 rounded-xl shadow-sm">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Data Competência</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{new Date(config.transacao.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 md:p-3 rounded-xl shadow-sm">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Status</span>
                  <span className={`font-black uppercase tracking-wider text-xs ${config.transacao.status === 'pago' ? 'text-emerald-600' : 'text-amber-600'}`}>{config.transacao.status}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm col-span-2 flex justify-between items-center gap-2">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Forma de Pagamento</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{config.nomePagamento}</span>
                  </div>
                  {config.transacao.data_pagamento && config.transacao.status === 'pago' && (
                    <div className="text-right shrink-0">
                      <span className="block text-[10px] text-emerald-500 uppercase font-bold mb-1 tracking-wider">Liquidado em</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{new Date(config.transacao.data_pagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                    </div>
                  )}
                </div>
                {config.transacao.observacao && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-4 rounded-xl col-span-2 shadow-sm">
                    <span className="block text-[10px] text-amber-600 dark:text-amber-500 uppercase font-bold mb-1.5 tracking-wider">Observação Adicional</span>
                    <span className="font-medium text-amber-800 dark:text-amber-300 leading-relaxed text-sm">{config.transacao.observacao}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => { onClose(); config.onAlternarStatus(); }} className="p-3.5 md:p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 shadow-sm col-span-1 sm:col-span-3 flex items-center justify-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} /> {config.transacao.status === 'pago' ? 'Tornar Pendente' : 'Marcar Pago (Liquidado)'}
                </button>
                <button onClick={() => config.onEditar()} className="p-3.5 md:p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition cursor-pointer active:scale-95 shadow-sm flex items-center justify-center gap-2">
                  <Pencil className="w-3.5 h-3.5" strokeWidth={2.25} /> Editar
                </button>
                {config.temComprovante && (
                  <button onClick={() => config.onAnexarComprovante()} className="p-3.5 md:p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 shadow-sm flex items-center justify-center gap-2">
                    <Paperclip className="w-3.5 h-3.5" strokeWidth={2.25} /> Anexar
                  </button>
                )}
                <button onClick={() => config.onDeletar()} className="p-3.5 md:p-2.5 bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition cursor-pointer active:scale-95 shadow-sm flex items-center justify-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.25} /> Excluir
                </button>
                {config.temComprovante && (
                  <button onClick={() => { onClose(); config.onVerComprovante(); }} className="p-3.5 md:p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 shadow-sm col-span-1 sm:col-span-3 flex items-center justify-center gap-2">
                    <FileText className="w-3.5 h-3.5" strokeWidth={2.25} /> Ver Comprovante Anexado
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}