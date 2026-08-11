/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Lock } from 'lucide-react';

/**
 * @file src/components/Login.jsx
 * @description Tela de captura de credenciais e gestão do fluxo de recuperação de senha.
 * Opera como uma State Machine visual de 4 etapas: login -> forgot -> verify -> reset.
 */
export function Login({ fazerLogin, usuarioLogin, setUsuarioLogin, senhaLogin, setSenhaLogin, erroLogin, modalConfig, modalClose, ModalComponent }) {

    // Controlo de Navegação Interna do Modal de Autenticação
    const [view, setView] = useState('login'); // 'login' | 'forgot' | 'verify' | 'reset'

    // Estados independentes para o fluxo de Recuperação de Senha
    const [resetUser, setResetUser] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    /** ETAPA 1: Solicitar o código de recuperação */
    const handleRequestCode = (e) => {
        e.preventDefault();
        if (!resetUser.trim()) {
            setLocalError('Informe o seu nome de utilizador.');
            return;
        }
        setLocalError('');
        // MOCK: Futura integração com endpoint /solicitar-reset
        setLocalSuccess(`Código de 6 dígitos enviado para os contactos registados de ${resetUser}.`);
        setView('verify');
    };

    /** ETAPA 2: Validar o código inserido */
    const handleVerifyCode = (e) => {
        e.preventDefault();
        if (resetCode.length < 5) {
            setLocalError('O código de verificação é inválido.');
            return;
        }
        setLocalError('');
        // MOCK: Futura integração com endpoint /validar-codigo
        setLocalSuccess('Código validado com sucesso. Crie a sua nova credencial.');
        setView('reset');
    };

    /** ETAPA 3: Submeter a nova senha */
    const handleResetPassword = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setLocalError('As senhas não coincidem. Tente novamente.');
            return;
        }
        if (newPassword.length < 6) {
            setLocalError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        setLocalError('');
        // MOCK: Futura integração com endpoint /resetar-senha-via-codigo
        setLocalSuccess('Senha redefinida com sucesso! Pode iniciar sessão.');

        // Limpar dados em cache de segurança e devolver ao Login
        setResetUser('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setView('login');
    };

    /** RESET: Retornar à base */
    const goToLogin = () => {
        setView('login');
        setLocalError('');
        setLocalSuccess('');
    };

    // UI Constantes (Mobile-First)
    const inputCls = "w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-3.5 md:p-3 rounded-xl text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all shadow-sm";
    const labelCls = "block text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 md:mb-1 uppercase tracking-wider transition-colors";
    const btnSubmitCls = "w-full bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white font-bold py-4 md:py-3.5 rounded-xl text-sm transition-all shadow-md mt-4 cursor-pointer active:scale-[0.98]";
    const btnCancelCls = "w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 md:py-3.5 rounded-xl text-sm transition-all cursor-pointer mt-3 border border-transparent dark:border-slate-700 active:scale-[0.98]";
    const alertErrorCls = "text-rose-600 dark:text-rose-400 text-xs font-bold text-center bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-200 dark:border-rose-800/50 transition-colors shadow-sm";
    const alertSuccessCls = "text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 mb-5 transition-colors shadow-sm";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <ModalComponent config={modalConfig} onClose={modalClose} />

            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300 animate-scale-in">

                {/* ================= VISÃO 1: LOGIN ================= */}
                {view === 'login' && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner border border-blue-200 dark:border-blue-800/50">
                                <Lock className="w-7 h-7" strokeWidth={2} />
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 transition-colors tracking-tight">Painel Financeiro</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors font-medium">Acesso Restrito</p>
                        </div>

                        {localSuccess && <p className={alertSuccessCls}>{localSuccess}</p>}

                        <form onSubmit={fazerLogin} className="space-y-5">
                            <div>
                                <label className={labelCls}>Usuário</label>
                                <input
                                    type="text" value={usuarioLogin} onChange={(e) => setUsuarioLogin(e.target.value)}
                                    required className={inputCls} placeholder="Seu login..."
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5 md:mb-1">
                                    <label className={labelCls} style={{ marginBottom: 0 }}>Senha</label>
                                    <button
                                        type="button"
                                        onClick={() => { setView('forgot'); setLocalSuccess(''); setLocalError(''); }}
                                        className="text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors"
                                    >
                                        Esqueci minha senha
                                    </button>
                                </div>
                                <input
                                    type="password" value={senhaLogin} onChange={(e) => setSenhaLogin(e.target.value)}
                                    required className={inputCls} placeholder="••••••••"
                                />
                            </div>

                            {erroLogin && <p className={alertErrorCls}>{erroLogin}</p>}

                            <button type="submit" className={btnSubmitCls}>
                                Entrar no Sistema
                            </button>
                        </form>
                    </div>
                )}

                {/* ================= VISÃO 2: SOLICITAÇÃO (FORGOT) ================= */}
                {view === 'forgot' && (
                    <div className="animate-fade-in-right">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 transition-colors tracking-tight">Recuperar Senha</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors font-medium">Identifique a sua conta</p>
                        </div>

                        <form onSubmit={handleRequestCode} className="space-y-5">
                            <div>
                                <label className={labelCls}>Usuário</label>
                                <input
                                    type="text" value={resetUser} onChange={(e) => setResetUser(e.target.value)}
                                    placeholder="O seu nome de acesso..." required className={inputCls}
                                />
                            </div>

                            {localError && <p className={alertErrorCls}>{localError}</p>}

                            <div className="pt-2">
                                <button type="submit" className={btnSubmitCls}>
                                    Enviar Código
                                </button>
                                <button type="button" onClick={goToLogin} className={btnCancelCls}>
                                    Voltar para o Login
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ================= VISÃO 3: VERIFICAÇÃO DO CÓDIGO ================= */}
                {view === 'verify' && (
                    <div className="animate-fade-in-right">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 transition-colors tracking-tight">Código Enviado</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors font-medium">Insira o código de 6 dígitos</p>
                        </div>

                        {localSuccess && <p className={alertSuccessCls}>{localSuccess}</p>}

                        <form onSubmit={handleVerifyCode} className="space-y-5">
                            <div>
                                <label className={labelCls}>Código</label>
                                <input
                                    type="text" maxLength="6" value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                                    placeholder="000000" required className={`${inputCls} text-center tracking-[0.5em] text-xl font-mono font-bold`}
                                />
                            </div>

                            {localError && <p className={alertErrorCls}>{localError}</p>}

                            <div className="pt-2">
                                <button type="submit" className={btnSubmitCls}>
                                    Validar Código
                                </button>
                                <button type="button" onClick={goToLogin} className={btnCancelCls}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ================= VISÃO 4: REDEFINIÇÃO DE SENHA ================= */}
                {view === 'reset' && (
                    <div className="animate-fade-in-right">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 transition-colors tracking-tight">Nova Senha</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors font-medium">Crie uma nova credencial forte</p>
                        </div>

                        {localSuccess && <p className={alertSuccessCls}>{localSuccess}</p>}

                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label className={labelCls}>Nova Senha</label>
                                <input
                                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                    required className={inputCls} placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Confirmar Nova Senha</label>
                                <input
                                    type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    required className={inputCls} placeholder="••••••••"
                                />
                            </div>

                            {localError && <p className={alertErrorCls}>{localError}</p>}

                            <div className="pt-2">
                                <button type="submit" className={btnSubmitCls}>
                                    Redefinir Senha
                                </button>
                                <button type="button" onClick={goToLogin} className={btnCancelCls}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
}