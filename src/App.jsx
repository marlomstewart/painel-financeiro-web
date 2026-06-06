import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from './components/Modal';
import { Login } from './components/Login';
import { TrocaSenha } from './components/TrocaSenha';
import { Admin } from './components/Admin';
import { Setup } from './components/Setup';
import { Dashboard } from './components/Dashboard';

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

    // Captura o KM se ele existir no formulário
    const kmMoto = fd.get('kmMoto') ? Number(fd.get('kmMoto')) : null;

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
        // Adicionado o kmMoto no envio
        novasT.push({ id: (Date.now() + i).toString(), descricao: parc > 1 ? `${d} (${i + 1}/${parc})` : d, categoria: c, valorParcela: v / parc, dataCompra: dt.toISOString(), tipo: t, formaPagamento: p, status: s, mesReferencia: mP + 1, anoReferencia: aP, grupo_id: grupoId, kmMoto });
      }
    } else {
      // Adicionado o kmMoto no envio
      novasT.push({ id: Date.now().toString(), descricao: d, categoria: c, valorParcela: v, dataCompra: dt.toISOString(), tipo: t, formaPagamento: p, status: s, mesReferencia: dt.getMonth() + 1, anoReferencia: dt.getFullYear(), grupo_id: grupoId, kmMoto });
    }

    for (const nova of novasT) await fetch(`${API}/transacoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(nova) });
    setTransacoes([...transacoes, ...novasT]);
    e.target.reset();
  };

  // =========================================================================
  // AÇÕES EM MASSA (BULK EDIT)
  // =========================================================================
  const executarAcaoEmMassa = async (acao, ids) => {
    const confirmacao = await modal.confirm(
      `Tem certeza que deseja ${acao === 'excluir' ? 'excluir' : `marcar como ${acao.toUpperCase()}`} ${ids.length} lançamento(s)?`,
      '⚠️ Ação em Massa'
    );
    if (!confirmacao) return false;

    try {
      // Faz todas as requisições ao servidor de uma vez só em paralelo
      const promessas = ids.map(id => {
        if (acao === 'excluir') {
          return fetch(`${API}/transacoes/${id}`, { method: 'DELETE', headers: getHeaders() });
        } else {
          const t = transacoes.find(tr => tr.id === id);
          return fetch(`${API}/transacoes/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: acao, valorParcela: t.valorParcela }) });
        }
      });

      await Promise.all(promessas);

      // Atualiza o visual da tabela na hora
      if (acao === 'excluir') {
        setTransacoes(prev => prev.filter(tr => !ids.includes(tr.id)));
      } else {
        setTransacoes(prev => prev.map(tr => ids.includes(tr.id) ? { ...tr, status: acao } : tr));
      }
      return true; // Sucesso
    } catch (err) {
      modal.alert('Ocorreu um erro de conexão ao tentar processar as alterações.', '❌ Erro');
      return false;
    }
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

  const alternarStatusTransacao = async (id, statusAtual, valorParcela, dataCompra) => {
    // Abre o modal de opções com os dois botões explícitos
    const opcaoEscolhida = await modal.options(
      `Status atual: ${statusAtual.toUpperCase()}\n\nEscolha o status correto para este lançamento:`,
      [
        { value: 'pago', icon: '✔', label: 'Marcar como PAGO' },
        { value: 'pendente', icon: '⏳', label: 'Marcar como PENDENTE' }
      ],
      '🔄 Alterar Status'
    );

    // Se o usuário clicar fora (cancelar) ou escolher o mesmo status que já estava
    if (!opcaoEscolhida || opcaoEscolhida === statusAtual) return;

    try {
      await fetch(`${API}/transacoes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: opcaoEscolhida, valorParcela, dataCompra })
      });

      // Atualiza a tela instantaneamente
      setTransacoes(prev => prev.map(t => t.id === id ? { ...t, status: opcaoEscolhida } : t));
    } catch (err) {
      modal.alert('Erro de conexão ao tentar alterar o status.', '❌ Erro');
    }
  };

  // =========================================================================
  // EDIÇÃO INTELIGENTE
  // =========================================================================
  const editarValor = async (t) => {
    // 1️⃣ Pede o Novo Valor usando o seu Modal customizado
    const nV = await modal.prompt(
      `Editando: ${t.descricao}\n\n1️⃣ Qual o novo VALOR?`,
      String(t.valorParcela),
      '✏️ Editar Valor',
      { inputType: 'number', placeholder: '0.00', confirmLabel: 'Próximo' }
    );
    if (nV === null) return; // Se clicar em cancelar, aborta
    const novoValor = Number(String(nV).replace(',', '.'));
    if (isNaN(novoValor)) return modal.alert('Valor inválido digitado.', '❌ Erro');

    // Prepara a data antiga no formato DD/MM/AAAA para exibir na tela
    const dataString = String(t.dataCompra).split('T')[0];
    const [ano, mes, dia] = dataString.split('-');
    const dataFormatadaBR = `${dia}/${mes}/${ano}`;

    // 2️⃣ Pede a Nova Data (Formato Brasileiro)
    const nD = await modal.prompt(
      `2️⃣ Qual a nova DATA?\n(Formato: DD/MM/AAAA)`,
      dataFormatadaBR,
      '📅 Editar Data',
      { confirmLabel: 'Próximo' }
    );
    if (nD === null) return;

    // Converte de volta para YYYY-MM-DD para o banco de dados não quebrar
    const partesData = nD.split('/');
    if (partesData.length !== 3) return modal.alert('Formato de data inválido. Use DD/MM/AAAA.', '❌ Erro');
    const novaDataStr = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

    // 3️⃣ Pergunta o Status final usando os botões personalizados
    const nS = await modal.options(
      `3️⃣ Qual o status atualizado deste lançamento?\n\nStatus atual: ${t.status.toUpperCase()}`,
      [
        { value: 'pago', icon: '✔', label: 'Marcar como PAGO' },
        { value: 'pendente', icon: '⏳', label: 'Marcar como PENDENTE' }
      ],
      '🔄 Editar Status'
    );
    if (!nS) return; // Se fechar o modal, cancela a edição

    // 4️⃣ Salva tudo no banco de dados e atualiza a tela
    try {
      await fetch(`${API}/transacoes/${t.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: nS, valorParcela: novoValor, dataCompra: novaDataStr })
      });

      setTransacoes(prev => prev.map(tr => tr.id === t.id ? { ...tr, valorParcela: novoValor, dataCompra: novaDataStr, status: nS } : tr));
    } catch (err) {
      modal.alert('Ocorreu um erro ao atualizar os dados.', '❌ Erro');
    }
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

  // =========================================================================
  // METAS DINÂMICAS (Gasolina)
  // =========================================================================
  const calcularMetaGasolina = (mes, ano) => {
    let diasDeAbastecimento = 0;
    const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
    for (let dia = 1; dia <= ultimoDiaDoMes; dia++) {
      const dataAtual = new Date(ano, mes - 1, dia);
      const diaDaSemana = dataAtual.getDay();
      if (diaDaSemana === 1 || diaDaSemana === 3 || diaDaSemana === 5) {
        diasDeAbastecimento++;
      }
    }
    return diasDeAbastecimento * 23;
  };

  const categoriasDinamicas = categorias.map(c => {
    if (c.nome === 'Gasolina' && nomeUsuario.toLowerCase() === 'stewart') {
      return { ...c, meta: calcularMetaGasolina(dataVis.mes, dataVis.ano) };
    }
    return c;
  });

  let custoPrevisto = gastoSemCategoria + gastoContasFixas;
  categoriasDinamicas.forEach(c => custoPrevisto += Math.max(c.meta, gCat[c.nome] || 0));
  const saldoMesAtual = totRendaPaga - totGastoPago;
  const saldoAtual = saldoMesAtual + (somarSaldoAnterior ? saldoMesAnterior : 0);
  const previstoFimMes = totRendaTotal - custoPrevisto + (somarSaldoAnterior ? saldoMesAnterior : 0);

  // =========================================================================
  // MÓDULO AUTOMOTIVO (Moto Biz 125) - Apenas para 'stewart'
  // =========================================================================
  let alertaMoto = null;
  if (nomeUsuario.toLowerCase() === 'stewart') {
    const transacoesComKm = transacoes.filter(t => t.kmMoto).sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));

    if (transacoesComKm.length > 0) {
      const kmAtual = Number(transacoesComKm[0].kmMoto);
      const ultimaTroca = transacoesComKm.find(t => t.categoria === 'Manutenção da moto' && t.descricao.toLowerCase().includes('leo'));
      const kmUltimaTroca = ultimaTroca ? Number(ultimaTroca.kmMoto) : kmAtual;

      const kmRodados = kmAtual - kmUltimaTroca;
      const limiteTrocaOleo = 1000;
      const kmFaltantes = limiteTrocaOleo - kmRodados;

      alertaMoto = {
        kmAtual,
        kmFaltantes,
        alertaCritico: kmFaltantes <= 150
      };
    }
  }

