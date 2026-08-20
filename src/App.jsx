import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Modal } from './components/Modal';
import { Login } from './components/Login';
import { TrocaSenha } from './components/TrocaSenha';
import { Sidebar } from './components/Sidebar';
import { Tutorial } from './components/Tutorial';

// Telas roteadas por `telaAtiva` — carregadas sob demanda (code splitting), já que num único
// acesso o usuário normalmente só visita 2-3 dessas telas. Login/TrocaSenha/Modal/Sidebar/Tutorial
// ficam eager acima porque são necessários já na primeira renderização (ou sempre montados).
const Admin = lazy(() => import('./components/Admin').then(m => ({ default: m.Admin })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const Lancamentos = lazy(() => import('./components/Lancamentos').then(m => ({ default: m.Lancamentos })));
const Garagem = lazy(() => import('./components/Garagem').then(m => ({ default: m.Garagem })));
const Cartoes = lazy(() => import('./components/Cartoes').then(m => ({ default: m.Cartoes })));
const MetasCategorias = lazy(() => import('./components/MetasCategorias').then(m => ({ default: m.MetasCategorias })));
const ContasFixas = lazy(() => import('./components/ContasFixas').then(m => ({ default: m.ContasFixas })));
const RendasFixas = lazy(() => import('./components/RendasFixas').then(m => ({ default: m.RendasFixas })));
const Configuracoes = lazy(() => import('./components/Configuracoes').then(m => ({ default: m.Configuracoes })));
const Dividas = lazy(() => import('./components/Dividas').then(m => ({ default: m.Dividas })));
const Investimentos = lazy(() => import('./components/Investimentos').then(m => ({ default: m.Investimentos })));
const CalculadoraCompra = lazy(() => import('./components/CalculadoraCompra').then(m => ({ default: m.CalculadoraCompra })));
const Cobrancas = lazy(() => import('./components/Cobrancas').then(m => ({ default: m.Cobrancas })));
const Ajuda = lazy(() => import('./components/Ajuda').then(m => ({ default: m.Ajuda })));

import { useAuth } from './hooks/useAuth';
import { useGaragem } from './hooks/useGaragem';
import { useCartoesFaturas } from './hooks/useCartoesFaturas';
import { useSetup } from './hooks/useSetup';
import { useTransacoes } from './hooks/useTransacoes';
import { useDashboard } from './hooks/useDashboard';
import { useOfflineSync } from './hooks/useOfflineSync';

import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { Skeleton } from './components/Skeleton';

/**
 * @constant {string} API
 * @description URL base da API consumida pela aplicação. 
 */
const API = import.meta.env.VITE_API_URL;

/**
 * @function useModal
 * @description Hook Customizado que orquestra os estados e chamadas de janelas modais.
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

/**
 * @function App
 * @description Raiz da aplicação React. Gerencia o roteamento interno e renderização condicional.
 */
function App() {
  const modal = useModal();
  const { toasts, showToast } = useToast();
  const [carregouAPI, setCarregouAPI] = useState(false);

  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mostrarTutorial, setMostrarTutorial] = useState(false);
  const [dataVis, setDataVis] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });
  const [transacoes, setTransacoes] = useState([]);

  const auth = useAuth({ API, modal, setCarregouAPI, showToast });
  const setup = useSetup({ API, getHeaders: auth.getHeaders, modal, transacoes, setTransacoes, showToast });
  const garagem = useGaragem({ API, getHeaders: auth.getHeaders, modal, temGaragem: auth.temGaragem, showToast });
  const transacoesMes = transacoes.filter(t => t.mesReferencia === dataVis.mes && t.anoReferencia === dataVis.ano);
  const cartoesFaturas = useCartoesFaturas({ transacoes, setTransacoes, transacoesMes, cartoes: setup.cartoes, dataVis, API, getHeaders: auth.getHeaders, modal, showToast });
  const transacoesManager = useTransacoes({ API, getHeaders: auth.getHeaders, modal, token: auth.token, temGaragem: auth.temGaragem, transacoes, setTransacoes, categorias: setup.categorias, cartoes: setup.cartoes, garagem, showToast });
  const offlineSync = useOfflineSync({ API, getHeaders: auth.getHeaders, token: auth.token, setTransacoes, showToast });
  const dashboardManager = useDashboard({ transacoes, setTransacoes, transacoesMes, categorias: setup.categorias, dataVis, setDataVis, modal, API, getHeaders: auth.getHeaders, temGaragem: auth.temGaragem, garagem, cartoes: setup.cartoes, showToast });

  useEffect(() => {
    const applyTheme = () => {
      const tema = localStorage.getItem('theme') || 'sistema';
      const root = window.document.documentElement;
      if (tema === 'sistema') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
        else root.classList.remove('dark');
      } else if (tema === 'escuro') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!localStorage.getItem('theme') || localStorage.getItem('theme') === 'sistema') applyTheme();
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!auth.token) return;
    const headers = auth.getHeaders();
    const carregar = async () => {
      try {
        const [resT, resC, resCat, resR, resF, resRF, resDiv] = await Promise.all([
          fetch(`${API}/transacoes`, { headers }), fetch(`${API}/cartoes`, { headers }), fetch(`${API}/categorias`, { headers }), fetch(`${API}/metas-renda`, { headers }), fetch(`${API}/contas-fixas`, { headers }), fetch(`${API}/rendas-fixas`, { headers }), fetch(`${API}/dividas`, { headers })
        ]);
        if (!resT.ok) { auth.fazerLogout(); return; }
        setTransacoes(await resT.json()); setup.setCartoes(await resC.json()); setup.setCategorias(await resCat.json()); setup.setMetasRenda(await resR.json()); setup.setContasFixas(await resF.json()); setup.setRendasFixas(await resRF.json()); setup.setDividas(await resDiv.json());
        setCarregouAPI(true); await garagem.carregarDadosGaragem();
      } catch (err) { console.error("Erro ao sincronizar:", err); }
    };
    carregar();
  }, [auth.token]);

  // Exibe o tour de boas-vindas automaticamente após o carregamento, uma vez por sessão,
  // a menos que o usuário já tenha marcado "Não mostrar novamente" (persistido no perfil dele).
  useEffect(() => {
    if (carregouAPI && !auth.tutorialDispensado) setMostrarTutorial(true);
  }, [carregouAPI, auth.tutorialDispensado]);

  if (!auth.token && !auth.precisaTrocarSenha) return <><Login fazerLogin={auth.fazerLogin} usuarioLogin={auth.usuarioLogin} setUsuarioLogin={auth.setUsuarioLogin} senhaLogin={auth.senhaLogin} setSenhaLogin={auth.setSenhaLogin} erroLogin={auth.erroLogin} modalConfig={modal.config} modalClose={modal.close} ModalComponent={Modal} /><Toast toasts={toasts} /></>;
  if (auth.precisaTrocarSenha) return <><TrocaSenha enviarNovaSenha={auth.enviarNovaSenha} novaSenha={auth.novaSenha} setNovaSenha={auth.setNovaSenha} confirmarSenha={auth.confirmarSenha} setConfirmarSenha={auth.setConfirmarSenha} erroTrocaSenha={auth.erroTrocaSenha} fazerLogout={auth.fazerLogout} /><Toast toasts={toasts} /></>;

  if (auth.token && !carregouAPI) return <><Skeleton /><Toast toasts={toasts} /></>;

  /**
   * @function renderizarConteudoAtivo
   */
  const renderizarConteudoAtivo = () => {
    if (telaAtiva === 'admin') return <Admin ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} criarUsuario={auth.criarUsuario} carregarUsuarios={auth.carregarUsuarios} usuarios={auth.usuarios} toggleAdmin={auth.toggleAdmin} resetarSenha={auth.resetarSenha} deletarUsuario={auth.deletarUsuario} toggleGaragem={auth.toggleGaragem} toggleComprovante={auth.toggleComprovante} />;

    if (telaAtiva === 'cobrancas') return <Cobrancas transacoes={transacoes} dividas={setup.dividas} cartoes={setup.cartoes} dataVis={dataVis} marcarRecebidoTerceiro={transacoesManager.marcarRecebidoTerceiro} editarSetup={setup.editarSetup} modal={modal} showToast={showToast} chavePix={auth.chavePix} />;

    if (telaAtiva === 'cartoes') return <Cartoes transacoes={transacoes} cartoes={setup.cartoes} addCartao={setup.addCartao} editarSetup={setup.editarSetup} removerSetup={setup.removerSetup} modal={modal} showToast={showToast} />;

    // Injetando a flag de controle da garagem no componente de Metas & Categorias
    if (telaAtiva === 'metas_categorias') return <MetasCategorias categorias={setup.categorias} addCategoria={setup.addCategoria} metasRenda={setup.metasRenda} addMetaRenda={setup.addMetaRenda} editarSetup={setup.editarSetup} removerSetup={setup.removerSetup} modal={modal} temGaragem={auth.temGaragem} showToast={showToast} />;

    if (telaAtiva === 'dividas') return <Dividas dividas={setup.dividas} transacoes={transacoes} cartoes={setup.cartoes} addDivida={setup.addDivida} editarSetup={setup.editarSetup} removerSetup={setup.removerSetup} modal={modal} showToast={showToast} />;
    if (telaAtiva === 'contas_fixas') return <ContasFixas contasFixas={setup.contasFixas} cartoes={setup.cartoes} addContaFixa={setup.addContaFixa} editarSetup={setup.editarSetup} removerSetup={setup.removerSetup} modal={modal} showToast={showToast} />;
    if (telaAtiva === 'rendas_fixas') return <RendasFixas rendasFixas={setup.rendasFixas} addRendaFixa={setup.addRendaFixa} editarSetup={setup.editarSetup} removerSetup={setup.removerSetup} modal={modal} showToast={showToast} />;

    if (telaAtiva === 'configuracoes') return <Configuracoes API={API} getHeaders={auth.getHeaders} nomeUsuario={auth.nomeUsuario} nomeCompleto={auth.nomeCompleto} atualizarPerfil={auth.atualizarPerfil} alterarSenha={auth.alterarSenha} exportarCSV={setup.exportarCSV} gerarMesManual={setup.gerarMesManual} gerandoMes={setup.gerandoMes} removerSetup={setup.removerSetup} telegramChatId={auth.telegramChatId} atualizarTelegram={auth.atualizarTelegram} chavePix={auth.chavePix} />;

    if (telaAtiva === 'ajuda') return <Ajuda temGaragem={auth.temGaragem} isAdmin={auth.isAdmin} abrirTutorial={() => setMostrarTutorial(true)} />;

    if (telaAtiva === 'garagem' && auth.temGaragem) return <Garagem ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} getHeaders={auth.getHeaders} transacoes={transacoes} garagem={garagem} />;

    if (['novo_lancamento', 'extrato', 'lancamentos'].includes(telaAtiva)) {
      return <Lancamentos
        modo={telaAtiva} categorias={dashboardManager.categoriasDinamicas} cartoes={setup.cartoes} addTransacao={transacoesManager.addTransacao}
        filtroStatus={dashboardManager.filtroStatus} setFiltroStatus={dashboardManager.setFiltroStatus} buscaTexto={dashboardManager.buscaTexto}
        setBuscaTexto={dashboardManager.setBuscaTexto} mostrarFiltrosAvancados={dashboardManager.mostrarFiltrosAvancados}
        setMostrarFiltrosAvancados={dashboardManager.setMostrarFiltrosAvancados} filtrosAvancados={dashboardManager.filtrosAvancados}
        setFiltrosAvancados={dashboardManager.setFiltrosAvancados} mudarOrdenacao={dashboardManager.mudarOrdenacao} ordenacao={dashboardManager.ordenacao}
        dadosTabela={dashboardManager.dadosTabela} alternarStatusTransacao={transacoesManager.alternarStatusTransacao} editarValor={transacoesManager.editarValor}
        deletarTransacao={transacoesManager.deletarTransacao} executarAcaoEmMassa={transacoesManager.executarAcaoEmMassa} modal={modal}
        nomeUsuario={auth.nomeUsuario} temGaragem={auth.temGaragem} temComprovante={auth.temComprovante} anexarComprovante={transacoesManager.anexarComprovante} verComprovante={transacoesManager.verComprovante}
        dataVis={dataVis} mesAnterior={dashboardManager.mesAnterior} mesProximo={dashboardManager.mesProximo} garagem={garagem}
      />;
    }

    if (telaAtiva === 'investimentos') {
      return <Investimentos API={API} getHeaders={auth.getHeaders} modal={modal} showToast={showToast} />;
    }

    if (telaAtiva === 'calculadora_compra') {
      return <CalculadoraCompra API={API} getHeaders={auth.getHeaders} modal={modal} />;
    }

    return <Dashboard
      nomeUsuario={auth.nomeUsuario} temGaragem={auth.temGaragem} transacoesGlobais={transacoes} transacoesMes={transacoesMes} cartoes={setup.cartoes} dividas={setup.dividas} garagem={garagem}
      dataVis={dataVis} mesAnterior={dashboardManager.mesAnterior} mesProximo={dashboardManager.mesProximo} totRendaPaga={dashboardManager.totRendaPaga}
      totGastoReal={dashboardManager.totGastoReal} totInvestido={dashboardManager.totInvestido} totFaturaCreditoAberto={dashboardManager.totFaturaCreditoAberto}
      saldoAtual={dashboardManager.saldoAtual} previstoFimMes={dashboardManager.previstoFimMes} somarSaldoAnterior={dashboardManager.somarSaldoAnterior}
      setSomarSaldoAnterior={dashboardManager.setSomarSaldoAnterior} categorias={dashboardManager.categoriasDinamicas} gCat={dashboardManager.gCat}
      abrirDetalhesCategoria={dashboardManager.abrirDetalhesCategoria} pendenciasPassadas={dashboardManager.pendenciasPassadas} abrirModalPendencias={dashboardManager.abrirModalPendencias}
      abrirResumoCard={dashboardManager.abrirResumoCard} verFaturasPorCartao={cartoesFaturas.verFaturasPorCartao}
    />;
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#0b1120] overflow-hidden">
      <Sidebar telaAtiva={telaAtiva} setTelaAtiva={setTelaAtiva} isAdmin={auth.isAdmin} temGaragem={auth.temGaragem} fazerLogout={auth.fazerLogout} nomeUsuario={auth.nomeUsuario} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} pendentesSync={offlineSync.pendentes.length} sincronizarAgora={offlineSync.sincronizarAgora} />

      <main className="flex-1 h-full overflow-y-auto relative custom-scrollbar flex flex-col">
        <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-30 sticky top-0">
          <h1 className="text-lg font-black tracking-tight flex items-center gap-2"><span className="text-blue-500">⚡</span> Financeiro</h1>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl cursor-pointer hover:text-blue-400 transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
        </div>
        <Suspense fallback={<Skeleton />}>
          {renderizarConteudoAtivo()}
        </Suspense>
      </main>
      <Modal config={modal.config} onClose={modal.close} />
      <Tutorial visivel={mostrarTutorial} onClose={() => setMostrarTutorial(false)} temGaragem={auth.temGaragem} isAdmin={auth.isAdmin} temComprovante={auth.temComprovante} dispensarTutorial={auth.dispensarTutorial} />
      <Toast toasts={toasts} />
    </div>
  );
}

export default App;