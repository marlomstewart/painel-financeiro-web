import { useCallback, useEffect, useRef, useState } from 'react';
import { listarPendentes, contarPendentesSemDono, removerPendente, atualizarPendente } from '../utils/offlineQueue';
import { usuarioIdDoToken } from '../utils/identidadeSessao';

const INTERVALO_RETRY_MS = 60 * 1000;

const ehFalhaPermanente = (status) => status >= 400 && status < 500 && status !== 408 && status !== 429;
const idsDoItem = (item) => Array.isArray(item.payload?.transacoes)
    ? item.payload.transacoes.map(transacao => transacao.id)
    : [item.payload?.id || item.id];

/**
 * @file src/hooks/useOfflineSync.jsx
 * @description Sincroniza a fila offline. Lotes novos são enviados pela rota transacional; erros
 * permanentes ficam visíveis e não entram em retry automático, evitando tráfego infinito.
 */
export function useOfflineSync({ API, getHeaders, token, setTransacoes, showToast }) {
    const [pendentes, setPendentes] = useState([]);
    const [semDono, setSemDono] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const sincronizandoRef = useRef(null);
    const sessaoRef = useRef(token);
    useEffect(() => { sessaoRef.current = token; }, [token]);
    const usuarioId = usuarioIdDoToken(token);

    const recarregarPendentes = useCallback(async () => {
        if (!usuarioId) return;
        try {
            const [itens, antigos] = await Promise.all([listarPendentes(usuarioId), contarPendentesSemDono()]);
            if (sessaoRef.current !== token) return;
            setPendentes(itens);
            setSemDono(antigos);
        } catch (err) { console.error('Erro ao ler fila offline:', err); }
    }, [token, usuarioId]);

    const sincronizarAgora = useCallback(async (opcoes = {}) => {
        const forcarFalhas = opcoes?.forcarFalhas === true;
        if (!token || !usuarioId || sessaoRef.current !== token || sincronizandoRef.current === token) return;

        sincronizandoRef.current = token;
        setIsSyncing(true);
        const sessaoAtual = () => sessaoRef.current === token;

        try {
            const fila = await listarPendentes(usuarioId);
            if (!sessaoAtual()) return;
            let sincronizados = 0;
            let falhasPermanentesNovas = 0;

            for (const item of fila) {
                if (!sessaoAtual()) break;
                if (item.usuarioId !== usuarioId) continue;
                if (item.estado === 'falha_permanente' && !forcarFalhas) continue;

                const lote = Array.isArray(item.payload?.transacoes);
                let res;
                try {
                    res = await fetch(`${API}/transacoes${lote ? '/lote' : ''}`, {
                        method: 'POST',
                        headers: { ...getHeaders(), Authorization: `Bearer ${token}`, 'X-Fincontrole-Owner-Id': usuarioId },
                        body: JSON.stringify(item.payload)
                    });
                } catch {
                    // Sem rede: preserva ordem e deixa a próxima rodada tentar novamente.
                    break;
                }
                if (!sessaoAtual()) break;

                const ids = idsDoItem(item);
                if (res.ok) {
                    await removerPendente(item.id, usuarioId);
                    if (!sessaoAtual()) break;
                    setTransacoes(prev => !sessaoAtual() ? prev : prev.map(t => ids.includes(t.id)
                        ? { ...t, _pendingSync: false, _syncError: null }
                        : t
                    ));
                    sincronizados += ids.length;
                    continue;
                }

                const dadosErro = await res.json().catch(() => ({}));
                if (!sessaoAtual()) break;
                const erro = dadosErro.message || dadosErro.error || `HTTP ${res.status}`;
                const tentativas = (item.tentativas || 0) + 1;

                if (ehFalhaPermanente(res.status)) {
                    await atualizarPendente(item.id, usuarioId, { tentativas, estado: 'falha_permanente', erro });
                    if (!sessaoAtual()) break;
                    setTransacoes(prev => !sessaoAtual() ? prev : prev.map(t => ids.includes(t.id)
                        ? { ...t, _pendingSync: true, _syncError: erro }
                        : t
                    ));
                    if (item.estado !== 'falha_permanente') falhasPermanentesNovas += 1;
                } else {
                    await atualizarPendente(item.id, usuarioId, { tentativas, estado: 'pendente', erro });
                }
            }

            if (!sessaoAtual()) return;
            await recarregarPendentes();
            if (!sessaoAtual()) return;

            if (sincronizados > 0 && showToast) {
                showToast(
                    sincronizados === 1
                        ? '1 lançamento sincronizado automaticamente.'
                        : `${sincronizados} lançamentos sincronizados automaticamente.`,
                    'success'
                );
            }
            if (falhasPermanentesNovas > 0 && showToast) {
                showToast(
                    falhasPermanentesNovas === 1
                        ? 'Um lote precisa de correção e não será reenviado automaticamente.'
                        : `${falhasPermanentesNovas} lotes precisam de correção e não serão reenviados automaticamente.`,
                    'error'
                );
            }
        } finally {
            if (sincronizandoRef.current === token) sincronizandoRef.current = null;
            if (sessaoAtual()) setIsSyncing(false);
        }
    }, [API, getHeaders, token, usuarioId, setTransacoes, showToast, recarregarPendentes]);

    useEffect(() => {
        if (usuarioId) {
            recarregarPendentes();
            sincronizarAgora();
        } else {
            setPendentes([]);
            setSemDono(0);
            setIsSyncing(false);
        }
    }, [usuarioId, recarregarPendentes, sincronizarAgora]);

    useEffect(() => {
        window.addEventListener('online', sincronizarAgora);
        return () => window.removeEventListener('online', sincronizarAgora);
    }, [sincronizarAgora]);

    useEffect(() => {
        if (!pendentes.some(item => item.usuarioId === usuarioId && item.estado !== 'falha_permanente')) return;
        const intervalo = setInterval(sincronizarAgora, INTERVALO_RETRY_MS);
        return () => clearInterval(intervalo);
    }, [pendentes, usuarioId, sincronizarAgora]);

    const pendentesDaConta = pendentes.filter(item => item.usuarioId === usuarioId);
    const falhasPermanentes = pendentesDaConta.filter(item => item.estado === 'falha_permanente').length;
    return { pendentes: pendentesDaConta, falhasPermanentes, semDono, sincronizarAgora, isSyncing };
}
