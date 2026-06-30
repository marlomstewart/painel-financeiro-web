import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './components/Modal';
import { Login } from './components/Login';
import { TrocaSenha } from './components/TrocaSenha';
import { Admin } from './components/Admin';
import { Dashboard } from './components/Dashboard';
import { Lancamentos } from './components/Lancamentos';
import { Garagem } from './components/Garagem';
import { Sidebar } from './components/Sidebar';

import { Cartoes } from './components/Cartoes';
import { MetasCategorias } from './components/MetasCategorias';
import { ContasFixas } from './components/ContasFixas';
import { Configuracoes } from './components/Configuracoes';

import { useAuth } from './hooks/useAuth';
import { useGaragem } from './hooks/useGaragem';
import { useCartoesFaturas } from './hooks/useCartoesFaturas';
import { useSetup } from './hooks/useSetup';
import { useTransacoes } from './hooks/useTransacoes';
import { useDashboard } from './hooks/useDashboard';

import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { useTheme } from './hooks/useTheme';
import { ThemeToggle } from './components/ThemeToggle';
import { DashboardSkeleton } from './components/Skeleton';

const API = import.meta.env.VITE_API_URL || 'https://painel-gestao-financeira-api.onrender.com/api';

/**
 * Hook Customizado: useModal
 * CORRIGIDO: Agora todos os eventos de fechar, cancelar e confirmar
 * emitem setConfig(null) para destruir o modal da tela e evitar congelamento.
 */
function useModal() {
  const [config, setConfig] = useState(null);
  const close = useCallback(() => setConfig(null), []);
  const alert = useCallback((message, title, opts = {}) => new Promise(resolve => setConfig({ type: 'alert', title, message, onConfirm: () => { setConfig(null); resolve(); }, onClose: () => { setConfig(null); resolve(); }, ...opts })), []);
  const confirm = useCallback((message, title, opts = {}) => new Promise(resolve => setConfig({ type: 'confirm', title, message, onConfirm: () => { setConfig(null); resolve(true); }, onCancel: () => { setConfig(null); resolve(false); }, onClose: () => { setConfig(null); resolve(false); }, ...opts })), []);
  const prompt = useCallback((message, defaultValue = '', title, opts = {}) => new Promise(resolve => setConfig({ type: 'prompt', title, message, defaultValue, onConfirm: (val) => { setConfig(null); resolve(val); }, onCancel: () => { setConfig(null); resolve(null); }, onClose: () => { setConfig(null); resolve(null); }, ...opts })), []);
  const options = useCallback((message, opts_list, title, opts = {}) => new Promise(resolve => setConfig({ type: 'options', title, message, options: opts_list, onConfirm: (val) => { setConfig(null); resolve(val); }, onCancel: () => { setConfig(null); resolve(null); }, onClose: () => { setConfig(null); resolve(null); }, ...opts })), []);
  return { config, close, setConfig, alert, confirm, prompt, options };
}

