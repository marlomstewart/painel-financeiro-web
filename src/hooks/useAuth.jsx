import { useState, useCallback } from 'react';

const loadingIcon = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

/**
 * Hook Customizado: useAuth
 * Gere o token JWT, fluxos de login, permissões administrativas e agora 
 * a atualização de perfil e palavra-passe do próprio utilizador.
 */
export function useAuth({ API, modal, setCarregouAPI }) {
    const [token, setToken] = useState(localStorage.getItem('tokenPainel') || null);
    const [tokenTemp, setTokenTemp] = useState(null);
    const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);
    const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem('nomeUsuario') || '');
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdminPainel') === 'true');

    const [usuarios, setUsuarios] = useState([]);
    const [usuarioLogin, setUsuarioLogin] = useState('');
    const [senhaLogin, setSenhaLogin] = useState('');
    const [erroLogin, setErroLogin] = useState('');

    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erroTrocaSenha, setErroTrocaSenha] = useState('');

    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), [token]);

    const fazerLogin = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `${loadingIcon} Entrando...`;

        try {
            const res = await fetch(`${API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario: usuarioLogin, senha: senhaLogin })
            });
            const data = await res.json();

            if (res.ok) {
                if (data.precisaTrocar) {
                    setTokenTemp(data.token);
                    setPrecisaTrocarSenha(true);
                } else {
                    localStorage.setItem('tokenPainel', data.token);
                    localStorage.setItem('nomeUsuario', usuarioLogin);
                    localStorage.setItem('isAdminPainel', data.is_admin);
                    setToken(data.token);
                    setNomeUsuario(usuarioLogin);
                    setIsAdmin(data.is_admin);
                }
            } else {
                setErroLogin(data.message || 'Erro ao fazer login');
                setTimeout(() => setErroLogin(''), 3000);
            }
        } catch (err) {
            setErroLogin('Erro de conexão. Servidor pode estar hibernando.');
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    const enviarNovaSenha = async (e) => {
        e.preventDefault();
        if (novaSenha !== confirmarSenha) {
            setErroTrocaSenha('As senhas não coincidem!');
            return;
        }
        try {
            const res = await fetch(`${API}/mudar-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenTemp}` },
                // CORREÇÃO: Enviamos a senha atual em cache para satisfazer a nova regra do backend
                body: JSON.stringify({ novaSenha, senhaAtual: senhaLogin })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('tokenPainel', tokenTemp);
                localStorage.setItem('nomeUsuario', usuarioLogin);
                setToken(tokenTemp);
                setNomeUsuario(usuarioLogin);
                setPrecisaTrocarSenha(false);
                setTokenTemp(null);
                setNovaSenha('');
                setConfirmarSenha('');
                setSenhaLogin('');
            } else {
                setErroTrocaSenha(data.message || 'Erro ao mudar senha');
            }
        } catch (err) {
            setErroTrocaSenha('Erro de conexão.');
        }
    };

    const fazerLogout = useCallback(() => {
        localStorage.removeItem('tokenPainel');
        localStorage.removeItem('nomeUsuario');
        localStorage.removeItem('isAdminPainel');
        setToken(null);
        setNomeUsuario('');
        setIsAdmin(false);
        setCarregouAPI(false);
        setUsuarioLogin('');
        setSenhaLogin('');
        setErroLogin('');
    }, [setCarregouAPI]);

    /**
     * ATUALIZAÇÃO: Atualiza os dados de perfil no servidor e na sessão local.
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
                await modal.alert('O seu perfil foi atualizado com sucesso!', '✅ Perfil Atualizado');
            } else {
                await modal.alert('Não foi possível atualizar o perfil. Tente novamente.', '❌ Erro');
            }
        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            await modal.alert('Erro de conexão com o servidor.', '❌ Erro de Rede');
        }
    };

    /**
     * ATUALIZAÇÃO: Envia a requisição de alteração de senha a partir da aba de Configurações.
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

    const carregarUsuarios = async () => {
        try {
            const res = await fetch(`${API}/admin/usuarios`, { headers: getHeaders() });
            if (res.ok) setUsuarios(await res.json());
        } catch (err) { console.error("Erro ao carregar utilizadores", err); }
    };

    const criarUsuario = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const usr = form.get('usuario');
        const ehAdmin = form.get('is_admin') === 'on';
        try {
            const res = await fetch(`${API}/admin/usuarios`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ usuario: usr, is_admin: ehAdmin }) });
            const data = await res.json();
            if (res.ok) { await modal.alert(data.message, '✅ Sucesso'); carregarUsuarios(); e.target.reset(); }
            else await modal.alert(data.message || data.error, '❌ Erro');
        } catch (err) { await modal.alert('Erro conexão', '❌ Erro'); }
    };

    const deletarUsuario = async (id, nome) => {
        const ok = await modal.confirm(`Tem a certeza que deseja EXCLUIR o utilizador "${nome}"?`, '🗑️ Excluir', { confirmLabel: 'Sim, Excluir', confirmColor: 'bg-red-600 hover:bg-red-700' });
        if (!ok) return;
        const res = await fetch(`${API}/admin/usuarios/${id}`, { method: 'DELETE', headers: getHeaders() });
        const data = await res.json();
        if (res.ok) { await modal.alert(data.message, '✅ Excluído'); carregarUsuarios(); }
        else await modal.alert(data.message, '❌ Erro');
    };

    const resetarSenha = async (id, nome) => {
        const ok = await modal.confirm(`Redefinir a senha de "${nome}" para 'admin123'?`, '🔑 Repor', { confirmLabel: 'Redefinir' });
        if (!ok) return;
        const res = await fetch(`${API}/admin/usuarios/${id}/resetar-senha`, { method: 'POST', headers: getHeaders() });
        const data = await res.json();
        await modal.alert(data.message, res.ok ? '✅ Redefinida' : '❌ Erro');
    };

    const toggleAdmin = async (id, nomeU, atualIsAdmin) => {
        const acao = atualIsAdmin ? 'remover privilégios de administrador' : 'promover a administrador';
        const ok = await modal.confirm(`Deseja ${acao} de "${nomeU}"?`, '⭐ Alterar Permissão', { confirmLabel: 'Confirmar' });
        if (!ok) return;
        const res = await fetch(`${API}/admin/usuarios/${id}/toggle-admin`, { method: 'PUT', headers: getHeaders() });
        const data = await res.json();
        if (res.ok) carregarUsuarios();
        else await modal.alert(data.message, '❌ Erro');
    };

    return {
        token, precisaTrocarSenha, nomeUsuario, isAdmin, usuarios, getHeaders,
        usuarioLogin, setUsuarioLogin, senhaLogin, setSenhaLogin, erroLogin,
        novaSenha, setNovaSenha, confirmarSenha, setConfirmarSenha, erroTrocaSenha,
        fazerLogin, enviarNovaSenha, fazerLogout,
        carregarUsuarios, criarUsuario, deletarUsuario, resetarSenha, toggleAdmin,
        atualizarPerfil, alterarSenha // Injeção das novas funções na View
    };
}