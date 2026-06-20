import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './components/Modal';
import { Login } from './components/Login';
import { TrocaSenha } from './components/TrocaSenha';
import { Admin } from './components/Admin';
import { Setup } from './components/Setup';
import { Dashboard } from './components/Dashboard';
import { Garagem } from './components/Garagem';

// =========================================================================
// INJEÇÃO DA ARQUITETURA MODULAR DE HOOKS
// =========================================================================
import { useAuth } from './hooks/useAuth';
import { useGaragem } from './hooks/useGaragem';
import { useCartoesFaturas } from './hooks/useCartoesFaturas';
import { useSetup } from './hooks/useSetup';
import { useTransacoes } from './hooks/useTransacoes';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const API = 'https://painel-gestao-financeira-api.onrender.com/api';

/** HOOK useModal — UI universal de Janelas */
function useModal() {
  const [config, setConfig] = useState(null);
  const close = useCallback(() => setConfig(null), []);
  const alert = useCallback((message, title, opts = {}) => new Promise(resolve => setConfig({ type: 'alert', title, message, onConfirm: resolve, onClose: () => { setConfig(null); resolve(); }, ...opts })), []);
  const confirm = useCallback((message, title, opts = {}) => new Promise(resolve => setConfig({ type: 'confirm', title, message, onConfirm: () => resolve(true), onCancel: () => resolve(false), onClose: () => { setConfig(null); resolve(false); }, ...opts })), []);
  const prompt = useCallback((message, defaultValue = '', title, opts = {}) => new Promise(resolve => setConfig({ type: 'prompt', title, message, defaultValue, onConfirm: (val) => resolve(val), onCancel: () => resolve(null), onClose: () => { setConfig(null); resolve(null); }, ...opts })), []);
  const options = useCallback((message, opts_list, title, opts = {}) => new Promise(resolve => setConfig({ type: 'options', title, message, options: opts_list, onConfirm: (val) => resolve(val), onCancel: () => resolve(null), onClose: () => { setConfig(null); resolve(null); }, ...opts })), []);
  return { config, close, setConfig, alert, confirm, prompt, options };
}

/**
 * Componente Mestre (Root) da Aplicação.
 * Agora atua *apenas* como orquestrador, delegando todas as operações REST e lógicas densas aos Custom Hooks.
 */
