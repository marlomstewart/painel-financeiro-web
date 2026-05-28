import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from './components/Modal';
import { Login } from './components/Login';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const API = 'https://painel-gestao-financeira-api.onrender.com/api';

// =========================================================================
// HOOK useModal — substitui window.alert, confirm e prompt
// =========================================================================
function useModal() {
  const [config, setConfig] = useState(null);

  const close = useCallback(() => setConfig(null), []);

  const alert = useCallback((message, title, opts = {}) =>
    new Promise(resolve => setConfig({ type: 'alert', title, message, onConfirm: resolve, onClose: () => { setConfig(null); resolve(); }, ...opts })),
  []);

  const confirm = useCallback((message, title, opts = {}) =>
    new Promise(resolve => setConfig({ type: 'confirm', title, message, onConfirm: () => resolve(true), onCancel: () => resolve(false), onClose: () => { setConfig(null); resolve(false); }, ...opts })),
  []);

  const prompt = useCallback((message, defaultValue = '', title, opts = {}) =>
    new Promise(resolve => setConfig({ type: 'prompt', title, message, defaultValue, onConfirm: (val) => resolve(val), onCancel: () => resolve(null), onClose: () => { setConfig(null); resolve(null); }, ...opts })),
  []);

  const options = useCallback((message, opts_list, title, opts = {}) =>
    new Promise(resolve => setConfig({ type: 'options', title, message, options: opts_list, onConfirm: (val) => resolve(val), onCancel: () => resolve(null), onClose: () => { setConfig(null); resolve(null); }, ...opts })),
  []);

  return { config, close, setConfig, alert, confirm, prompt, options };
}

