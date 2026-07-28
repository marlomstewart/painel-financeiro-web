import React, { useState, useEffect } from 'react';

/**
 * @file src/components/Configuracoes.jsx
 * @description Painel de controlo central do utilizador.
 * Gere os dados de perfil, segurança, notificações interativas (Telegram), aparência (Modo Escuro), 
 * backups e ações destrutivas.
 */
export function Configuracoes({ exportarCSV, gerarMesManual, gerandoMes, removerSetup, nomeUsuario, atualizarPerfil, alterarSenha }) {

    // ================= ESTADOS GERAIS =================
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [nomeExibicao, setNomeExibicao] = useState('');

    // Estados de Segurança
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    // Estado de Aparência
    const [tema, setTema] = useState(localStorage.getItem('theme') || 'sistema');

    // ================= ESTADOS DO TELEGRAM (BOT INTERATIVO) =================
    const [statusTelegram, setStatusTelegram] = useState('loading'); // 'loading', 'vinculado', 'nao_vinculado'
    const [pinGerado, setPinGerado] = useState(null);
    const [gerandoPin, setGerandoPin] = useState(false);

    // ================= EFEITOS (USE EFFECT) =================

    // Sincroniza as propriedades herdadas
    useEffect(() => {
        if (nomeUsuario) setNomeExibicao(nomeUsuario);
    }, [nomeUsuario]);

    // Busca o status atual do Telegram ao carregar a página
    useEffect(() => {
        const fetchTelegramStatus = async () => {
            try {
                const token = localStorage.getItem('tokenPainel');
                const apiUrl = import.meta.env.VITE_API_URL || 'https://painel-gestao-financeira-api.onrender.com/api';

                // 🔥 CORREÇÃO: Removido o /api duplicado da string
                const res = await fetch(`${apiUrl}/telegram/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setStatusTelegram(data.vinculado ? 'vinculado' : 'nao_vinculado');
                } else {
                    setStatusTelegram('nao_vinculado');
                }
            } catch (error) {
                console.error('Erro ao buscar status do Telegram:', error);
                setStatusTelegram('nao_vinculado');
            }
        };

        fetchTelegramStatus();
    }, []);

    // Lógica do Motor do Tema (Dark Mode)
    useEffect(() => {
        const root = window.document.documentElement;
        if (tema === 'sistema') {
            localStorage.removeItem('theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
            else root.classList.remove('dark');
        } else {
            localStorage.setItem('theme', tema);
            if (tema === 'escuro') root.classList.add('dark');
            else root.classList.remove('dark');
        }
    }, [tema]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            if (tema === 'sistema') {
                const root = window.document.documentElement;
                if (e.matches) root.classList.add('dark');
                else root.classList.remove('dark');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [tema]);

    // ================= FUNÇÕES DE AÇÃO =================

    const handleSalvarPerfil = (e) => {
        e.preventDefault();
        if (atualizarPerfil) atualizarPerfil({ nomeCompleto, nomeExibicao });
    };

    const handleAlterarSenha = (e) => {
        e.preventDefault();
        if (novaSenha !== confirmarSenha) return alert('As senhas não coincidem. Verifique e tente novamente.');
        if (novaSenha.length < 6) return alert('A nova senha deve conter pelo menos 6 caracteres.');
        if (alterarSenha) {
            alterarSenha({ senhaAtual, novaSenha });
            setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
        }
    };

    /**
     * @function gerarPinTelegram
     * @description Solicita à API a geração de um PIN aleatório de 6 dígitos para vínculo.
     */
    const gerarPinTelegram = async () => {
        setGerandoPin(true);
        try {
            const token = localStorage.getItem('tokenPainel');
            const apiUrl = import.meta.env.VITE_API_URL || 'https://painel-gestao-financeira-api.onrender.com/api';

            // 🔥 CORREÇÃO: Removido o /api duplicado da string
            const res = await fetch(`${apiUrl}/telegram/gerar-pin`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setPinGerado(data.pin);
            } else {
                alert('Erro ao gerar PIN. Verifique sua conexão ou faça login novamente.');
            }
        } catch (error) {
            console.error('Erro ao gerar PIN:', error);
            alert('Erro de conexão ao gerar PIN.');
        } finally {
            setGerandoPin(false);
        }
    };

    /**
     * @function desvincularTelegram
     * @description Remove o Chat ID do banco de dados, parando as notificações.
     */
    const desvincularTelegram = async () => {
        if (!window.confirm('Tem certeza que deseja desvincular seu Telegram? Você deixará de receber os alertas diários.')) return;

        try {
            const token = localStorage.getItem('tokenPainel');
            const apiUrl = import.meta.env.VITE_API_URL || 'https://painel-gestao-financeira-api.onrender.com/api';

            // 🔥 CORREÇÃO: Removido o /api duplicado da string
            const res = await fetch(`${apiUrl}/telegram/desvincular`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setStatusTelegram('nao_vinculado');
                setPinGerado(null);
            } else {
                alert('Erro ao desvincular. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao desvincular:', error);
            alert('Erro de conexão ao desvincular.');
        }
    };

    // ================= CLASSES CSS PADRÃO =================
    const inputCls = "w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors shadow-sm";
    const btnSalvarCls = "bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-sm transition-colors cursor-pointer shadow-md w-full md:w-auto";

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 transition-colors duration-300 relative">

            {/* CABEÇALHO FIXO COM VIDRO FOSCO */}
            <div className="sticky top-0 z-40 pt-4 md:pt-8 pb-4 -mt-4 md:-mt-8 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">⚙️ Configurações</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Preferências, segurança, exportação de dados e notificações.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ================= BLOCO 1: PERFIL DO UTILIZADOR ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">👤 Perfil do Utilizador</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Personalize os seus dados e defina como o sistema se dirige a si.</p>

                    <form onSubmit={handleSalvarPerfil} className="space-y-4 flex flex-col flex-1">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Nome Completo</label>
                            <input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} placeholder="Ex: Marlom Stewart Souza" className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Como quer ser chamado</label>
                            <input type="text" value={nomeExibicao} onChange={(e) => setNomeExibicao(e.target.value)} placeholder="Ex: Marlom" required className={inputCls} />
                        </div>
                        <div className="flex justify-end pt-2 mt-auto">
                            <button type="submit" className={btnSalvarCls}>Salvar Perfil</button>
                        </div>
                    </form>
                </div>

                {/* ================= BLOCO 1.5: NOTIFICAÇÕES (TELEGRAM) ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <span className="text-8xl">💬</span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 relative z-10">📱 Integração Telegram</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 relative z-10">Receba seu radar diário de faturas e manutenções automotivas diretamente no celular.</p>

                    <div className="flex flex-col flex-1 relative z-10">
                        {statusTelegram === 'loading' && (
                            <div className="animate-pulse flex items-center justify-center h-full">
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Verificando status da integração...</p>
                            </div>
                        )}

                        {statusTelegram === 'vinculado' && (
                            <div className="flex flex-col items-center justify-center h-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-6 text-center">
                                <span className="text-4xl mb-3">✅</span>
                                <h4 className="text-emerald-800 dark:text-emerald-400 font-bold text-lg mb-1">Bot Conectado!</h4>
                                <p className="text-sm text-emerald-600 dark:text-emerald-500/80 mb-6">Sua conta já está recebendo alertas de garagem e contas diárias pelo Telegram.</p>
                                <button type="button" onClick={desvincularTelegram} className="text-rose-600 dark:text-rose-400 hover:underline text-sm font-bold cursor-pointer">
                                    Desvincular Conta
                                </button>
                            </div>
                        )}

                        {statusTelegram === 'nao_vinculado' && (
                            <div className="flex flex-col flex-1">
                                {!pinGerado ? (
                                    <div className="mt-auto">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4">
                                            <p className="text-xs text-blue-800 dark:text-blue-300">
                                                Para garantir a segurança dos seus dados financeiros, o vínculo com o bot é feito através de um <strong>PIN Temporário de uso único</strong>.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={gerarPinTelegram}
                                            disabled={gerandoPin}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                                        >
                                            <span className="text-lg">🤖</span> {gerandoPin ? 'Gerando...' : 'Gerar PIN de Vínculo'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center flex-1">
                                        <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
                                            Abra o seu bot no Telegram e envie o código abaixo para concluir a integração:
                                        </p>
                                        <div className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 w-full py-6 rounded-lg flex justify-center items-center mb-4 shadow-inner">
                                            <span className="text-4xl md:text-5xl font-mono font-bold tracking-widest text-blue-600 dark:text-blue-500">
                                                {pinGerado}
                                            </span>
                                        </div>
                                        <button type="button" onClick={() => setPinGerado(null)} className="text-slate-500 dark:text-slate-400 hover:underline text-xs mt-auto cursor-pointer">
                                            Cancelar e voltar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ================= BLOCO 2: APARÊNCIA ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">🎨 Aparência</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Personalize o tema visual do sistema para maior conforto.</p>

                    <div className="grid grid-cols-3 gap-3 mt-auto">
                        <button type="button" onClick={() => setTema('claro')} className={`py-4 rounded-lg text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 border transition-all cursor-pointer ${tema === 'claro' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <span className="text-xl">☀️</span> Claro
                        </button>
                        <button type="button" onClick={() => setTema('escuro')} className={`py-4 rounded-lg text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 border transition-all cursor-pointer ${tema === 'escuro' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <span className="text-xl">🌙</span> Escuro
                        </button>
                        <button type="button" onClick={() => setTema('sistema')} className={`py-4 rounded-lg text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 border transition-all cursor-pointer ${tema === 'sistema' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <span className="text-xl">💻</span> Sistema
                        </button>
                    </div>
                </div>

                {/* ================= BLOCO 3: SEGURANÇA ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">🔒 Segurança</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Altere a sua senha de acesso frequentemente para manter a conta protegida.</p>

                    <form onSubmit={handleAlterarSenha} className="space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Senha Atual</label>
                            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required className={inputCls} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Nova Senha</label>
                                <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Confirmar Senha</label>
                                <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required className={inputCls} />
                            </div>
                        </div>
                        <div className="mt-auto pt-4">
                            <button type="submit" className="w-full bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 text-white font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-md">
                                Atualizar Senha
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ================= BLOCO 4: FERRAMENTAS DE DADOS ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">🛠️ Ferramentas de Dados</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Exporte o livro-razão financeiro completo para o Excel ou processe automações.</p>

                    <div className="space-y-3 mt-auto">
                        <button type="button" onClick={exportarCSV} className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold py-3.5 rounded-lg text-sm border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer shadow-sm">
                            <span className="text-lg">📥</span> Fazer Download Completo (CSV)
                        </button>
                        <button type="button" onClick={gerarMesManual} disabled={gerandoMes} className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-lg text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm">
                            {gerandoMes ? '⏳ Injetando na base...' : <><span className="text-lg">⚡</span> Lançar Contas e Rendas Fixas deste Mês Agora</>}
                        </button>
                    </div>
                </div>

                {/* ================= BLOCO 5: ZONA DE PERIGO ================= */}
                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/50 p-6 rounded-xl shadow-sm flex flex-col">
                    <h3 className="font-bold text-rose-800 dark:text-rose-400 mb-1">⚠️ Zona de Perigo</h3>
                    <p className="text-sm text-rose-600 dark:text-rose-500/80 mb-6">Ações destrutivas massivas. Não é possível desfazer ou recuperar os dados.</p>

                    <div className="space-y-3 mt-auto">
                        <button type="button" onClick={() => removerSetup('categoria')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer shadow-sm">Excluir Metas / Categorias</button>
                        <button type="button" onClick={() => removerSetup('contaFixa')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer shadow-sm">Excluir Todas as Contas Fixas</button>
                        <button type="button" onClick={() => removerSetup('cartao')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer shadow-sm">Excluir Todos os Cartões</button>
                    </div>
                </div>
            </div>

        </div>
    );
}