// =========================================================================
  // INTELIGÊNCIA PREDITIVA E RAIO-X DE CATEGORIA
  // =========================================================================
  const abrirDetalhesCategoria = (nomeCategoria, valorGasto, valorMeta) => {
    console.log(`🔍 Iniciando Raio-X para: ${nomeCategoria}`);

    // 1. Filtra as transações (Removida a trava do 'despesa' para evitar erros de maiúscula)
    const transacoesMes = transacoes.filter(t => 
      t.categoria === nomeCategoria && 
      t.mesReferencia === dataVis.mes && 
      t.anoReferencia === dataVis.ano
    );

    console.log(`📦 Transações encontradas para o cálculo: ${transacoesMes.length}`);

    if (transacoesMes.length === 0) {
      console.warn("⚠️ Nenhuma transação encontrada! Abortando Raio-X.");
      return;
    }

    // 2. Cálculos Básicos
    const qtdLancamentos = transacoesMes.length;
    const mediaGasto = valorGasto / qtdLancamentos;
    
    // 3. Encontra Maior e Menor Gasto
    const maiorGasto = transacoesMes.reduce((max, t) => t.valorParcela > max.valorParcela ? t : max, transacoesMes[0]);
    const menorGasto = transacoesMes.reduce((min, t) => t.valorParcela < min.valorParcela ? t : min, transacoesMes[0]);

    // 4. Inteligência Preditiva (Projeção de Fim de Mês)
    const dataAtual = new Date();
    const diasNoMes = new Date(dataVis.ano, dataVis.mes, 0).getDate();
    
    let previsaoFimMes = valorGasto;
    let analiseIA = "";

    if (dataVis.mes === dataAtual.getMonth() + 1 && dataVis.ano === dataAtual.getFullYear()) {
      const diaHoje = dataAtual.getDate();
      previsaoFimMes = (valorGasto / diaHoje) * diasNoMes;

      if (previsaoFimMes > valorMeta) {
        analiseIA = `⚠️ Cuidado! No ritmo atual de gastos, você deve fechar o mês em ${formatarMoeda(previsaoFimMes)}, estourando a meta em ${formatarMoeda(previsaoFimMes - valorMeta)}.`;
      } else {
        analiseIA = `✅ Ritmo excelente! A previsão é fechar o mês em ${formatarMoeda(previsaoFimMes)}, economizando ${formatarMoeda(valorMeta - previsaoFimMes)}.`;
      }
    } else {
      analiseIA = "Análise preditiva disponível apenas para o mês atual.";
    }

    // 5. Monta a tela do Modal
    const conteudoModal = (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3 rounded-lg border">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Gasto Atual vs Meta</p>
            <p className="text-lg font-bold text-slate-800">{formatarMoeda(valorGasto)} <span className="text-xs text-slate-400 font-normal">/ {formatarMoeda(valorMeta)}</span></p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Média por Lançamento</p>
            <p className="text-lg font-bold text-slate-800">{formatarMoeda(mediaGasto)} <span className="text-xs text-slate-400 font-normal">em {qtdLancamentos}x</span></p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1">🤖 Previsão Inteligente</p>
          <p className="text-sm text-blue-900 font-medium">{analiseIA}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
            <p className="text-[10px] uppercase text-rose-600 font-bold mb-1">Maior Gasto</p>
            <p className="text-sm font-bold text-rose-700">{formatarMoeda(maiorGasto.valorParcela)}</p>
            <p className="text-[9px] text-rose-500 mt-1 truncate" title={maiorGasto.descricao}>{new Date(maiorGasto.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {maiorGasto.descricao}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <p className="text-[10px] uppercase text-emerald-600 font-bold mb-1">Menor Gasto</p>
            <p className="text-sm font-bold text-emerald-700">{formatarMoeda(menorGasto.valorParcela)}</p>
            <p className="text-[9px] text-emerald-500 mt-1 truncate" title={menorGasto.descricao}>{new Date(menorGasto.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {menorGasto.descricao}</p>
          </div>
        </div>
      </div>
    );

    console.log("🚀 Tentando exibir a interface do modal...");
    
    // 6. Tenta abrir o Modal adaptando-se ao seu projeto
    try {
        if (typeof modal !== 'undefined' && modal.show) {
            // Se você usar o hook 'modal'
            modal.show({ titulo: `Raio-X: ${nomeCategoria}`, conteudo: conteudoModal, tamanho: 'max-w-md' });
        } else if (typeof setModal === 'function') {
            // Se você usar o estado 'setModal'
            setModal({ isOpen: true, config: { titulo: `Raio-X: ${nomeCategoria}`, conteudo: conteudoModal, tamanho: 'max-w-md' } });
        } else {
            console.error("❌ O formato do seu Modal é diferente. Por favor, mostre como você costuma usar o Modal no App.jsx.");
        }
    } catch (erro) {
        console.error("❌ Erro grave ao abrir o modal:", erro);
    }
  };

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
    return <TrocaSenha enviarNovaSenha={enviarNovaSenha} novaSenha={novaSenha} setNovaSenha={setNovaSenha} confirmarSenha={confirmarSenha} setConfirmarSenha={setConfirmarSenha} erroTrocaSenha={erroTrocaSenha} fazerLogout={fazerLogout} />;
  }

  if (telaAtiva === 'admin') {
    return <Admin ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} criarUsuario={criarUsuario} carregarUsuarios={carregarUsuarios} usuarios={usuarios} toggleAdmin={toggleAdmin} resetarSenha={resetarSenha} deletarUsuario={deletarUsuario} />;
  }

  if (telaAtiva === 'setup') {
    return <Setup ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} gerarMesManual={gerarMesManual} gerandoMes={gerandoMes} exportarCSV={exportarCSV} setTelaAtiva={setTelaAtiva} addCartao={addCartao} cartoes={cartoes} removerSetup={removerSetup} addCategoria={addCategoria} categorias={categorias} addContaFixa={addContaFixa} contasFixas={contasFixas} addRendaFixa={addRendaFixa} rendasFixas={rendasFixas} />;
  }

  return (
    <Dashboard
      nomeUsuario={nomeUsuario} alertaMoto={alertaMoto} abrirDetalhesCategoria={abrirDetalhesCategoria} dataVis={dataVis} mesAnterior={mesAnterior} mesProximo={mesProximo}
      isAdmin={isAdmin} setTelaAtiva={setTelaAtiva} carregarUsuarios={carregarUsuarios} fazerLogout={fazerLogout}
      totRendaPaga={totRendaPaga} totGastoReal={totGastoReal} totInvestido={totInvestido}
      verFaturasPorCartao={verFaturasPorCartao} totFaturaCreditoAberto={totFaturaCreditoAberto}
      saldoMesAnterior={saldoMesAnterior} somarSaldoAnterior={somarSaldoAnterior} setSomarSaldoAnterior={setSomarSaldoAnterior}
      saldoAtual={saldoAtual} saldoMesAtual={saldoMesAtual} mesAntRef={mesAntRef} previstoFimMes={previstoFimMes}
      categorias={categoriasDinamicas} gCat={gCat} addTransacao={addTransacao} cartoes={cartoes}
      filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus} buscaTexto={buscaTexto} setBuscaTexto={setBuscaTexto}
      mostrarFiltrosAvancados={mostrarFiltrosAvancados} setMostrarFiltrosAvancados={setMostrarFiltrosAvancados}
      filtrosAvancados={filtrosAvancados} setFiltrosAvancados={setFiltrosAvancados}
      mudarOrdenacao={mudarOrdenacao} ordenacao={ordenacao} dadosTabela={dadosTabela}
      alternarStatusTransacao={alternarStatusTransacao} editarValor={editarValor} deletarTransacao={deletarTransacao}
      ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} executarAcaoEmMassa={executarAcaoEmMassa}
    />
  );
}

export default App;