function App() {
  const modal = useModal();
  const { toast, showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [carregouAPI, setCarregouAPI] = useState(false);

  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dataVis, setDataVis] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });
  const [transacoes, setTransacoes] = useState([]);

  const auth = useAuth({ API, modal, setCarregouAPI });
  const setup = useSetup({ API, getHeaders: auth.getHeaders, modal, transacoes, setTransacoes });
  const garagem = useGaragem({ API, getHeaders: auth.getHeaders, modal, nomeUsuario: auth.nomeUsuario, transacoes, showToast });
  const transacoesMes = transacoes.filter(t => t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano);
  const cartoesFaturas = useCartoesFaturas({ transacoes, setTransacoes, transacoesMes, cartoes: setup.cartoes, dataVis, API, getHeaders: auth.getHeaders, modal });
  const transacoesManager = useTransacoes({ API, getHeaders: auth.getHeaders, modal, token: auth.token, nomeUsuario: auth.nomeUsuario, transacoes, setTransacoes, categorias: setup.categorias, cartoes: setup.cartoes, garagem });
  const dashboardManager = useDashboard({ transacoes, setTransacoes, transacoesMes, categorias: setup.categorias, dataVis, setDataVis, modal, API, getHeaders: auth.getHeaders, nomeUsuario: auth.nomeUsuario, garagem });

  useEffect(() => {
    if (!auth.token) return;
    const headers = auth.getHeaders();
    const carregar = async () => {
      try {
        const [resT, resC, resCat, resR, resF, resRF] = await Promise.all([
          fetch(`${API}/transacoes`, { headers }), fetch(`${API}/cartoes`, { headers }), fetch(`${API}/categorias`, { headers }), fetch(`${API}/metas-renda`, { headers }), fetch(`${API}/contas-fixas`, { headers }), fetch(`${API}/rendas-fixas`, { headers })
        ]);
        if (!resT.ok) { auth.fazerLogout(); return; }
        setTransacoes(await resT.json()); setup.setCartoes(await resC.json()); setup.setCategorias(await resCat.json()); setup.setMetasRenda(await resR.json()); setup.setContasFixas(await resF.json()); setup.setRendasFixas(await resRF.json());
        setCarregouAPI(true); await garagem.carregarDadosGaragem();
      } catch (err) { console.error("Erro ao sincronizar:", err); }
    };
    carregar();
  }, [auth.token]);

  if (!auth.token && !auth.precisaTrocarSenha) return <><Login fazerLogin={auth.fazerLogin} usuarioLogin={auth.usuarioLogin} setUsuarioLogin={auth.setUsuarioLogin} senhaLogin={auth.senhaLogin} setSenhaLogin={auth.setSenhaLogin} erroLogin={auth.erroLogin} modalConfig={modal.config} modalClose={modal.close} ModalComponent={Modal} /><Toast toast={toast} /><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></>;
  if (auth.precisaTrocarSenha) return <><TrocaSenha enviarNovaSenha={auth.enviarNovaSenha} novaSenha={auth.novaSenha} setNovaSenha={auth.setNovaSenha} confirmarSenha={auth.confirmarSenha} setConfirmarSenha={auth.setConfirmarSenha} erroTrocaSenha={auth.erroTrocaSenha} fazerLogout={auth.fazerLogout} /><Toast toast={toast} /><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></>;
  if (auth.token && !carregouAPI) return <><DashboardSkeleton /><Toast toast={toast} /><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></>;

  const renderizarConteudoAtivo = () => {
    if (telaAtiva === 'admin') return <Admin ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} criarUsuario={auth.criarUsuario} carregarUsuarios={auth.carregarUsuarios} usuarios={auth.usuarios} toggleAdmin={auth.toggleAdmin} resetarSenha={auth.resetarSenha} deletarUsuario={auth.deletarUsuario} />;

    if (telaAtiva === 'cartoes') return <Cartoes cartoes={setup.cartoes} addCartao={setup.addCartao} editarSetup={setup.editarSetup} removerSetup={setup.removerSetup} modal={modal} />;

    if (telaAtiva === 'metas_categorias') return <MetasCategorias categorias={setup.categorias} addCategoria={setup.addCategoria} metasRenda={setup.metasRenda} addMetaRenda={setup.addMetaRenda} editarSetup={setup.editarSetup} removerSetup={setup.removerSetup} modal={modal} />;

    if (['contas_fixas', 'dividas', 'rendas_fixas'].includes(telaAtiva)) {
      return <ContasFixas modo={telaAtiva} contasFixas={setup.contasFixas} addContaFixa={setup.addContaFixa} rendasFixas={setup.rendasFixas} addRendaFixa={setup.addRendaFixa} editarSetup={setup.editarSetup} removerSetup={setup.removerSetup} modal={modal} />;
    }

    if (telaAtiva === 'configuracoes') return <Configuracoes nomeUsuario={auth.nomeUsuario} atualizarPerfil={auth.atualizarPerfil} alterarSenha={auth.alterarSenha} exportarCSV={setup.exportarCSV} gerarMesManual={setup.gerarMesManual} gerandoMes={setup.gerandoMes} removerSetup={setup.removerSetup} />;

    if (telaAtiva === 'garagem') return <Garagem ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} getHeaders={auth.getHeaders} transacoes={transacoes} garagem={garagem} />;

    if (['novo_lancamento', 'extrato', 'lancamentos'].includes(telaAtiva)) {
      return <Lancamentos
        modo={telaAtiva}
        categorias={dashboardManager.categoriasDinamicas}
        cartoes={setup.cartoes}
        addTransacao={transacoesManager.addTransacao}
        filtroStatus={dashboardManager.filtroStatus}
        setFiltroStatus={dashboardManager.setFiltroStatus}
        buscaTexto={dashboardManager.buscaTexto}
        setBuscaTexto={dashboardManager.setBuscaTexto}
        mostrarFiltrosAvancados={dashboardManager.mostrarFiltrosAvancados}
        setMostrarFiltrosAvancados={dashboardManager.setMostrarFiltrosAvancados}
        filtrosAvancados={dashboardManager.filtrosAvancados}
        setFiltrosAvancados={dashboardManager.setFiltrosAvancados}
        mudarOrdenacao={dashboardManager.mudarOrdenacao}
        ordenacao={dashboardManager.ordenacao}
        dadosTabela={dashboardManager.dadosTabela}
        alternarStatusTransacao={transacoesManager.alternarStatusTransacao}
        editarValor={transacoesManager.editarValor}
        deletarTransacao={transacoesManager.deletarTransacao}
        executarAcaoEmMassa={transacoesManager.executarAcaoEmMassa}
        modal={modal}
        nomeUsuario={auth.nomeUsuario}
        anexarComprovante={transacoesManager.anexarComprovante}
        verComprovante={transacoesManager.verComprovante}
        dataVis={dataVis}
        mesAnterior={dashboardManager.mesAnterior}
        mesProximo={dashboardManager.mesProximo}
      />;
    }

    if (telaAtiva === 'investimentos') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in transition-colors duration-300">
          <span className="text-6xl mb-6">📈</span>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Módulo de Investimentos</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">O ambiente para gerir a sua carteira, fundos imobiliários e aportes está a ser preparado. Em breve estará disponível.</p>
        </div>
      );
    }

    return <Dashboard nomeUsuario={auth.nomeUsuario} transacoesMes={transacoesMes} garagem={garagem} dataVis={dataVis} mesAnterior={dashboardManager.mesAnterior} mesProximo={dashboardManager.mesProximo} totRendaPaga={dashboardManager.totRendaPaga} totGastoReal={dashboardManager.totGastoReal} totInvestido={dashboardManager.totInvestido} totFaturaCreditoAberto={dashboardManager.totFaturaCreditoAberto} saldoAtual={dashboardManager.saldoAtual} previstoFimMes={dashboardManager.previstoFimMes} somarSaldoAnterior={dashboardManager.somarSaldoAnterior} setSomarSaldoAnterior={dashboardManager.setSomarSaldoAnterior} categorias={dashboardManager.categoriasDinamicas} gCat={dashboardManager.gCat} abrirDetalhesCategoria={dashboardManager.abrirDetalhesCategoria} pendenciasPassadas={dashboardManager.pendenciasPassadas} abrirModalPendencias={dashboardManager.abrirModalPendencias} abrirResumoCard={dashboardManager.abrirResumoCard} verFaturasPorCartao={cartoesFaturas.verFaturasPorCartao} />;
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#0b1120] overflow-hidden">
      <Sidebar telaAtiva={telaAtiva} setTelaAtiva={setTelaAtiva} isAdmin={auth.isAdmin} fazerLogout={auth.fazerLogout} nomeUsuario={auth.nomeUsuario} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <main className="flex-1 h-full overflow-y-auto relative custom-scrollbar flex flex-col">
        <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-30 sticky top-0">
          <h1 className="text-lg font-black tracking-tight flex items-center gap-2"><span className="text-blue-500">⚡</span> Financeiro</h1>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl cursor-pointer hover:text-blue-400 transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
        </div>
        {renderizarConteudoAtivo()}
      </main>
      <Modal config={modal.config} onClose={modal.close} />
      <Toast toast={toast} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </div>
  );
}

export default App;