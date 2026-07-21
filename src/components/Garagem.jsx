/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';

/**
 * @constant {string} API
 * @description URL base da API consumida pela aplicação. 
 * Centralizada estritamente na variável de ambiente do Vite.
 */
const API = import.meta.env.VITE_API_URL;

const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarData = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—';

/**
 * @function Garagem
 * @description Componente visual para a gestão da frota de veículos, incluindo odômetros, manutenções 
 * manuais e rastreio automatizado de lançamentos financeiros atrelados aos veículos.
 * @returns {JSX.Element}
 */
export function Garagem({ getHeaders, setTelaAtiva, transacoes, ModalComponent, modalConfig, modalClose, garagem }) {

    const [veiculosLocais, setVeiculosLocais] = useState([]);
    const veiculos = garagem ? garagem.veiculosGaragem : veiculosLocais;
    const setVeiculos = garagem ? garagem.setVeiculosGaragem : setVeiculosLocais;

    const [carregando, setCarregando] = useState(!garagem);

    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [itens, setItens] = useState([]);
    const [manutencoes, setManutencoes] = useState([]);

    const [modalVeiculo, setModalVeiculo] = useState(null);
    const [modalItem, setModalItem] = useState(null);
    const [modalManutencao, setModalManutencao] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalConfirm, setModalConfirm] = useState(null);

    const [modoBarras, setModoBarras] = useState('pct');
    const [tipoVeiculoForm, setTipoVeiculoForm] = useState('proprio');

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
            mensagem: 'Excluir este veículo apagará todos os seus itens e manutenções. Tem certeza?',
            acao: async () => {
                await fetch(`${API}/garagem/veiculos/${id}`, { method: 'DELETE', headers: getHeaders() });
                setVeiculos(prev => prev.filter(v => v.id !== id));
                if (veiculoSelecionado?.id === id) setVeiculoSelecionado(null);
            }
        });
    };

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
            mensagem: 'Deseja remover este item de manutenção do odômetro?',
            acao: async () => {
                await fetch(`${API}/garagem/itens/${id}`, { method: 'DELETE', headers: getHeaders() });
                setItens(prev => prev.filter(i => i.id !== id));
            }
        });
    };

    const salvarManutencao = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const fd = new FormData(e.target);
        const body = { descricao: fd.get('descricao'), km_registro: fd.get('km_registro') ? Number(fd.get('km_registro')) : null, data_registro: fd.get('data_registro'), observacao: fd.get('observacao') };

        try {
            if (modalManutencao === 'novo') {
                body.id = Date.now().toString();
                const res = await fetch(`${API}/garagem/veiculos/${veiculoSelecionado.id}/manutencoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
                if (res.ok) { setManutencoes(prev => [body, ...prev]); setModalManutencao(null); }
            } else {
                const res = await fetch(`${API}/garagem/manutencoes/${modalManutencao.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) });
                if (res.ok) { setManutencoes(prev => prev.map(m => m.id === modalManutencao.id ? { ...modalManutencao, ...body } : m)); setModalManutencao(null); }
            }
        } finally { setIsSubmitting(false); }
    };

    const solicitarExclusaoManutencao = (id) => {
        setModalConfirm({
            titulo: '🗑️ Excluir Registro',
            mensagem: 'Deseja apagar este histórico de manutenção manual?',
            acao: async () => {
                await fetch(`${API}/garagem/manutencoes/${id}`, { method: 'DELETE', headers: getHeaders() });
                setManutencoes(prev => prev.filter(m => m.id !== id));
            }
        });
    };

    const lancamentosVeiculo = veiculoSelecionado
        ? transacoes.filter(t => t.veiculo_id === veiculoSelecionado.id).sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra))
        : [];

    const ModalInterno = ({ titulo, children, onFechar }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onFechar}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300 animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 tracking-tight">{titulo}</h3>
                    {children}
                </div>
            </div>
        </div>
    );

    const inputCls = "w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors";
    const btnSalvar = `flex-1 font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm flex justify-center items-center gap-2 ${isSubmitting ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'}`;
    const btnCancelar = "flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer border border-transparent dark:border-slate-700";

    const renderLoadingIcon = () => (
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    );

    if (!veiculoSelecionado) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 text-slate-800 dark:text-slate-200 transition-colors duration-300 relative">
                <ModalComponent config={modalConfig} onClose={modalClose} />

                {/* MODAL GLOBAL DE CONFIRMAÇÃO EXCLUSÃO (Para Veículos) */}
                {modalConfirm && (
                    <ModalInterno titulo={modalConfirm.titulo} onFechar={() => setModalConfirm(null)}>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 whitespace-pre-wrap">{modalConfirm.mensagem}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setModalConfirm(null)} className={btnCancelar} disabled={isSubmitting}>Cancelar</button>
                            <button onClick={async () => { setIsSubmitting(true); await modalConfirm.acao(); setIsSubmitting(false); setModalConfirm(null); }} className={`flex-1 font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'bg-red-400 text-white cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'}`}>
                                {isSubmitting ? renderLoadingIcon() : 'Sim, Excluir'}
                            </button>
                        </div>
                    </ModalInterno>
                )}

                {modalVeiculo && (
                    <ModalInterno titulo={modalVeiculo === 'novo' ? '🚗 Cadastrar Veículo' : '✏️ Editar Veículo'} onFechar={() => !isSubmitting && setModalVeiculo(null)}>
                        <form onSubmit={salvarVeiculo} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Tipo de Veículo</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setTipoVeiculoForm('proprio')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors cursor-pointer ${tipoVeiculoForm === 'proprio' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>🚗 Próprio</button>
                                    <button type="button" onClick={() => setTipoVeiculoForm('convidado')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors cursor-pointer ${tipoVeiculoForm === 'convidado' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>🤝 Convidado</button>
                                </div>
                                <input type="hidden" name="tipo" value={tipoVeiculoForm} />
                            </div>

                            <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">{tipoVeiculoForm === 'convidado' ? 'Nome/Descrição' : 'Modelo'}</label><input name="modelo" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.modelo : ''} placeholder={tipoVeiculoForm === 'convidado' ? 'Ex: Carro do meu pai' : 'Ex: Honda Biz 125'} required className={inputCls} /></div>

                            {tipoVeiculoForm === 'proprio' && (
                                <>
                                    <div className="flex gap-2">
                                        <div className="flex-1"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Ano Fab.</label><input name="ano_fabricacao" type="number" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.ano_fabricacao : ''} placeholder="2020" required={tipoVeiculoForm === 'proprio'} className={inputCls} /></div>
                                        <div className="flex-1"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Ano Modelo</label><input name="ano_modelo" type="number" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.ano_modelo : ''} placeholder="2021" required={tipoVeiculoForm === 'proprio'} className={inputCls} /></div>
                                    </div>
                                    <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">KM Atual</label><input name="km_atual" type="number" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.km_atual : '0'} required={tipoVeiculoForm === 'proprio'} className={inputCls} /></div>
                                </>
                            )}

                            {tipoVeiculoForm === 'convidado' && <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 leading-tight font-medium">💡 Veículos convidados não pedem KM nem itens de manutenção — servem apenas para vincular gastos (ex: gasolina) quando você usa um veículo de terceiros.</p>}

                            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setModalVeiculo(null)} disabled={isSubmitting} className={btnCancelar}>Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className={btnSalvar}>{isSubmitting ? <>{renderLoadingIcon()} Salvando...</> : 'Salvar Veículo'}</button>
                            </div>
                        </form>
                    </ModalInterno>
                )}

                <div className="mx-auto max-w-4xl">
                    {/* CABEÇALHO FIXO - VISÃO GERAL DE VEÍCULOS */}
                    <div className="sticky top-0 z-40 pt-4 md:pt-8 pb-4 -mt-4 md:-mt-8 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md mb-8">
                        <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🏍️ Garagem</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Selecione um veículo para ver o dashboard</p>
                            </div>
                            <button type="button" onClick={() => setTelaAtiva('dashboard')} className="bg-slate-900 dark:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 text-sm cursor-pointer transition-colors shadow-sm">← Voltar</button>
                        </header>
                    </div>

                    {carregando ? (
                        <div className="text-center py-20 text-slate-400 dark:text-slate-500 animate-pulse font-bold">Carregando frota...</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <button type="button" onClick={() => { setTipoVeiculoForm('proprio'); setModalVeiculo('novo'); }} className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all group cursor-pointer">
                                <span className="text-4xl group-hover:scale-110 transition-transform">➕</span>
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Cadastrar Veículo</span>
                            </button>

                            {veiculos.map(v => (
                                <div key={v.id} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden ${v.tipo === 'convidado' ? 'border-amber-200 dark:border-amber-800/50' : ''}`}>
                                    <div role="button" tabIndex={0} onClick={() => carregarDashboard(v)} className="p-5 cursor-pointer">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-3xl">{v.tipo === 'convidado' ? '🤝' : '🚗'}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${v.tipo === 'convidado' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'}`}>
                                                {v.tipo === 'convidado' ? 'Convidado' : 'Próprio'}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">{v.modelo}</h3>
                                        {v.tipo === 'convidado' ? (
                                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">Veículo de terceiros</p>
                                        ) : (
                                            <>
                                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">{v.ano_fabricacao}/{v.ano_modelo}</p>
                                                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-3">{Number(v.km_atual).toLocaleString('pt-BR')} km</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="border-t border-slate-100 dark:border-slate-700 flex">
                                        <button type="button" onClick={() => { setTipoVeiculoForm(v.tipo || 'proprio'); setModalVeiculo(v); }} className="flex-1 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">✏️ Editar</button>
                                        <button type="button" onClick={() => solicitarExclusaoVeiculo(v.id)} className="flex-1 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors border-l border-slate-100 dark:border-slate-700 cursor-pointer">🗑️ Excluir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const kmAtual = Number(veiculoSelecionado.km_atual);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 md:p-8 text-slate-800 dark:text-slate-200 transition-colors duration-300 relative">
            <ModalComponent config={modalConfig} onClose={modalClose} />

            {/* MODAL GLOBAL DE CONFIRMAÇÃO EXCLUSÃO (Para Dashboard) */}
            {modalConfirm && (
                <ModalInterno titulo={modalConfirm.titulo} onFechar={() => setModalConfirm(null)}>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 whitespace-pre-wrap">{modalConfirm.mensagem}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setModalConfirm(null)} className={btnCancelar} disabled={isSubmitting}>Cancelar</button>
                        <button onClick={async () => { setIsSubmitting(true); await modalConfirm.acao(); setIsSubmitting(false); setModalConfirm(null); }} className={`flex-1 font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'bg-rose-400 text-white cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'}`}>
                            {isSubmitting ? renderLoadingIcon() : 'Sim, Excluir'}
                        </button>
                    </div>
                </ModalInterno>
            )}

            {modalVeiculo && (
                <ModalInterno titulo="✏️ Editar Veículo" onFechar={() => !isSubmitting && setModalVeiculo(null)}>
                    <form onSubmit={salvarVeiculo} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Tipo de Veículo</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setTipoVeiculoForm('proprio')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors cursor-pointer ${tipoVeiculoForm === 'proprio' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>🚗 Próprio</button>
                                <button type="button" onClick={() => setTipoVeiculoForm('convidado')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors cursor-pointer ${tipoVeiculoForm === 'convidado' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>🤝 Convidado</button>
                            </div>
                            <input type="hidden" name="tipo" value={tipoVeiculoForm} />
                        </div>
                        <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">{tipoVeiculoForm === 'convidado' ? 'Nome/Descrição' : 'Modelo'}</label><input name="modelo" defaultValue={modalVeiculo.modelo} required className={inputCls} /></div>
                        {tipoVeiculoForm === 'proprio' && (
                            <>
                                <div className="flex gap-2">
                                    <div className="flex-1"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Ano Fab.</label><input name="ano_fabricacao" type="number" defaultValue={modalVeiculo.ano_fabricacao} required className={inputCls} /></div>
                                    <div className="flex-1"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Ano Modelo</label><input name="ano_modelo" type="number" defaultValue={modalVeiculo.ano_modelo} required className={inputCls} /></div>
                                </div>
                                <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">KM Atual</label><input name="km_atual" type="number" defaultValue={modalVeiculo.km_atual} required className={inputCls} /></div>
                            </>
                        )}
                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onClick={() => setModalVeiculo(null)} disabled={isSubmitting} className={btnCancelar}>Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className={btnSalvar}>{isSubmitting ? <>{renderLoadingIcon()} Salvando...</> : 'Salvar'}</button>
                        </div>
                    </form>
                </ModalInterno>
            )}

            {modalItem && (
                <ModalInterno titulo={modalItem === 'novo' ? '⚙️ Novo Item de Manutenção' : '✏️ Editar Item'} onFechar={() => !isSubmitting && setModalItem(null)}>
                    <form onSubmit={salvarItem} className="space-y-4">
                        <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Nome do Item</label><input name="nome" defaultValue={modalItem !== 'novo' ? modalItem.nome : ''} placeholder="Ex: Óleo do Motor" required className={inputCls} /></div>
                        <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Intervalo (km)</label><input name="intervalo_km" type="number" defaultValue={modalItem !== 'novo' ? modalItem.intervalo_km : ''} placeholder="Ex: 1000" required className={inputCls} /></div>
                        <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">KM da Última Troca</label><input name="km_ultima_troca" type="number" defaultValue={modalItem !== 'novo' ? modalItem.km_ultima_troca : '0'} required className={inputCls} /></div>
                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onClick={() => setModalItem(null)} disabled={isSubmitting} className={btnCancelar}>Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className={btnSalvar}>{isSubmitting ? <>{renderLoadingIcon()} Salvando...</> : 'Salvar Item'}</button>
                        </div>
                    </form>
                </ModalInterno>
            )}

            {modalManutencao && (
                <ModalInterno titulo={modalManutencao === 'novo' ? '🔧 Registrar Manutenção' : '✏️ Editar Registro'} onFechar={() => !isSubmitting && setModalManutencao(null)}>
                    <form onSubmit={salvarManutencao} className="space-y-4">
                        <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Descrição</label><input name="descricao" defaultValue={modalManutencao !== 'novo' ? modalManutencao.descricao : ''} placeholder="Ex: Esticar corrente" required className={inputCls} /></div>
                        <div className="flex gap-3">
                            <div className="flex-1"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Data</label><input name="data_registro" type="date" defaultValue={modalManutencao !== 'novo' ? modalManutencao.data_registro?.split('T')[0] : new Date().toISOString().split('T')[0]} required className={inputCls} /></div>
                            <div className="flex-1"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">KM (opcional)</label><input name="km_registro" type="number" defaultValue={modalManutencao !== 'novo' ? modalManutencao.km_registro : ''} placeholder="Ex: 12500" className={inputCls} /></div>
                        </div>
                        <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Observação (opcional)</label><textarea name="observacao" defaultValue={modalManutencao !== 'novo' ? modalManutencao.observacao : ''} placeholder="Detalhes adicionais..." rows={2} className={inputCls + " resize-none"} /></div>
                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onClick={() => setModalManutencao(null)} disabled={isSubmitting} className={btnCancelar}>Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className={btnSalvar}>{isSubmitting ? <>{renderLoadingIcon()} Salvando...</> : 'Salvar Registro'}</button>
                        </div>
                    </form>
                </ModalInterno>
            )}

            <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">

                {/* CABEÇALHO FIXO - VISÃO DO DASHBOARD DO VEÍCULO */}
                <div className="sticky top-0 z-40 pt-2 md:pt-8 pb-4 -mt-2 md:-mt-8 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md mb-4 md:mb-6">
                    <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 gap-3 transition-colors">
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setVeiculoSelecionado(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl cursor-pointer transition-colors">←</button>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{veiculoSelecionado.modelo}</h1>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{veiculoSelecionado.ano_fabricacao}/{veiculoSelecionado.ano_modelo} • {Number(kmAtual).toLocaleString('pt-BR')} km</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button type="button" onClick={() => { setTipoVeiculoForm(veiculoSelecionado.tipo || 'proprio'); setModalVeiculo(veiculoSelecionado); }} className="flex-1 md:flex-none bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2.5 rounded-lg text-sm font-bold border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer">✏️ Editar</button>
                            <button type="button" onClick={() => setTelaAtiva('dashboard')} className="flex-1 md:flex-none bg-slate-900 dark:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 text-sm border border-transparent dark:border-slate-600 cursor-pointer transition-colors shadow-sm">← Painel</button>
                        </div>
                    </header>
                </div>

                <div className={`grid grid-cols-1 ${veiculoSelecionado.tipo !== 'convidado' ? 'lg:grid-cols-2' : ''} gap-4 md:gap-6`}>

                    {veiculoSelecionado.tipo !== 'convidado' && (
                        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">⚙️ Odômetro de Desgaste</h2>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-transparent dark:border-slate-700">
                                    <button type="button" onClick={() => setModoBarras('pct')} className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-colors cursor-pointer ${modoBarras === 'pct' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>% Uso</button>
                                    <button type="button" onClick={() => setModoBarras('km')} className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-colors cursor-pointer ${modoBarras === 'km' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>KM Falta</button>
                                </div>
                            </div>

                            {itens.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                    <p className="font-semibold">Nenhum item cadastrado ainda.</p>
                                    <button type="button" onClick={() => setModalItem('novo')} className="mt-3 text-white bg-blue-600 hover:bg-blue-700 font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors shadow-sm">+ Adicionar item</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {itens.map(item => {
                                        const kmDesdeUltima = kmAtual - Number(item.km_ultima_troca);
                                        const intervalo = Number(item.intervalo_km);
                                        const pct = Math.min((kmDesdeUltima / intervalo) * 100, 100);
                                        const kmFaltando = Math.max(intervalo - kmDesdeUltima, 0);
                                        const corBarra = pct >= 90 ? 'bg-rose-500 dark:bg-rose-600' : pct >= 70 ? 'bg-amber-400 dark:bg-amber-500' : 'bg-emerald-500 dark:bg-emerald-600';
                                        const corTexto = pct >= 90 ? 'text-rose-600 dark:text-rose-400' : pct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';

                                        return (
                                            <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900/20 shadow-sm">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-tight">{item.nome}</span>
                                                        {pct >= 90 && <span className="text-[10px] uppercase bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 font-black px-2 py-0.5 rounded shadow-sm">⚠️ Trocar</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-xs font-black ${corTexto}`}>
                                                            {modoBarras === 'pct' ? `${pct.toFixed(0)}%` : `${kmFaltando.toLocaleString('pt-BR')} km`}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            <button type="button" onClick={() => setModalItem(item)} className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer" title="Editar">✏️</button>
                                                            <button type="button" onClick={() => solicitarExclusaoItem(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer" title="Excluir">🗑️</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                                                    <div className={`${corBarra} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-2">
                                                    <span>Última troca: <strong className="text-slate-500 dark:text-slate-400">{Number(item.km_ultima_troca).toLocaleString('pt-BR')} km</strong></span>
                                                    <span>Intervalo: <strong className="text-slate-500 dark:text-slate-400">{intervalo.toLocaleString('pt-BR')} km</strong></span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <button type="button" onClick={() => setModalItem('novo')} className="mt-4 w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold py-3 rounded-xl text-sm transition-all cursor-pointer shadow-sm">+ Adicionar Novo Item</button>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4">💸 Lançamentos Financeiros</h2>
                        {lancamentosVeiculo.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl font-semibold">
                                <p>Nenhum lançamento vinculado.</p>
                                <p className="text-xs text-slate-400 mt-1 font-normal">Cadastre uma despesa associada a este veículo na aba de Lançamentos.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {lancamentosVeiculo.map(t => (
                                    <div key={t.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                                        <div className="min-w-0 flex-1 pr-3">
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate leading-tight">{t.descricao}</p>
                                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{formatarData(t.dataCompra)} {t.km_moto ? `• ${Number(t.km_moto).toLocaleString('pt-BR')} km` : ''}</p>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                            <p className="font-black text-sm text-slate-800 dark:text-slate-100">{formatarMoeda(t.valorParcela)}</p>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm ${t.status === 'pago' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>{t.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {veiculoSelecionado.tipo !== 'convidado' && (
                        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors lg:col-span-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">🔧 Manutenções Manuais</h2>
                                <button type="button" onClick={() => setModalManutencao('novo')} className="w-full sm:w-auto bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2">
                                    <span>+</span> Registrar Manutenção
                                </button>
                            </div>
                            {manutencoes.length === 0 ? (
                                <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl font-semibold">Nenhuma manutenção registrada ainda.</p>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                                    {manutencoes.map(m => (
                                        <div key={m.id} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight">{m.descricao}</p>
                                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                                                        {m.data_registro ? formatarData(m.data_registro) : ''}
                                                        {m.km_registro ? ` • ${Number(m.km_registro).toLocaleString('pt-BR')} km` : ''}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 shrink-0 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <button type="button" onClick={() => setModalManutencao(m)} className="text-slate-400 hover:text-blue-500 cursor-pointer transition-colors" title="Editar">✏️</button>
                                                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                                                    <button type="button" onClick={() => solicitarExclusaoManutencao(m.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer transition-colors" title="Excluir">🗑️</button>
                                                </div>
                                            </div>
                                            {m.observacao && <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-3 bg-white dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50">{m.observacao}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}