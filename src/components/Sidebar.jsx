import React from 'react';

export function Sidebar({ telaAtiva, setTelaAtiva, isAdmin, fazerLogout, nomeUsuario, isMobileMenuOpen, setIsMobileMenuOpen }) {

    const menuItems = [
        { id: 'dashboard', icone: '📊', titulo: 'Dashboard' },
        { id: 'lancamentos', icone: '💸', titulo: 'Lançamentos' },
        { id: 'cartoes', icone: '💳', titulo: 'Cartões de Crédito' },
        { id: 'contas_fixas', icone: '🔄', titulo: 'Contas Fixas' },
        { id: 'metas_categorias', icone: '🎯', titulo: 'Metas & Categorias' },
        { id: 'garagem', icone: '🚗', titulo: 'Garagem' },
        { id: 'configuracoes', icone: '⚙️', titulo: 'Configurações' },
    ];

    return (
        <>
            {/* Overlay para fechar o menu no Mobile ao clicar fora */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Gaveta Lateral (Off-Canvas no Mobile, Fixa no Desktop) */}
            <aside className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-50 shrink-0 shadow-2xl md:shadow-none`}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                            <span className="text-blue-500">⚡</span> Financeiro
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Olá, {nomeUsuario}</p>
                    </div>
                    {/* Botão de Fechar Exclusivo do Mobile */}
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white cursor-pointer p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => { setTelaAtiva(item.id); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${telaAtiva === item.id
                                ? 'bg-blue-600/10 text-blue-400'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                        >
                            <span className="text-lg">{item.icone}</span>
                            {item.titulo}
                        </button>
                    ))}

                    {isAdmin && (
                        <>
                            <div className="pt-4 pb-2 mt-4 border-t border-slate-800/50 px-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Administração</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setTelaAtiva('admin'); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${telaAtiva === 'admin'
                                    ? 'bg-indigo-600/10 text-indigo-400'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }`}
                            >
                                <span className="text-lg">👥</span>
                                Usuários
                            </button>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={fazerLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                    >
                        🚪 Sair do Sistema
                    </button>
                </div>
            </aside>
        </>
    );
}