function App() {
  // =========================================================================
  // ESTADOS DO SISTEMA E SEGURANÇA
  // =========================================================================
  const [token, setToken] = useState(localStorage.getItem('tokenPainel') || null);
  const [tokenTemp, setTokenTemp] = useState(null);
  const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem('nomeUsuario') || '');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true' || false);
  const [usuarios, setUsuarios] = useState([]);

  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroTrocaSenha, setErroTrocaSenha] = useState('');

  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  const [dataVis, setDataVis] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });

  // Filtros e Ordenação
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [ordenacao, setOrdenacao] = useState({ coluna: 'data', direcao: 'desc' });
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [filtrosAvancados, setFiltrosAvancados] = useState({ dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: '' });

  // Bancos de Dados
  const [cartoes, setCartoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [metasRenda, setMetasRenda] = useState([]);
  const [contasFixas, setContasFixas] = useState([]);
  const [rendasFixas, setRendasFixas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [carregouAPI, setCarregouAPI] = useState(false);

  const [somarSaldoAnterior, setSomarSaldoAnterior] = useState(false);
  const [gerandoMes, setGerandoMes] = useState(false);

  // Modal
  const modal = useModal();

  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token || tokenTemp}`,
    'Content-Type': 'application/json'
  }), [token, tokenTemp]);

  // =========================================================================
  // EFEITOS
  // =========================================================================
  useEffect(() => {
    if (!token) return;
    const headers = getHeaders();
    const carregar = async () => {
      try {
        const [resT, resC, resCat, resR, resF, resRF] = await Promise.all([
          fetch(`${API}/transacoes`, { headers }),
          fetch(`${API}/cartoes`, { headers }),
          fetch(`${API}/categorias`, { headers }),
          fetch(`${API}/metas-renda`, { headers }),
          fetch(`${API}/contas-fixas`, { headers }),
          fetch(`${API}/rendas-fixas`, { headers })
        ]);
        if (!resT.ok) { fazerLogout(); return; }
        setTransacoes(await resT.json());
        setCartoes(await resC.json());
        setCategorias(await resCat.json());
        setMetasRenda(await resR.json());
        setContasFixas(await resF.json());
        setRendasFixas(await resRF.json());
        setCarregouAPI(true);
      } catch (err) { console.error("Erro ao sincronizar:", err); }
    };
    carregar();
  }, [token]);

  // =========================================================================
  // LOGIN / LOGOUT / CSV
  // =========================================================================
  const fazerLogin = async (e) => {
    e.preventDefault(); setErroLogin('');
    try {
      const res = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: usuarioLogin, senha: senhaLogin }) });
      const data = await res.json();
      if (data.auth) {
        localStorage.setItem('nomeUsuario', usuarioLogin); setNomeUsuario(usuarioLogin);
        if (data.precisaTrocar) { setTokenTemp(data.token); setPrecisaTrocarSenha(true); }
        else {
          localStorage.setItem('tokenPainel', data.token);
          localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false');
          setToken(data.token);
          setIsAdmin(data.is_admin === true);
        }
      } else { setErroLogin(data.message); }
    } catch (err) { setErroLogin("Erro ao conectar no servidor."); }
  };

  const fazerLogout = () => {
    localStorage.removeItem('tokenPainel'); localStorage.removeItem('nomeUsuario'); localStorage.removeItem('isAdmin');
    setToken(null); setTokenTemp(null); setPrecisaTrocarSenha(false); setCarregouAPI(false); setNomeUsuario(''); setIsAdmin(false); setUsuarios([]);
  };

  const enviarNovaSenha = async (e) => {
    e.preventDefault(); setErroTrocaSenha('');
    const regexSenhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
    if (novaSenha !== confirmarSenha) return setErroTrocaSenha("As senhas não coincidem.");
    if (!regexSenhaForte.test(novaSenha)) return setErroTrocaSenha("Mínimo 12 caracteres, 1 Maiúscula, 1 Minúscula, 1 Número, 1 Especial.");
    try {
      const res = await fetch(`${API}/mudar-senha`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ novaSenha }) });
      if (res.ok) { localStorage.setItem('tokenPainel', tokenTemp); setToken(tokenTemp); setTokenTemp(null); setPrecisaTrocarSenha(false); }
      else { setErroTrocaSenha("Erro ao atualizar a senha no servidor."); }
    } catch (err) { setErroTrocaSenha("Erro de conexão."); }
  };

  const exportarCSV = () => {
    if (transacoes.length === 0) return modal.alert("Nenhum dado para exportar.", "Exportar CSV");
    let csvContent = "DataCompra,Descricao,Categoria,Valor,Tipo,Status,FormaPagamento,MesReferencia,AnoReferencia\n";
    transacoes.forEach(t => {
      let dataFormatada = new Date(t.dataCompra).toLocaleDateString('pt-BR');
      csvContent += `${dataFormatada},"${t.descricao}","${t.categoria}",${t.valorParcela},${t.tipo},${t.status},${t.formaPagamento},${t.mesReferencia},${t.anoReferencia}\n`;
    });
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", `Backup_Financeiro_${nomeUsuario}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // =========================================================================
  // CRUD SETUP
  // =========================================================================
  const salvarConfig = async (rota, dados, setState, stateAtual) => {
    try {
      const res = await fetch(`${API}/${rota}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dados) });
      if (res.ok) setState([...stateAtual, dados]);
    } catch (err) { console.error("Erro ao salvar:", err); }
  };

  const addCartao = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('cartoes', { id: Date.now().toString(), nome: fd.get('nome'), melhorDia: Number(fd.get('melhorDia')), vencimento: Number(fd.get('vencimento')) }, setCartoes, cartoes); e.target.reset(); };
  const addCategoria = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('categorias', { id: Date.now().toString(), nome: fd.get('nome'), meta: Number(fd.get('meta')), tipo: fd.get('tipo') }, setCategorias, categorias); e.target.reset(); };
  const addContaFixa = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('contas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valor')), vencimento: Number(fd.get('vencimento')) }, setContasFixas, contasFixas); e.target.reset(); };
  const addRendaFixa = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('rendas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valor')), diaRecebimento: Number(fd.get('diaRecebimento')) }, setRendasFixas, rendasFixas); e.target.reset(); };

  const gerarMesManual = async () => {
    setGerandoMes(true);
    try {
      const res = await fetch(`${API}/gerar-mes`, { method: 'POST', headers: getHeaders() });
      const data = await res.json();
      if (data.gerados.length === 0) {
        await modal.alert(`Tudo já estava gerado para ${data.mes}/${data.ano}.\nNenhum lançamento novo.`, '✅ Nenhum lançamento novo');
      } else {
        const lista = data.gerados.map(g => `• ${g.nome} (${g.tipo})`).join('\n');
        await modal.alert(`${data.gerados.length} lançamento(s) gerado(s):\n\n${lista}`, '✅ Lançamentos gerados');
        const resT = await fetch(`${API}/transacoes`, { headers: getHeaders() });
        if (resT.ok) setTransacoes(await resT.json());
      }
    } catch (err) {
      await modal.alert('Erro ao gerar lançamentos. Tente novamente.', '❌ Erro');
    } finally { setGerandoMes(false); }
  };

  const removerSetup = async (banco, id) => {
    const rotas = { cartoes: 'cartoes', categorias: 'categorias', metasRenda: 'metas-renda', contasFixas: 'contas-fixas', rendasFixas: 'rendas-fixas' };
    await fetch(`${API}/${rotas[banco]}/${id}`, { method: 'DELETE', headers: getHeaders() });
    const setters = { cartoes: [setCartoes, cartoes], categorias: [setCategorias, categorias], metasRenda: [setMetasRenda, metasRenda], contasFixas: [setContasFixas, contasFixas], rendasFixas: [setRendasFixas, rendasFixas] };
    const [setter, state] = setters[banco];
    setter(state.filter(i => i.id !== id));
  };

  // =========================================================================
  // LANÇAMENTOS
  // =========================================================================
  const addTransacao = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const d = fd.get('descricao'), v = Number(fd.get('valor')), dt = new Date(fd.get('dataCompra') + 'T00:00:00');
    let t = fd.get('tipo'), c = fd.get('categoria'), p = fd.get('formaPagamento'), parc = Number(fd.get('parcelas')) || 1, s = fd.get('status');
    if (c === 'Renda' || c === 'Renda Fixa') t = 'renda';
    if (c === 'Contas Fixas') t = 'despesa';
    const grupoId = parc > 1 ? Date.now().toString() : null;
    let novasT = [];
    if (p.startsWith('credito_')) {
      const cart = cartoes.find(card => card.id === p.split('_')[1]);
      let mI = (dt.getDate() >= cart.melhorDia) ? dt.getMonth() + 1 : dt.getMonth();
      for (let i = 0; i < parc; i++) {
        let mP = mI + i, aP = dt.getFullYear();
        if (mP > 11) { aP += Math.floor(mP / 12); mP %= 12; }
        novasT.push({ id: (Date.now() + i).toString(), descricao: parc > 1 ? `${d} (${i + 1}/${parc})` : d, categoria: c, valorParcela: v / parc, dataCompra: dt.toISOString(), tipo: t, formaPagamento: p, status: s, mesReferencia: mP + 1, anoReferencia: aP, grupo_id: grupoId });
      }
    } else {
      novasT.push({ id: Date.now().toString(), descricao: d, categoria: c, valorParcela: v, dataCompra: dt.toISOString(), tipo: t, formaPagamento: p, status: s, mesReferencia: dt.getMonth() + 1, anoReferencia: dt.getFullYear(), grupo_id: grupoId });
    }
    for (const nova of novasT) await fetch(`${API}/transacoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(nova) });
    setTransacoes([...transacoes, ...novasT]);
    e.target.reset();
  };

  const deletarTransacao = async (t) => {
    if (t.grupo_id) {
      const opcao = await modal.options(
        `"${t.descricao}" é uma compra parcelada.\nO que deseja excluir?`,
        [
          { value: '1', icon: '1️⃣', label: 'Somente esta parcela', desc: `Apenas ${t.mesReferencia}/${t.anoReferencia}` },
          { value: '2', icon: '2️⃣', label: 'Esta e todas as futuras', desc: `A partir de ${t.mesReferencia}/${t.anoReferencia}` },
          { value: '3', icon: '3️⃣', label: 'Esta e todas as anteriores', desc: `Até ${t.mesReferencia}/${t.anoReferencia}` },
          { value: '4', icon: '4️⃣', label: 'Todas as parcelas', desc: 'Remove a compra inteira' },
        ],
        '🗑️ Excluir Parcela'
      );
      if (!opcao) return;

      if (opcao === '1') {
        await fetch(`${API}/transacoes/${t.id}`, { method: 'DELETE', headers: getHeaders() });
        setTransacoes(prev => prev.filter(tr => tr.id !== t.id));
      } else if (opcao === '2') {
        await fetch(`${API}/transacoes/grupo/${t.grupo_id}?mes=${t.mesReferencia}&ano=${t.anoReferencia}&modo=futuras`, { method: 'DELETE', headers: getHeaders() });
        setTransacoes(prev => prev.filter(tr => !(tr.grupo_id === t.grupo_id && (tr.anoReferencia > t.anoReferencia || (tr.anoReferencia === t.anoReferencia && tr.mesReferencia >= t.mesReferencia)))));
      } else if (opcao === '3') {
        await fetch(`${API}/transacoes/grupo/${t.grupo_id}?mes=${t.mesReferencia}&ano=${t.anoReferencia}&modo=anteriores`, { method: 'DELETE', headers: getHeaders() });
        setTransacoes(prev => prev.filter(tr => !(tr.grupo_id === t.grupo_id && (tr.anoReferencia < t.anoReferencia || (tr.anoReferencia === t.anoReferencia && tr.mesReferencia <= t.mesReferencia)))));
      } else if (opcao === '4') {
        await fetch(`${API}/transacoes/grupo/${t.grupo_id}?modo=todas`, { method: 'DELETE', headers: getHeaders() });
        setTransacoes(prev => prev.filter(tr => tr.grupo_id !== t.grupo_id));
      }
      return;
    }

    const ok = await modal.confirm('Deseja excluir esta transação?', '🗑️ Excluir', { confirmLabel: 'Excluir', confirmColor: 'bg-red-600 hover:bg-red-700' });
    if (!ok) return;
    await fetch(`${API}/transacoes/${t.id}`, { method: 'DELETE', headers: getHeaders() });
    setTransacoes(prev => prev.filter(tr => tr.id !== t.id));
  };

  const alternarStatusTransacao = async (id, statusAtual, valor, dataCompraOriginal) => {
    const novoStatus = statusAtual === 'pago' ? 'pendente' : 'pago';
    await fetch(`${API}/transacoes/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: novoStatus, valorParcela: valor, dataCompra: dataCompraOriginal }) });
    setTransacoes(prev => prev.map(tr => tr.id === id ? { ...tr, status: novoStatus } : tr));
  };

  // =========================================================================
  // EDIÇÃO INTELIGENTE
  // =========================================================================
  const editarValor = async (t) => {
    const nV = await modal.prompt('Qual o novo valor?', String(t.valorParcela), '✏️ Editar Valor', { inputType: 'number', placeholder: '0.00', confirmLabel: 'Próximo' });
    if (nV === null) return;
    const valorAjustado = parseFloat(nV);

    const alternar = await modal.confirm(
      `Status atual: ${t.status.toUpperCase()}\nDeseja alternar para ${t.status === 'pago' ? 'PENDENTE' : 'PAGO'}?`,
      '🔄 Alterar Status?'
    );
    const novoStatus = alternar ? (t.status === 'pago' ? 'pendente' : 'pago') : t.status;
    let novaDataISO = t.dataCompra;

    if (t.tipo === 'renda') {
      const dataAtualBR = new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      const novaDataStr = await modal.prompt('Nova data de recebimento:', dataAtualBR, '📅 Alterar Data', { placeholder: 'DD/MM/AAAA', confirmLabel: 'Próximo' });
      if (novaDataStr && novaDataStr.includes('/')) {
        const partes = novaDataStr.split('/');
        if (partes.length === 3) novaDataISO = new Date(`${partes[2]}-${partes[1]}-${partes[0]}T00:00:00`).toISOString();
      }
    }

    if (t.grupo_id) {
      const cascata = await modal.confirm(
        'Esta é uma compra parcelada.\nDeseja aplicar o novo valor a todas as parcelas futuras também?',
        '📦 Editar Parcelas',
        { confirmLabel: 'Todas as futuras', cancelLabel: 'Só esta' }
      );
      if (cascata) {
        await fetch(`${API}/transacoes/grupo/${t.grupo_id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ valorParcela: valorAjustado, mes: t.mesReferencia, ano: t.anoReferencia }) });
        setTransacoes(prev => prev.map(tr =>
          (tr.grupo_id === t.grupo_id && (tr.anoReferencia > t.anoReferencia || (tr.anoReferencia === t.anoReferencia && tr.mesReferencia >= t.mesReferencia)))
            ? { ...tr, valorParcela: valorAjustado } : tr
        ));
        await fetch(`${API}/transacoes/${t.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: novoStatus, valorParcela: valorAjustado, dataCompra: novaDataISO }) });
        setTransacoes(prev => prev.map(tr => tr.id === t.id ? { ...tr, status: novoStatus, dataCompra: novaDataISO } : tr));
        return;
      }
    }

    await fetch(`${API}/transacoes/${t.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: novoStatus, valorParcela: valorAjustado, dataCompra: novaDataISO }) });
    setTransacoes(prev => prev.map(tr => tr.id === t.id ? { ...tr, valorParcela: valorAjustado, status: novoStatus, dataCompra: novaDataISO } : tr));
  };

  // =========================================================================
  // FATURAS POR CARTÃO
  // =========================================================================
  const verFaturasPorCartao = () => {
    const porCartao = {};
    transacoesMes.forEach(t => {
      if (t.formaPagamento && t.formaPagamento.startsWith('credito_')) {
        const cartaoId = t.formaPagamento.split('_')[1];
        const cartao = cartoes.find(c => c.id === cartaoId);
        const nome = cartao ? cartao.nome : 'Cartão Desconhecido';
        if (!porCartao[nome]) porCartao[nome] = { total: 0, pago: 0, pendente: 0 };
        porCartao[nome].total += Number(t.valorParcela);
        if (t.status === 'pago') porCartao[nome].pago += Number(t.valorParcela);
        else porCartao[nome].pendente += Number(t.valorParcela);
      }
    });
    const itens = Object.entries(porCartao)
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.total - a.total);

    modal.setConfig({
      type: 'faturas',
      title: `💳 Gastos no Crédito — ${nomesMeses[dataVis.mes - 1]} ${dataVis.ano}`,
      itens,
      onCancel: modal.close,
      onClose: modal.close,
    });
  };

  // =========================================================================
  // CÁLCULOS DO DASHBOARD
  // =========================================================================
  const mesAnterior = () => setDataVis(prev => prev.mes === 1 ? { mes: 12, ano: prev.ano - 1 } : { ...prev, mes: prev.mes - 1 });
  const mesProximo = () => setDataVis(prev => prev.mes === 12 ? { mes: 1, ano: prev.ano + 1 } : { ...prev, mes: prev.mes + 1 });

  const transacoesMes = transacoes.filter(t => t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano);

  const calcularSaldoAcumuladoAte = React.useCallback((mes, ano) => {
    const todasAteOMes = transacoes.filter(t => t.anoReferencia < ano || (t.anoReferencia === ano && t.mesReferencia <= mes));
    let rendaPaga = 0, gastoPago = 0;
    todasAteOMes.forEach(t => {
      const v = Number(t.valorParcela);
      if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') { if (t.status === 'pago') rendaPaga += v; }
      else { if (t.status === 'pago') gastoPago += v; }
    });
    return rendaPaga - gastoPago;
  }, [transacoes]);

  const mesAntRef = React.useMemo(() => {
    if (dataVis.mes === 1) return { mes: 12, ano: dataVis.ano - 1 };
    return { mes: dataVis.mes - 1, ano: dataVis.ano };
  }, [dataVis]);

  const saldoMesAnterior = React.useMemo(() => calcularSaldoAcumuladoAte(mesAntRef.mes, mesAntRef.ano), [calcularSaldoAcumuladoAte, mesAntRef]);

  const mudarOrdenacao = (coluna) => {
    if (ordenacao.coluna === coluna) setOrdenacao({ coluna, direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' });
    else setOrdenacao({ coluna, direcao: 'asc' });
  };

  let dadosTabela = transacoesMes.filter(t => {
    const atendeStatus = filtroStatus === 'todos' || t.status === filtroStatus;
    const atendeBusca = t.descricao.toLowerCase().includes(buscaTexto.toLowerCase());
    let atendeAvancado = true;
    if (mostrarFiltrosAvancados) {
      if (filtrosAvancados.categoria && t.categoria !== filtrosAvancados.categoria) atendeAvancado = false;
      if (filtrosAvancados.formaPagamento && !t.formaPagamento.includes(filtrosAvancados.formaPagamento)) atendeAvancado = false;
      if (filtrosAvancados.valorMin && Number(t.valorParcela) < Number(filtrosAvancados.valorMin)) atendeAvancado = false;
      if (filtrosAvancados.valorMax && Number(t.valorParcela) > Number(filtrosAvancados.valorMax)) atendeAvancado = false;
      if (filtrosAvancados.dataInicio && new Date(t.dataCompra) < new Date(filtrosAvancados.dataInicio + 'T00:00:00')) atendeAvancado = false;
      if (filtrosAvancados.dataFim && new Date(t.dataCompra) > new Date(filtrosAvancados.dataFim + 'T23:59:59')) atendeAvancado = false;
    }
    return atendeStatus && atendeBusca && atendeAvancado;
  });

  if (ordenacao.coluna) {
    dadosTabela.sort((a, b) => {
      let vA, vB;
      switch (ordenacao.coluna) {
        case 'descricao': vA = a.descricao.toLowerCase(); vB = b.descricao.toLowerCase(); break;
        case 'categoria': vA = a.categoria.toLowerCase(); vB = b.categoria.toLowerCase(); break;
        case 'data': vA = new Date(a.dataCompra).getTime(); vB = new Date(b.dataCompra).getTime(); break;
        case 'status': vA = a.status; vB = b.status; break;
        case 'pagamento': vA = a.formaPagamento; vB = b.formaPagamento; break;
        case 'valor': vA = Number(a.valorParcela); vB = Number(b.valorParcela); break;
        default: return 0;
      }
      if (vA < vB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (vA > vB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });
  }

  let totRendaTotal = 0, totRendaPaga = 0, totGastoReal = 0, totInvestido = 0, totGastoPago = 0, totFaturaCreditoAberto = 0;
  let gCat = {}; categorias.forEach(c => gCat[c.nome] = 0);
  let gastoSemCategoria = 0, gastoContasFixas = 0;

  transacoesMes.forEach(t => {
    const v = Number(t.valorParcela);
    if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') { totRendaTotal += v; if (t.status === 'pago') totRendaPaga += v; }
    else {
      if (t.tipo === 'despesa') totGastoReal += v;
      if (t.tipo === 'investimento') totInvestido += v;
      if (t.status === 'pago') totGastoPago += v;
      if (t.formaPagamento && t.formaPagamento.startsWith('credito_') && t.status === 'pendente') totFaturaCreditoAberto += v;
      if (t.categoria === 'Contas Fixas') gastoContasFixas += v;
      else if (t.categoria === 'Sem Categoria') gastoSemCategoria += v;
      else if (gCat[t.categoria] !== undefined) gCat[t.categoria] += v;
    }
  });

  let custoPrevisto = gastoSemCategoria + gastoContasFixas;
  categorias.forEach(c => custoPrevisto += Math.max(c.meta, gCat[c.nome] || 0));
  const saldoMesAtual = totRendaPaga - totGastoPago;
  const saldoAtual = saldoMesAtual + (somarSaldoAnterior ? saldoMesAnterior : 0);
  const previstoFimMes = totRendaTotal - custoPrevisto;

  // =========================================================================
  // FUNÇÕES DE ADMIN
  // =========================================================================
  const carregarUsuarios = async () => {
    const res = await fetch(`${API}/admin/usuarios`, { headers: getHeaders() });
    if (res.ok) setUsuarios(await res.json());
  };

  const criarUsuario = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const usuario = fd.get('usuario');
    const is_admin = fd.get('is_admin') === 'on';
    const res = await fetch(`${API}/admin/usuarios`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ usuario, is_admin }) });
    const data = await res.json();
    if (res.ok) { await modal.alert(data.message, '✅ Usuário criado'); e.target.reset(); carregarUsuarios(); }
    else await modal.alert(data.message, '❌ Erro');
  };

  const deletarUsuario = async (id, nome) => {
    const ok = await modal.confirm(`Deletar o usuário "${nome}" e todos os seus dados?\n\nEsta ação não pode ser desfeita.`, '🗑️ Deletar Usuário', { confirmLabel: 'Deletar', confirmColor: 'bg-red-600 hover:bg-red-700' });
    if (!ok) return;
    const res = await fetch(`${API}/admin/usuarios/${id}`, { method: 'DELETE', headers: getHeaders() });
    const data = await res.json();
    if (res.ok) { await modal.alert(data.message, '✅ Deletado'); carregarUsuarios(); }
    else await modal.alert(data.message, '❌ Erro');
  };

  const resetarSenha = async (id, nome) => {
    const ok = await modal.confirm(`Resetar a senha de "${nome}" para 'admin123'?\n\nEle será obrigado a trocar no próximo login.`, '🔑 Resetar Senha', { confirmLabel: 'Resetar' });
    if (!ok) return;
    const res = await fetch(`${API}/admin/usuarios/${id}/resetar-senha`, { method: 'POST', headers: getHeaders() });
    const data = await res.json();
    await modal.alert(data.message, res.ok ? '✅ Senha resetada' : '❌ Erro');
  };

  const toggleAdmin = async (id, nomeU, atualIsAdmin) => {
    const acao = atualIsAdmin ? 'remover o Super Admin' : 'promover a Super Admin';
    const ok = await modal.confirm(`Deseja ${acao} o usuário "${nomeU}"?`, '⭐ Alterar Permissão', { confirmLabel: atualIsAdmin ? 'Remover Admin' : 'Tornar Admin' });
    if (!ok) return;
    const res = await fetch(`${API}/admin/usuarios/${id}/toggle-admin`, { method: 'PUT', headers: getHeaders() });
    const data = await res.json();
    if (res.ok) carregarUsuarios();
    else await modal.alert(data.message, '❌ Erro');
  };

  // =========================================================================
  // TELAS
  // =========================================================================
  if (!token && !precisaTrocarSenha) {
    return <Login fazerLogin={fazerLogin} usuarioLogin={usuarioLogin} setUsuarioLogin={setUsuarioLogin} senhaLogin={senhaLogin} setSenhaLogin={setSenhaLogin} erroLogin={erroLogin} modalConfig={modal.config} modalClose={modal.close} ModalComponent={Modal} />;
  }

  if (precisaTrocarSenha) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-6"><h1 className="text-xl font-bold text-slate-800">Crie sua Senha Definitiva</h1><p className="text-sm text-slate-500 mt-2">Por segurança, não é permitido manter a senha padrão.</p></div>
          <form onSubmit={enviarNovaSenha} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label><input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required className="w-full border p-2.5 rounded-lg outline-none focus:border-emerald-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Confirme a Nova Senha</label><input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} required className="w-full border p-2.5 rounded-lg outline-none focus:border-emerald-500" /></div>
            {erroTrocaSenha && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded">{erroTrocaSenha}</p>}
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors">Salvar e Acessar Painel</button>
            <button type="button" onClick={fazerLogout} className="w-full mt-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">Cancelar e Sair</button>
          </form>
        </div>
      </div>
    );
  }

  if (telaAtiva === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
        <Modal config={modal.config} onClose={modal.close} />
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="border-b border-slate-200 pb-4 flex justify-between items-center">
            <div><h1 className="text-2xl font-bold text-slate-900">👥 Gerenciamento de Usuários</h1><p className="text-sm text-slate-500 mt-1">Super Admin — acesso restrito</p></div>
            <button onClick={() => setTelaAtiva('dashboard')} className="bg-slate-900 text-white font-medium py-2 px-6 rounded-lg hover:bg-slate-800">Voltar</button>
          </header>
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-bold uppercase text-slate-600 mb-4">Criar Novo Usuário</h2>
            <form onSubmit={criarUsuario} className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1"><label className="block text-xs font-medium text-slate-600 mb-1">Nome de usuário</label><input name="usuario" placeholder="Ex: joao" required className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
              <div className="flex items-center gap-2 pb-2.5"><input type="checkbox" name="is_admin" id="is_admin_check" className="w-4 h-4" /><label htmlFor="is_admin_check" className="text-sm text-slate-600">Super Admin?</label></div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors">Criar Usuário</button>
            </form>
            <p className="text-xs text-slate-400 mt-2">A senha padrão será <strong>admin123</strong>. O usuário será obrigado a trocar no primeiro acesso.</p>
          </section>
          <section className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase text-slate-600">Usuários Cadastrados</h2>
              <button onClick={carregarUsuarios} className="text-xs text-blue-600 hover:underline font-medium">🔄 Atualizar lista</button>
            </div>
            {usuarios.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm"><p>Clique em "Atualizar lista" para carregar os usuários.</p></div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b text-xs uppercase text-slate-500 font-semibold">
                  <tr><th className="p-4">Usuário</th><th className="p-4">Permissão</th><th className="p-4">Status Senha</th><th className="p-4 text-center">Ações</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{u.usuario}</td>
                      <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded ${u.is_admin === 1 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{u.is_admin === 1 ? '⭐ Super Admin' : 'Usuário'}</span></td>
                      <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded ${u.precisa_trocar === 1 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{u.precisa_trocar === 1 ? '⚠ Senha Padrão' : '✔ Senha Própria'}</span></td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => toggleAdmin(u.id, u.usuario, u.is_admin === 1)} className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded font-medium">{u.is_admin === 1 ? '⭐ Remover Admin' : '⭐ Tornar Admin'}</button>
                          <button onClick={() => resetarSenha(u.id, u.usuario)} className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded font-medium">🔑 Resetar Senha</button>
                          <button onClick={() => deletarUsuario(u.id, u.usuario)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2 py-1 rounded font-medium">🗑️ Deletar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    );
  }

  if (telaAtiva === 'setup') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
        <Modal config={modal.config} onClose={modal.close} />
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

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-8 text-slate-800 overflow-x-hidden">
      <Modal config={modal.config} onClose={modal.close} />
      <div className="mx-auto max-w-6xl space-y-4 md:space-y-6">

        <header className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
          <div><h1 className="text-xl md:text-2xl font-bold text-slate-900">Painel Financeiro</h1><p className="text-xs md:text-sm text-slate-500 font-medium capitalize">Olá, {nomeUsuario}! 👋</p></div>
          <div className="flex items-center gap-2 md:gap-4 mt-4 md:mt-0 bg-slate-50 px-4 py-2 rounded-lg border">
            <button onClick={mesAnterior} className="text-slate-400 hover:text-slate-700 text-lg md:text-xl font-bold">◀</button>
            <span className="font-semibold text-slate-700 uppercase min-w-24 md:min-w-30 text-center text-xs md:text-base">{nomesMeses[dataVis.mes - 1]} {dataVis.ano}</span>
            <button onClick={mesProximo} className="text-slate-400 hover:text-slate-700 text-lg md:text-xl font-bold">▶</button>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto">
            {isAdmin && (<button onClick={() => { setTelaAtiva('admin'); carregarUsuarios(); }} className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-xs md:text-sm font-medium border border-purple-200 transition-colors flex-1 md:flex-none">👥 Usuários</button>)}
            <button onClick={() => setTelaAtiva('setup')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs md:text-sm font-medium border transition-colors flex-1 md:flex-none">⚙ Config</button>
            <button onClick={fazerLogout} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-xs md:text-sm font-medium border border-red-100 transition-colors flex-1 md:flex-none">Sair</button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4">
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-emerald-500"><h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Rendas</h3><p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(totRendaPaga)}</p></div>
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-red-500"><h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Gastos</h3><p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(totGastoReal)}</p></div>
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-blue-500"><h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Investimentos</h3><p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(totInvestido)}</p></div>
          <div onClick={verFaturasPorCartao} className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-purple-500 cursor-pointer hover:bg-purple-50 transition-colors">
            <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Faturas Abertas</h3>
            <p className="text-sm md:text-lg font-bold text-purple-700 mt-1">{formatarMoeda(totFaturaCreditoAberto)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Clique para ver por cartão</p>
          </div>
          <div className={`p-3 md:p-4 rounded-xl shadow-sm border-l-4 transition-colors ${saldoMesAnterior >= 0 ? 'bg-teal-50 border-teal-500' : 'bg-rose-50 border-rose-400'}`}>
            <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Saldo Mês Anterior</h3>
            <p className={`text-sm md:text-lg font-bold mt-1 ${saldoMesAnterior >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>{formatarMoeda(saldoMesAnterior)}</p>
            <p className="text-[9px] text-slate-400 mb-2">{nomesMeses[mesAntRef.mes - 1]} {mesAntRef.ano}</p>
            <button onClick={() => setSomarSaldoAnterior(v => !v)} className={`w-full text-[9px] md:text-[10px] font-bold py-1 px-2 rounded transition-colors border ${somarSaldoAnterior ? 'bg-teal-500 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
              {somarSaldoAnterior ? '✔ Somando ao Saldo' : '+ Somar ao Saldo'}
            </button>
          </div>
          <div className="bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-slate-400">
            <h3 className="text-[10px] md:text-xs font-semibold text-slate-300 uppercase">Saldo em Conta</h3>
            <p className="text-sm md:text-lg font-bold text-white mt-1">{formatarMoeda(saldoAtual)}</p>
            {somarSaldoAnterior ? <p className="text-[9px] text-slate-400 mt-0.5">Mês: {formatarMoeda(saldoMesAtual)} + Ant.: {formatarMoeda(saldoMesAnterior)}</p> : <p className="text-[9px] text-slate-500 mt-0.5">Apenas mês atual</p>}
          </div>
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 border-amber-500"><h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Previsão Fim Mês</h3><p className="text-sm md:text-lg font-bold mt-1">{formatarMoeda(previstoFimMes)}</p></div>
        </div>

        {categorias.length > 0 && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
            <h2 className="text-xs md:text-sm font-bold text-slate-600 uppercase mb-4">Progresso das Metas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {categorias.map(c => {
                const gas = gCat[c.nome] || 0; let por = Math.min((gas / c.meta) * 100, 100);
                let corBarra = 'bg-emerald-500';
                if (c.tipo === 'despesa') { if (por >= 90) corBarra = 'bg-red-500'; else if (por >= 70) corBarra = 'bg-amber-400'; } else { corBarra = 'bg-blue-500'; }
                return (
                  <div key={c.id} className="border p-3 md:p-4 rounded-lg bg-slate-50">
                    <h4 className="text-xs md:text-sm font-medium mb-2 truncate" title={c.nome}>{c.nome}</h4>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden"><div className={`${corBarra} h-1.5 rounded-full transition-all duration-700 ease-out`} style={{ width: `${por}%` }}></div></div>
                    <div className="flex justify-between text-[10px] md:text-xs text-slate-500 font-medium"><span>{formatarMoeda(gas)}</span><span>{formatarMoeda(c.meta)}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border lg:col-span-1 h-fit">
            <h2 className="text-xs md:text-sm font-bold text-slate-600 uppercase mb-4">Novo Lançamento</h2>
            <form onSubmit={addTransacao} className="space-y-3 md:space-y-4">
              <input name="descricao" placeholder="Descrição" required className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500" />
              <input name="valor" type="number" step="0.01" placeholder="Valor (R$)" required className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500" />
              <input name="dataCompra" type="date" required className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm text-slate-600 outline-none focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-2">
                <select name="tipo" required className="border p-2 md:p-2.5 rounded-lg text-xs md:text-sm bg-white outline-none focus:border-blue-500"><option value="despesa">Despesa</option><option value="renda">Renda</option><option value="investimento">Invest. / Meta</option></select>
                <select name="status" className="border p-2 md:p-2.5 rounded-lg text-xs md:text-sm bg-white outline-none focus:border-blue-500"><option value="pendente">Pendente</option><option value="pago">Pago</option></select>
              </div>
              <select name="categoria" required className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm bg-white outline-none focus:border-blue-500"><option value="Sem Categoria">Sem Categoria</option><option value="Contas Fixas">Contas Fixas</option><option value="Renda Fixa">Renda Fixa</option><option value="Renda">Renda Variável</option>{categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select>
              <select name="formaPagamento" required className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm bg-white outline-none focus:border-blue-500"><option value="pix">PIX / Dinheiro</option><option value="debito">Débito</option>{cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito - {c.nome}</option>)}</select>
              <input name="parcelas" type="number" min="1" placeholder="Qtd. Parcelas (Apenas Crédito)" className="w-full border p-2 md:p-2.5 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500" />
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 md:py-3 rounded-lg text-xs md:text-sm transition-colors shadow-sm">Adicionar</button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border lg:col-span-2 flex flex-col overflow-hidden w-full">
            <div className="p-3 md:p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 bg-slate-50 rounded-t-xl">
              <div className="flex bg-white rounded-lg border p-1 w-full md:w-auto">
                <button onClick={() => setFiltroStatus('todos')} className={`px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md flex-1 ${filtroStatus === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Todos</button>
                <button onClick={() => setFiltroStatus('pendente')} className={`px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md flex-1 ${filtroStatus === 'pendente' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100'}`}>Pendentes</button>
                <button onClick={() => setFiltroStatus('pago')} className={`px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md flex-1 ${filtroStatus === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>Pagos</button>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <input type="text" placeholder="🔍 Buscar..." value={buscaTexto} onChange={(e) => setBuscaTexto(e.target.value)} className="w-full md:w-48 lg:w-64 border border-slate-300 p-1.5 md:p-2 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500" />
                <button onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)} className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg border text-[10px] md:text-sm font-bold transition-colors ${mostrarFiltrosAvancados ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  Filtros {mostrarFiltrosAvancados ? '▲' : '▼'}
                </button>
              </div>
            </div>

            {mostrarFiltrosAvancados && (
              <div className="p-3 md:p-4 border-b bg-blue-50/50 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1">Período de Data</label>
                  <div className="flex gap-2">
                    <input type="date" value={filtrosAvancados.dataInicio} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataInicio: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                    <input type="date" value={filtrosAvancados.dataFim} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, dataFim: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1">Faixa de Valor (R$)</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Mín." value={filtrosAvancados.valorMin} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMin: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                    <input type="number" placeholder="Máx." value={filtrosAvancados.valorMax} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, valorMax: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1">Pagamento e Categoria</label>
                  <div className="flex gap-2">
                    <select value={filtrosAvancados.formaPagamento} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, formaPagamento: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs bg-white">
                      <option value="">Qualquer</option><option value="pix">PIX/Dinheiro</option><option value="debito">Débito</option><option value="credito">Crédito</option>
                    </select>
                    <select value={filtrosAvancados.categoria} onChange={e => setFiltrosAvancados({ ...filtrosAvancados, categoria: e.target.value })} className="w-full border p-1 md:p-1.5 rounded text-[10px] md:text-xs bg-white">
                      <option value="">Qualquer</option>
                      {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button onClick={() => setFiltrosAvancados({ dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: '' })} className="text-[10px] md:text-xs text-red-500 hover:underline font-bold">Limpar Filtros</button>
                </div>
              </div>
            )}

            <div className="w-full">
              <table className="w-full text-left text-[9px] sm:text-[10px] md:text-sm text-slate-600 table-fixed">
                <thead className="bg-white text-[8px] sm:text-[9px] md:text-xs uppercase font-semibold border-b select-none">
                  <tr>
                    <th className="p-1 sm:p-2 md:p-4 w-[28%] cursor-pointer hover:bg-slate-50" onClick={() => mudarOrdenacao('descricao')}>Desc. {ordenacao.coluna === 'descricao' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-1 sm:p-2 md:p-4 w-[15%] cursor-pointer hover:bg-slate-50" onClick={() => mudarOrdenacao('categoria')}>Categ. {ordenacao.coluna === 'categoria' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-1 sm:p-2 md:p-4 w-[13%] cursor-pointer hover:bg-slate-50" onClick={() => mudarOrdenacao('data')}>Data {ordenacao.coluna === 'data' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-1 sm:p-2 md:p-4 w-[11%] cursor-pointer hover:bg-slate-50" onClick={() => mudarOrdenacao('status')}>Status {ordenacao.coluna === 'status' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-1 sm:p-2 md:p-4 w-[11%] cursor-pointer hover:bg-slate-50" onClick={() => mudarOrdenacao('pagamento')}>Pgto. {ordenacao.coluna === 'pagamento' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-1 sm:p-2 md:p-4 w-[14%] cursor-pointer hover:bg-slate-50 text-right" onClick={() => mudarOrdenacao('valor')}>Valor {ordenacao.coluna === 'valor' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-1 sm:p-2 md:p-4 w-[8%] text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dadosTabela.length === 0 && (<tr><td colSpan="7" className="p-4 md:p-8 text-center text-slate-400 font-medium text-xs">Nenhum lançamento encontrado.</td></tr>)}
                  {dadosTabela.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-1 sm:p-2 md:p-4 font-bold text-slate-800 break-words leading-tight">
                        {t.descricao}
                        {t.grupo_id && <span className="ml-1 text-[7px] text-blue-400 font-normal" title="Compra parcelada">🔗</span>}
                      </td>
                      <td className="p-1 sm:p-2 md:p-4"><span className="text-[7px] sm:text-[9px] md:text-xs bg-slate-100 px-1 py-0.5 md:px-2 md:py-1 rounded block truncate w-full" title={t.categoria}>{t.categoria}</span></td>
                      <td className="p-1 sm:p-2 md:p-4"><span className="text-[8px] md:text-xs text-slate-400 font-medium break-words">{new Date(t.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span></td>
                      <td className="p-1 sm:p-2 md:p-4">
                        <button onClick={() => alternarStatusTransacao(t.id, t.status, t.valorParcela, t.dataCompra)} className={`px-1 py-0.5 md:px-2 md:py-1 rounded text-[7px] md:text-[10px] font-bold uppercase transition-transform hover:scale-105 w-full truncate ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</button>
                      </td>
                      <td className="p-1 sm:p-2 md:p-4"><span className="text-[7px] md:text-[10px] uppercase text-slate-500 font-bold bg-slate-100 border px-1 py-0.5 md:px-2 md:py-1 rounded block w-full truncate text-center">{t.formaPagamento ? t.formaPagamento.split('_')[0] : 'PIX'}</span></td>
                      <td className="p-1 sm:p-2 md:p-4 font-bold text-slate-800 text-right text-[9px] md:text-sm break-words">{formatarMoeda(t.valorParcela)}</td>
                      <td className="p-1 sm:p-2 md:p-4">
                        <div className="flex flex-col lg:flex-row justify-center items-center gap-1">
                          <button onClick={() => editarValor(t)} className="bg-white border text-slate-500 hover:bg-slate-100 px-1.5 py-1 md:px-2 md:py-1 rounded text-[8px] md:text-xs transition-colors w-full md:w-auto">✏️</button>
                          <button onClick={() => deletarTransacao(t)} className="bg-red-50 text-red-500 hover:bg-red-100 px-1.5 py-1 md:px-2 md:py-1 rounded text-[8px] md:text-xs transition-colors w-full md:w-auto">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;