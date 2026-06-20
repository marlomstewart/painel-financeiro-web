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

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const API = 'https://painel-gestao-financeira-api.onrender.com/api';

/**
 * HOOK useModal — UI universal de Janelas (Prompts, Alerts, Calendário)
 */
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
 * Atua puramente como orquestrador, delegando cálculos pesados aos Custom Hooks.
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

  // Estados do Banco de Dados Relacional
  const [cartoes, setCartoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [metasRenda, setMetasRenda] = useState([]);
  const [contasFixas, setContasFixas] = useState([]);
  const [rendasFixas, setRendasFixas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);

  const [somarSaldoAnterior, setSomarSaldoAnterior] = useState(true);
  const [gerandoMes, setGerandoMes] = useState(false);

  // 1. INSTÂNCIA DE AUTENTICAÇÃO E SEGURANÇA
  const auth = useAuth({ API, modal, setCarregouAPI });
  
  // 2. INSTÂNCIA DO MOTOR AUTOMOTIVO
  const garagem = useGaragem({ API, getHeaders: auth.getHeaders, modal, nomeUsuario: auth.nomeUsuario, transacoes });

  // 3. INSTÂNCIA DE FATURAMENTO E CRÉDITO
  const transacoesMes = transacoes.filter(t => t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano);
  const cartoesFaturas = useCartoesFaturas({ transacoes, setTransacoes, transacoesMes, cartoes, dataVis, API, getHeaders: auth.getHeaders, modal });

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
        
        setTransacoes(await resT.json()); setCartoes(await resC.json()); setCategorias(await resCat.json()); setMetasRenda(await resR.json()); setContasFixas(await resF.json()); setRendasFixas(await resRF.json()); 
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
  // CRUD SETUP GLOBAL
  // =========================================================================
  const salvarConfig = async (rota, dados, setState, stateAtual) => {
    try { const res = await fetch(`${API}/${rota}`, { method: 'POST', headers: auth.getHeaders(), body: JSON.stringify(dados) }); if (res.ok) setState([...stateAtual, dados]); } catch (err) { console.error("Erro ao salvar:", err); }
  };
  const addCartao = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('cartoes', { id: Date.now().toString(), nome: fd.get('nome'), melhorDia: Number(fd.get('melhorDia')), vencimento: Number(fd.get('vencimento')) }, setCartoes, cartoes); e.target.reset(); };
  const addCategoria = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('categorias', { id: Date.now().toString(), nome: fd.get('nome'), meta: Number(fd.get('meta')), tipo: fd.get('tipo') }, setCategorias, categorias); e.target.reset(); };
  const addContaFixa = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('contas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valor')), vencimento: Number(fd.get('vencimento')) }, setContasFixas, contasFixas); e.target.reset(); };
  const addRendaFixa = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('rendas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valor')), diaRecebimento: Number(fd.get('diaRecebimento')) }, setRendasFixas, rendasFixas); e.target.reset(); };

  const gerarMesManual = async () => {
    setGerandoMes(true);
    try {
      const res = await fetch(`${API}/gerar-mes`, { method: 'POST', headers: auth.getHeaders() }); const data = await res.json();
      if (data.gerados.length === 0) { await modal.alert(`Tudo já estava gerado para ${data.mes}/${data.ano}.\nNenhum lançamento novo.`, '✅ Nenhum novo'); } 
      else {
        const lista = data.gerados.map(g => `• ${g.nome} (${g.tipo})`).join('\n');
        await modal.alert(`${data.gerados.length} lançamento(s):\n\n${lista}`, '✅ Gerados');
        const resT = await fetch(`${API}/transacoes`, { headers: auth.getHeaders() }); if (resT.ok) setTransacoes(await resT.json());
      }
    } catch (err) { await modal.alert('Erro ao gerar lançamentos.', '❌ Erro'); } finally { setGerandoMes(false); }
  };

  const removerSetup = async (banco, id) => {
    const rotas = { cartoes: 'cartoes', categorias: 'categorias', metasRenda: 'metas-renda', contasFixas: 'contas-fixas', rendasFixas: 'rendas-fixas' };
    await fetch(`${API}/${rotas[banco]}/${id}`, { method: 'DELETE', headers: auth.getHeaders() });
    const setters = { cartoes: [setCartoes, cartoes], categorias: [setCategorias, categorias], metasRenda: [setMetasRenda, metasRenda], contasFixas: [setContasFixas, contasFixas], rendasFixas: [setRendasFixas, rendasFixas] };
    const [setter, state] = setters[banco];
    setter(state.filter(i => i.id !== id));
  };

  // =========================================================================
  // LANÇAMENTOS CORE E ROTINAS DE TABELA
  // =========================================================================
  const addTransacao = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const d = fd.get('descricao'), v = Number(fd.get('valor')), dt = new Date(fd.get('dataCompra') + 'T00:00:00');
    let t = fd.get('tipo'), c = fd.get('categoria'), p = fd.get('formaPagamento'), parc = Number(fd.get('parcelas')) || 1, s = fd.get('status');

    let km_moto = fd.get('kmMoto') ? Number(fd.get('kmMoto')) : null;
    let veiculo_id = null; let veiculo_emprestado = null;

    if (auth.nomeUsuario.toLowerCase() === 'stewart' && (c === 'Gasolina' || c === 'Manutenção da moto')) {
      let listaAtual = garagem.veiculosGaragem;
      try { const resGar = await fetch(`${API}/garagem/veiculos`, { headers: auth.getHeaders() }); if (resGar.ok) { listaAtual = await resGar.json(); garagem.setVeiculosGaragem(listaAtual); } } catch (err) { console.error('Erro atualizar garagem:', err); }
      const opcoesVeiculo = listaAtual.map(vc => ({ value: vc.id, icon: vc.tipo === 'convidado' ? '🤝' : '🚗', label: vc.modelo, desc: vc.tipo === 'convidado' ? 'Convidado' : `${vc.ano_fabricacao}/${vc.ano_modelo}` }));
      if (opcoesVeiculo.length === 0) { await modal.alert('Cadastre um veículo primeiro.', '🏍️ Vazio'); return; }
      const idEscolhido = await modal.options('Qual veículo recebeu o lançamento?', opcoesVeiculo, '🏍️ Veículo');
      if (!idEscolhido) return; 
      const veiculoEscolhido = listaAtual.find(vc => vc.id === idEscolhido);
      veiculo_id = veiculoEscolhido.id;
      if (veiculoEscolhido.tipo === 'convidado') { veiculo_emprestado = veiculoEscolhido.modelo; km_moto = null; }
    }

    if (c === 'Renda' || c === 'Renda Fixa') t = 'renda';
    if (c === 'Contas Fixas') t = 'despesa';
    const grupoId = parc > 1 ? Date.now().toString() : null; let novasT = [];

    if (p.startsWith('credito_')) {
      const cart = cartoes.find(card => card.id === p.split('_')[1]); let mI = (dt.getDate() >= cart.melhorDia) ? dt.getMonth() + 1 : dt.getMonth();
      for (let i = 0; i < parc; i++) { let mP = mI + i, aP = dt.getFullYear(); if (mP > 11) { aP += Math.floor(mP / 12); mP %= 12; } novasT.push({ id: (Date.now() + i).toString(), descricao: parc > 1 ? `${d} (${i + 1}/${parc})` : d, categoria: c, valorParcela: v / parc, dataCompra: dt.toISOString(), tipo: t, formaPagamento: p, status: s, mesReferencia: mP + 1, anoReferencia: aP, grupo_id: grupoId, km_moto, veiculo_id, veiculo_emprestado }); }
    } else {
      novasT.push({ id: Date.now().toString(), descricao: d, categoria: c, valorParcela: v, dataCompra: dt.toISOString(), tipo: t, formaPagamento: p, status: s, mesReferencia: dt.getMonth() + 1, anoReferencia: dt.getFullYear(), grupo_id: grupoId, km_moto, veiculo_id, veiculo_emprestado });
    }

    for (const nova of novasT) await fetch(`${API}/transacoes`, { method: 'POST', headers: auth.getHeaders(), body: JSON.stringify(nova) });
    setTransacoes([...transacoes, ...novasT]); e.target.reset();

    if (km_moto && veiculo_id && !veiculo_emprestado) await garagem.verificarDesgasteVeiculo(veiculo_id, km_moto);
  };

  const executarAcaoEmMassa = async (acao, ids) => {
    const confirmacao = await modal.confirm(`Deseja aplicar ${acao.toUpperCase()} a ${ids.length} item(s)?`, '⚠️ Ação em Massa'); if (!confirmacao) return false;
    try {
      const promessas = ids.map(id => {
        if (acao === 'excluir') return fetch(`${API}/transacoes/${id}`, { method: 'DELETE', headers: auth.getHeaders() });
        const t = transacoes.find(tr => tr.id === id); return fetch(`${API}/transacoes/${id}`, { method: 'PUT', headers: auth.getHeaders(), body: JSON.stringify({ status: acao, valorParcela: t.valorParcela }) });
      });
      await Promise.all(promessas);
      if (acao === 'excluir') setTransacoes(prev => prev.filter(tr => !ids.includes(tr.id))); else setTransacoes(prev => prev.map(tr => ids.includes(tr.id) ? { ...tr, status: acao } : tr));
      return true;
    } catch (err) { modal.alert('Erro de conexão.', '❌ Erro'); return false; }
  };

  const deletarTransacao = async (t) => {
    if (t.grupo_id) {
      const opcao = await modal.options(`"${t.descricao}" parcelada. O que excluir?`, [{ value: '1', icon: '1️⃣', label: 'Esta parcela' }, { value: '2', icon: '2️⃣', label: 'Esta e futuras' }, { value: '3', icon: '3️⃣', label: 'Esta e anteriores' }, { value: '4', icon: '4️⃣', label: 'Todas parcelas' }], '🗑️ Excluir');
      if (!opcao) return;
      if (opcao === '1') { await fetch(`${API}/transacoes/${t.id}`, { method: 'DELETE', headers: auth.getHeaders() }); setTransacoes(prev => prev.filter(tr => tr.id !== t.id)); } 
      else if (opcao === '2') { await fetch(`${API}/transacoes/grupo/${t.grupo_id}?mes=${t.mesReferencia}&ano=${t.anoReferencia}&modo=futuras`, { method: 'DELETE', headers: auth.getHeaders() }); setTransacoes(prev => prev.filter(tr => !(tr.grupo_id === t.grupo_id && (tr.anoReferencia > t.anoReferencia || (tr.anoReferencia === t.anoReferencia && tr.mesReferencia >= t.mesReferencia))))); } 
      else if (opcao === '3') { await fetch(`${API}/transacoes/grupo/${t.grupo_id}?mes=${t.mesReferencia}&ano=${t.anoReferencia}&modo=anteriores`, { method: 'DELETE', headers: auth.getHeaders() }); setTransacoes(prev => prev.filter(tr => !(tr.grupo_id === t.grupo_id && (tr.anoReferencia < t.anoReferencia || (tr.anoReferencia === t.anoReferencia && tr.mesReferencia <= t.mesReferencia))))); } 
      else if (opcao === '4') { await fetch(`${API}/transacoes/grupo/${t.grupo_id}?modo=todas`, { method: 'DELETE', headers: auth.getHeaders() }); setTransacoes(prev => prev.filter(tr => tr.grupo_id !== t.grupo_id)); }
      return;
    }
    const ok = await modal.confirm('Excluir transação?', '🗑️ Excluir', { confirmLabel: 'Excluir', confirmColor: 'bg-red-600 hover:bg-red-700' }); if (!ok) return;
    await fetch(`${API}/transacoes/${t.id}`, { method: 'DELETE', headers: auth.getHeaders() }); setTransacoes(prev => prev.filter(tr => tr.id !== t.id));
  };

  const alternarStatusTransacao = async (id, statusAtual, valorParcela, dataCompra) => {
    const opcaoEscolhida = await modal.options(`Status: ${statusAtual.toUpperCase()}\n\nEscolha:`, [ { value: 'pago', icon: '✔', label: 'PAGO' }, { value: 'pendente', icon: '⏳', label: 'PENDENTE' } ], '🔄 Alterar Status');
    if (!opcaoEscolhida || opcaoEscolhida === statusAtual) return;
    try { await fetch(`${API}/transacoes/${id}`, { method: 'PUT', headers: auth.getHeaders(), body: JSON.stringify({ status: opcaoEscolhida, valorParcela, dataCompra }) }); setTransacoes(prev => prev.map(t => t.id === id ? { ...t, status: opcaoEscolhida } : t)); } catch (err) { modal.alert('Erro de conexão.', '❌ Erro'); }
  };

  const editarValor = async (t) => {
    const nV = await modal.prompt(`1️⃣ Novo VALOR?`, String(t.valorParcela), '✏️ Editar', { inputType: 'number', placeholder: '0.00', confirmLabel: 'Próximo' }); if (nV === null) return;
    const novoValor = Number(String(nV).replace(',', '.')); if (isNaN(novoValor)) return modal.alert('Inválido.', '❌ Erro');
    const [ano, mes, dia] = String(t.dataCompra).split('T')[0].split('-');
    const nD = await modal.prompt(`2️⃣ Nova DATA?\nDD/MM/AAAA`, `${dia}/${mes}/${ano}`, '📅 Editar', { confirmLabel: 'Próximo' }); if (nD === null) return;
    const partes = nD.split('/'); if (partes.length !== 3) return modal.alert('Formato inválido.', '❌ Erro'); const novaDataStr = `${partes[2]}-${partes[1]}-${partes[0]}`;
    const opcoesCat = [ { value: 'Sem Categoria', icon: '🏷️', label: 'Sem Categoria' }, { value: 'Contas Fixas', icon: '📅', label: 'Contas Fixas' }, { value: 'Renda Fixa', icon: '💰', label: 'Renda Fixa' }, { value: 'Renda', icon: '💵', label: 'Renda Variável' }, ...categorias.map(c => ({ value: c.nome, icon: c.tipo === 'investimento' ? '📈' : '💸', label: c.nome })) ];
    const nCat = await modal.options(`3️⃣ CATEGORIA?\nAtual: ${t.categoria}`, opcoesCat, '🏷️ Editar'); if (!nCat) return;
    const nS = await modal.options(`4️⃣ STATUS?\nAtual: ${t.status.toUpperCase()}`, [ { value: 'pago', icon: '✔', label: 'PAGO' }, { value: 'pendente', icon: '⏳', label: 'PENDENTE' } ], '🔄 Editar'); if (!nS) return;

    try { await fetch(`${API}/transacoes/${t.id}`, { method: 'PUT', headers: auth.getHeaders(), body: JSON.stringify({ status: nS, valorParcela: novoValor, dataCompra: novaDataStr, categoria: nCat }) }); setTransacoes(prev => prev.map(tr => tr.id === t.id ? { ...tr, valorParcela: novoValor, dataCompra: novaDataStr, status: nS, categoria: nCat } : tr)); } catch (err) { modal.alert('Erro ao atualizar.', '❌ Erro'); }
  };

  // =========================================================================
  // ANALÍTICA, DASHBOARDS E RETORNO JSX
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

  let totRendaTotal = 0, totRendaPaga = 0, totGastoReal = 0, totInvestido = 0, totGastoPago = 0, totFaturaCreditoAberto = 0; let gCat = {}; categorias.forEach(c => gCat[c.nome] = 0); let gastoSemCategoria = 0, gastoContasFixas = 0;
  transacoesMes.forEach(t => { const v = Number(t.valorParcela); if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') { totRendaTotal += v; if (t.status === 'pago') totRendaPaga += v; } else { if (t.tipo === 'despesa') totGastoReal += v; if (t.tipo === 'investimento') totInvestido += v; if (t.status === 'pago') totGastoPago += v; if (t.formaPagamento && t.formaPagamento.startsWith('credito_') && t.status === 'pendente') totFaturaCreditoAberto += v; if (t.categoria === 'Contas Fixas') gastoContasFixas += v; else if (t.categoria === 'Sem Categoria') gastoSemCategoria += v; else if (gCat[t.categoria] !== undefined) gCat[t.categoria] += v; } });

  const categoriasDinamicas = categorias.map(c => c.nome === 'Gasolina' && auth.nomeUsuario.toLowerCase() === 'stewart' ? { ...c, meta: garagem.calcularMetaGasolina(dataVis.mes, dataVis.ano) } : c);
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

  const abrirDetalhesCategoria = (nCat, vGasto, vMeta, tCat) => {
    const ts = transacoes.filter(t => t.categoria === nCat && t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano); if (ts.length === 0) return;
    const qtd = ts.length; const med = vGasto / qtd; const maior = ts.reduce((max, t) => t.valorParcela > max.valorParcela ? t : max, ts[0]); const menor = ts.reduce((min, t) => t.valorParcela < min.valorParcela ? t : min, ts[0]);
    let prev = vGasto; let analise = "Indisponível fora do mês atual.";
    if (dataVis.mes === dataAtual.getMonth() + 1 && dataVis.ano === dataAtual.getFullYear()) {
      prev = (vGasto / dataAtual.getDate()) * new Date(dataVis.ano, dataVis.mes, 0).getDate();
      if (tCat === 'despesa' || tCat === 'Gasto' || tCat === 'gasto') analise = prev > vMeta ? `⚠️ Alerta: Estouro de limite projetado de ${formatarMoeda(prev - vMeta)}.` : `✅ Controlado. Economia projetada: ${formatarMoeda(vMeta - prev)}.`;
      else analise = prev < vMeta ? `⚠️ Ritmo lento. Faltam ${formatarMoeda(vMeta - prev)} para a meta.` : `✅ Excelente! Superando a meta em ${formatarMoeda(prev - vMeta)}.`;
    }
    const c = (<div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="bg-slate-50 p-3 rounded-lg border"><p className="text-[10px] font-bold mb-1">Atual vs Meta</p><p className="text-lg font-bold">{formatarMoeda(vGasto)}<span className="text-xs font-normal"> / {formatarMoeda(vMeta)}</span></p></div><div className="bg-slate-50 p-3 rounded-lg border"><p className="text-[10px] font-bold mb-1">Média</p><p className="text-lg font-bold">{formatarMoeda(med)}<span className="text-xs font-normal"> em {qtd}x</span></p></div></div><div className="bg-blue-50 p-4 rounded-lg border text-blue-900 text-sm font-medium">{analise}</div>{nCat === 'Gasolina' && auth.nomeUsuario === 'stewart' && (<button onClick={(e) => garagem.abrirCalendarioGasolina(e, dataVis.mes, dataVis.ano)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg">📅 Ajustar Dias Não Rodados</button>)}</div>);
    modal.alert(c, `Raio-X: ${nCat}`);
  };

  const abrirResumoCard = (tipo) => modal.alert(<div>Resumo em tela: clique em exportar para visualização contábil global ou avalie painéis diretos.</div>, 'Raio-X');
  const anexarComprovante = async (t) => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*,application/pdf'; input.onchange = async (e) => { const arq = e.target.files[0]; if (!arq) return; const fd = new FormData(); fd.append('arquivo', arq); try { const res = await fetch(`${API}/transacoes/${t.id}/comprovante`, { method: 'POST', headers: { 'Authorization': `Bearer ${auth.token}` }, body: fd }); const data = await res.json(); if (res.ok) { setTransacoes(prev => prev.map(tr => tr.id === t.id ? { ...tr, comprovante_url: data.comprovante_url, comprovante_public_id: data.comprovante_public_id } : tr)); modal.alert('Anexado!', '✅ Sucesso'); } else modal.alert('Erro', '❌ Erro'); } catch (err) { modal.alert('Erro conexão', '❌ Erro'); } }; input.click(); };
  const removerComprovante = async (t) => { const ok = await modal.confirm('Remover?', '🗑️ Remover'); if (!ok) return; try { const res = await fetch(`${API}/transacoes/${t.id}/comprovante`, { method: 'DELETE', headers: auth.getHeaders() }); if (res.ok) { setTransacoes(prev => prev.map(tr => tr.id === t.id ? { ...tr, comprovante_url: null, comprovante_public_id: null } : tr)); modal.alert('Removido', '✅'); } } catch (err) { modal.alert('Erro', '❌'); } };
  const verComprovante = (t) => { modal.setConfig({ type: 'comprovante', title: `📎 Comprovante`, url: t.comprovante_url, isPDF: t.comprovante_url.includes('/raw/'), onCancel: modal.close, onClose: modal.close, onRemover: () => { modal.close(); removerComprovante(t); } }); };

  // ROTAS
  if (!auth.token && !auth.precisaTrocarSenha) return <Login fazerLogin={auth.fazerLogin} usuarioLogin={auth.usuarioLogin} setUsuarioLogin={auth.setUsuarioLogin} senhaLogin={auth.senhaLogin} setSenhaLogin={auth.setSenhaLogin} erroLogin={auth.erroLogin} modalConfig={modal.config} modalClose={modal.close} ModalComponent={Modal} />;
  if (auth.precisaTrocarSenha) return <TrocaSenha enviarNovaSenha={auth.enviarNovaSenha} novaSenha={auth.novaSenha} setNovaSenha={auth.setNovaSenha} confirmarSenha={auth.confirmarSenha} setConfirmarSenha={auth.setConfirmarSenha} erroTrocaSenha={auth.erroTrocaSenha} fazerLogout={auth.fazerLogout} />;
  if (telaAtiva === 'admin') return <Admin ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} criarUsuario={auth.criarUsuario} carregarUsuarios={auth.carregarUsuarios} usuarios={auth.usuarios} toggleAdmin={auth.toggleAdmin} resetarSenha={auth.resetarSenha} deletarUsuario={auth.deletarUsuario} />;
  if (telaAtiva === 'setup') return <Setup ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} gerarMesManual={gerarMesManual} gerandoMes={gerandoMes} exportarCSV={exportarCSV} setTelaAtiva={setTelaAtiva} addCartao={addCartao} cartoes={cartoes} setCartoes={setCartoes} removerSetup={removerSetup} addCategoria={addCategoria} categorias={categorias} setCategorias={setCategorias} addContaFixa={addContaFixa} contasFixas={contasFixas} setContasFixas={setContasFixas} addRendaFixa={addRendaFixa} rendasFixas={rendasFixas} setRendasFixas={setRendasFixas} getHeaders={auth.getHeaders} />;
  if (telaAtiva === 'garagem') return <Garagem ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} getHeaders={auth.getHeaders} transacoes={transacoes} />;

  return (
    <Dashboard nomeUsuario={auth.nomeUsuario} alertaMoto={garagem.alertaMoto} abrirDetalhesCategoria={abrirDetalhesCategoria} dataVis={dataVis} mesAnterior={mesAnterior} mesProximo={mesProximo} isAdmin={auth.isAdmin} setTelaAtiva={setTelaAtiva} carregarUsuarios={auth.carregarUsuarios} fazerLogout={auth.fazerLogout} totRendaPaga={totRendaPaga} totGastoReal={totGastoReal} totInvestido={totInvestido} verFaturasPorCartao={cartoesFaturas.verFaturasPorCartao} totFaturaCreditoAberto={totFaturaCreditoAberto} saldoMesAnterior={saldoMesAnterior} somarSaldoAnterior={somarSaldoAnterior} setSomarSaldoAnterior={setSomarSaldoAnterior} saldoAtual={saldoAtual} saldoMesAtual={saldoMesAtual} mesAntRef={mesAntRef} previstoFimMes={previstoFimMes} categorias={categoriasDinamicas} gCat={gCat} addTransacao={addTransacao} cartoes={cartoes} filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus} buscaTexto={buscaTexto} setBuscaTexto={setBuscaTexto} mostrarFiltrosAvancados={mostrarFiltrosAvancados} setMostrarFiltrosAvancados={setMostrarFiltrosAvancados} filtrosAvancados={filtrosAvancados} setFiltrosAvancados={setFiltrosAvancados} mudarOrdenacao={mudarOrdenacao} ordenacao={ordenacao} dadosTabela={dadosTabela} alternarStatusTransacao={alternarStatusTransacao} editarValor={editarValor} deletarTransacao={deletarTransacao} ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} executarAcaoEmMassa={executarAcaoEmMassa} pendenciasPassadas={pendenciasPassadas} abrirModalPendencias={abrirModalPendencias} pagarFaturaCartao={cartoesFaturas.pagarFaturaCartao} anexarComprovante={anexarComprovante} removerComprovante={removerComprovante} verComprovante={verComprovante} abrirResumoCard={abrirResumoCard} />
  );
}

export default App;