function App() {
  const modal = useModal();
  const [carregouAPI, setCarregouAPI] = useState(false);

  // Estados Base de UI/Navegação
  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  const [dataVis, setDataVis] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [ordenacao, setOrdenacao] = useState({ coluna: 'data', direcao: 'desc' });
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [filtrosAvancados, setFiltrosAvancados] = useState({ dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: '' });
  const [somarSaldoAnterior, setSomarSaldoAnterior] = useState(true);

  // Estado Transacional Base (Lifted State)
  const [transacoes, setTransacoes] = useState([]);

  // =========================================================================
  // MONTAGEM DOS MÓDULOS DE NEGÓCIO (HOOKS)
  // =========================================================================
  const auth = useAuth({ API, modal, setCarregouAPI });
  const setup = useSetup({ API, getHeaders: auth.getHeaders, modal, setTransacoes });
  const garagem = useGaragem({ API, getHeaders: auth.getHeaders, modal, nomeUsuario: auth.nomeUsuario, transacoes });

  const transacoesMes = transacoes.filter(t => t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano);

  const cartoesFaturas = useCartoesFaturas({ transacoes, setTransacoes, transacoesMes, cartoes: setup.cartoes, dataVis, API, getHeaders: auth.getHeaders, modal });
  const transacoesManager = useTransacoes({ API, getHeaders: auth.getHeaders, modal, token: auth.token, nomeUsuario: auth.nomeUsuario, transacoes, setTransacoes, categorias: setup.categorias, cartoes: setup.cartoes, garagem });

  // =========================================================================
  // CARGA INICIAL DE DADOS DA API
  // =========================================================================
  useEffect(() => {
    if (!auth.token) return;
    const headers = auth.getHeaders();
    const carregar = async () => {
      try {
        const [resT, resC, resCat, resR, resF, resRF] = await Promise.all([
          fetch(`${API}/transacoes`, { headers }), fetch(`${API}/cartoes`, { headers }), fetch(`${API}/categorias`, { headers }), fetch(`${API}/metas-renda`, { headers }), fetch(`${API}/contas-fixas`, { headers }), fetch(`${API}/rendas-fixas`, { headers })
        ]);
        if (!resT.ok) { auth.fazerLogout(); return; }

        setTransacoes(await resT.json());
        setup.setCartoes(await resC.json());
        setup.setCategorias(await resCat.json());
        setup.setMetasRenda(await resR.json());
        setup.setContasFixas(await resF.json());
        setup.setRendasFixas(await resRF.json());

        setCarregouAPI(true);
        await garagem.carregarDadosGaragem();
      } catch (err) { console.error("Erro ao sincronizar:", err); }
    };
    carregar();
  }, [auth.token]);

  const exportarCSV = () => {
    if (transacoes.length === 0) return modal.alert("Nenhum dado para exportar.", "Exportar CSV");
    let csvContent = "DataCompra,Descricao,Categoria,Valor,Tipo,Status,FormaPagamento,MesReferencia,AnoReferencia\n";
    transacoes.forEach(t => {
      let dataFormatada = new Date(t.dataCompra).toLocaleDateString('pt-BR');
      csvContent += `${dataFormatada},"${t.descricao}","${t.categoria}",${t.valorParcela},${t.tipo},${t.status},${t.formaPagamento},${t.mesReferencia},${t.anoReferencia}\n`;
    });
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.setAttribute("download", `Backup_Financeiro_${auth.nomeUsuario}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // =========================================================================
  // MATEMÁTICAS ANALÍTICOS DO DASHBOARD
  // =========================================================================
  const mesAnterior = () => setDataVis(prev => prev.mes === 1 ? { mes: 12, ano: prev.ano - 1 } : { ...prev, mes: prev.mes - 1 });
  const mesProximo = () => setDataVis(prev => prev.mes === 12 ? { mes: 1, ano: prev.ano + 1 } : { ...prev, mes: prev.mes + 1 });

  const calcularSaldoAcumuladoAte = React.useCallback((mes, ano) => {
    const todasAteOMes = transacoes.filter(t => t.anoReferencia < ano || (t.anoReferencia === ano && t.mesReferencia <= mes));
    let rendaPaga = 0, gastoPago = 0;
    todasAteOMes.forEach(t => { const v = Number(t.valorParcela); if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') { if (t.status === 'pago') rendaPaga += v; } else { if (t.status === 'pago') gastoPago += v; } });
    return rendaPaga - gastoPago;
  }, [transacoes]);

  const mesAntRef = React.useMemo(() => dataVis.mes === 1 ? { mes: 12, ano: dataVis.ano - 1 } : { mes: dataVis.mes - 1, ano: dataVis.ano }, [dataVis]);
  const saldoMesAnterior = React.useMemo(() => calcularSaldoAcumuladoAte(mesAntRef.mes, mesAntRef.ano), [calcularSaldoAcumuladoAte, mesAntRef]);

  const mudarOrdenacao = (coluna) => setOrdenacao({ coluna, direcao: ordenacao.coluna === coluna ? (ordenacao.direcao === 'asc' ? 'desc' : 'asc') : 'asc' });

  let dadosTabela = transacoesMes.filter(t => {
    const atendeStatus = filtroStatus === 'todos' || t.status === filtroStatus; const atendeBusca = t.descricao.toLowerCase().includes(buscaTexto.toLowerCase()); let atendeAvancado = true;
    if (mostrarFiltrosAvancados) {
      if (filtrosAvancados.categoria && t.categoria !== filtrosAvancados.categoria) atendeAvancado = false; if (filtrosAvancados.formaPagamento && !t.formaPagamento.includes(filtrosAvancados.formaPagamento)) atendeAvancado = false;
      if (filtrosAvancados.valorMin && Number(t.valorParcela) < Number(filtrosAvancados.valorMin)) atendeAvancado = false; if (filtrosAvancados.valorMax && Number(t.valorParcela) > Number(filtrosAvancados.valorMax)) atendeAvancado = false;
      if (filtrosAvancados.dataInicio && new Date(t.dataCompra) < new Date(filtrosAvancados.dataInicio + 'T00:00:00')) atendeAvancado = false; if (filtrosAvancados.dataFim && new Date(t.dataCompra) > new Date(filtrosAvancados.dataFim + 'T23:59:59')) atendeAvancado = false;
    } return atendeStatus && atendeBusca && atendeAvancado;
  });
  if (ordenacao.coluna) dadosTabela.sort((a, b) => { let vA, vB; switch (ordenacao.coluna) { case 'descricao': vA = a.descricao.toLowerCase(); vB = b.descricao.toLowerCase(); break; case 'categoria': vA = a.categoria.toLowerCase(); vB = b.categoria.toLowerCase(); break; case 'data': vA = new Date(a.dataCompra).getTime(); vB = new Date(b.dataCompra).getTime(); break; case 'status': vA = a.status; vB = b.status; break; case 'pagamento': vA = a.formaPagamento; vB = b.formaPagamento; break; case 'valor': vA = Number(a.valorParcela); vB = Number(b.valorParcela); break; default: return 0; } return vA < vB ? (ordenacao.direcao === 'asc' ? -1 : 1) : (vA > vB ? (ordenacao.direcao === 'asc' ? 1 : -1) : 0); });

  let totRendaTotal = 0, totRendaPaga = 0, totGastoReal = 0, totInvestido = 0, totGastoPago = 0, totFaturaCreditoAberto = 0; let gCat = {}; setup.categorias.forEach(c => gCat[c.nome] = 0); let gastoSemCategoria = 0, gastoContasFixas = 0;
  transacoesMes.forEach(t => { const v = Number(t.valorParcela); if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') { totRendaTotal += v; if (t.status === 'pago') totRendaPaga += v; } else { if (t.tipo === 'despesa') totGastoReal += v; if (t.tipo === 'investimento') totInvestido += v; if (t.status === 'pago') totGastoPago += v; if (t.formaPagamento && t.formaPagamento.startsWith('credito_') && t.status === 'pendente') totFaturaCreditoAberto += v; if (t.categoria === 'Contas Fixas') gastoContasFixas += v; else if (t.categoria === 'Sem Categoria') gastoSemCategoria += v; else if (gCat[t.categoria] !== undefined) gCat[t.categoria] += v; } });

  const categoriasDinamicas = setup.categorias.map(c => c.nome === 'Gasolina' && auth.nomeUsuario.toLowerCase() === 'stewart' ? { ...c, meta: garagem.calcularMetaGasolina(dataVis.mes, dataVis.ano) } : c);
  let custoPrevisto = gastoSemCategoria + gastoContasFixas; categoriasDinamicas.forEach(c => custoPrevisto += Math.max(c.meta, gCat[c.nome] || 0));
  const saldoMesAtual = totRendaPaga - totGastoPago; const saldoAtual = saldoMesAtual + (somarSaldoAnterior ? saldoMesAnterior : 0); const previstoFimMes = totRendaTotal - custoPrevisto + (somarSaldoAnterior ? saldoMesAnterior : 0);

  const dataHoje = new Date(); const mesReal = dataHoje.getMonth() + 1; const anoReal = dataHoje.getFullYear();
  const pendenciasPassadas = transacoes.filter(t => t.status === 'pendente' && (t.anoReferencia < anoReal || (t.anoReferencia === anoReal && t.mesReferencia < mesReal)));

  const processarRolagemPendencias = async () => {
    try {
      const promessas = pendenciasPassadas.flatMap((t, index) => {
        const reqUpdate = fetch(`${API}/transacoes/${t.id}`, { method: 'PUT', headers: auth.getHeaders(), body: JSON.stringify({ status: 'transferido', valorParcela: t.valorParcela }) });
        const reqCreate = fetch(`${API}/transacoes`, { method: 'POST', headers: auth.getHeaders(), body: JSON.stringify({ id: (Date.now() + index).toString(), descricao: `[Pendência ${nomesMeses[t.mesReferencia - 1]}] ${t.descricao}`, categoria: t.categoria, valorParcela: t.valorParcela, dataCompra: new Date(anoReal, mesReal - 1, dataHoje.getDate()).toISOString(), tipo: t.tipo, formaPagamento: t.formaPagamento, status: 'pendente', mesReferencia: mesReal, anoReferencia: anoReal, kmMoto: t.kmMoto || null, grupo_id: null }) });
        return [reqUpdate, reqCreate];
      });
      await Promise.all(promessas); const resT = await fetch(`${API}/transacoes`, { headers: auth.getHeaders() }); if (resT.ok) { setTransacoes(await resT.json()); setDataVis({ mes: mesReal, ano: anoReal }); modal.alert(`Importado!`, '✅ Concluído'); }
    } catch (err) { modal.alert('Erro de conexão.', '❌ Erro'); }
  };

  const abrirModalPendencias = () => modal.alert(<div className="space-y-3"><p className="text-sm"><b>{pendenciasPassadas.length}</b> pendência(s) antiga(s). Deseja importar para {nomesMeses[mesReal - 1]}?</p><div className="max-h-60 overflow-y-auto space-y-2 pr-2">{pendenciasPassadas.map(t => (<div key={t.id} className="border border-rose-200 bg-rose-50 p-3 rounded-lg flex justify-between"><div className="truncate"><p className="text-xs font-bold text-rose-800">{t.descricao}</p></div><span className="font-bold text-rose-700 text-sm">{formatarMoeda(t.valorParcela)}</span></div>))}</div><button onClick={() => { modal.close(); processarRolagemPendencias(); }} className="w-full mt-4 bg-rose-600 text-white font-bold py-3 rounded-lg shadow">Importar</button></div>, '⚠️ Pendências');

  // =========================================================================
  // UI RAIO-X E RETORNO DOS COMPONENTES (ROUTER)
  // =========================================================================
  const abrirDetalhesCategoria = (nCat, vGasto, vMeta, tCat) => {
    const ts = transacoes.filter(t => t.categoria === nCat && t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano); if (ts.length === 0) return;
    const qtd = ts.length; const med = vGasto / qtd; const maior = ts.reduce((max, t) => t.valorParcela > max.valorParcela ? t : max, ts[0]); const menor = ts.reduce((min, t) => t.valorParcela < min.valorParcela ? t : min, ts[0]);
    let prev = vGasto; let analise = "Indisponível fora do mês atual.";
    if (dataVis.mes === dataAtual.getMonth() + 1 && dataVis.ano === dataAtual.getFullYear()) {
      prev = (vGasto / dataAtual.getDate()) * new Date(dataVis.ano, dataVis.mes, 0).getDate();
      if (tCat === 'despesa' || tCat === 'Gasto' || tCat === 'gasto') analise = prev > vMeta ? `⚠️ Alerta: Estouro de limite projetado de ${formatarMoeda(prev - vMeta)}.` : `✅ Controlado. Economia projetada: ${formatarMoeda(vMeta - prev)}.`;
      else analise = prev < vMeta ? `⚠️ Ritmo lento. Faltam ${formatarMoeda(vMeta - prev)} para a meta.` : `✅ Excelente! Superando a meta em ${formatarMoeda(prev - vMeta)}.`;
    }
    const c = (<div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="bg-slate-50 p-3 rounded-lg border"><p className="text-[10px] font-bold mb-1">Atual vs Meta</p><p className="text-lg font-bold">{formatarMoeda(vGasto)}<span className="text-xs font-normal"> / {formatarMoeda(vMeta)}</span></p></div><div className="bg-slate-50 p-3 rounded-lg border"><p className="text-[10px] font-bold mb-1">Média</p><p className="text-lg font-bold">{formatarMoeda(med)}<span className="text-xs font-normal"> em {qtd}x</span></p></div></div><div className="bg-blue-50 p-4 rounded-lg border text-blue-900 text-sm font-medium">{analise}</div><div className="grid grid-cols-2 gap-4"><div className="bg-rose-50 p-3 rounded-lg border border-rose-100"><p className="text-[10px] uppercase text-rose-600 font-bold mb-1">Maior Valor</p><p className="text-sm font-bold text-rose-700">{formatarMoeda(maiorGasto.valorParcela)}</p><p className="text-[9px] text-rose-500 mt-1 truncate" title={maiorGasto.descricao}>{new Date(maiorGasto.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {maiorGasto.descricao}</p></div><div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100"><p className="text-[10px] uppercase text-emerald-600 font-bold mb-1">Menor Valor</p><p className="text-sm font-bold text-emerald-700">{formatarMoeda(menorGasto.valorParcela)}</p><p className="text-[9px] text-emerald-500 mt-1 truncate" title={menorGasto.descricao}>{new Date(menorGasto.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {menorGasto.descricao}</p></div></div>{nCat === 'Gasolina' && auth.nomeUsuario === 'stewart' && (<button onClick={(e) => garagem.abrirCalendarioGasolina(e, dataVis.mes, dataVis.ano)} className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg">📅 Ajustar Dias Não Rodados</button>)}</div>);
    modal.alert(c, `Raio-X: ${nCat}`);
  };

  const abrirResumoCard = (tipo) => modal.alert(<div>Resumo em tela: clique em exportar para visualização contábil ou avalie painéis diretos.</div>, 'Raio-X');

  // Gating de Acesso
  if (!auth.token && !auth.precisaTrocarSenha) return <Login fazerLogin={auth.fazerLogin} usuarioLogin={auth.usuarioLogin} setUsuarioLogin={auth.setUsuarioLogin} senhaLogin={auth.senhaLogin} setSenhaLogin={auth.setSenhaLogin} erroLogin={auth.erroLogin} modalConfig={modal.config} modalClose={modal.close} ModalComponent={Modal} />;
  if (auth.precisaTrocarSenha) return <TrocaSenha enviarNovaSenha={auth.enviarNovaSenha} novaSenha={auth.novaSenha} setNovaSenha={auth.setNovaSenha} confirmarSenha={auth.confirmarSenha} setConfirmarSenha={auth.setConfirmarSenha} erroTrocaSenha={auth.erroTrocaSenha} fazerLogout={auth.fazerLogout} />;

  // Rotas Dinâmicas
  if (telaAtiva === 'admin') return <Admin ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} criarUsuario={auth.criarUsuario} carregarUsuarios={auth.carregarUsuarios} usuarios={auth.usuarios} toggleAdmin={auth.toggleAdmin} resetarSenha={auth.resetarSenha} deletarUsuario={auth.deletarUsuario} />;

  if (telaAtiva === 'setup') return <Setup
    ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} exportarCSV={exportarCSV} getHeaders={auth.getHeaders}
    gerarMesManual={setup.gerarMesManual} gerandoMes={setup.gerandoMes}
    addCartao={setup.addCartao} cartoes={setup.cartoes} setCartoes={setup.setCartoes}
    addCategoria={setup.addCategoria} categorias={setup.categorias} setCategorias={setup.setCategorias}
    addContaFixa={setup.addContaFixa} contasFixas={setup.contasFixas} setContasFixas={setup.setContasFixas}
    addRendaFixa={setup.addRendaFixa} rendasFixas={setup.rendasFixas} setRendasFixas={setup.setRendasFixas}
    removerSetup={setup.removerSetup}
  />;

  if (telaAtiva === 'garagem') return <Garagem ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} getHeaders={auth.getHeaders} transacoes={transacoes} />;

  // Rota Principal (Dashboard)
  return (
    <Dashboard
      nomeUsuario={auth.nomeUsuario} alertaMoto={garagem.alertaMoto} abrirDetalhesCategoria={abrirDetalhesCategoria} dataVis={dataVis} mesAnterior={mesAnterior} mesProximo={mesProximo} isAdmin={auth.isAdmin} setTelaAtiva={setTelaAtiva} carregarUsuarios={auth.carregarUsuarios} fazerLogout={auth.fazerLogout}
      totRendaPaga={totRendaPaga} totGastoReal={totGastoReal} totInvestido={totInvestido} verFaturasPorCartao={cartoesFaturas.verFaturasPorCartao} totFaturaCreditoAberto={totFaturaCreditoAberto} saldoMesAnterior={saldoMesAnterior} somarSaldoAnterior={somarSaldoAnterior} setSomarSaldoAnterior={setSomarSaldoAnterior} saldoAtual={saldoAtual} saldoMesAtual={saldoMesAtual} mesAntRef={mesAntRef} previstoFimMes={previstoFimMes}
      categorias={categoriasDinamicas} gCat={gCat} cartoes={setup.cartoes} filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus} buscaTexto={buscaTexto} setBuscaTexto={setBuscaTexto} mostrarFiltrosAvancados={mostrarFiltrosAvancados} setMostrarFiltrosAvancados={setMostrarFiltrosAvancados} filtrosAvancados={filtrosAvancados} setFiltrosAvancados={setFiltrosAvancados} mudarOrdenacao={mudarOrdenacao} ordenacao={ordenacao} dadosTabela={dadosTabela} pendenciasPassadas={pendenciasPassadas} abrirModalPendencias={abrirModalPendencias} abrirResumoCard={abrirResumoCard} ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close}
      addTransacao={transacoesManager.addTransacao} alternarStatusTransacao={transacoesManager.alternarStatusTransacao} editarValor={transacoesManager.editarValor} deletarTransacao={transacoesManager.deletarTransacao} executarAcaoEmMassa={transacoesManager.executarAcaoEmMassa} anexarComprovante={transacoesManager.anexarComprovante} removerComprovante={transacoesManager.removerComprovante} verComprovante={transacoesManager.verComprovante} pagarFaturaCartao={cartoesFaturas.pagarFaturaCartao}
    />
  );
}

export default App;