import React, { useState, useEffect } from 'react';

/**
 * @file src/components/Sidebar.jsx
 * @description Componente de Navegação Lateral Principal.
 * Suporta menus expansíveis, renderização condicional baseada em permissões (Admin e Garagem) 
 * e controle fluido em dispositivos móveis (Offcanvas).
 */
export function Sidebar({ telaAtiva, setTelaAtiva, isAdmin, temGaragem, fazerLogout, nomeUsuario, isMobileMenuOpen, setIsMobileMenuOpen }) {

    // Estados para controlar o colapso dos menus expansíveis
    const [openMenus, setOpenMenus] = useState({
        lancamentos: false,
        despesas: false
    });

    /**
     * @function toggleMenu
     * @description Alterna o estado de abertura de um menu expansível (Acordeão).
     * @param {string} menu - Identificador do menu a ser alternado.
     */
    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    // Auto-expandir o menu se uma subtela for a telaAtiva atual no carregamento
    useEffect(() => {
        if (['novo_lancamento', 'extrato'].includes(telaAtiva)) {
            setOpenMenus(prev => ({ ...prev, lancamentos: true }));
        }
        if (['contas_fixas', 'dividas'].includes(telaAtiva)) {
            setOpenMenus(prev => ({ ...prev, despesas: true }));
        }
    }, [telaAtiva]);

    /**
     * @function handleNavegacao
     * @description Altera a tela ativa e fecha o menu lateral automaticamente em dispositivos móveis.
     * @param {string} tela - ID da tela destino.
     */
    const handleNavegacao = (tela) => {
        setTelaAtiva(tela);
        setIsMobileMenuOpen(false);
    };

    /**
     * @component MenuItem
     * @description Botão de navegação simples para telas de nível único.
     */
    const MenuItem = ({ id, icone, titulo, onClick, isSub = false }) => {
        const ativo = telaAtiva === id;
        return (
            <button
                type="button"
                onClick={onClick || (() => handleNavegacao(id))}
                className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors text-sm font-medium ${isSub ? 'pl-11' : ''} ${ativo ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-500' : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}`}
            >
                <span className="text-lg shrink-0">{icone}</span>
                <span className="truncate">{titulo}</span>
            </button>
        );
    };

    /**
     * @component MenuExpansivel
     * @description Contêiner de navegação em acordeão para agrupar subtelas (ex: Lançamentos -> Novo / Extrato).
     */
    const MenuExpansivel = ({ id, icone, titulo, children }) => {
        const isOpen = openMenus[id];
        const isChildActive = children.some(child => child.props.id === telaAtiva);

        return (
            <div className="flex flex-col">
                <button
                    type="button"
                    onClick={() => toggleMenu(id)}
                    className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-sm font-medium ${isChildActive && !isOpen ? 'text-blue-400 border-l-4 border-blue-500/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg shrink-0">{icone}</span>
                        <span className="truncate">{titulo}</span>
                    </div>
                    <svg className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {children}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* 🔥 MELHORIA UX: Overlay para Mobile com Backdrop Blur elegante */}
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
                    <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 text-white">
                            <span className="text-blue-500 text-xl">⚡</span>
                            <h1 className="text-xl font-black tracking-tight truncate">Financeiro</h1>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                            OLÁ, {nomeUsuario || 'USUÁRIO'}
                        </p>
                    </div>

                    {/* 🔥 MELHORIA UX: Botão "X" explícito para fechar no celular */}
                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden p-2 bg-slate-800/50 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-lg border border-slate-700/50 transition-colors cursor-pointer shrink-0"
                        aria-label="Fechar menu lateral"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Navegação Principal */}
                <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar flex flex-col gap-1">
                    <MenuItem id="dashboard" icone="📊" titulo="Dashboard" />

                    <MenuExpansivel id="lancamentos" icone="💸" titulo="Lançamentos">
                        <MenuItem id="novo_lancamento" icone="➕" titulo="Novo Lançamento" isSub />
                        <MenuItem id="extrato" icone="📋" titulo="Extrato" isSub />
                    </MenuExpansivel>

                    <MenuExpansivel id="despesas" icone="🔻" titulo="Despesas">
                        <MenuItem id="contas_fixas" icone="🔄" titulo="Contas Fixas" isSub />
                        <MenuItem id="dividas" icone="📉" titulo="Dívidas" isSub />
                    </MenuExpansivel>

                    {/* 🔥 NOVO: Item de menu para Cobranças */}
                    <MenuItem id="cobrancas" icone="🤝" titulo="A Receber (Terceiros)" />

                    <MenuItem id="cartoes" icone="💳" titulo="Cartões de Crédito" />
                    <MenuItem id="rendas_fixas" icone="💰" titulo="Rendas Fixas" />
                    <MenuItem id="metas_categorias" icone="🎯" titulo="Metas & Categorias" />
                    <MenuItem id="investimentos" icone="📈" titulo="Investimentos" />

                    {/* 🔥 RENDERIZAÇÃO CONDICIONAL: Só exibe se o usuário tiver a flag temGaragem verdadeira */}
                    {temGaragem && (
                        <MenuItem id="garagem" icone="🏍️" titulo="Garagem" />
                    )}

                    <MenuItem id="configuracoes" icone="⚙️" titulo="Configurações" />

                    {isAdmin && (
                        <div className="mt-4">
                            <p className="px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 select-none">Administração</p>
                            <MenuItem id="admin" icone="👥" titulo="Usuários" />
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
                        <span>🚪</span> Sair do Sistema
                    </button>
                </div>
            </aside>
        </>
    );
}