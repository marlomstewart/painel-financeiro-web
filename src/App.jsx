import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './components/Modal';
import { Login } from './components/Login';
import { TrocaSenha } from './components/TrocaSenha';
import { Admin } from './components/Admin';
import { Setup } from './components/Setup';
import { Dashboard } from './components/Dashboard';
import { Garagem } from './components/Garagem';

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

function useModal() {
  const [config, setConfig] = useState(null);
  const close = useCallback(() => setConfig(null), []);
  const alert = useCallback((message, title, opts = {}) => new Promise(resolve => setConfig({ type: 'alert', title, message, onConfirm: resolve, onClose: () => { setConfig(null); resolve(); }, ...opts })), []);
  const confirm = useCallback((message, title, opts = {}) => new Promise(resolve => setConfig({ type: 'confirm', title, message, onConfirm: () => resolve(true), onCancel: () => resolve(false), onClose: () => { setConfig(null); resolve(false); }, ...opts })), []);
  const prompt = useCallback((message, defaultValue = '', title, opts = {}) => new Promise(resolve => setConfig({ type: 'prompt', title, message, defaultValue, onConfirm: (val) => resolve(val), onCancel: () => resolve(null), onClose: () => { setConfig(null); resolve(null); }, ...opts })), []);
  const options = useCallback((message, opts_list, title, opts = {}) => new Promise(resolve => setConfig({ type: 'options', title, message, options: opts_list, onConfirm: (val) => resolve(val), onCancel: () => resolve(null), onClose: () => { setConfig(null); resolve(null); }, ...opts })), []);
  return { config, close, setConfig, alert, confirm, prompt, options };
}

function App() {
  const modal = useModal();
  const { toast, showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [carregouAPI, setCarregouAPI] = useState(false);

  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  const [dataVis, setDataVis] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });
  const [transacoes, setTransacoes] = useState([]);

  const auth = useAuth({ API, modal, setCarregouAPI });
  const setup = useSetup({ API, getHeaders: auth.getHeaders, modal, setTransacoes });
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

  const exportarCSV = () => { /* Export mantido no Setup */ };

  if (!auth.token && !auth.precisaTrocarSenha) return <><Login fazerLogin={auth.fazerLogin} usuarioLogin={auth.usuarioLogin} setUsuarioLogin={auth.setUsuarioLogin} senhaLogin={auth.senhaLogin} setSenhaLogin={auth.setSenhaLogin} erroLogin={auth.erroLogin} modalConfig={modal.config} modalClose={modal.close} ModalComponent={Modal} /><Toast toast={toast} /><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></>;
  if (auth.precisaTrocarSenha) return <><TrocaSenha enviarNovaSenha={auth.enviarNovaSenha} novaSenha={auth.novaSenha} setNovaSenha={auth.setNovaSenha} confirmarSenha={auth.confirmarSenha} setConfirmarSenha={auth.setConfirmarSenha} erroTrocaSenha={auth.erroTrocaSenha} fazerLogout={auth.fazerLogout} /><Toast toast={toast} /><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></>;
  if (auth.token && !carregouAPI) return <><DashboardSkeleton /><Toast toast={toast} /><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></>;

  if (telaAtiva === 'admin') return <Admin ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} criarUsuario={auth.criarUsuario} carregarUsuarios={auth.carregarUsuarios} usuarios={auth.usuarios} toggleAdmin={auth.toggleAdmin} resetarSenha={auth.resetarSenha} deletarUsuario={auth.deletarUsuario} />;
  if (telaAtiva === 'setup') return <Setup ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} exportarCSV={exportarCSV} getHeaders={auth.getHeaders} gerarMesManual={setup.gerarMesManual} gerandoMes={setup.gerandoMes} addCartao={setup.addCartao} cartoes={setup.cartoes} setCartoes={setup.setCartoes} addCategoria={setup.addCategoria} categorias={setup.categorias} setCategorias={setup.setCategorias} addContaFixa={setup.addContaFixa} contasFixas={setup.contasFixas} setContasFixas={setup.setContasFixas} addRendaFixa={setup.addRendaFixa} rendasFixas={setup.rendasFixas} setRendasFixas={setup.setRendasFixas} removerSetup={setup.removerSetup} />;
  if (telaAtiva === 'garagem') return <><Garagem ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close} setTelaAtiva={setTelaAtiva} getHeaders={auth.getHeaders} transacoes={transacoes} /><Toast toast={toast} /><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></>;

  return (
    <>
      <Dashboard
        nomeUsuario={auth.nomeUsuario} alertaMoto={garagem.alertaMoto} abrirDetalhesCategoria={dashboardManager.abrirDetalhesCategoria}
        dataVis={dataVis} mesAnterior={dashboardManager.mesAnterior} mesProximo={dashboardManager.mesProximo}
        isAdmin={auth.isAdmin} setTelaAtiva={setTelaAtiva} carregarUsuarios={auth.carregarUsuarios} fazerLogout={auth.fazerLogout}
        totRendaPaga={dashboardManager.totRendaPaga} totGastoReal={dashboardManager.totGastoReal} totInvestido={dashboardManager.totInvestido}
        verFaturasPorCartao={cartoesFaturas.verFaturasPorCartao} totFaturaCreditoAberto={dashboardManager.totFaturaCreditoAberto}
        saldoMesAnterior={dashboardManager.saldoMesAnterior} somarSaldoAnterior={dashboardManager.somarSaldoAnterior} setSomarSaldoAnterior={dashboardManager.setSomarSaldoAnterior}
        saldoAtual={dashboardManager.saldoAtual} saldoMesAtual={dashboardManager.saldoMesAtual} mesAntRef={dashboardManager.mesAntRef} previstoFimMes={dashboardManager.previstoFimMes}
        categorias={dashboardManager.categoriasDinamicas} gCat={dashboardManager.gCat} cartoes={setup.cartoes}
        filtroStatus={dashboardManager.filtroStatus} setFiltroStatus={dashboardManager.setFiltroStatus} buscaTexto={dashboardManager.buscaTexto} setBuscaTexto={dashboardManager.setBuscaTexto}
        mostrarFiltrosAvancados={dashboardManager.mostrarFiltrosAvancados} setMostrarFiltrosAvancados={dashboardManager.setMostrarFiltrosAvancados} filtrosAvancados={dashboardManager.filtrosAvancados} setFiltrosAvancados={dashboardManager.setFiltrosAvancados}
        mudarOrdenacao={dashboardManager.mudarOrdenacao} ordenacao={dashboardManager.ordenacao} dadosTabela={dashboardManager.dadosTabela}
        pendenciasPassadas={dashboardManager.pendenciasPassadas} abrirModalPendencias={dashboardManager.abrirModalPendencias} abrirResumoCard={dashboardManager.abrirResumoCard}
        ModalComponent={Modal} modalConfig={modal.config} modalClose={modal.close}
        addTransacao={transacoesManager.addTransacao} alternarStatusTransacao={transacoesManager.alternarStatusTransacao} editarValor={transacoesManager.editarValor} deletarTransacao={transacoesManager.deletarTransacao} executarAcaoEmMassa={transacoesManager.executarAcaoEmMassa}
        anexarComprovante={transacoesManager.anexarComprovante} removerComprovante={transacoesManager.removerComprovante} verComprovante={transacoesManager.verComprovante} pagarFaturaCartao={cartoesFaturas.pagarFaturaCartao}
      />
      <Toast toast={toast} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </>
  );
}

export default App;