import React, { useState } from 'react';
import {
    X, ChevronDown, LayoutDashboard, Wallet, Plus, ClipboardList,
    TrendingDown, Repeat, HandCoins, Handshake, CreditCard, PiggyBank,
    Target, TrendingUp, Bike, Settings, Users, LogOut, HelpCircle, RefreshCw, Calculator
} from 'lucide-react';
import logo from '../assets/logo.png';

/**
 * @component MenuItem
 * @description Botão de navegação simples para telas de nível único.
 */
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

/**
 * @component MenuExpansivel
 * @description Contêiner de navegação em acordeão para agrupar subtelas (ex: Lançamentos -> Novo / Extrato).
 */
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

/**
 * @file src/components/Sidebar.jsx
 * @description Componente de Navegação Lateral Principal.
 * Suporta menus expansíveis, renderização condicional baseada em permissões (Admin e Garagem)
 * e controle fluido em dispositivos móveis (Offcanvas).
 */
export function Sidebar({ telaAtiva, setTelaAtiva, isAdmin, temGaragem, fazerLogout, nomeUsuario, isMobileMenuOpen, setIsMobileMenuOpen, pendentesSync = 0, sincronizarAgora }) {

    // Estados para controlar o colapso dos menus expansíveis
    const [openMenus, setOpenMenus] = useState({
        lancamentos: ['novo_lancamento', 'extrato'].includes(telaAtiva),
        despesas: ['contas_fixas', 'dividas'].includes(telaAtiva)
    });

    // Sincroniza (durante a renderização, sem efeito) o acordeão correspondente sempre que a
    // navegação troca de tela por fora da Sidebar (ex: atalho no Dashboard), sem sobrescrever
    // um fechamento manual que o usuário já tenha feito para a mesma tela.
    const [telaSincronizada, setTelaSincronizada] = useState(telaAtiva);
    if (telaAtiva !== telaSincronizada) {
        setTelaSincronizada(telaAtiva);
        const proximoEstado = { ...openMenus };
        if (['novo_lancamento', 'extrato'].includes(telaAtiva)) proximoEstado.lancamentos = true;
        if (['contas_fixas', 'dividas'].includes(telaAtiva)) proximoEstado.despesas = true;
        setOpenMenus(proximoEstado);
    }

    /**
     * @function toggleMenu
     * @description Alterna o estado de abertura de um menu expansível (Acordeão).
     * @param {string} menu - Identificador do menu a ser alternado.
     */
    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    /**
     * @function handleNavegacao
     * @description Altera a tela ativa e fecha o menu lateral automaticamente em dispositivos móveis.
     * @param {string} tela - ID da tela destino.
     */
    const handleNavegacao = (tela) => {
        setTelaAtiva(tela);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Overlay para Mobile com Backdrop Blur elegante */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Fechar menu"
                />
            )}

            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-[#0b1120] border-r border-slate-800/60 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 shadow-2xl md:shadow-none'}`}>

                {/* Logo / Header com Botão de Fechar Mobile */}
                <div className="p-5 md:p-6 border-b border-slate-800/60 flex justify-between items-start md:items-center shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <img src={logo} alt="FinControle" className="w-9 h-9 rounded-xl shrink-0 object-contain" />
                        <div className="flex flex-col gap-1 min-w-0">
                            <h1 className="text-lg font-extrabold text-white tracking-tight truncate">FinControle</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                                Olá, {nomeUsuario || 'Usuário'}
                            </p>
                        </div>
                    </div>

                    {/* Botão "X" explícito para fechar no celular */}
                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden p-2 bg-slate-800/50 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-lg border border-slate-700/50 transition-colors cursor-pointer shrink-0"
                        aria-label="Fechar menu lateral"
                    >
                        <X className="w-5 h-5" strokeWidth={2} />
                    </button>
                </div>

                {/* Aviso de Lançamentos Pendentes de Sincronização (Modo Offline) */}
                {pendentesSync > 0 && (
                    <button
                        type="button"
                        onClick={sincronizarAgora}
                        className="mx-5 md:mx-6 mt-4 flex items-center gap-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                        title="Clique para tentar sincronizar agora"
                    >
                        <RefreshCw className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                        {pendentesSync} pendente{pendentesSync > 1 ? 's' : ''} de sincronização
                    </button>
                )}

                {/* Navegação Principal */}
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

                    {/* Renderização condicional: só exibe se o usuário tiver a flag temGaragem verdadeira */}
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

                {/* Footer / Logout */}
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
