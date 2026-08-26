import React, { useState } from 'react';
import {
    X, ChevronDown, LayoutDashboard, Wallet, Plus, ClipboardList,
    TrendingDown, Repeat, HandCoins, Handshake, CreditCard, PiggyBank,
    Target, TrendingUp, Bike, Settings, Users, LogOut, HelpCircle, RefreshCw, Calculator,
    Cloud, CloudOff // 🔥 Ícones de Nuvem Adicionados
} from 'lucide-react';
import logo from '../assets/logo.png';

const MenuItem = ({ id, Icone, titulo, telaAtiva, onClick, isSub = false }) => {
    const ativo = telaAtiva === id;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors text-sm font-medium ${isSub ? 'pl-11' : ''} ${ativo ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-500' : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}`}
        >
            <Icone className="w-4.5 h-4.5 shrink-0" strokeWidth={2} />
            <span className="truncate">{titulo}</span>
        </button>
    );
};

const MenuExpansivel = ({ Icone, titulo, telaAtiva, isOpen, onToggle, children }) => {
    const isChildActive = children.some(child => child.props.id === telaAtiva);

    return (
        <div className="flex flex-col">
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-sm font-medium ${isChildActive && !isOpen ? 'text-blue-400 border-l-4 border-blue-500/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <Icone className="w-4.5 h-4.5 shrink-0" strokeWidth={2} />
                    <span className="truncate">{titulo}</span>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2.25} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                {children}
            </div>
        </div>
    );
};

