import React, { useState, useEffect } from 'react';

/**
 * Componente: Configuracoes
 * Painel de controlo central do utilizador.
 * Gere os dados de perfil, segurança, backups de dados (CSV) e eliminações em massa.
 */
export function Configuracoes({ exportarCSV, gerarMesManual, gerandoMes, removerSetup, nomeUsuario, atualizarPerfil, alterarSenha }) {

    // Estados do Perfil de Utilizador
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [nomeExibicao, setNomeExibicao] = useState('');

    // Estados de Segurança (Alteração de Senha)
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    // Sincroniza a propriedade herdada assim que a API a fornece
    useEffect(() => {
        if (nomeUsuario) setNomeExibicao(nomeUsuario);
    }, [nomeUsuario]);

    /** Interceta a submissão do formulário de Perfil */
    const handleSalvarPerfil = (e) => {
        e.preventDefault();
        if (atualizarPerfil) {
            atualizarPerfil({ nomeCompleto, nomeExibicao });
        } else {
            alert('A rota de atualização do perfil será ativada na próxima etapa do backend.');
        }
    };

    /** Interceta a submissão do formulário de Segurança */
    const handleAlterarSenha = (e) => {
        e.preventDefault();
        if (novaSenha !== confirmarSenha) {
            alert('As senhas não coincidem. Verifique e tente novamente.');
            return;
        }
        if (novaSenha.length < 6) {
            alert('A nova senha deve conter pelo menos 6 caracteres.');
            return;
        }
        if (alterarSenha) {
            alterarSenha({ senhaAtual, novaSenha });
            // Limpar formulário após envio
            setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
        } else {
            alert('A rota de segurança será ativada na próxima etapa do backend.');
        }
    };

    const inputCls = "w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors";
    const btnSalvarCls = "bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-sm transition-colors cursor-pointer shadow-md w-full md:w-auto";

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 transition-colors duration-300">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">⚙️ Configurações</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Preferências, segurança, exportação de dados e gestão estrutural da conta.</p>
            </div>

            {/* ================= BLOCO 1: PERFIL DO UTILIZADOR ================= */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">👤 Perfil do Utilizador</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Personalize os seus dados e defina como o sistema se dirige a si.</p>

                <form onSubmit={handleSalvarPerfil} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Nome Completo</label>
                            <input
                                type="text"
                                value={nomeCompleto}
                                onChange={(e) => setNomeCompleto(e.target.value)}
                                placeholder="Ex: Marlom Stewart Souza"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Como quer ser chamado</label>
                            <input
                                type="text"
                                value={nomeExibicao}
                                onChange={(e) => setNomeExibicao(e.target.value)}
                                placeholder="Ex: Marlom"
                                required
                                className={inputCls}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className={btnSalvarCls}>Salvar Perfil</button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ================= BLOCO 2: SEGURANÇA ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">🔒 Segurança</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Altere a sua senha de acesso frequentemente para manter a conta protegida.</p>

                    <form onSubmit={handleAlterarSenha} className="space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Senha Atual</label>
                            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required className={inputCls} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Nova Senha</label>
                                <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Confirmar Nova Senha</label>
                                <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required className={inputCls} />
                            </div>
                        </div>
                        <div className="mt-auto pt-6">
                            <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">
                                Atualizar Senha
                            </button>
                        </div>
                    </form>
                </div>

                {/* ================= BLOCO 3: FERRAMENTAS DE DADOS ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">🛠️ Ferramentas de Dados</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Exporte o livro-razão financeiro completo para abrir no Excel ou processar manualmente em Mês Fechado.</p>

                    <div className="space-y-3 mt-auto">
                        <button type="button" onClick={exportarCSV} className="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold py-3 rounded-lg text-sm border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer">
                            📥 Fazer Download Completo (CSV)
                        </button>
                        <button type="button" onClick={gerarMesManual} disabled={gerandoMes} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-lg text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                            {gerandoMes ? '⏳ A injetar obrigações na base...' : '⚡ Lançar Contas Fixas deste Mês Agora'}
                        </button>
                    </div>
                </div>

            </div>

            {/* ================= BLOCO 4: ZONA DE PERIGO ================= */}
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 p-6 rounded-xl shadow-sm space-y-4">
                <div>
                    <h3 className="font-bold text-rose-800 dark:text-rose-400">⚠️ Zona de Perigo</h3>
                    <p className="text-sm text-rose-600 dark:text-rose-500">Ações destrutivas. Não é possível desfazer eliminações massivas na Base de Dados.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button type="button" onClick={() => removerSetup('categoria')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-sm">Excluir Metas / Categorias</button>
                    <button type="button" onClick={() => removerSetup('contaFixa')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-sm">Excluir Todas as Contas Fixas</button>
                    <button type="button" onClick={() => removerSetup('cartao')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-sm">Excluir Todos os Cartões</button>
                </div>
            </div>
        </div>
    );
}