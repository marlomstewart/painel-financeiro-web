/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL;

/**
 * @function formatarMoeda
 * @description Formata valor numérico para BRL.
 */
const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * @function formatarData
 * @description Formata a data ISO para o padrão brasileiro de exibição (dd/mm/aaaa).
 */
const formatarData = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—';

/**
 * @file src/components/Garagem.jsx
 * @description Módulo de gestão automotiva preditiva. Controla veículos, desgaste de peças por odômetro, 
 * linha do tempo de manutenções e rastreio de despesas financeiras associadas.
 */
export function Garagem({ getHeaders, setTelaAtiva, transacoes, ModalComponent, modalConfig, modalClose, garagem }) {

    // ==========================================
    // ESTADOS GLOBAIS DO MÓDULO
    // ==========================================
    const [veiculosLocais, setVeiculosLocais] = useState([]);
    const veiculos = garagem ? garagem.veiculosGaragem : veiculosLocais;
    const setVeiculos = garagem ? garagem.setVeiculosGaragem : setVeiculosLocais;

    const [carregando, setCarregando] = useState(!garagem);

    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [itens, setItens] = useState([]);
    const [manutencoes, setManutencoes] = useState([]);

    // Estados de Controle de Modais
    const [modalVeiculo, setModalVeiculo] = useState(null);
    const [modalItem, setModalItem] = useState(null);
    const [modalManutencao, setModalManutencao] = useState(null);
    const [modalConfirm, setModalConfirm] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados de UI (View Mode)
    const [modoBarras, setModoBarras] = useState('pct');
    const [tipoVeiculoForm, setTipoVeiculoForm] = useState('proprio');

    // ==========================================
    // EFEITOS E CARREGAMENTO INICIAL
    // ==========================================
    useEffect(() => {
        if (!garagem || veiculos.length === 0) {
            carregarVeiculos();
        } else {
            setCarregando(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [garagem]);

    const carregarVeiculos = async () => {
        setCarregando(true);
        try {
            const res = await fetch(`${API}/garagem/veiculos`, { headers: getHeaders() });
            if (res.ok) setVeiculos(await res.json());
        } catch (err) { console.error('Erro de conexão ao carregar veículos:', err); }
        setCarregando(false);
    };

    const carregarDashboard = async (veiculo) => {
        setVeiculoSelecionado(veiculo);
        try {
            const [resI, resM] = await Promise.all([
                fetch(`${API}/garagem/veiculos/${veiculo.id}/itens`, { headers: getHeaders() }),
                fetch(`${API}/garagem/veiculos/${veiculo.id}/manutencoes`, { headers: getHeaders() })
            ]);
            if (resI.ok) setItens(await resI.json());
            if (resM.ok) setManutencoes(await resM.json());
        } catch (err) { console.error(err); }
    };

    // ==========================================
    // CRUD: VEÍCULOS
    // ==========================================
    const salvarVeiculo = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const fd = new FormData(e.target);
        const tipo = fd.get('tipo') || 'proprio';
        const body = {
            modelo: fd.get('modelo'),
            tipo,
            ano_fabricacao: tipo === 'proprio' ? Number(fd.get('ano_fabricacao')) : null,
            ano_modelo: tipo === 'proprio' ? Number(fd.get('ano_modelo')) : null,
            km_atual: tipo === 'proprio' ? Number(fd.get('km_atual')) : 0
        };

        try {
            if (modalVeiculo === 'novo') {
                body.id = Date.now().toString();
                const res = await fetch(`${API}/garagem/veiculos`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
                if (res.ok) { setVeiculos(prev => [...prev, body]); setModalVeiculo(null); }
            } else {
                const res = await fetch(`${API}/garagem/veiculos/${modalVeiculo.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) });
                if (res.ok) {
                    const atualizado = { ...modalVeiculo, ...body };
                    setVeiculos(prev => prev.map(v => v.id === modalVeiculo.id ? atualizado : v));
                    if (veiculoSelecionado?.id === modalVeiculo.id) setVeiculoSelecionado(atualizado);
                    setModalVeiculo(null);
                }
            }
        } finally { setIsSubmitting(false); }
    };

    const solicitarExclusaoVeiculo = (id) => {
        setModalConfirm({
            titulo: '🗑️ Excluir Veículo',
            mensagem: 'Excluir este veículo apagará todos os seus itens mecânicos e histórico de manutenções. Os lançamentos financeiros no extrato não serão apagados. Tem certeza?',
            acao: async () => {
                await fetch(`${API}/garagem/veiculos/${id}`, { method: 'DELETE', headers: getHeaders() });
                setVeiculos(prev => prev.filter(v => v.id !== id));
                if (veiculoSelecionado?.id === id) setVeiculoSelecionado(null);
            }
        });
    };

    // ==========================================
    // CRUD: ITENS DO ODÔMETRO (Desgaste Preditivo)
    // ==========================================
    const salvarItem = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const fd = new FormData(e.target);
        const body = { nome: fd.get('nome'), intervalo_km: Number(fd.get('intervalo_km')), km_ultima_troca: Number(fd.get('km_ultima_troca')) };

        try {
            if (modalItem === 'novo') {
                body.id = Date.now().toString();
                const res = await fetch(`${API}/garagem/veiculos/${veiculoSelecionado.id}/itens`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
                if (res.ok) { setItens(prev => [...prev, body]); setModalItem(null); }
            } else {
                const res = await fetch(`${API}/garagem/itens/${modalItem.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) });
                if (res.ok) { setItens(prev => prev.map(i => i.id === modalItem.id ? { ...modalItem, ...body } : i)); setModalItem(null); }
            }
        } finally { setIsSubmitting(false); }
    };

    const solicitarExclusaoItem = (id) => {
        setModalConfirm({
            titulo: '🗑️ Excluir Item',
            mensagem: 'Deseja remover este item do rastreador de desgaste do odômetro?',
            acao: async () => {
                await fetch(`${API}/garagem/itens/${id}`, { method: 'DELETE', headers: getHeaders() });
                setItens(prev => prev.filter(i => i.id !== id));
            }
        });
    };

    // ==========================================
    // CRUD: MANUTENÇÕES MANUAIS (Histórico)
    // ==========================================
    const salvarManutencao = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const fd = new FormData(e.target);
        const body = { descricao: fd.get('descricao'), km_registro: fd.get('km_registro') ? Number(fd.get('km_registro')) : null, data_registro: fd.get('data_registro'), observacao: fd.get('observacao') };

        try {
            if (modalManutencao === 'novo') {
                body.id = Date.now().toString();
                const res = await fetch(`${API}/garagem/veiculos/${veiculoSelecionado.id}/manutencoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
                if (res.ok) { setManutencoes(prev => [body, ...prev].sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro))); setModalManutencao(null); }
            } else {
                const res = await fetch(`${API}/garagem/manutencoes/${modalManutencao.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) });
                if (res.ok) { setManutencoes(prev => prev.map(m => m.id === modalManutencao.id ? { ...modalManutencao, ...body } : m).sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro))); setModalManutencao(null); }
            }
        } finally { setIsSubmitting(false); }
    };

    const solicitarExclusaoManutencao = (id) => {
        setModalConfirm({
            titulo: '🗑️ Excluir Registro',
            mensagem: 'Deseja apagar este registro do histórico da linha do tempo da sua manutenção?',
            acao: async () => {
                await fetch(`${API}/garagem/manutencoes/${id}`, { method: 'DELETE', headers: getHeaders() });
                setManutencoes(prev => prev.filter(m => m.id !== id));
            }
        });
    };

    const lancamentosVeiculo = veiculoSelecionado
        ? transacoes.filter(t => t.veiculo_id === veiculoSelecionado.id).sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra))
        : [];

    // ==========================================
    // COMPONENTES AUXILIARES (UI OTIMIZADA)
    // ==========================================
    const inputCls = "w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-3.5 md:p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors shadow-sm";
    const labelCls = "text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 md:mb-1 block";
    const btnSalvar = `flex-1 font-bold py-3.5 md:py-2.5 rounded-lg text-sm transition-colors shadow-sm flex justify-center items-center gap-2 ${isSubmitting ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-[0.98]'}`;
    const btnCancelar = "flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 md:py-2.5 rounded-lg text-sm transition-colors cursor-pointer border border-transparent dark:border-slate-700 active:scale-[0.98]";

    const renderLoadingIcon = () => (
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    );

    const ModalInterno = ({ titulo, children, onFechar }) => (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 transition-colors duration-300 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={onFechar}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md border border-slate-200 dark:border-slate-800 transition-colors duration-300 animate-scale-in relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Cabeçalho do Modal Mobile-First */}
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">{titulo}</h3>
                    <button type="button" onClick={onFechar} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="p-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );

    const ModalEConfirmacoesBase = () => (
        <>
            <ModalComponent config={modalConfig} onClose={modalClose} />

            {modalConfirm && (
                <ModalInterno titulo={modalConfirm.titulo} onFechar={() => setModalConfirm(null)}>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">{modalConfirm.mensagem}</p>
                    <div className="flex gap-3">
                        <button onClick={() => setModalConfirm(null)} className={btnCancelar} disabled={isSubmitting}>Cancelar</button>
                        <button onClick={async () => { setIsSubmitting(true); await modalConfirm.acao(); setIsSubmitting(false); setModalConfirm(null); }} className={`flex-1 font-bold py-3.5 md:py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md ${isSubmitting ? 'bg-red-400 text-white cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'}`}>
                            {isSubmitting ? renderLoadingIcon() : 'Sim, Excluir'}
                        </button>
                    </div>
                </ModalInterno>
            )}

            {modalVeiculo && (
                <ModalInterno titulo={modalVeiculo === 'novo' ? '🚗 Cadastrar Veículo' : '✏️ Editar Veículo'} onFechar={() => !isSubmitting && setModalVeiculo(null)}>
                    <form onSubmit={salvarVeiculo} className="space-y-5">
                        <div>
                            <label className={labelCls}>Tipo de Veículo</label>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setTipoVeiculoForm('proprio')} className={`flex-1 py-3 md:py-2 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer shadow-sm ${tipoVeiculoForm === 'proprio' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-200 dark:ring-blue-900/20' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>🚗 Próprio</button>
                                <button type="button" onClick={() => setTipoVeiculoForm('convidado')} className={`flex-1 py-3 md:py-2 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer shadow-sm ${tipoVeiculoForm === 'convidado' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-2 ring-amber-200 dark:ring-amber-900/20' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>🤝 Convidado</button>
                            </div>
                            <input type="hidden" name="tipo" value={tipoVeiculoForm} />
                        </div>
                        <div><label className={labelCls}>{tipoVeiculoForm === 'convidado' ? 'Nome/Descrição' : 'Modelo'}</label><input name="modelo" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.modelo : ''} placeholder={tipoVeiculoForm === 'convidado' ? 'Ex: Carro do meu pai' : 'Ex: Honda Biz 125'} required className={inputCls} /></div>
                        {tipoVeiculoForm === 'proprio' && (
                            <>
                                <div className="flex gap-4">
                                    <div className="flex-1"><label className={labelCls}>Ano Fab.</label><input name="ano_fabricacao" type="number" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.ano_fabricacao : ''} placeholder="2020" required={tipoVeiculoForm === 'proprio'} className={inputCls} /></div>
                                    <div className="flex-1"><label className={labelCls}>Ano Modelo</label><input name="ano_modelo" type="number" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.ano_modelo : ''} placeholder="2021" required={tipoVeiculoForm === 'proprio'} className={inputCls} /></div>
                                </div>
                                <div><label className={labelCls}>KM Atual</label><input name="km_atual" type="number" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.km_atual : '0'} required={tipoVeiculoForm === 'proprio'} className={`${inputCls} font-bold text-blue-600 dark:text-blue-400`} /></div>
                            </>
                        )}
                        {tipoVeiculoForm === 'convidado' && <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3.5 leading-relaxed font-medium">💡 Veículos convidados não rastreiam quilometragem nem peças mecânicas. Eles servem apenas para organizar gastos eventuais (como gasolina) quando você usa um veículo emprestado.</p>}

                        <div className="flex gap-3 pt-2 mt-2">
                            <button type="button" onClick={() => setModalVeiculo(null)} disabled={isSubmitting} className={btnCancelar}>Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className={btnSalvar}>{isSubmitting ? <>{renderLoadingIcon()} Salvando...</> : 'Salvar Veículo'}</button>
                        </div>
                    </form>
                </ModalInterno>
            )}
        </>
    );

    // ==========================================
    // VISÃO 1: LISTAGEM DA FROTA (DASHBOARD)
    // ==========================================
    if (!veiculoSelecionado) {
        return (
            <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 relative animate-fade-in">
                <ModalEConfirmacoesBase />

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            🏍️ Minha Garagem
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Selecione um veículo para auditar histórico mecânico e financeiro.
                        </p>
                    </div>
                    <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row items-center justify-start sm:justify-end gap-3 mt-2 md:mt-0">
                        <button type="button" onClick={() => setTelaAtiva('dashboard')} className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3 md:py-2.5 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm transition-colors cursor-pointer shadow-sm border border-transparent dark:border-slate-700 active:scale-[0.98]">
                            ← Painel Principal
                        </button>
                        <button type="button" onClick={() => { setTipoVeiculoForm('proprio'); setModalVeiculo('novo'); }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 md:py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-[0.98]">
                            <span>+</span> Novo Veículo
                        </button>
                    </div>
                </div>

                {carregando ? (
                    <div className="text-center py-20 text-slate-400 dark:text-slate-500 animate-pulse font-bold">Carregando frota do banco de dados...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                        <button type="button" onClick={() => { setTipoVeiculoForm('proprio'); setModalVeiculo('novo'); }} className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all group cursor-pointer active:scale-[0.98]">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <span className="text-3xl group-hover:scale-110 transition-transform">➕</span>
                            </div>
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Cadastrar Novo Veículo</span>
                        </button>

                        {veiculos.map(v => (
                            <div key={v.id} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col ${v.tipo === 'convidado' ? 'border-amber-200 dark:border-amber-800/50' : ''}`}>
                                <div role="button" tabIndex={0} onClick={() => carregarDashboard(v)} className="p-6 cursor-pointer flex-1 flex flex-col active:scale-[0.98] transition-transform">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-800/50">
                                            <span className="text-3xl">{v.tipo === 'convidado' ? '🤝' : '🚗'}</span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-sm ${v.tipo === 'convidado' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
                                            {v.tipo === 'convidado' ? 'Convidado' : 'Próprio'}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg leading-tight truncate">{v.modelo}</h3>

                                    {v.tipo === 'convidado' ? (
                                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 mt-2 bg-amber-50 dark:bg-amber-900/10 inline-block px-2 py-1 rounded">Veículo de terceiros</p>
                                    ) : (
                                        <div className="mt-auto pt-4 space-y-1">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Odômetro Atual</p>
                                            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{Number(v.km_atual).toLocaleString('pt-BR')} <span className="text-sm font-bold text-indigo-400 dark:text-indigo-600">km</span></p>
                                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase mt-1">Ano Fab/Mod: {v.ano_fabricacao}/{v.ano_modelo}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-700 flex bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                                    <button type="button" onClick={() => { setTipoVeiculoForm(v.tipo || 'proprio'); setModalVeiculo(v); }} className="flex-1 py-3.5 md:py-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-800 transition-colors cursor-pointer rounded-bl-xl active:bg-blue-200 dark:active:bg-slate-700">✏️ Editar</button>
                                    <div className="w-px bg-slate-200 dark:bg-slate-700/50 my-2"></div>
                                    <button type="button" onClick={() => solicitarExclusaoVeiculo(v.id)} className="flex-1 py-3.5 md:py-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors cursor-pointer rounded-br-xl active:bg-rose-200 dark:active:bg-rose-800">🗑️ Excluir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const kmAtual = Number(veiculoSelecionado.km_atual);

    // ==========================================
    // VISÃO 2: DASHBOARD DO VEÍCULO (Selecionado)
    // ==========================================
    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-24 relative animate-fade-in">
            <ModalEConfirmacoesBase />

            {/* MODAL: ITEM DE DESGASTE */}
            {modalItem && (
                <ModalInterno titulo={modalItem === 'novo' ? '⚙️ Novo Rastreio de Peça' : '✏️ Editar Rastreio'} onFechar={() => !isSubmitting && setModalItem(null)}>
                    <form onSubmit={salvarItem} className="space-y-5">
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded-lg p-3 mb-2 flex items-center justify-between shadow-sm">
                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Odômetro Mestre</span>
                            <span className="font-black text-indigo-800 dark:text-indigo-300">{kmAtual.toLocaleString('pt-BR')} km</span>
                        </div>
                        <div><label className={labelCls}>Nome da Peça / Fluido</label><input name="nome" defaultValue={modalItem !== 'novo' ? modalItem.nome : ''} placeholder="Ex: Óleo de Motor, Lona de Freio..." required className={inputCls} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelCls}>Vida Útil (km)</label><input name="intervalo_km" type="number" defaultValue={modalItem !== 'novo' ? modalItem.intervalo_km : ''} placeholder="Ex: 1000" required className={inputCls} /></div>
                            <div><label className={labelCls}>Última Troca (km)</label><input name="km_ultima_troca" type="number" defaultValue={modalItem !== 'novo' ? modalItem.km_ultima_troca : kmAtual} required className={`${inputCls} font-bold`} /></div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">O sistema calculará quando a próxima troca deve ocorrer baseando-se no Odômetro Mestre da garagem.</p>

                        <div className="flex gap-3 pt-3 mt-2">
                            <button type="button" onClick={() => setModalItem(null)} disabled={isSubmitting} className={btnCancelar}>Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className={btnSalvar}>{isSubmitting ? <>{renderLoadingIcon()} Salvando...</> : 'Salvar Rastreador'}</button>
                        </div>
                    </form>
                </ModalInterno>
            )}

            {/* MODAL: REGISTRO HISTÓRICO MANUAL */}
            {modalManutencao && (
                <ModalInterno titulo={modalManutencao === 'novo' ? '🔧 Registrar Intervenção' : '✏️ Editar Registro'} onFechar={() => !isSubmitting && setModalManutencao(null)}>
                    <form onSubmit={salvarManutencao} className="space-y-5">
                        <div><label className={labelCls}>Resumo do Serviço</label><input name="descricao" defaultValue={modalManutencao !== 'novo' ? modalManutencao.descricao : ''} placeholder="Ex: Aperto da corrente, Troca de fusível..." required className={inputCls} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelCls}>Data</label><input name="data_registro" type="date" defaultValue={modalManutencao !== 'novo' ? modalManutencao.data_registro?.split('T')[0] : new Date().toISOString().split('T')[0]} required className={inputCls} /></div>
                            <div><label className={labelCls}>KM na Época (Opcional)</label><input name="km_registro" type="number" defaultValue={modalManutencao !== 'novo' ? modalManutencao.km_registro : ''} placeholder={kmAtual} className={inputCls} /></div>
                        </div>
                        <div>
                            <label className={labelCls}>Diagnóstico / Observações</label>
                            <textarea name="observacao" defaultValue={modalManutencao !== 'novo' ? modalManutencao.observacao : ''} placeholder="Descreva os problemas encontrados ou detalhes técnicos da peça instalada..." rows={3} className={inputCls + " resize-none"} />
                        </div>
                        <div className="flex gap-3 pt-3 mt-2">
                            <button type="button" onClick={() => setModalManutencao(null)} disabled={isSubmitting} className={btnCancelar}>Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className={btnSalvar}>{isSubmitting ? <>{renderLoadingIcon()} Registrando...</> : 'Salvar no Histórico'}</button>
                        </div>
                    </form>
                </ModalInterno>
            )}

            {/* CABEÇALHO DO VEÍCULO ESPECÍFICO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 transition-colors">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <button type="button" onClick={() => setVeiculoSelecionado(null)} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-xl font-black border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 active:scale-95">←</button>
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 truncate">
                            {veiculoSelecionado.tipo === 'convidado' ? '🤝' : '🚗'} {veiculoSelecionado.modelo}
                        </h1>
                        {veiculoSelecionado.tipo === 'convidado' ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Veículo de uso esporádico (Terceiros)</p>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">{Number(kmAtual).toLocaleString('pt-BR')} km</span>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ano: {veiculoSelecionado.ano_fabricacao}/{veiculoSelecionado.ano_modelo}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-center gap-3">
                    <button type="button" onClick={() => { setTipoVeiculoForm(veiculoSelecionado.tipo || 'proprio'); setModalVeiculo(veiculoSelecionado); }} className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 px-5 py-3 md:py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm active:scale-[0.98]">
                        ✏️ Atualizar KM / Editar
                    </button>
                    <button type="button" onClick={() => setTelaAtiva('dashboard')} className="w-full sm:w-auto bg-slate-800 dark:bg-slate-700 text-white border border-slate-800 dark:border-slate-600 hover:bg-slate-900 dark:hover:bg-slate-600 px-5 py-3 md:py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm active:scale-[0.98]">
                        Ir para Dashboard Central
                    </button>
                </div>
            </div>

            {/* GRADES E PAINÉIS DE DADOS */}
            <div className={`grid grid-cols-1 ${veiculoSelecionado.tipo !== 'convidado' ? 'lg:grid-cols-2' : ''} gap-5 md:gap-6`}>

                {/* BLOCO: ODÔMETRO DE DESGASTE PREDITIVO (Apenas Veículos Próprios) */}
                {veiculoSelecionado.tipo !== 'convidado' && (
                    <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <div>
                                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">⚙️ Rastreador de Peças</h2>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold">Baseado no odômetro atual ({kmAtual.toLocaleString()}km)</p>
                            </div>
                            <div className="flex items-center w-full sm:w-auto bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-lg border border-transparent dark:border-slate-700">
                                <button type="button" onClick={() => setModoBarras('pct')} className={`flex-1 sm:flex-none px-4 py-2 sm:py-1.5 rounded-md text-xs sm:text-[10px] uppercase font-bold transition-colors cursor-pointer ${modoBarras === 'pct' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Visualizar %</button>
                                <button type="button" onClick={() => setModoBarras('km')} className={`flex-1 sm:flex-none px-4 py-2 sm:py-1.5 rounded-md text-xs sm:text-[10px] uppercase font-bold transition-colors cursor-pointer ${modoBarras === 'km' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Visualizar KM</button>
                            </div>
                        </div>

                        {itens.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                                <span className="text-3xl opacity-50 mb-3">🛠️</span>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sem rastreio ativo</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">Cadastre o óleo do motor, filtro de ar ou velas para que o painel avise a hora exata da troca.</p>
                                <button type="button" onClick={() => setModalItem('novo')} className="mt-5 text-white bg-blue-600 hover:bg-blue-700 font-bold text-sm py-2.5 px-6 rounded-lg cursor-pointer transition-colors shadow-sm active:scale-95">+ Iniciar Rastreamento</button>
                            </div>
                        ) : (
                            <div className="space-y-4 flex-1">
                                {itens.sort((a, b) => {
                                    const pctA = Math.min(((kmAtual - Number(a.km_ultima_troca)) / Number(a.intervalo_km)) * 100, 100);
                                    const pctB = Math.min(((kmAtual - Number(b.km_ultima_troca)) / Number(b.intervalo_km)) * 100, 100);
                                    return pctB - pctA; // Ordena do mais desgastado pro menos
                                }).map(item => {
                                    const kmDesdeUltima = Math.max(kmAtual - Number(item.km_ultima_troca), 0);
                                    const intervalo = Number(item.intervalo_km);
                                    const pct = Math.min((kmDesdeUltima / intervalo) * 100, 100);
                                    const kmFaltando = Math.max(intervalo - kmDesdeUltima, 0);

                                    // Sistema Semafórico de Cores Preditivas
                                    const isCritico = pct >= 90;
                                    const isAlerta = pct >= 70 && !isCritico;
                                    const corBarra = isCritico ? 'bg-rose-500 dark:bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.6)]' : isAlerta ? 'bg-amber-400 dark:bg-amber-500' : 'bg-emerald-500 dark:bg-emerald-600';
                                    const corTexto = isCritico ? 'text-rose-600 dark:text-rose-400' : isAlerta ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
                                    const bgCard = isCritico ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50' : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700';

                                    return (
                                        <div key={item.id} className={`border rounded-xl p-4 md:p-5 shadow-sm transition-colors relative overflow-hidden ${bgCard}`}>
                                            {isCritico && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 dark:bg-rose-500/5 rounded-bl-full pointer-events-none"></div>}

                                            <div className="flex justify-between items-center mb-3.5 relative z-10">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0 pr-2">
                                                    <span className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base tracking-tight truncate">{item.nome}</span>
                                                    {isCritico && <span className="inline-flex w-max items-center gap-1 text-[9px] uppercase bg-rose-600 text-white font-black px-2 py-0.5 rounded shadow-sm animate-pulse">⚠️ Troca Imediata</span>}
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <span className={`text-base md:text-lg font-black tracking-tighter ${corTexto}`}>
                                                        {modoBarras === 'pct' ? `${pct.toFixed(0)}%` : `${kmFaltando.toLocaleString('pt-BR')} km`}
                                                    </span>
                                                    <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        <button type="button" onClick={() => setModalItem(item)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Editar Intervalo/KM">✏️</button>
                                                        <button type="button" onClick={() => solicitarExclusaoItem(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Excluir Rastreio">🗑️</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-3 overflow-hidden shadow-inner relative z-10 border border-slate-300 dark:border-slate-800">
                                                <div className={`${corBarra} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-3 relative z-10">
                                                <span>Trocou em: <strong className="text-slate-700 dark:text-slate-300">{Number(item.km_ultima_troca).toLocaleString('pt-BR')} km</strong></span>
                                                <span>Vida Útil: <strong className="text-slate-700 dark:text-slate-300">{intervalo.toLocaleString('pt-BR')} km</strong></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <button type="button" onClick={() => setModalItem('novo')} className="mt-5 w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 font-bold py-3.5 md:py-3 rounded-xl text-sm transition-all cursor-pointer shadow-sm active:scale-[0.98]">+ Monitorar Nova Peça</button>
                    </div>
                )}

                {/* BLOCO: LINHA DO TEMPO (TIMELINE) DE MANUTENÇÕES MANUAIS */}
                {veiculoSelecionado.tipo !== 'convidado' && (
                    <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">🛠️ Histórico Clínico</h2>
                            <button type="button" onClick={() => setModalManutencao('novo')} className="w-full sm:w-auto bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold px-5 py-3 md:py-2.5 rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-95">
                                <span>+</span> Registrar Serviço
                            </button>
                        </div>

                        {manutencoes.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                                <span className="text-3xl opacity-50 mb-3">📋</span>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Ficha limpa</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">Registre limpezas de bico, diagnósticos elétricos, troca de pneu ou reparos mecânicos aqui para criar um histórico valioso.</p>
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 md:ml-4 space-y-6 pb-4 mt-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {manutencoes.map((m, index) => (
                                    <div key={m.id} className="relative pl-6 md:pl-8 group">
                                        {/* Ponto da Linha do Tempo */}
                                        <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-slate-800 group-hover:bg-indigo-500 transition-colors shadow-sm"></span>

                                        <div className="p-4 md:p-5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                                            <div className="flex justify-between items-start gap-4 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base leading-tight truncate">{m.descricao}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        {m.data_registro && <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">{formatarData(m.data_registro)}</span>}
                                                        {m.km_registro && <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">{Number(m.km_registro).toLocaleString('pt-BR')} km</span>}
                                                    </div>
                                                </div>
                                                {/* Mini menu de contexto (Hover) */}
                                                <div className="flex gap-1 shrink-0 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <button type="button" onClick={() => setModalManutencao(m)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" title="Editar Registro">✏️</button>
                                                    <button type="button" onClick={() => solicitarExclusaoManutencao(m.id)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" title="Excluir Registro">🗑️</button>
                                                </div>
                                            </div>
                                            {m.observacao && (
                                                <div className="mt-3 bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 shadow-inner">
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic leading-relaxed whitespace-pre-wrap">{m.observacao}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* BLOCO: LANÇAMENTOS FINANCEIROS ATRELADOS (Para Próprios e Convidados) */}
                <div className={`bg-white dark:bg-slate-800 p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors ${veiculoSelecionado.tipo === 'convidado' ? 'lg:col-span-2' : 'lg:col-span-2 xl:col-span-2'}`}>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-1">💸 Custos Associados (Extrato)</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Transações extraídas automaticamente do Livro-Razão atreladas a esta placa.</p>

                    {lancamentosVeiculo.length === 0 ? (
                        <div className="text-center py-10 px-4 text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl font-semibold bg-slate-50 dark:bg-slate-900/30">
                            <span className="text-3xl opacity-50 mb-3 block">💳</span>
                            <p>Nenhum custo registrado para este veículo.</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-normal">Ao registrar uma despesa no painel principal, selecione a categoria Gasolina/Manutenção e vincule a quilometragem.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {lancamentosVeiculo.map(t => (
                                <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800">
                                    <div className="min-w-0 flex-1 pr-4">
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate leading-tight">{t.descricao}</p>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>📅 {formatarData(t.dataCompra)}</span>
                                            {t.km_moto && <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">🏍️ {Number(t.km_moto).toLocaleString('pt-BR')} km</span>}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                        <p className="font-black text-base text-rose-600 dark:text-rose-400">{formatarMoeda(t.valorParcela)}</p>
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm ${t.status === 'pago' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'}`}>{t.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}