export function Sidebar({ telaAtiva, setTelaAtiva, isAdmin, temGaragem, fazerLogout, nomeUsuario, isMobileMenuOpen, setIsMobileMenuOpen, pendentesSync = 0, sincronizarAgora, isSyncing = false }) {

    const [openMenus, setOpenMenus] = useState({
        lancamentos: ['novo_lancamento', 'extrato'].includes(telaAtiva),
        despesas: ['contas_fixas', 'dividas'].includes(telaAtiva)
    });

    const [telaSincronizada, setTelaSincronizada] = useState(telaAtiva);
    if (telaAtiva !== telaSincronizada) {
        setTelaSincronizada(telaAtiva);
        const proximoEstado = { ...openMenus };
        if (['novo_lancamento', 'extrato'].includes(telaAtiva)) proximoEstado.lancamentos = true;
        if (['contas_fixas', 'dividas'].includes(telaAtiva)) proximoEstado.despesas = true;
        setOpenMenus(proximoEstado);
    }

    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    const handleNavegacao = (tela) => {
        setTelaAtiva(tela);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu" />
            )}

            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-[#0b1120] border-r border-slate-800/60 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 shadow-2xl md:shadow-none'}`}>

                <div className="p-5 md:p-6 border-b border-slate-800/60 flex justify-between items-start md:items-center shrink-0">
                    <div className="flex items-center gap-3 min-w-0 w-full">
                        <img src={logo} alt="FinControle" className="w-9 h-9 rounded-xl shrink-0 object-contain" />
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-extrabold text-white tracking-tight truncate">FinControle</h1>

                                {/* 🔥 INDICADOR TÁTIL DE NUVEM AQUI */}
                                <button
                                    type="button"
                                    onClick={sincronizarAgora}
                                    className="group flex items-center justify-center transition-all focus:outline-none shrink-0"
                                    title={isSyncing ? "Sincronizando com a nuvem..." : pendentesSync > 0 ? `${pendentesSync} item(ns) aguardando rede. Clique para forçar.` : "Tudo salvo na nuvem"}
                                >
                                    {isSyncing ? (
                                        <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" strokeWidth={2.5} />
                                    ) : pendentesSync > 0 ? (
                                        <div className="relative">
                                            <CloudOff className="w-4 h-4 text-amber-500 group-hover:text-amber-400 transition-colors" strokeWidth={2.5} />
                                            <span className="absolute -top-1 -right-1.5 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-slate-900 text-[8px] font-black text-white items-center justify-center">{pendentesSync}</span>
                                            </span>
                                        </div>
                                    ) : (
                                        <Cloud className="w-4 h-4 text-emerald-500/30 hover:text-emerald-400 transition-colors" strokeWidth={2.5} />
                                    )}
                                </button>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                                Olá, {nomeUsuario || 'Usuário'}
                            </p>
                        </div>
                    </div>

                    <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 bg-slate-800/50 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-lg border border-slate-700/50 transition-colors cursor-pointer shrink-0" aria-label="Fechar menu lateral">
                        <X className="w-5 h-5" strokeWidth={2} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar flex flex-col gap-1">
                    <MenuItem id="dashboard" Icone={LayoutDashboard} titulo="Dashboard" telaAtiva={telaAtiva} onClick={() => handleNavegacao('dashboard')} />

                    <MenuExpansivel id="lancamentos" Icone={Wallet} titulo="Lançamentos" telaAtiva={telaAtiva} isOpen={openMenus.lancamentos} onToggle={() => toggleMenu('lancamentos')}>
                        <MenuItem id="novo_lancamento" Icone={Plus} titulo="Novo Lançamento" isSub telaAtiva={telaAtiva} onClick={() => handleNavegacao('novo_lancamento')} />
                        <MenuItem id="extrato" Icone={ClipboardList} titulo="Extrato" isSub telaAtiva={telaAtiva} onClick={() => handleNavegacao('extrato')} />
                    </MenuExpansivel>

                    <MenuExpansivel id="despesas" Icone={TrendingDown} titulo="Despesas" telaAtiva={telaAtiva} isOpen={openMenus.despesas} onToggle={() => toggleMenu('despesas')}>
                        <MenuItem id="contas_fixas" Icone={Repeat} titulo="Contas Fixas" isSub telaAtiva={telaAtiva} onClick={() => handleNavegacao('contas_fixas')} />
                        <MenuItem id="dividas" Icone={HandCoins} titulo="Dívidas" isSub telaAtiva={telaAtiva} onClick={() => handleNavegacao('dividas')} />
                    </MenuExpansivel>

                    <MenuItem id="cobrancas" Icone={Handshake} titulo="A Receber (Terceiros)" telaAtiva={telaAtiva} onClick={() => handleNavegacao('cobrancas')} />

                    <MenuItem id="cartoes" Icone={CreditCard} titulo="Cartões de Crédito" telaAtiva={telaAtiva} onClick={() => handleNavegacao('cartoes')} />
                    <MenuItem id="rendas_fixas" Icone={PiggyBank} titulo="Rendas Fixas" telaAtiva={telaAtiva} onClick={() => handleNavegacao('rendas_fixas')} />
                    <MenuItem id="metas_categorias" Icone={Target} titulo="Metas & Categorias" telaAtiva={telaAtiva} onClick={() => handleNavegacao('metas_categorias')} />
                    <MenuItem id="investimentos" Icone={TrendingUp} titulo="Investimentos" telaAtiva={telaAtiva} onClick={() => handleNavegacao('investimentos')} />
                    <MenuItem id="calculadora_compra" Icone={Calculator} titulo="À Vista ou Parcelado" telaAtiva={telaAtiva} onClick={() => handleNavegacao('calculadora_compra')} />

                    {temGaragem && (
                        <MenuItem id="garagem" Icone={Bike} titulo="Garagem" telaAtiva={telaAtiva} onClick={() => handleNavegacao('garagem')} />
                    )}

                    <MenuItem id="ajuda" Icone={HelpCircle} titulo="Ajuda" telaAtiva={telaAtiva} onClick={() => handleNavegacao('ajuda')} />
                    <MenuItem id="configuracoes" Icone={Settings} titulo="Configurações" telaAtiva={telaAtiva} onClick={() => handleNavegacao('configuracoes')} />

                    {isAdmin && (
                        <div className="mt-4">
                            <p className="px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 select-none">Administração</p>
                            <MenuItem id="admin" Icone={Users} titulo="Usuários" telaAtiva={telaAtiva} onClick={() => handleNavegacao('admin')} />
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800/60 mt-auto shrink-0 pb-6 md:pb-4">
                    <button
                        type="button"
                        onClick={fazerLogout}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 py-3 md:py-2.5 rounded-lg text-sm font-bold border border-slate-700/50 hover:border-rose-800/50 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" strokeWidth={2} /> Sair do Sistema
                    </button>
                </div>
            </aside>
        </>
    );
}