import React, { useState, useEffect } from 'react';

const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function App() {
  // =========================================================================
  // ESTADOS DO SISTEMA E SEGURANÇA
  // =========================================================================
  const [token, setToken] = useState(localStorage.getItem('tokenPainel') || null);
  const [tokenTemp, setTokenTemp] = useState(null);
  const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem('nomeUsuario') || '');
  
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroTrocaSenha, setErroTrocaSenha] = useState('');

  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  const [dataVis, setDataVis] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });

  // Estados de Filtros e Ordenação da Tabela
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  
  // NOVA INTELIGÊNCIA: Ordenação e Filtros Avançados
  const [ordenacao, setOrdenacao] = useState({ coluna: 'data', direcao: 'desc' });
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [filtrosAvancados, setFiltrosAvancados] = useState({
    dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: ''
  });

  // Bancos de Dados
  const [cartoes, setCartoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [metasRenda, setMetasRenda] = useState([]);
  const [contasFixas, setContasFixas] = useState([]);
  const [rendasFixas, setRendasFixas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [carregouAPI, setCarregouAPI] = useState(false);

  const headersAuth = { 'Authorization': `Bearer ${token || tokenTemp}`, 'Content-Type': 'application/json' };

  // =========================================================================
  // EFEITOS (Sincronização com a API)
  // =========================================================================
  useEffect(() => {
    if (!token) return;
    const carregarDadosDoBanco = async () => {
      try {
        const [resT, resC, resCat, resR, resF, resRF] = await Promise.all([
          fetch('https://painel-gestao-financeira-api.onrender.com/api/transacoes', { headers: headersAuth }),
          fetch('https://painel-gestao-financeira-api.onrender.com/api/cartoes', { headers: headersAuth }),
          fetch('https://painel-gestao-financeira-api.onrender.com/api/categorias', { headers: headersAuth }),
          fetch('https://painel-gestao-financeira-api.onrender.com/api/metas-renda', { headers: headersAuth }),
          fetch('https://painel-gestao-financeira-api.onrender.com/api/contas-fixas', { headers: headersAuth }),
          fetch('https://painel-gestao-financeira-api.onrender.com/api/rendas-fixas', { headers: headersAuth })
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
    carregarDadosDoBanco();
  }, [token]);

  // =========================================================================
  // FUNÇÕES DE LOGIN E CSV
  // =========================================================================
  const fazerLogin = async (e) => {
    e.preventDefault(); setErroLogin('');
    try {
      const res = await fetch('https://painel-gestao-financeira-api.onrender.com/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: usuarioLogin, senha: senhaLogin }) });
      const data = await res.json();
      
      if (data.auth) {
        localStorage.setItem('nomeUsuario', usuarioLogin); setNomeUsuario(usuarioLogin);
        if (data.precisaTrocar) { setTokenTemp(data.token); setPrecisaTrocarSenha(true); } 
        else { localStorage.setItem('tokenPainel', data.token); setToken(data.token); }
      } else { setErroLogin(data.message); }
    } catch (err) { setErroLogin("Erro ao conectar no servidor."); }
  };

  const fazerLogout = () => {
    localStorage.removeItem('tokenPainel'); localStorage.removeItem('nomeUsuario');
    setToken(null); setTokenTemp(null); setPrecisaTrocarSenha(false); setCarregouAPI(false); setNomeUsuario('');
  };

  const enviarNovaSenha = async (e) => {
    e.preventDefault(); setErroTrocaSenha('');
    const regexSenhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
    if (novaSenha !== confirmarSenha) return setErroTrocaSenha("As senhas não coincidem.");
    if (!regexSenhaForte.test(novaSenha)) return setErroTrocaSenha("Mínimo 12 caracteres, 1 Maiúscula, 1 Minúscula, 1 Número, 1 Especial.");

    try {
      const res = await fetch('https://painel-gestao-financeira-api.onrender.com/api/mudar-senha', { method: 'POST', headers: headersAuth, body: JSON.stringify({ novaSenha }) });
      if (res.ok) { localStorage.setItem('tokenPainel', tokenTemp); setToken(tokenTemp); setTokenTemp(null); setPrecisaTrocarSenha(false); } 
      else { setErroTrocaSenha("Erro ao atualizar a senha no servidor."); }
    } catch (err) { setErroTrocaSenha("Erro de conexão."); }
  };

  const exportarCSV = () => {
    if (transacoes.length === 0) return alert("Nenhum dado para exportar.");
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
  // CRUD DO SISTEMA (Setup e Lançamentos)
  // =========================================================================
  const salvarConfig = async (rota, dados, setState, stateAtual) => { await fetch(`https://painel-gestao-financeira-api.onrender.com/api/${rota}`, { method: 'POST', headers: headersAuth, body: JSON.stringify(dados) }); setState([...stateAtual, dados]); };
  
  const addCartao = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('cartoes', { id: Date.now().toString(), nome: fd.get('nome'), melhorDia: Number(fd.get('melhorDia')), vencimento: Number(fd.get('vencimento')) }, setCartoes, cartoes); e.target.reset(); };
  const addCategoria = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('categorias', { id: Date.now().toString(), nome: fd.get('nome'), meta: Number(fd.get('meta')), tipo: fd.get('tipo') }, setCategorias, categorias); e.target.reset(); };
  const addRendaMeta = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('metas-renda', { id: Date.now().toString(), nome: fd.get('nome'), valor: Number(fd.get('valor')) }, setMetasRenda, metasRenda); e.target.reset(); };
  const addContaFixa = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('contas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valor')), vencimento: Number(fd.get('vencimento')) }, setContasFixas, contasFixas); e.target.reset(); };
  const addRendaFixa = (e) => { e.preventDefault(); const fd = new FormData(e.target); salvarConfig('rendas-fixas', { id: Date.now().toString(), nome: fd.get('nome'), valorPadrao: Number(fd.get('valor')), diaRecebimento: Number(fd.get('diaRecebimento')) }, setRendasFixas, rendasFixas); e.target.reset(); };
  
  const removerSetup = async (banco, id) => { 
    let rota = banco === 'metasRenda' ? 'metas-renda' : banco === 'contasFixas' ? 'contas-fixas' : banco === 'rendasFixas' ? 'rendas-fixas' : banco; 
    await fetch(`https://painel-gestao-financeira-api.onrender.com/api/${rota}/${id}`, { method: 'DELETE', headers: headersAuth }); 
    if (banco === 'cartoes') setCartoes(cartoes.filter(c => c.id !== id)); 
    if (banco === 'categorias') setCategorias(categorias.filter(c => c.id !== id)); 
    if (banco === 'metasRenda') setMetasRenda(metasRenda.filter(r => r.id !== id)); 
    if (banco === 'contasFixas') setContasFixas(contasFixas.filter(f => f.id !== id)); 
    if (banco === 'rendasFixas') setRendasFixas(rendasFixas.filter(f => f.id !== id));
  };

  const addTransacao = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const d = fd.get('descricao'); const v = Number(fd.get('valor')); const dt = new Date(fd.get('dataCompra') + 'T00:00:00');
    let t = fd.get('tipo'); const c = fd.get('categoria'); const p = fd.get('formaPagamento'); const parc = Number(fd.get('parcelas')) || 1; const s = fd.get('status');
    if(c === 'Renda' || c === 'Renda Fixa') t = 'renda'; if(c === 'Contas Fixas') t = 'despesa';

    let novasT = [];
    if (p.startsWith('credito_')) {
      const cart = cartoes.find(card => card.id === p.split('_')[1]);
      let mI = (dt.getDate() >= cart.melhorDia) ? dt.getMonth() + 1 : dt.getMonth();
      for (let i = 0; i < parc; i++) {
        let mP = mI + i, aP = dt.getFullYear(); if(mP > 11) { aP += Math.floor(mP / 12); mP %= 12; }
        novasT.push({ id: (Date.now() + i).toString(), descricao: parc > 1 ? `${d} (${i+1}/${parc})` : d, categoria: c, valorParcela: v / parc, dataCompra: dt.toISOString(), tipo: t, formaPagamento: p, status: s, mesReferencia: mP + 1, anoReferencia: aP });
      }
    } else { novasT.push({ id: Date.now().toString(), descricao: d, categoria: c, valorParcela: v, dataCompra: dt.toISOString(), tipo: t, formaPagamento: p, status: s, mesReferencia: dt.getMonth() + 1, anoReferencia: dt.getFullYear() }); }

    for (const nova of novasT) await fetch('https://painel-gestao-financeira-api.onrender.com/api/transacoes', { method: 'POST', headers: headersAuth, body: JSON.stringify(nova) });
    setTransacoes([...transacoes, ...novasT]); e.target.reset();
  };

  const deletarTransacao = async (id) => { if(window.confirm("Excluir?")) { await fetch(`https://painel-gestao-financeira-api.onrender.com/api/transacoes/${id}`, { method: 'DELETE', headers: headersAuth }); setTransacoes(transacoes.filter(t => t.id !== id)); } };
  const alternarStatusTransacao = async (id, statusAtual, valor) => { const novoStatus = statusAtual === 'pago' ? 'pendente' : 'pago'; await fetch(`https://painel-gestao-financeira-api.onrender.com/api/transacoes/${id}`, { method: 'PUT', headers: headersAuth, body: JSON.stringify({ status: novoStatus, valorParcela: valor }) }); setTransacoes(transacoes.map(tr => tr.id === id ? { ...tr, status: novoStatus } : tr)); };
  const editarValor = async (t) => { const nV = window.prompt("Novo Valor:", t.valorParcela); if(nV !== null) { const valorAjustado = parseFloat(nV); const alternar = window.confirm("Deseja alternar o status PAGO/PENDENTE?"); const novoStatus = alternar ? (t.status === 'pago' ? 'pendente' : 'pago') : t.status; await fetch(`https://painel-gestao-financeira-api.onrender.com/api/transacoes/${t.id}`, { method: 'PUT', headers: headersAuth, body: JSON.stringify({ status: novoStatus, valorParcela: valorAjustado }) }); setTransacoes(transacoes.map(tr => tr.id === t.id ? { ...tr, valorParcela: valorAjustado, status: novoStatus } : tr)); } };

  // =========================================================================
  // CÁLCULOS, FILTROS E ORDENAÇÃO DO DASHBOARD E TABELA
  // =========================================================================
  const mesAnterior = () => setDataVis(prev => prev.mes === 1 ? { mes: 12, ano: prev.ano - 1 } : { ...prev, mes: prev.mes - 1 });
  const mesProximo = () => setDataVis(prev => prev.mes === 12 ? { mes: 1, ano: prev.ano + 1 } : { ...prev, mes: prev.mes + 1 });
  
  const transacoesMes = transacoes.filter(t => t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano);

  // Lógica de Ordenação dos Cabeçalhos
  const mudarOrdenacao = (coluna) => {
    if (ordenacao.coluna === coluna) {
      setOrdenacao({ coluna, direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' });
    } else {
      setOrdenacao({ coluna, direcao: 'asc' });
    }
  };

  // Aplicação dos Filtros Regulares + Avançados
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

  // Aplicação da Ordenação
  if (ordenacao.coluna) {
    dadosTabela.sort((a, b) => {
      let valorA, valorB;
      switch (ordenacao.coluna) {
        case 'descricao': valorA = a.descricao.toLowerCase(); valorB = b.descricao.toLowerCase(); break;
        case 'data': valorA = new Date(a.dataCompra).getTime(); valorB = new Date(b.dataCompra).getTime(); break;
        case 'status': valorA = a.status; valorB = b.status; break;
        case 'pagamento': valorA = a.formaPagamento; valorB = b.formaPagamento; break;
        case 'valor': valorA = Number(a.valorParcela); valorB = Number(b.valorParcela); break;
        default: return 0;
      }
      if (valorA < valorB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Cálculos do Painel Superior
  let totRendaTotal = 0, totRendaPaga = 0, totGastoReal = 0, totInvestido = 0, totGastoPago = 0, totFaturaCreditoAberto = 0;
  let gCat = {}; categorias.forEach(c => gCat[c.nome] = 0);
  let gastoSemCategoria = 0, gastoContasFixas = 0;

  transacoesMes.forEach(t => {
    const v = Number(t.valorParcela);
    if (t.tipo === 'renda' || t.categoria === 'Renda' || t.categoria === 'Renda Fixa') {
      totRendaTotal += v;
      if (t.status === 'pago') totRendaPaga += v;
    }
    else {
      if (t.tipo === 'despesa') totGastoReal += v;
      if (t.tipo === 'investimento') totInvestido += v;
      if (t.status === 'pago') totGastoPago += v;
      if (t.formaPagamento && t.formaPagamento.startsWith('credito_') && t.status === 'pendente') { totFaturaCreditoAberto += v; }
      if (t.categoria === 'Contas Fixas') gastoContasFixas += v;
      else if (t.categoria === 'Sem Categoria') gastoSemCategoria += v;
      else if (gCat[t.categoria] !== undefined) gCat[t.categoria] += v;
    }
  });

  let custoPrevisto = (gastoSemCategoria + gastoContasFixas);
  categorias.forEach(c => custoPrevisto += Math.max(c.meta, (gCat[c.nome] || 0)));
  const saldoAtual = totRendaPaga - totGastoPago;
  const previstoFimMes = totRendaTotal - custoPrevisto;

  // =========================================================================
  // RENDERIZAÇÃO DAS TELAS
  // =========================================================================
  
  // TELA 1: LOGIN (Omitida para manter limpo, igual ao original)
  if (!token && !precisaTrocarSenha) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
          <div className="text-center mb-8"><h1 className="text-2xl font-bold text-slate-800">Painel Financeiro</h1><p className="text-sm text-slate-500 mt-1">Acesso Restrito</p></div>
          <form onSubmit={fazerLogin} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label><input type="text" value={usuarioLogin} onChange={e => setUsuarioLogin(e.target.value)} required className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Senha</label><input type="password" value={senhaLogin} onChange={e => setSenhaLogin(e.target.value)} required className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:border-blue-500" /></div>
            {erroLogin && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded">{erroLogin}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">Entrar no Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  // TELA 2: TROCA DE SENHA
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

  // TELA 3: SETUP
  if (telaAtiva === 'setup') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div><h1 className="text-2xl font-bold text-slate-900">Configuração Inicial</h1></div>
            <div className="flex gap-2">
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
              <ul className="mt-4 space-y-2">
                {rendasFixas.map(r => (
                  <li key={r.id} className="flex justify-between bg-slate-50 p-2 rounded border text-sm items-center">
                    <span>💰 {r.nome}</span>
                    <button onClick={() => removerSetup('rendasFixas', r.id)} className="text-red-500 bg-red-50 px-2 py-1 rounded">X</button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // TELA 4: DASHBOARD PRINCIPAL
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-6">
        
        <header className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
          <div><h1 className="text-2xl font-bold text-slate-900">Painel Financeiro</h1><p className="text-sm text-slate-500 font-medium capitalize">Olá, {nomeUsuario}! 👋</p></div>
          <div className="flex items-center gap-4 mt-4 md:mt-0 bg-slate-50 px-4 py-2 rounded-lg border">
            <button onClick={mesAnterior} className="text-slate-400 hover:text-slate-700 text-xl font-bold">◀</button>
            <span className="font-semibold text-slate-700 uppercase min-w-30 text-center">{nomesMeses[dataVis.mes - 1]} {dataVis.ano}</span>
            <button onClick={mesProximo} className="text-slate-400 hover:text-slate-700 text-xl font-bold">▶</button>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button onClick={() => setTelaAtiva('setup')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium border transition-colors">⚙ Config</button>
            <button onClick={fazerLogout} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium border border-red-100 transition-colors">Sair</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500"><h3 className="text-xs font-semibold text-slate-500 uppercase">Rendas</h3><p className="text-lg font-bold mt-1">{formatarMoeda(totRendaPaga)}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500"><h3 className="text-xs font-semibold text-slate-500 uppercase">Gastos</h3><p className="text-lg font-bold mt-1">{formatarMoeda(totGastoReal)}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500"><h3 className="text-xs font-semibold text-slate-500 uppercase">Investimentos</h3><p className="text-lg font-bold mt-1">{formatarMoeda(totInvestido)}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500"><h3 className="text-xs font-semibold text-slate-500 uppercase">Faturas Abertas</h3><p className="text-lg font-bold text-purple-700 mt-1">{formatarMoeda(totFaturaCreditoAberto)}</p></div>
          <div className="bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-slate-400"><h3 className="text-xs font-semibold text-slate-300 uppercase">Saldo Pago</h3><p className="text-lg font-bold text-white mt-1">{formatarMoeda(saldoAtual)}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500"><h3 className="text-xs font-semibold text-slate-500 uppercase">Previsão Fim Mês</h3><p className="text-lg font-bold mt-1">{formatarMoeda(previstoFimMes)}</p></div>
        </div>

        {categorias.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-bold text-slate-600 uppercase mb-4">Progresso das Metas</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {categorias.map(c => {
                const gas = gCat[c.nome] || 0; let por = Math.min((gas / c.meta) * 100, 100);
                let corBarra = 'bg-emerald-500'; 
                if (c.tipo === 'despesa') { if (por >= 90) corBarra = 'bg-red-500'; else if (por >= 70) corBarra = 'bg-amber-400'; } 
                else { corBarra = 'bg-blue-500'; }
                return (
                  <div key={c.id} className="border p-4 rounded-lg bg-slate-50">
                    <h4 className="text-sm font-medium mb-2 truncate" title={c.nome}>{c.nome}</h4>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden"><div className={`${corBarra} h-1.5 rounded-full transition-all duration-700 ease-out`} style={{ width: `${por}%` }}></div></div>
                    <div className="flex justify-between text-xs text-slate-500 font-medium"><span>{formatarMoeda(gas)}</span><span>{formatarMoeda(c.meta)}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border lg:col-span-1 h-fit">
            <h2 className="text-sm font-bold text-slate-600 uppercase mb-4">Novo Lançamento</h2>
            <form onSubmit={addTransacao} className="space-y-4">
              <input name="descricao" placeholder="Descrição" required className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" />
              <input name="valor" type="number" step="0.01" placeholder="Valor (R$)" required className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" />
              <input name="dataCompra" type="date" required className="w-full border p-2.5 rounded-lg text-sm text-slate-600 outline-none focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-2"><select name="tipo" required className="border p-2.5 rounded-lg text-sm bg-white outline-none focus:border-blue-500"><option value="despesa">Despesa</option><option value="renda">Renda</option><option value="investimento">Invest. / Meta</option></select><select name="status" className="border p-2.5 rounded-lg text-sm bg-white outline-none focus:border-blue-500"><option value="pendente">Pendente</option><option value="pago">Pago</option></select></div>
              <select name="categoria" required className="w-full border p-2.5 rounded-lg text-sm bg-white outline-none focus:border-blue-500"><option value="Sem Categoria">Sem Categoria</option><option value="Contas Fixas">Contas Fixas</option><option value="Renda Fixa">Renda Fixa</option><option value="Renda">Renda Variável</option>{categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select>
              <select name="formaPagamento" required className="w-full border p-2.5 rounded-lg text-sm bg-white outline-none focus:border-blue-500"><option value="pix">PIX / Dinheiro</option><option value="debito">Débito</option>{cartoes.map(c => <option key={c.id} value={`credito_${c.id}`}>Crédito - {c.nome}</option>)}</select>
              <input name="parcelas" type="number" min="1" placeholder="Qtd. Parcelas (Apenas Crédito)" className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" />
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-sm">Adicionar</button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border lg:col-span-2 flex flex-col">
            <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 rounded-t-xl">
              
              <div className="flex bg-white rounded-lg border p-1 w-full md:w-auto">
                <button onClick={() => setFiltroStatus('todos')} className={`px-4 py-1.5 text-xs font-bold rounded-md flex-1 ${filtroStatus === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Todos</button>
                <button onClick={() => setFiltroStatus('pendente')} className={`px-4 py-1.5 text-xs font-bold rounded-md flex-1 ${filtroStatus === 'pendente' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100'}`}>Pendentes</button>
                <button onClick={() => setFiltroStatus('pago')} className={`px-4 py-1.5 text-xs font-bold rounded-md flex-1 ${filtroStatus === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>Pagos</button>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <input type="text" placeholder="🔍 Buscar por descrição..." value={buscaTexto} onChange={(e) => setBuscaTexto(e.target.value)} className="w-full md:w-64 border border-slate-300 p-2 rounded-lg text-sm outline-none focus:border-blue-500" />
                <button onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)} className={`px-3 py-2 rounded-lg border text-sm font-bold transition-colors ${mostrarFiltrosAvancados ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  Filtros {mostrarFiltrosAvancados ? '▲' : '▼'}
                </button>
              </div>
            </div>

            {/* PAINEL DE FILTROS AVANÇADOS */}
            {mostrarFiltrosAvancados && (
              <div className="p-4 border-b bg-blue-50/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Período de Data</label>
                  <div className="flex gap-2">
                    <input type="date" value={filtrosAvancados.dataInicio} onChange={e => setFiltrosAvancados({...filtrosAvancados, dataInicio: e.target.value})} className="w-full border p-1.5 rounded text-xs" title="Data Inicial" />
                    <input type="date" value={filtrosAvancados.dataFim} onChange={e => setFiltrosAvancados({...filtrosAvancados, dataFim: e.target.value})} className="w-full border p-1.5 rounded text-xs" title="Data Final" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Faixa de Valor (R$)</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Mínimo" value={filtrosAvancados.valorMin} onChange={e => setFiltrosAvancados({...filtrosAvancados, valorMin: e.target.value})} className="w-full border p-1.5 rounded text-xs" />
                    <input type="number" placeholder="Máximo" value={filtrosAvancados.valorMax} onChange={e => setFiltrosAvancados({...filtrosAvancados, valorMax: e.target.value})} className="w-full border p-1.5 rounded text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pagamento e Categoria</label>
                  <div className="flex gap-2">
                    <select value={filtrosAvancados.formaPagamento} onChange={e => setFiltrosAvancados({...filtrosAvancados, formaPagamento: e.target.value})} className="w-full border p-1.5 rounded text-xs bg-white">
                      <option value="">Qualquer Pagto</option>
                      <option value="pix">PIX / Dinheiro</option>
                      <option value="debito">Débito</option>
                      <option value="credito">Crédito</option>
                    </select>
                    <select value={filtrosAvancados.categoria} onChange={e => setFiltrosAvancados({...filtrosAvancados, categoria: e.target.value})} className="w-full border p-1.5 rounded text-xs bg-white">
                      <option value="">Qualquer Cat.</option>
                      {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button onClick={() => setFiltrosAvancados({dataInicio: '', dataFim: '', valorMin: '', valorMax: '', formaPagamento: '', categoria: ''})} className="text-xs text-red-500 hover:underline font-bold">Limpar Filtros Avançados</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-white text-xs uppercase font-semibold border-b select-none">
                  <tr>
                    <th className="p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => mudarOrdenacao('descricao')}>Descrição {ordenacao.coluna === 'descricao' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => mudarOrdenacao('data')}>Categoria / Data {ordenacao.coluna === 'data' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => mudarOrdenacao('status')}>Status {ordenacao.coluna === 'status' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => mudarOrdenacao('pagamento')}>Pagamento {ordenacao.coluna === 'pagamento' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-50 transition-colors text-right" onClick={() => mudarOrdenacao('valor')}>Valor {ordenacao.coluna === 'valor' ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dadosTabela.length === 0 && (<tr><td colSpan="6" className="p-8 text-center text-slate-400 font-medium">Nenhum lançamento encontrado.</td></tr>)}
                  {dadosTabela.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      {/* O Segredo do Texto Longo resolvido aqui embaixo (break-words min-w-[200px]) */}
                      <td className="p-4 font-bold text-slate-800 break-words whitespace-normal min-w-[200px]">{t.descricao}</td>
                      <td className="p-4"><div className="flex flex-col"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded w-fit mb-1 truncate max-w-[120px]">{t.categoria}</span><span className="text-xs text-slate-400">{new Date(t.dataCompra).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span></div></td>
                      <td className="p-4">
                        <button onClick={() => alternarStatusTransacao(t.id, t.status, t.valorParcela)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-transform hover:scale-105 ${t.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {t.status}
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] uppercase text-slate-500 font-bold bg-slate-100 border px-2 py-1 rounded">
                          {t.formaPagamento ? t.formaPagamento.split('_')[0] : 'PIX'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800 text-right whitespace-nowrap">{formatarMoeda(t.valorParcela)}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => editarValor(t)} className="bg-white border text-slate-500 hover:bg-slate-100 px-2 py-1 rounded text-xs transition-colors">✏️</button>
                          <button onClick={() => deletarTransacao(t.id)} className="bg-red-50 text-red-500 hover:bg-red-100 px-2 py-1 rounded text-xs transition-colors">🗑️</button>
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