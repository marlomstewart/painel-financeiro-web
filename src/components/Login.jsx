/* eslint-disable react/prop-types */
import React, { useState } from 'react';

/**
 * Componente: Login
 * Tela de captura de credenciais e gestão do fluxo de recuperação de senha.
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

    // Estilos padrão reaproveitados (DRY)
    const inputCls = "w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors";
    const btnSubmitCls = "w-full bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-md mt-2 cursor-pointer";
    const btnCancelCls = "w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-lg text-sm transition-colors cursor-pointer mt-3";
    const alertErrorCls = "text-red-500 dark:text-red-400 text-xs font-bold text-center bg-red-50 dark:bg-red-900/30 p-2 rounded border border-red-100 dark:border-red-800 transition-colors";
    const alertSuccessCls = "text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded border border-emerald-100 dark:border-emerald-800 mb-4 transition-colors";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <ModalComponent config={modalConfig} onClose={modalClose} />

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-sm border border-transparent dark:border-slate-700 transition-colors duration-300">

                {/* ================= VISÃO 1: LOGIN ================= */}
                {view === 'login' && (
                    <>
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors">Painel Financeiro</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Acesso Restrito</p>
                        </div>

                        {localSuccess && <p className={alertSuccessCls}>{localSuccess}</p>}

                        <form onSubmit={fazerLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase transition-colors">Usuário</label>
                                <input
                                    type="text" value={usuarioLogin} onChange={(e) => setUsuarioLogin(e.target.value)}
                                    required className={inputCls}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase transition-colors">Senha</label>
                                    <button
                                        type="button"
                                        onClick={() => { setView('forgot'); setLocalSuccess(''); setLocalError(''); }}
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer transition-colors"
                                    >
                                        Esqueci minha senha
                                    </button>
                                </div>
                                <input
                                    type="password" value={senhaLogin} onChange={(e) => setSenhaLogin(e.target.value)}
                                    required className={inputCls}
                                />
                            </div>

                            {erroLogin && <p className={alertErrorCls}>{erroLogin}</p>}

                            <button type="submit" className={btnSubmitCls}>
                                Entrar no Sistema
                            </button>
                        </form>
                    </>
                )}

                {/* ================= VISÃO 2: SOLICITAÇÃO (FORGOT) ================= */}
                {view === 'forgot' && (
                    <>
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors">Recuperar Senha</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Identifique a sua conta</p>
                        </div>

                        <form onSubmit={handleRequestCode} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase transition-colors">Usuário</label>
                                <input
                                    type="text" value={resetUser} onChange={(e) => setResetUser(e.target.value)}
                                    placeholder="O seu nome de acesso..." required className={inputCls}
                                />
                            </div>

                            {localError && <p className={alertErrorCls}>{localError}</p>}

                            <button type="submit" className={btnSubmitCls}>
                                Enviar Código de Verificação
                            </button>
                            <button type="button" onClick={goToLogin} className={btnCancelCls}>
                                Voltar para o Login
                            </button>
                        </form>
                    </>
                )}

                {/* ================= VISÃO 3: VERIFICAÇÃO DO CÓDIGO ================= */}
                {view === 'verify' && (
                    <>
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors">Código Enviado</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Insira o código de 6 dígitos</p>
                        </div>

                        {localSuccess && <p className={alertSuccessCls}>{localSuccess}</p>}

                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase transition-colors">Código</label>
                                <input
                                    type="text" maxLength="6" value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                                    placeholder="000000" required className={`${inputCls} text-center tracking-widest text-lg font-mono`}
                                />
                            </div>

                            {localError && <p className={alertErrorCls}>{localError}</p>}

                            <button type="submit" className={btnSubmitCls}>
                                Validar Código
                            </button>
                            <button type="button" onClick={goToLogin} className={btnCancelCls}>
                                Cancelar
                            </button>
                        </form>
                    </>
                )}

                {/* ================= VISÃO 4: REDEFINIÇÃO DE SENHA ================= */}
                {view === 'reset' && (
                    <>
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors">Nova Senha</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Crie uma nova credencial forte</p>
                        </div>

                        {localSuccess && <p className={alertSuccessCls}>{localSuccess}</p>}

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase transition-colors">Nova Senha</label>
                                <input
                                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                    required className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase transition-colors">Confirmar Nova Senha</label>
                                <input
                                    type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    required className={inputCls}
                                />
                            </div>

                            {localError && <p className={alertErrorCls}>{localError}</p>}

                            <button type="submit" className={btnSubmitCls}>
                                Redefinir Senha
                            </button>
                            <button type="button" onClick={goToLogin} className={btnCancelCls}>
                                Cancelar
                            </button>
                        </form>
                    </>
                )}

            </div>
        </div>
    );
}