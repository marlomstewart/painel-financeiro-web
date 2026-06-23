/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';

const API = 'https://painel-gestao-financeira-api.onrender.com/api';
const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarData = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—';

export function Garagem({ getHeaders, setTelaAtiva, transacoes, ModalComponent, modalConfig, modalClose }) {

    const [veiculos, setVeiculos] = useState([]);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [itens, setItens] = useState([]);
    const [manutencoes, setManutencoes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const [modalVeiculo, setModalVeiculo] = useState(null);
    const [modalItem, setModalItem] = useState(null);
    const [modalManutencao, setModalManutencao] = useState(null);

    const [modoBarras, setModoBarras] = useState('pct');
    const [tipoVeiculoForm, setTipoVeiculoForm] = useState('proprio');

    useEffect(() => {
        carregarVeiculos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const carregarVeiculos = async () => {
        setCarregando(true);
        try {
            const res = await fetch(`${API}/garagem/veiculos`, { headers: getHeaders() });
            if (res.ok) {
                const dados = await res.json();
                setVeiculos(dados);
            } else {
                const erro = await res.json().catch(() => ({}));
                console.error('Erro ao carregar veículos:', res.status, erro);
                alert(`Erro ao carregar veículos (${res.status}): ${erro.error || erro.message || 'desconhecido'}`);
            }
        } catch (err) {
            console.error('Erro de conexão ao carregar veículos:', err);
            alert('Erro de conexão ao carregar veículos. Verifique sua internet.');
        }
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
        const fd = new FormData(e.target);
        const tipo = fd.get('tipo') || 'proprio';
        const body = {
            modelo: fd.get('modelo'),
            tipo,
            ano_fabricacao: tipo === 'proprio' ? Number(fd.get('ano_fabricacao')) : null,
            ano_modelo: tipo === 'proprio' ? Number(fd.get('ano_modelo')) : null,
            km_atual: tipo === 'proprio' ? Number(fd.get('km_atual')) : 0
        };

        if (modalVeiculo === 'novo') {
            body.id = Date.now().toString();
            try {
                const res = await fetch(`${API}/garagem/veiculos`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
                if (res.ok) {
                    setVeiculos(prev => [...prev, body]);
                    setModalVeiculo(null);
                } else {
                    const erro = await res.json().catch(() => ({}));
                    alert(`Erro ao salvar veículo: ${erro.error || erro.message || 'erro desconhecido'}`);
                }
            } catch (err) {
                alert('Erro de conexão ao salvar veículo.');
            }
        } else {
            const res = await fetch(`${API}/garagem/veiculos/${modalVeiculo.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) });
            if (res.ok) {
                const atualizado = { ...modalVeiculo, ...body };
                setVeiculos(prev => prev.map(v => v.id === modalVeiculo.id ? atualizado : v));
                if (veiculoSelecionado?.id === modalVeiculo.id) setVeiculoSelecionado(atualizado);
                setModalVeiculo(null);
            }
        }
    };

    const excluirVeiculo = async (id) => {
        if (!window.confirm('Excluir este veículo e todos os seus dados?')) return;
        await fetch(`${API}/garagem/veiculos/${id}`, { method: 'DELETE', headers: getHeaders() });
        setVeiculos(prev => prev.filter(v => v.id !== id));
        if (veiculoSelecionado?.id === id) setVeiculoSelecionado(null);
    };

    const salvarItem = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const body = { nome: fd.get('nome'), intervalo_km: Number(fd.get('intervalo_km')), km_ultima_troca: Number(fd.get('km_ultima_troca')) };

        if (modalItem === 'novo') {
            body.id = Date.now().toString();
            const res = await fetch(`${API}/garagem/veiculos/${veiculoSelecionado.id}/itens`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
            if (res.ok) { setItens(prev => [...prev, body]); setModalItem(null); }
        } else {
            const res = await fetch(`${API}/garagem/itens/${modalItem.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) });
            if (res.ok) { setItens(prev => prev.map(i => i.id === modalItem.id ? { ...modalItem, ...body } : i)); setModalItem(null); }
        }
    };

    const excluirItem = async (id) => {
        if (!window.confirm('Excluir este item?')) return;
        await fetch(`${API}/garagem/itens/${id}`, { method: 'DELETE', headers: getHeaders() });
        setItens(prev => prev.filter(i => i.id !== id));
    };

    const salvarManutencao = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const body = { descricao: fd.get('descricao'), km_registro: fd.get('km_registro') ? Number(fd.get('km_registro')) : null, data_registro: fd.get('data_registro'), observacao: fd.get('observacao') };

        if (modalManutencao === 'novo') {
            body.id = Date.now().toString();
            const res = await fetch(`${API}/garagem/veiculos/${veiculoSelecionado.id}/manutencoes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
            if (res.ok) { setManutencoes(prev => [body, ...prev]); setModalManutencao(null); }
        } else {
            const res = await fetch(`${API}/garagem/manutencoes/${modalManutencao.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) });
            if (res.ok) { setManutencoes(prev => prev.map(m => m.id === modalManutencao.id ? { ...modalManutencao, ...body } : m)); setModalManutencao(null); }
        }
    };

    const excluirManutencao = async (id) => {
        if (!window.confirm('Excluir este registro?')) return;
        await fetch(`${API}/garagem/manutencoes/${id}`, { method: 'DELETE', headers: getHeaders() });
        setManutencoes(prev => prev.filter(m => m.id !== id));
    };

    const lancamentosVeiculo = veiculoSelecionado
        ? transacoes.filter(t => t.veiculo_id === veiculoSelecionado.id).sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra))
        : [];

    const ModalInterno = ({ titulo, children, onFechar }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onFechar}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-transparent dark:border-slate-700 transition-colors duration-300" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">{titulo}</h3>
                    {children}
                </div>
            </div>
        </div>
    );

    const inputCls = "w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors";
    const btnSalvar = "flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer";
    const btnCancelar = "flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer";

    if (!veiculoSelecionado) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 text-slate-800 dark:text-slate-200 transition-colors duration-300">
                <ModalComponent config={modalConfig} onClose={modalClose} />

                {modalVeiculo && (
                    <ModalInterno titulo={modalVeiculo === 'novo' ? '🚗 Cadastrar Veículo' : '✏️ Editar Veículo'} onFechar={() => setModalVeiculo(null)}>
                        <form onSubmit={salvarVeiculo} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Tipo de Veículo</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setTipoVeiculoForm('proprio')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors cursor-pointer ${tipoVeiculoForm === 'proprio' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>🚗 Próprio</button>
                                    <button type="button" onClick={() => setTipoVeiculoForm('convidado')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors cursor-pointer ${tipoVeiculoForm === 'convidado' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>🤝 Convidado</button>
                                </div>
                                <input type="hidden" name="tipo" value={tipoVeiculoForm} />
                            </div>

                            <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">{tipoVeiculoForm === 'convidado' ? 'Nome/Descrição' : 'Modelo'}</label><input name="modelo" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.modelo : ''} placeholder={tipoVeiculoForm === 'convidado' ? 'Ex: Carro do meu pai' : 'Ex: Honda Biz 125'} required className={inputCls} /></div>

                            {tipoVeiculoForm === 'proprio' && (
                                <>
                                    <div className="flex gap-2">
                                        <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Ano Fab.</label><input name="ano_fabricacao" type="number" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.ano_fabricacao : ''} placeholder="2020" required={tipoVeiculoForm === 'proprio'} className={inputCls} /></div>
                                        <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Ano Modelo</label><input name="ano_modelo" type="number" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.ano_modelo : ''} placeholder="2021" required={tipoVeiculoForm === 'proprio'} className={inputCls} /></div>
                                    </div>
                                    <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">KM Atual</label><input name="km_atual" type="number" defaultValue={modalVeiculo !== 'novo' ? modalVeiculo.km_atual : '0'} required={tipoVeiculoForm === 'proprio'} className={inputCls} /></div>
                                </>
                            )}

                            {tipoVeiculoForm === 'convidado' && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                                    💡 Veículos convidados não pedem KM nem itens de manutenção — servem apenas para vincular gastos (ex: gasolina) quando você usa um veículo de terceiros.
                                </p>
                            )}

                            <div className="flex gap-2 pt-1"><button type="button" onClick={() => setModalVeiculo(null)} className={btnCancelar}>Cancelar</button><button type="submit" className={btnSalvar}>Salvar</button></div>
                        </form>
                    </ModalInterno>
                )}

                <div className="mx-auto max-w-4xl">
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🏍️ Garagem</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Selecione um veículo para ver o dashboard</p>
                        </div>
                        <button type="button" onClick={() => setTelaAtiva('dashboard')} className="bg-slate-900 dark:bg-slate-800 text-white font-medium py-2 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 text-sm cursor-pointer transition-colors border border-transparent dark:border-slate-700">← Voltar</button>
                    </header>

                    {carregando ? (
                        <div className="text-center py-20 text-slate-400 dark:text-slate-500 animate-pulse">Carregando frota...</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <button type="button" onClick={() => { setTipoVeiculoForm('proprio'); setModalVeiculo('novo'); }} className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all group cursor-pointer">
                                <span className="text-4xl">➕</span>
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Cadastrar Veículo</span>
                            </button>

                            {veiculos.map(v => (
                                <div key={v.id} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden ${v.tipo === 'convidado' ? 'border-amber-200 dark:border-amber-800/50' : ''}`}>
                                    <div role="button" tabIndex={0} onClick={() => carregarDashboard(v)} className="p-5 cursor-pointer">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-3xl">{v.tipo === 'convidado' ? '🤝' : '🚗'}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.tipo === 'convidado' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'}`}>
                                                {v.tipo === 'convidado' ? 'Convidado' : 'Próprio'}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">{v.modelo}</h3>
                                        {v.tipo === 'convidado' ? (
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Veículo de terceiros</p>
                                        ) : (
                                            <>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{v.ano_fabricacao}/{v.ano_modelo}</p>
                                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-3">{Number(v.km_atual).toLocaleString('pt-BR')} km</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="border-t border-slate-100 dark:border-slate-700 flex">
                                        <button type="button" onClick={() => { setTipoVeiculoForm(v.tipo || 'proprio'); setModalVeiculo(v); }} className="flex-1 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">✏️ Editar</button>
                                        <button type="button" onClick={() => excluirVeiculo(v.id)} className="flex-1 py-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-slate-100 dark:border-slate-700 cursor-pointer">🗑️ Excluir</button>
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 md:p-8 text-slate-800 dark:text-slate-200 transition-colors duration-300">
            <ModalComponent config={modalConfig} onClose={modalClose} />

            {modalVeiculo && (
                <ModalInterno titulo="✏️ Editar Veículo" onFechar={() => setModalVeiculo(null)}>
                    <form onSubmit={salvarVeiculo} className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Tipo de Veículo</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setTipoVeiculoForm('proprio')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors cursor-pointer ${tipoVeiculoForm === 'proprio' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>🚗 Próprio</button>
                                <button type="button" onClick={() => setTipoVeiculoForm('convidado')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors cursor-pointer ${tipoVeiculoForm === 'convidado' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>🤝 Convidado</button>
                            </div>
                            <input type="hidden" name="tipo" value={tipoVeiculoForm} />
                        </div>
                        <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">{tipoVeiculoForm === 'convidado' ? 'Nome/Descrição' : 'Modelo'}</label><input name="modelo" defaultValue={modalVeiculo.modelo} required className={inputCls} /></div>
                        {tipoVeiculoForm === 'proprio' && (
                            <>
                                <div className="flex gap-2">
                                    <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Ano Fab.</label><input name="ano_fabricacao" type="number" defaultValue={modalVeiculo.ano_fabricacao} required className={inputCls} /></div>
                                    <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Ano Modelo</label><input name="ano_modelo" type="number" defaultValue={modalVeiculo.ano_modelo} required className={inputCls} /></div>
                                </div>
                                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">KM Atual</label><input name="km_atual" type="number" defaultValue={modalVeiculo.km_atual} required className={inputCls} /></div>
                            </>
                        )}
                        <div className="flex gap-2 pt-1"><button type="button" onClick={() => setModalVeiculo(null)} className={btnCancelar}>Cancelar</button><button type="submit" className={btnSalvar}>Salvar</button></div>
                    </form>
                </ModalInterno>
            )}

            {modalItem && (
                <ModalInterno titulo={modalItem === 'novo' ? '⚙️ Novo Item de Manutenção' : '✏️ Editar Item'} onFechar={() => setModalItem(null)}>
                    <form onSubmit={salvarItem} className="space-y-3">
                        <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Nome do Item</label><input name="nome" defaultValue={modalItem !== 'novo' ? modalItem.nome : ''} placeholder="Ex: Óleo do Motor" required className={inputCls} /></div>
                        <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Intervalo (km)</label><input name="intervalo_km" type="number" defaultValue={modalItem !== 'novo' ? modalItem.intervalo_km : ''} placeholder="Ex: 1000" required className={inputCls} /></div>
                        <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">KM da Última Troca</label><input name="km_ultima_troca" type="number" defaultValue={modalItem !== 'novo' ? modalItem.km_ultima_troca : '0'} required className={inputCls} /></div>
                        <div className="flex gap-2 pt-1"><button type="button" onClick={() => setModalItem(null)} className={btnCancelar}>Cancelar</button><button type="submit" className={btnSalvar}>Salvar</button></div>
                    </form>
                </ModalInterno>
            )}

            {modalManutencao && (
                <ModalInterno titulo={modalManutencao === 'novo' ? '🔧 Registrar Manutenção' : '✏️ Editar Registro'} onFechar={() => setModalManutencao(null)}>
                    <form onSubmit={salvarManutencao} className="space-y-3">
                        <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Descrição</label><input name="descricao" defaultValue={modalManutencao !== 'novo' ? modalManutencao.descricao : ''} placeholder="Ex: Esticar corrente" required className={inputCls} /></div>
                        <div className="flex gap-2">
                            <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Data</label><input name="data_registro" type="date" defaultValue={modalManutencao !== 'novo' ? modalManutencao.data_registro?.split('T')[0] : new Date().toISOString().split('T')[0]} required className={inputCls} /></div>
                            <div className="flex-1"><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">KM (opcional)</label><input name="km_registro" type="number" defaultValue={modalManutencao !== 'novo' ? modalManutencao.km_registro : ''} placeholder="Ex: 12500" className={inputCls} /></div>
                        </div>
                        <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Observação (opcional)</label><textarea name="observacao" defaultValue={modalManutencao !== 'novo' ? modalManutencao.observacao : ''} placeholder="Detalhes adicionais..." rows={2} className={inputCls + " resize-none"} /></div>
                        <div className="flex gap-2 pt-1"><button type="button" onClick={() => setModalManutencao(null)} className={btnCancelar}>Cancelar</button><button type="submit" className={btnSalvar}>Salvar</button></div>
                    </form>
                </ModalInterno>
            )}

            <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 gap-3 transition-colors">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => setVeiculoSelecionado(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl cursor-pointer transition-colors">←</button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{veiculoSelecionado.modelo}</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{veiculoSelecionado.ano_fabricacao}/{veiculoSelecionado.ano_modelo} • {Number(kmAtual).toLocaleString('pt-BR')} km</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => { setTipoVeiculoForm(veiculoSelecionado.tipo || 'proprio'); setModalVeiculo(veiculoSelecionado); }} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-2 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer">✏️ Editar</button>
                        <button type="button" onClick={() => setTelaAtiva('dashboard')} className="bg-slate-900 dark:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 text-sm border border-transparent dark:border-slate-600 cursor-pointer transition-colors">← Painel</button>
                    </div>
                </header>

                <div className={`grid grid-cols-1 ${veiculoSelecionado.tipo !== 'convidado' ? 'lg:grid-cols-2' : ''} gap-4 md:gap-6`}>

                    {veiculoSelecionado.tipo !== 'convidado' && (
                        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase">⚙️ Odômetro de Desgaste</h2>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-transparent dark:border-slate-700">
                                    <button type="button" onClick={() => setModoBarras('pct')} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${modoBarras === 'pct' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>% Uso</button>
                                    <button type="button" onClick={() => setModoBarras('km')} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${modoBarras === 'km' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>KM Faltando</button>
                                </div>
                            </div>

                            {itens.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                                    <p>Nenhum item cadastrado ainda.</p>
                                    <button type="button" onClick={() => setModalItem('novo')} className="mt-2 text-blue-500 dark:text-blue-400 hover:underline font-medium text-xs cursor-pointer">+ Adicionar primeiro item</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {itens.map(item => {
                                        const kmDesdeUltima = kmAtual - Number(item.km_ultima_troca);
                                        const intervalo = Number(item.intervalo_km);
                                        const pct = Math.min((kmDesdeUltima / intervalo) * 100, 100);
                                        const kmFaltando = Math.max(intervalo - kmDesdeUltima, 0);
                                        const corBarra = pct >= 90 ? 'bg-red-500 dark:bg-red-600' : pct >= 70 ? 'bg-amber-400 dark:bg-amber-500' : 'bg-emerald-500 dark:bg-emerald-600';
                                        const corTexto = pct >= 90 ? 'text-red-600 dark:text-red-400' : pct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';

                                        return (
                                            <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-900/20">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{item.nome}</span>
                                                        {pct >= 90 && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold px-1.5 py-0.5 rounded">⚠️ Trocar!</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold ${corTexto}`}>
                                                            {modoBarras === 'pct' ? `${pct.toFixed(0)}%` : `${kmFaltando.toLocaleString('pt-BR')} km`}
                                                        </span>
                                                        <button type="button" onClick={() => setModalItem(item)} className="text-blue-400 hover:text-blue-600 text-xs cursor-pointer">✏️</button>
                                                        <button type="button" onClick={() => excluirItem(item.id)} className="text-red-400 hover:text-red-600 text-xs cursor-pointer">🗑️</button>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                    <div className={`${corBarra} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                                    <span>Última troca: {Number(item.km_ultima_troca).toLocaleString('pt-BR')} km</span>
                                                    <span>Intervalo: {intervalo.toLocaleString('pt-BR')} km</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <button type="button" onClick={() => setModalItem('novo')} className="mt-4 w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2 rounded-lg text-sm transition-all cursor-pointer">+ Adicionar Item</button>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-4">💸 Lançamentos Financeiros</h2>
                        {lancamentosVeiculo.length === 0 ? (
                            <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">Nenhum lançamento vinculado a este veículo.</p>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {lancamentosVeiculo.map(t => (
                                    <div key={t.id} className="flex justify-between items-start p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-sm transition-colors">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{t.descricao}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatarData(t.dataCompra)} {t.km_moto ? `• ${Number(t.km_moto).toLocaleString('pt-BR')} km` : ''}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{formatarMoeda(t.valorParcela)}</p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.status === 'pago' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>{t.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {veiculoSelecionado.tipo !== 'convidado' && (
                        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors md:col-span-2 lg:col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase">🔧 Manutenções Manuais</h2>
                                <button type="button" onClick={() => setModalManutencao('novo')} className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer">+ Registrar</button>
                            </div>
                            {manutencoes.length === 0 ? (
                                <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">Nenhuma manutenção registrada ainda.</p>
                            ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {manutencoes.map(m => (
                                        <div key={m.id} className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-sm transition-colors">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium text-slate-800 dark:text-slate-200">{m.descricao}</p>
                                                <div className="flex gap-1 shrink-0 ml-2">
                                                    <button type="button" onClick={() => setModalManutencao(m)} className="text-blue-400 hover:text-blue-600 cursor-pointer text-xs">✏️</button>
                                                    <button type="button" onClick={() => excluirManutencao(m.id)} className="text-red-400 hover:text-red-600 cursor-pointer text-xs">🗑️</button>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                {m.data_registro ? formatarData(m.data_registro) : ''}
                                                {m.km_registro ? ` • ${Number(m.km_registro).toLocaleString('pt-BR')} km` : ''}
                                            </p>
                                            {m.observacao && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{m.observacao}</p>}
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