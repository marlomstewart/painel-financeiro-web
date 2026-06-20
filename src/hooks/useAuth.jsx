import { useState, useCallback } from 'react';

/**
 * Hook Customizado: useAuth
 * Encapsula o portão de segurança (Gatekeeper) do sistema.
 * Gere token JWT, níveis de acesso, fluxos de login/logout e rotinas do Super Admin.
 * * @param {Object} params - Instâncias globais injetadas pelo Root.
 * @param {string} params.API - URL Base da API REST.
 * @param {Object} params.modal - Instância de manipulação visual de janelas.
 * @param {Function} params.setCarregouAPI - Setter de estado de carregamento do App principal.
 */
export function useAuth({ API, modal, setCarregouAPI }) {
    // Estados Globais de Autenticação
    const [token, setToken] = useState(localStorage.getItem('tokenPainel') || null);
    const [tokenTemp, setTokenTemp] = useState(null);
    const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);
    const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem('nomeUsuario') || '');
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true' || false);
    const [usuarios, setUsuarios] = useState([]);

    // Estados Locais de Formulário
    const [usuarioLogin, setUsuarioLogin] = useState('');
    const [senhaLogin, setSenhaLogin] = useState('');
    const [erroLogin, setErroLogin] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erroTrocaSenha, setErroTrocaSenha] = useState('');

    /**
     * Memória injetável do JWT em cada requisição REST do sistema.
     */
    const getHeaders = useCallback(() => ({
        'Authorization': `Bearer ${token || tokenTemp}`,
        'Content-Type': 'application/json'
    }), [token, tokenTemp]);

    /**
     * Realiza o aperto de mãos (Handshake) com o Backend validando as credenciais.
     */
    const fazerLogin = async (e) => {
        e.preventDefault(); setErroLogin('');
        try {
            const res = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: usuarioLogin, senha: senhaLogin }) });
            const data = await res.json();
            if (data.auth) {
                localStorage.setItem('nomeUsuario', usuarioLogin); setNomeUsuario(usuarioLogin);
                if (data.precisaTrocar) { setTokenTemp(data.token); setPrecisaTrocarSenha(true); }
                else {
                    localStorage.setItem('tokenPainel', data.token); localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false');
                    setToken(data.token); setIsAdmin(data.is_admin === true);
                }
            } else { setErroLogin(data.message); }
        } catch (err) { setErroLogin("Erro ao conectar no servidor."); }
    };

    /**
     * Purga violentamente qualquer estado local e de sessão do cliente.
     */
    const fazerLogout = useCallback(() => {
        localStorage.removeItem('tokenPainel'); localStorage.removeItem('nomeUsuario'); localStorage.removeItem('isAdmin');
        setToken(null); setTokenTemp(null); setPrecisaTrocarSenha(false); setCarregouAPI(false); setNomeUsuario(''); setIsAdmin(false); setUsuarios([]);
    }, [setCarregouAPI]);

    /**
     * Atualiza no banco de dados a senha do usuário e liberta o Token temporário para uso vitalício (12h).
     */
    const enviarNovaSenha = async (e) => {
        e.preventDefault(); setErroTrocaSenha('');
        const regexSenhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
        if (novaSenha !== confirmarSenha) return setErroTrocaSenha("As senhas não coincidem.");
        if (!regexSenhaForte.test(novaSenha)) return setErroTrocaSenha("Mínimo 12 caracteres, 1 Maiúscula, 1 Minúscula, 1 Número, 1 Especial.");
        try {
            const res = await fetch(`${API}/mudar-senha`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ novaSenha }) });
            if (res.ok) { localStorage.setItem('tokenPainel', tokenTemp); setToken(tokenTemp); setTokenTemp(null); setPrecisaTrocarSenha(false); }
            else { setErroTrocaSenha("Erro ao atualizar a senha no servidor."); }
        } catch (err) { setErroTrocaSenha("Erro de conexão."); }
    };

    /** Operações restritas ao Super Admin */
    const carregarUsuarios = async () => { const res = await fetch(`${API}/admin/usuarios`, { headers: getHeaders() }); if (res.ok) setUsuarios(await res.json()); };
    const criarUsuario = async (e) => { e.preventDefault(); const fd = new FormData(e.target); const usuario = fd.get('usuario'); const is_admin = fd.get('is_admin') === 'on'; const res = await fetch(`${API}/admin/usuarios`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ usuario, is_admin }) }); const data = await res.json(); if (res.ok) { await modal.alert(data.message, '✅ Criado'); e.target.reset(); carregarUsuarios(); } else await modal.alert(data.message, '❌ Erro'); };
    const deletarUsuario = async (id, nome) => { const ok = await modal.confirm(`Deletar o usuário "${nome}"?`, '🗑️ Deletar', { confirmLabel: 'Deletar', confirmColor: 'bg-red-600 hover:bg-red-700' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}`, { method: 'DELETE', headers: getHeaders() }); const data = await res.json(); if (res.ok) { await modal.alert(data.message, '✅ Deletado'); carregarUsuarios(); } else await modal.alert(data.message, '❌ Erro'); };
    const resetarSenha = async (id, nome) => { const ok = await modal.confirm(`Resetar a senha de "${nome}" para 'admin123'?`, '🔑 Resetar', { confirmLabel: 'Resetar' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}/resetar-senha`, { method: 'POST', headers: getHeaders() }); const data = await res.json(); await modal.alert(data.message, res.ok ? '✅ Resetada' : '❌ Erro'); };
    const toggleAdmin = async (id, nomeU, atualIsAdmin) => { const acao = atualIsAdmin ? 'remover admin' : 'promover a admin'; const ok = await modal.confirm(`Deseja ${acao} de "${nomeU}"?`, '⭐ Alterar Permissão', { confirmLabel: 'Confirmar' }); if (!ok) return; const res = await fetch(`${API}/admin/usuarios/${id}/toggle-admin`, { method: 'PUT', headers: getHeaders() }); const data = await res.json(); if (res.ok) carregarUsuarios(); else await modal.alert(data.message, '❌ Erro'); };

    return {
        token, precisaTrocarSenha, nomeUsuario, isAdmin, usuarios, getHeaders,
        usuarioLogin, setUsuarioLogin, senhaLogin, setSenhaLogin, erroLogin,
        novaSenha, setNovaSenha, confirmarSenha, setConfirmarSenha, erroTrocaSenha,
        fazerLogin, fazerLogout, enviarNovaSenha, carregarUsuarios, criarUsuario, deletarUsuario, resetarSenha, toggleAdmin
    };
}