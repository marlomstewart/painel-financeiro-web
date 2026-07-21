import { useState, useCallback } from 'react';

const loadingIcon = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

/**
 * @function useAuth
 * @description Hook Customizado: Gere token JWT, fluxos de login, perfis e controle de acesso granular.
 * @updated Inclui a captura e persistência da flag 'temGaragem' para isolamento de módulos.
 */
export function useAuth({ API, modal, setCarregouAPI }) {
    const [token, setToken] = useState(localStorage.getItem('tokenPainel') || null);
    const [tokenTemp, setTokenTemp] = useState(null);
    const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);

    // O nome visual agora é baseado no nome de exibição (isolado do login)
    const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem('nomeUsuario') || '');
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdminPainel') === 'true');

    // 🔥 NOVO ESTADO: Controle de acesso ao módulo garagem
    const [temGaragem, setTemGaragem] = useState(localStorage.getItem('temGaragem') === 'true');

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

                    // 🔥 ATUALIZAÇÃO: Persiste a permissão da garagem localmente
                    localStorage.setItem('temGaragem', data.tem_garagem ? 'true' : 'false');

                    setToken(data.token);
                    setIsAdmin(data.is_admin === true);
                    setNomeUsuario(nomeVisual);
                    setTemGaragem(data.tem_garagem === true);
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
        localStorage.removeItem('isAdminPainel');
        // 🔥 Limpa a permissão ao deslogar
        localStorage.removeItem('temGaragem');

        setToken(null);
        setTokenTemp(null);
        setPrecisaTrocarSenha(false);
        setCarregouAPI(false);
        setNomeUsuario('');
        setIsAdmin(false);
        setTemGaragem(false);
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
                localStorage.setItem('tokenPainel', tokenTemp);
                localStorage.setItem('nomeUsuario', usuarioLogin);
                setToken(tokenTemp);
                setNomeUsuario(usuarioLogin);
                setTokenTemp(null);
                setPrecisaTrocarSenha(false);
                setSenhaLogin('');
                setNovaSenha('');
                setConfirmarSenha('');

                // NOTA: Como não estamos fazendo um login limpo neste fluxo, o usuário precisará fazer logoff e login
                // para puxar flags atualizadas. No entanto, para segurança, desativamos permissões no primeiro acesso.
            } else {
                setErroTrocaSenha(data.message || "Erro ao atualizar a senha no servidor.");
            }
        } catch (err) {
            setErroTrocaSenha("Erro de conexão.");
        } finally {
            if (btn) { btn.disabled = false; btn.classList.remove('opacity-70', 'cursor-wait'); btn.innerHTML = originalText; }
        }
    };

    /**
     * Atualiza os dados visuais do Perfil na Base de Dados e atualiza a Sessão Local.
     */
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
                await modal.alert('O seu perfil foi atualizado com sucesso e o login permanece protegido.', '✅ Perfil Atualizado');
            } else {
                await modal.alert('Não foi possível atualizar o perfil. Tente novamente.', '❌ Erro');
            }
        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            await modal.alert('Erro de conexão com o servidor.', '❌ Erro de Rede');
        }
    };

    /**
     * Envia a requisição de alteração de senha a partir da aba de Configurações, validando a senha atual.
     */
    const alterarSenha = async (dados) => {
        try {
            const res = await fetch(`${API}/mudar-senha`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(dados)
            });
            const data = await res.json();

            if (res.ok) {
                await modal.alert('A sua palavra-passe foi alterada com sucesso!', '✅ Segurança Atualizada');
            } else {
                await modal.alert(data.message || 'A palavra-passe atual está incorreta.', '❌ Erro de Validação');
            }
        } catch (err) {
            console.error("Erro ao alterar senha:", err);
            await modal.alert('Erro de conexão com o servidor.', '❌ Erro de Rede');
        }
    };

    /** Operações restritas ao Super Admin */
    const carregarUsuarios = async () => { const res = await fetch(`${API}/admin/usuarios`, { headers: getHeaders() }); if (res.ok) setUsuarios(await res.json()); };
    const criarUsuario = async (e) => { e.preventDefault(); const fd = new FormData(e.target); const usuario = fd.get('usuario'); const is_admin = fd.get('is_admin') === 'on'; const res = await fetch(`${API}/admin/usuarios`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ usuario, is_admin }) }); const data = await res.json(); if (res.ok) { await modal.alert(data.message, '✅ Criado'); e.target.reset(); carregarUsuarios(); } else await modal.alert(data.message || data.error, '❌ Erro'); };
    const deletarUsuario = async (id, nome) => { const ok = await modal.confirm(`Tem a certeza que deseja EXCLUIR o utilizador "${nome}"?`, '🗑️ Excluir', { confirmLabel: 'Deletar', confirmColor: 'bg-red-600 hover:bg-red-700' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}`, { method: 'DELETE', headers: getHeaders() }); const data = await res.json(); if (res.ok) { await modal.alert(data.message, '✅ Excluído'); carregarUsuarios(); } else await modal.alert(data.message, '❌ Erro'); };
    const resetarSenha = async (id, nome) => { const ok = await modal.confirm(`Resetar a senha de "${nome}" para 'admin123'?`, '🔑 Resetar', { confirmLabel: 'Resetar' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}/resetar-senha`, { method: 'POST', headers: getHeaders() }); const data = await res.json(); await modal.alert(data.message, res.ok ? '✅ Resetada' : '❌ Erro'); };
    const toggleAdmin = async (id, nomeU, atualIsAdmin) => { const acao = atualIsAdmin ? 'remover admin' : 'promover a admin'; const ok = await modal.confirm(`Deseja ${acao} de "${nomeU}"?`, '⭐ Alterar Permissão', { confirmLabel: 'Confirmar' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}/toggle-admin`, { method: 'PUT', headers: getHeaders() }); const data = await res.json(); if (res.ok) carregarUsuarios(); else await modal.alert(data.message, '❌ Erro'); };

    // 🔥 NOVA AÇÃO: Ligar/Desligar acesso à Garagem
    const toggleGaragem = async (id, nomeU, atualTemGaragem) => { const acao = atualTemGaragem ? 'REVOGAR o acesso à Garagem' : 'LIBERAR o acesso à Garagem'; const ok = await modal.confirm(`Deseja ${acao} para "${nomeU}"?`, '🏍️ Alterar Acesso', { confirmLabel: 'Confirmar' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}/toggle-garagem`, { method: 'PUT', headers: getHeaders() }); const data = await res.json(); if (res.ok) carregarUsuarios(); else await modal.alert(data.message, '❌ Erro'); };

    return {
        token, precisaTrocarSenha, nomeUsuario, isAdmin, temGaragem, usuarios, getHeaders,
        usuarioLogin, setUsuarioLogin, senhaLogin, setSenhaLogin, erroLogin,
        novaSenha, setNovaSenha, confirmarSenha, setConfirmarSenha, erroTrocaSenha,
        fazerLogin, fazerLogout, enviarNovaSenha, carregarUsuarios, criarUsuario, deletarUsuario, resetarSenha, toggleAdmin, toggleGaragem,
        atualizarPerfil, alterarSenha
    };
}