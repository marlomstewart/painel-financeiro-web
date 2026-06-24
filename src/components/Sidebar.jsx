import React from 'react';

export function Sidebar({ telaAtiva, setTelaAtiva, isAdmin, fazerLogout, nomeUsuario }) {

    const menuItems = [
        { id: 'dashboard', icone: '📊', titulo: 'Dashboard' },
        { id: 'lancamentos', icone: '💸', titulo: 'Lançamentos' },
        { id: 'cartoes', icone: '💳', titulo: 'Cartões de Crédito' },
        { id: 'contas_fixas', icone: '🔄', titulo: 'Contas Fixas' },
        { id: 'metas_categorias', icone: '🎯', titulo: 'Metas & Categorias' },
        { id: 'investimentos', icone: '📈', titulo: 'Investimentos' },
        { id: 'garagem', icone: '🚗', titulo: 'Garagem' },
        { id: 'setup', icone: '⚙️', titulo: 'Configurações' },
    ];

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full transition-all duration-300 hidden md:flex shrink-0 z-50">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span className="text-blue-500">⚡</span> Financeiro
                </h1>
                <p className="text-xs text-slate-400 mt-1 truncate">Olá, <span className="font-bold text-slate-200">{nomeUsuario}</span></p>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setTelaAtiva(item.id)}
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
                            onClick={() => setTelaAtiva('admin')}
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
    );
}