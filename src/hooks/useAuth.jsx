import { useState, useCallback } from 'react';

const loadingIcon = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

/**
 * @function useAuth
 * @description Hook Customizado: Gere token JWT, fluxos de login, perfis e controle de acesso granular.
 * @updated Inclui a captura e persistência do 'telegram_chat_id' para alertas preditivos.
 */
export function useAuth({ API, modal, setCarregouAPI, showToast }) {
    const [token, setToken] = useState(localStorage.getItem('tokenPainel') || null);
    const [tokenTemp, setTokenTemp] = useState(null);
    const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);

    // O nome visual agora é baseado no nome de exibição (isolado do login)
    const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem('nomeUsuario') || '');
    const [nomeCompleto, setNomeCompleto] = useState(localStorage.getItem('nomeCompleto') || '');
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdminPainel') === 'true');

    // Controle de acesso ao módulo garagem e notificações preditivas
    const [temGaragem, setTemGaragem] = useState(localStorage.getItem('temGaragem') === 'true');
    const [temComprovante, setTemComprovante] = useState(localStorage.getItem('temComprovante') === 'true');
    const [telegramChatId, setTelegramChatId] = useState(localStorage.getItem('telegramChatId') || '');
    const [tutorialDispensado, setTutorialDispensado] = useState(localStorage.getItem('tutorialDispensado') === 'true');
    const [chavePix, setChavePix] = useState(localStorage.getItem('chavePix') || '');

    const [usuarios, setUsuarios] = useState([]);

    const [usuarioLogin, setUsuarioLogin] = useState('');
    const [senhaLogin, setSenhaLogin] = useState('');
    const [erroLogin, setErroLogin] = useState('');

    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erroTrocaSenha, setErroTrocaSenha] = useState('');

    const getHeaders = useCallback(() => ({
        'Authorization': `Bearer ${token || tokenTemp}`,
        'Content-Type': 'application/json'
    }), [token, tokenTemp]);

    const fazerLogin = async (e) => {
        e.preventDefault();
        setErroLogin('');

        const btn = e.target.querySelector('button[type="submit"]') || e.target.querySelector('button');
        const originalText = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.classList.add('opacity-70', 'cursor-wait'); btn.innerHTML = `${loadingIcon} Autenticando...`; }

        try {
            const res = await fetch(`${API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario: usuarioLogin, senha: senhaLogin })
            });
            const data = await res.json();

            if (res.ok && data.auth) {
                const nomeVisual = data.nomeExibicao || usuarioLogin;

                if (data.precisaTrocar) {
                    setTokenTemp(data.token);
                    setPrecisaTrocarSenha(true);
                } else {
                    localStorage.setItem('tokenPainel', data.token);
                    localStorage.setItem('isAdminPainel', data.is_admin ? 'true' : 'false');
                    localStorage.setItem('nomeUsuario', nomeVisual);
                    localStorage.setItem('nomeCompleto', data.nomeCompleto || '');
                    localStorage.setItem('temGaragem', data.tem_garagem ? 'true' : 'false');
                    localStorage.setItem('temComprovante', data.tem_comprovante ? 'true' : 'false');
                    localStorage.setItem('telegramChatId', data.telegram_chat_id || '');
                    localStorage.setItem('tutorialDispensado', data.tutorial_dispensado ? 'true' : 'false');
                    localStorage.setItem('chavePix', data.chave_pix || '');

                    setToken(data.token);
                    setIsAdmin(data.is_admin === true);
                    setNomeUsuario(nomeVisual);
                    setNomeCompleto(data.nomeCompleto || '');
                    setTemGaragem(data.tem_garagem === true);
                    setTemComprovante(data.tem_comprovante === true);
                    setTelegramChatId(data.telegram_chat_id || '');
                    setTutorialDispensado(data.tutorial_dispensado === true);
                    setChavePix(data.chave_pix || '');
                }
            } else {
                setErroLogin(data.message || 'Erro de credenciais.');
            }
        } catch (err) {
            setErroLogin("Erro ao conectar no servidor. Pode estar a hibernar.");
        } finally {
            if (btn) { btn.disabled = false; btn.classList.remove('opacity-70', 'cursor-wait'); btn.innerHTML = originalText; }
        }
    };

    const fazerLogout = useCallback(() => {
        localStorage.removeItem('tokenPainel');
        localStorage.removeItem('nomeUsuario');
        localStorage.removeItem('nomeCompleto');
        localStorage.removeItem('isAdminPainel');
        localStorage.removeItem('temGaragem');
        localStorage.removeItem('temComprovante');
        localStorage.removeItem('telegramChatId');
        localStorage.removeItem('tutorialDispensado');
        localStorage.removeItem('chavePix');

        setToken(null);
        setTokenTemp(null);
        setPrecisaTrocarSenha(false);
        setCarregouAPI(false);
        setNomeUsuario('');
        setNomeCompleto('');
        setIsAdmin(false);
        setTemGaragem(false);
        setTemComprovante(false);
        setTelegramChatId('');
        setTutorialDispensado(false);
        setChavePix('');
        setUsuarios([]);
        setUsuarioLogin('');
        setSenhaLogin('');
    }, [setCarregouAPI]);

    const enviarNovaSenha = async (e) => {
        e.preventDefault();
        setErroTrocaSenha('');
        const regexSenhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;

        if (novaSenha !== confirmarSenha) return setErroTrocaSenha("As senhas não coincidem.");
        if (!regexSenhaForte.test(novaSenha)) return setErroTrocaSenha("Mínimo 12 caracteres, 1 Maiúscula, 1 Minúscula, 1 Número, 1 Especial.");

        const btn = e.target.querySelector('button[type="submit"]') || e.target.querySelector('button');
        const originalText = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.classList.add('opacity-70', 'cursor-wait'); btn.innerHTML = `${loadingIcon} Atualizando...`; }

        try {
            const res = await fetch(`${API}/mudar-senha`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ novaSenha, senhaAtual: senhaLogin })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('tokenPainel', data.token);
                localStorage.setItem('nomeUsuario', usuarioLogin);
                setToken(data.token);
                setNomeUsuario(usuarioLogin);
                setTokenTemp(null);
                setPrecisaTrocarSenha(false);
                setSenhaLogin('');
                setNovaSenha('');
                setConfirmarSenha('');
            } else {
                setErroTrocaSenha(data.message || "Erro ao atualizar a senha no servidor.");
            }
        } catch (err) {
            setErroTrocaSenha("Erro de conexão.");
        } finally {
            if (btn) { btn.disabled = false; btn.classList.remove('opacity-70', 'cursor-wait'); btn.innerHTML = originalText; }
        }
    };

    /** Atualiza os dados visuais do Perfil */
    const atualizarPerfil = async (dados) => {
        try {
            const res = await fetch(`${API}/perfil`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(dados)
            });
            if (res.ok) {
                localStorage.setItem('nomeUsuario', dados.nomeExibicao);
                setNomeUsuario(dados.nomeExibicao);
                localStorage.setItem('nomeCompleto', dados.nomeCompleto || '');
                setNomeCompleto(dados.nomeCompleto || '');
                if (dados.chave_pix !== undefined) {
                    localStorage.setItem('chavePix', dados.chave_pix || '');
                    setChavePix(dados.chave_pix || '');
                }
                showToast('Perfil atualizado com sucesso!', 'success');
            } else {
                showToast('Não foi possível atualizar o perfil. Tente novamente.', 'error');
            }
        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            showToast('Erro de conexão com o servidor.', 'error');
        }
    };

    /** Atualiza o ID do Telegram para Notificações */
    const atualizarTelegram = async (dados) => {
        try {
            const res = await fetch(`${API}/telegram`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(dados)
            });
            if (res.ok) {
                localStorage.setItem('telegramChatId', dados.telegram_chat_id);
                setTelegramChatId(dados.telegram_chat_id);
                showToast('Chat ID salvo! Você passará a receber notificações preditivas.', 'success');
            } else {
                showToast('Não foi possível salvar o seu ID do Telegram. Tente novamente.', 'error');
            }
        } catch (err) {
            console.error("Erro ao atualizar telegram:", err);
            showToast('Erro de conexão com o servidor.', 'error');
        }
    };

    /** Envia a requisição de alteração de senha a partir das Configurações */
    const alterarSenha = async (dados) => {
        try {
            const res = await fetch(`${API}/mudar-senha`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(dados)
            });
            const data = await res.json();

            if (res.ok) {
                showToast('Senha alterada com sucesso!', 'success');
            } else {
                showToast(data.message || 'A palavra-passe atual está incorreta.', 'error');
            }
        } catch (err) {
            console.error("Erro ao alterar senha:", err);
            showToast('Erro de conexão com o servidor.', 'error');
        }
    };

    /** Marca o tutorial de boas-vindas como dispensado (não mostrar novamente) */
    const dispensarTutorial = async () => {
        localStorage.setItem('tutorialDispensado', 'true');
        setTutorialDispensado(true);
        try {
            await fetch(`${API}/tutorial`, { method: 'PUT', headers: getHeaders() });
        } catch (err) {
            console.error("Erro ao dispensar tutorial:", err);
        }
    };

    /** Operações restritas ao Super Admin */
    const carregarUsuarios = async () => { const res = await fetch(`${API}/admin/usuarios`, { headers: getHeaders() }); if (res.ok) setUsuarios(await res.json()); };
    const criarUsuario = async (e) => { e.preventDefault(); const fd = new FormData(e.target); const usuario = fd.get('usuario'); const is_admin = fd.get('is_admin') === 'on'; const res = await fetch(`${API}/admin/usuarios`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ usuario, is_admin }) }); const data = await res.json(); if (res.ok) { showToast(data.message, 'success'); e.target.reset(); carregarUsuarios(); } else showToast(data.message || data.error, 'error'); };
    const deletarUsuario = async (id, nome) => { const ok = await modal.confirm(`Tem a certeza que deseja EXCLUIR o utilizador "${nome}"?`, '🗑️ Excluir', { confirmLabel: 'Deletar', confirmColor: 'bg-red-600 hover:bg-red-700' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}`, { method: 'DELETE', headers: getHeaders() }); const data = await res.json(); if (res.ok) { showToast(data.message, 'success'); carregarUsuarios(); } else showToast(data.message, 'error'); };
    const resetarSenha = async (id, nome) => { const ok = await modal.confirm(`Resetar a senha de "${nome}" para 'admin123'?`, '🔑 Resetar', { confirmLabel: 'Resetar' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}/resetar-senha`, { method: 'POST', headers: getHeaders() }); const data = await res.json(); showToast(data.message, res.ok ? 'success' : 'error'); };
    const toggleAdmin = async (id, nomeU, atualIsAdmin) => { const acao = atualIsAdmin ? 'remover admin' : 'promover a admin'; const ok = await modal.confirm(`Deseja ${acao} de "${nomeU}"?`, '⭐ Alterar Permissão', { confirmLabel: 'Confirmar' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}/toggle-admin`, { method: 'PUT', headers: getHeaders() }); const data = await res.json(); if (res.ok) carregarUsuarios(); else showToast(data.message, 'error'); };
    const toggleGaragem = async (id, nomeU, atualTemGaragem) => { const acao = atualTemGaragem ? 'REVOGAR o acesso à Garagem' : 'LIBERAR o acesso à Garagem'; const ok = await modal.confirm(`Deseja ${acao} para "${nomeU}"?`, '🏍️ Alterar Acesso', { confirmLabel: 'Confirmar' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}/toggle-garagem`, { method: 'PUT', headers: getHeaders() }); const data = await res.json(); if (res.ok) carregarUsuarios(); else showToast(data.message, 'error'); };
    const toggleComprovante = async (id, nomeU, atualTemComprovante) => { const acao = atualTemComprovante ? 'REVOGAR o anexo de comprovantes' : 'LIBERAR o anexo de comprovantes'; const ok = await modal.confirm(`Deseja ${acao} para "${nomeU}"?`, '📎 Alterar Acesso', { confirmLabel: 'Confirmar' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}/toggle-comprovante`, { method: 'PUT', headers: getHeaders() }); const data = await res.json(); if (res.ok) carregarUsuarios(); else showToast(data.message, 'error'); };

    return {
        token, precisaTrocarSenha, nomeUsuario, nomeCompleto, isAdmin, temGaragem, temComprovante, telegramChatId, tutorialDispensado, chavePix, usuarios, getHeaders,
        usuarioLogin, setUsuarioLogin, senhaLogin, setSenhaLogin, erroLogin,
        novaSenha, setNovaSenha, confirmarSenha, setConfirmarSenha, erroTrocaSenha,
        fazerLogin, fazerLogout, enviarNovaSenha, carregarUsuarios, criarUsuario, deletarUsuario, resetarSenha, toggleAdmin, toggleGaragem, toggleComprovante,
        atualizarPerfil, atualizarTelegram, alterarSenha, dispensarTutorial
    };
}