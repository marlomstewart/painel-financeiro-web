// O ID do JWT só roteia dados locais. A API sempre valida a assinatura do token e autoriza a escrita.
export function usuarioIdDoToken(token) {
    try {
        const payload = token?.split('.')[1];
        if (!payload) return null;
        const { id } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        if (Number.isSafeInteger(id) && id > 0) return String(id);
        if (typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id)) return id;
    } catch {
        // Token ausente/malformado não pode ser usado para atribuir uma fila a uma conta.
    }
    return null;
}
