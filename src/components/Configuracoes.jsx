import React, { useState, useEffect } from 'react';
import {
    Settings, User, Send, CheckCircle2, Bot, Rocket, ArrowLeft, Palette,
    Sun, Moon, Monitor, Lock, Wrench, Download, Hourglass, Zap, AlertTriangle, Landmark
} from 'lucide-react';

/**
 * @file src/components/Configuracoes.jsx
 * @description Painel de controlo central do utilizador.
 * Gere os dados de perfil, segurança, exportação, motor de temas e vinculação com o Telegram.
 */
export function Configuracoes({ API, getHeaders, exportarCSV, gerarMesManual, gerandoMes, removerSetup, nomeUsuario, nomeCompleto: nomeCompletoProp, atualizarPerfil, atualizarSaldoConciliado, saldoConciliado, alterarSenha, chavePix, showToast, modal }) {

    // ================= ESTADOS GERAIS =================
    // Sementes já preenchidas com o valor vindo da sessão (não com string vazia) — senão o campo
    // fica em branco até o valor "mudar" depois do mount, o que nunca acontece se já chegou certo.
    const [nomeCompleto, setNomeCompleto] = useState(nomeCompletoProp || '');
    const [nomeExibicao, setNomeExibicao] = useState(nomeUsuario || '');
    const [chavePixInput, setChavePixInput] = useState(chavePix || '');
    const [saldoConciliadoValor, setSaldoConciliadoValor] = useState(saldoConciliado ? String(saldoConciliado.valor).replace('.', ',') : '');
    const [saldoConciliadoData, setSaldoConciliadoData] = useState(saldoConciliado?.data || '');

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

    // Sincroniza (durante a renderização, sem efeito) o campo "como quer ser chamado" com o
    // nomeUsuario vindo da sessão, sem sobrescrever o que o usuário já esteja a digitar depois.
    const [nomeUsuarioSincronizado, setNomeUsuarioSincronizado] = useState(nomeUsuario);
    if (nomeUsuario && nomeUsuario !== nomeUsuarioSincronizado) {
        setNomeUsuarioSincronizado(nomeUsuario);
        setNomeExibicao(nomeUsuario);
    }

    // Mesmo padrão para o nome completo.
    const [nomeCompletoSincronizado, setNomeCompletoSincronizado] = useState(nomeCompletoProp);
    if (nomeCompletoProp !== undefined && nomeCompletoProp !== nomeCompletoSincronizado) {
        setNomeCompletoSincronizado(nomeCompletoProp);
        setNomeCompleto(nomeCompletoProp);
    }

    // Mesmo padrão para a chave PIX, que também chega depois do login.
    const [chavePixSincronizada, setChavePixSincronizada] = useState(chavePix);
    if (chavePix !== undefined && chavePix !== chavePixSincronizada) {
        setChavePixSincronizada(chavePix);
        setChavePixInput(chavePix);
    }

    useEffect(() => {
        const fetchTelegramStatus = async () => {
            try {
                const res = await fetch(`${API}/telegram/status`, {
                    headers: getHeaders()
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

    /** @function handleSalvarPerfil - Envia os dados de personalização */
    const handleSalvarPerfil = (e) => {
        e.preventDefault();
        if (atualizarPerfil) atualizarPerfil({ nomeCompleto, nomeExibicao, chave_pix: chavePixInput });
    };

    const handleSalvarSaldoConciliado = async (e) => {
        e.preventDefault();
        const texto = saldoConciliadoValor.trim();
        const valor = Number(texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto);
        if (!Number.isFinite(valor) || !saldoConciliadoData) {
            showToast('Informe um saldo e uma data de conciliação válidos.', 'error');
            return;
        }
        try {
            const res = await fetch(`${API}/transacoes/caixa/previa?${new URLSearchParams({ valor: String(valor), data: saldoConciliadoData })}`, { headers: getHeaders() });
            const previa = res.ok ? await res.json() : null;
            const valorPrevisto = previa?.caixa?.valor;
            const confirmacao = await modal.confirm(
                Number.isFinite(Number(valorPrevisto))
                    ? `Com este marco, o caixa calculado até hoje será R$ ${Number(valorPrevisto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Confirmar?`
                    : 'Confirmar este novo marco de saldo conciliado?',
                'Confirmar saldo conciliado'
            );
            if (!confirmacao) return;
        } catch {
            const confirmacao = await modal.confirm('Não foi possível gerar a prévia agora. Deseja salvar o marco mesmo assim?', 'Confirmar saldo conciliado');
            if (!confirmacao) return;
        }
        await atualizarSaldoConciliado?.({ valor, data: saldoConciliadoData });
    };

    /** @function handleAlterarSenha - Valida as regras de negócio para troca de credencial */
    const handleAlterarSenha = (e) => {
        e.preventDefault();
        if (novaSenha !== confirmarSenha) return showToast('As senhas não coincidem. Verifique e tente novamente.', 'error');
        if (novaSenha.length < 6) return showToast('A nova senha deve conter pelo menos 6 caracteres.', 'error');
        if (alterarSenha) {
            alterarSenha({ senhaAtual, novaSenha });
            setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
        }
    };

    /** @function gerarPinTelegram - Requisita um PIN temporário à API do Bot */
    const gerarPinTelegram = async () => {
        setGerandoPin(true);
        try {
            const res = await fetch(`${API}/telegram/gerar-pin`, {
                method: 'POST',
                headers: getHeaders()
            });

            if (res.ok) {
                const data = await res.json();
                setPinGerado(data.pin);
            } else {
                showToast('Erro ao gerar PIN. Verifique sua conexão ou faça login novamente.', 'error');
            }
        } catch (error) {
            console.error('Erro ao gerar PIN:', error);
            showToast('Erro de conexão ao gerar PIN.', 'error');
        } finally {
            setGerandoPin(false);
        }
    };

    /** @function desvincularTelegram - Remove o ChatID da base de dados */
    const desvincularTelegram = async () => {
        const ok = await modal.confirm('Tem certeza que deseja desvincular seu Telegram? Você deixará de receber os alertas diários.', 'Desvincular Telegram', { confirmLabel: 'Desvincular', confirmColor: 'bg-rose-600 hover:bg-rose-700' });
        if (!ok) return;

        try {
            const res = await fetch(`${API}/telegram/desvincular`, {
                method: 'POST',
                headers: getHeaders()
            });

            if (res.ok) {
                setStatusTelegram('nao_vinculado');
                setPinGerado(null);
            } else {
                showToast('Erro ao desvincular. Tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Erro ao desvincular:', error);
            showToast('Erro de conexão ao desvincular.', 'error');
        }
    };

    // ================= CLASSES CSS PADRÃO (MOBILE-FIRST) =================
    const inputCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 md:p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors shadow-sm";
    const labelCls = "block text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 md:mb-1 uppercase tracking-wider";
    const btnSalvarCls = "w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 md:py-3 px-8 rounded-lg text-sm transition-all cursor-pointer shadow-md active:scale-[0.98]";

    return (
        <div className="p-4 md:p-6 space-y-6 md:space-y-8 w-full max-w-7xl mx-auto pb-24 transition-colors duration-300 relative animate-fade-in">

            {/* CABEÇALHO PADRÃO (SÓLIDO E ROLÁVEL) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                        <Settings className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                            Configurações
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Preferências, segurança, exportação de dados e notificações.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* ================= BLOCO 1: PERFIL DO UTILIZADOR ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-lg flex items-center gap-2"><User className="w-4.5 h-4.5" strokeWidth={2} /> Perfil do Utilizador</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Personalize os seus dados e defina como o sistema se dirige a si.</p>

                    <form onSubmit={handleSalvarPerfil} className="space-y-5 flex flex-col flex-1">
                        <div>
                            <label className={labelCls}>Nome Completo</label>
                            <input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} placeholder="Ex: João da Silva Santos" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Como quer ser chamado</label>
                            <input type="text" value={nomeExibicao} onChange={(e) => setNomeExibicao(e.target.value)} placeholder="Ex: João" required className={`${inputCls} font-bold text-blue-600 dark:text-blue-400`} />
                        </div>
                        <div>
                            <label className={labelCls}>Chave PIX</label>
                            <input type="text" value={chavePixInput} onChange={(e) => setChavePixInput(e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" className={inputCls} />
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Usada automaticamente na mensagem de cobrança em "A Receber".</p>
                        </div>
                        <div className="flex justify-end pt-4 mt-auto">
                            <button type="submit" className={btnSalvarCls}>Salvar Perfil</button>
                        </div>
                    </form>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 p-5 md:p-6 rounded-xl shadow-sm flex flex-col transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-lg flex items-center gap-2"><Landmark className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" strokeWidth={2} /> Caixa conciliado</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Informe o saldo real confirmado da conta em uma data. A partir desse marco, o Saldo Líquido acompanha apenas o que entrou ou saiu de verdade.</p>

                    <form onSubmit={handleSalvarSaldoConciliado} className="space-y-4 flex flex-col flex-1">
                        <div>
                            <label className={labelCls}>Saldo confirmado (R$)</label>
                            <input inputMode="decimal" value={saldoConciliadoValor} onChange={(e) => setSaldoConciliadoValor(e.target.value)} placeholder="Ex: 43,90" className={inputCls} required />
                        </div>
                        <div>
                            <label className={labelCls}>Data de referência</label>
                            <input type="date" value={saldoConciliadoData} onChange={(e) => setSaldoConciliadoData(e.target.value)} className={inputCls} required />
                        </div>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-lg p-3">Use o fechamento já conferido no banco. Não cadastre esse valor como renda: ele é o ponto de partida do caixa.</p>
                        <div className="flex justify-end mt-auto pt-2">
                            <button type="submit" className={btnSalvarCls}>Salvar saldo conciliado</button>
                        </div>
                    </form>
                </div>

                {/* ================= BLOCO 1.5: NOTIFICAÇÕES (TELEGRAM) ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col relative overflow-hidden transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Send className="w-32 h-32" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 relative z-10 text-lg flex items-center gap-2"><Send className="w-4.5 h-4.5" strokeWidth={2} /> Integração Telegram</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 relative z-10 pr-10">Receba seu radar diário de faturas e manutenções da garagem diretamente no celular.</p>

                    <div className="flex flex-col flex-1 relative z-10">
                        {statusTelegram === 'loading' && (
                            <div className="animate-pulse flex flex-col items-center justify-center h-full gap-3">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Verificando status do Bot...</p>
                            </div>
                        )}

                        {statusTelegram === 'vinculado' && (
                            <div className="flex flex-col items-center justify-center h-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-6 text-center shadow-sm">
                                <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500" strokeWidth={1.75} />
                                <h4 className="text-emerald-800 dark:text-emerald-400 font-black text-xl mb-2">Bot Conectado!</h4>
                                <p className="text-sm text-emerald-600 dark:text-emerald-500/80 mb-6">Sua conta já está recebendo alertas de garagem e contas diárias pelo Telegram.</p>
                                <button type="button" onClick={desvincularTelegram} className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 text-sm font-bold cursor-pointer active:scale-95 transition-transform bg-rose-100/50 dark:bg-rose-900/20 px-4 py-2 rounded-lg">
                                    Desvincular Conta
                                </button>
                            </div>
                        )}

                        {statusTelegram === 'nao_vinculado' && (
                            <div className="flex flex-col flex-1">
                                {!pinGerado ? (
                                    <div className="mt-auto h-full flex flex-col justify-end">
                                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl mb-5 shadow-sm">
                                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                                                Para garantir a segurança dos seus dados financeiros, o vínculo com o bot é feito através de um <strong>PIN Temporário de uso único</strong>.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={gerarPinTelegram}
                                            disabled={gerandoPin}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            <Bot className="w-5 h-5" strokeWidth={2} /> {gerandoPin ? 'Gerando Código...' : 'Gerar PIN de Vínculo'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center flex-1 w-full animate-fade-in-up">
                                        <div className="bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-blue-300 dark:border-blue-700 w-full py-6 md:py-8 rounded-xl flex justify-center items-center mb-5 shadow-inner">
                                            <span className="text-5xl md:text-6xl font-mono font-black tracking-[0.2em] text-blue-600 dark:text-blue-500">
                                                {pinGerado}
                                            </span>
                                        </div>

                                        <div className="w-full text-left bg-blue-50/50 dark:bg-slate-800/40 border border-blue-100 dark:border-slate-700/50 rounded-xl p-5 mb-5 shadow-sm">
                                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                                <Rocket className="w-4 h-4" strokeWidth={2} /> Próximos Passos:
                                            </h4>
                                            <ol className="text-xs md:text-sm text-slate-600 dark:text-slate-400 space-y-3 ml-1 font-medium">
                                                <li className="flex items-start gap-3">
                                                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-sm">1</span>
                                                    <span>Abra o seu aplicativo do <strong>Telegram</strong>.</span>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-sm">2</span>
                                                    <span className="leading-relaxed">
                                                        Busque pelo bot <strong>@erp_pessoal_bot</strong> (ou <a href="https://t.me/erp_pessoal_bot" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">clique aqui</a> para abrir direto).
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-sm">3</span>
                                                    <span>Envie o <strong>código de 6 dígitos</strong> acima na conversa.</span>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-sm">4</span>
                                                    <span>Receba a confirmação no celular e <strong>atualize esta página</strong>.</span>
                                                </li>
                                            </ol>
                                        </div>

                                        <button type="button" onClick={() => setPinGerado(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs mt-auto cursor-pointer p-2 transition-colors flex items-center gap-1.5">
                                            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} /> Cancelar e voltar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* ================= BLOCO 2: APARÊNCIA ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-lg flex items-center gap-2"><Palette className="w-4.5 h-4.5" strokeWidth={2} /> Aparência</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Personalize o tema visual do sistema para maior conforto.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-auto">
                        <button type="button" onClick={() => setTema('claro')} className={`py-4 md:py-3.5 rounded-xl text-sm font-bold flex flex-row sm:flex-col lg:flex-row items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 ${tema === 'claro' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/50' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <Sun className="w-4.5 h-4.5" strokeWidth={2} /> <span className="sm:mt-1 lg:mt-0">Claro</span>
                        </button>
                        <button type="button" onClick={() => setTema('escuro')} className={`py-4 md:py-3.5 rounded-xl text-sm font-bold flex flex-row sm:flex-col lg:flex-row items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 ${tema === 'escuro' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/50' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <Moon className="w-4.5 h-4.5" strokeWidth={2} /> <span className="sm:mt-1 lg:mt-0">Escuro</span>
                        </button>
                        <button type="button" onClick={() => setTema('sistema')} className={`py-4 md:py-3.5 rounded-xl text-sm font-bold flex flex-row sm:flex-col lg:flex-row items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 ${tema === 'sistema' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/50' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <Monitor className="w-4.5 h-4.5" strokeWidth={2} /> <span className="sm:mt-1 lg:mt-0">Sistema</span>
                        </button>
                    </div>
                </div>

                {/* ================= BLOCO 3: SEGURANÇA ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-lg flex items-center gap-2"><Lock className="w-4.5 h-4.5" strokeWidth={2} /> Segurança</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Altere a sua senha de acesso frequentemente para manter a conta protegida.</p>

                    <form onSubmit={handleAlterarSenha} className="space-y-5 flex-1 flex flex-col">
                        <div>
                            <label className={labelCls}>Senha Atual</label>
                            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required className={inputCls} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Nova Senha</label>
                                <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Confirmar Senha</label>
                                <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required className={inputCls} />
                            </div>
                        </div>
                        <div className="mt-auto pt-4">
                            <button type="submit" className="w-full bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 text-white font-bold py-4 md:py-3.5 rounded-lg text-sm transition-colors cursor-pointer shadow-md active:scale-[0.98]">
                                Atualizar Senha de Acesso
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* ================= BLOCO 4: FERRAMENTAS DE DADOS ================= */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm flex flex-col transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-lg flex items-center gap-2"><Wrench className="w-4.5 h-4.5" strokeWidth={2} /> Ferramentas de Dados</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Exporte o livro-razão financeiro completo para o Excel ou processe automações.</p>

                    <div className="space-y-4 mt-auto">
                        <button type="button" onClick={exportarCSV} className="w-full flex items-center justify-center gap-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 font-bold py-4 md:py-3.5 rounded-xl text-sm border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer shadow-sm active:scale-[0.98]">
                            <Download className="w-4.5 h-4.5" strokeWidth={2} /> Fazer Download Completo (CSV)
                        </button>
                        <button type="button" onClick={() => gerarMesManual(new Date().getMonth() + 1, new Date().getFullYear())} disabled={gerandoMes} className="w-full flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold py-4 md:py-3.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                            {gerandoMes ? <><Hourglass className="w-4.5 h-4.5" strokeWidth={2} /> Injetando na base...</> : <><Zap className="w-4.5 h-4.5" strokeWidth={2} /> Lançar Contas e Rendas Deste Mês Agora</>}
                        </button>
                    </div>
                </div>

                {/* ================= BLOCO 5: ZONA DE PERIGO ================= */}
                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/50 p-5 md:p-6 rounded-xl shadow-sm flex flex-col transition-colors">
                    <h3 className="font-black text-rose-800 dark:text-rose-400 mb-1 text-lg flex items-center gap-2"><AlertTriangle className="w-4.5 h-4.5" strokeWidth={2} /> Zona de Perigo</h3>
                    <p className="text-sm text-rose-600 dark:text-rose-500/80 mb-6 font-medium">Ações destrutivas massivas. Não é possível desfazer ou recuperar os dados após a confirmação.</p>

                    <div className="space-y-3 mt-auto">
                        <button type="button" onClick={() => removerSetup('categoria')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 md:py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-sm active:scale-[0.98]">Excluir Metas e Categorias</button>
                        <button type="button" onClick={() => removerSetup('contaFixa')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 md:py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-sm active:scale-[0.98]">Excluir Todas as Contas Fixas</button>
                        <button type="button" onClick={() => removerSetup('cartao')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 md:py-3 rounded-lg text-sm transition-colors cursor-pointer shadow-sm active:scale-[0.98]">Excluir Todos os Cartões</button>
                    </div>
                </div>
            </div>

        </div>
    );
}
