import { useCallback, useEffect, useRef, useState } from 'react';
import { listarPendentes, removerPendente, atualizarPendente } from '../utils/offlineQueue';

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
    const [isSyncing, setIsSyncing] = useState(false);
    const sincronizandoRef = useRef(false);

    const recarregarPendentes = useCallback(async () => {
        try {
            setPendentes(await listarPendentes());
        } catch (err) { console.error('Erro ao ler fila offline:', err); }
    }, []);

    const sincronizarAgora = useCallback(async (opcoes = {}) => {
        const forcarFalhas = opcoes?.forcarFalhas === true;
        if (!token || sincronizandoRef.current) return;

        sincronizandoRef.current = true;
        setIsSyncing(true);

        try {
            const fila = await listarPendentes();
            let sincronizados = 0;
            let falhasPermanentesNovas = 0;

            for (const item of fila) {
                if (item.estado === 'falha_permanente' && !forcarFalhas) continue;

                const lote = Array.isArray(item.payload?.transacoes);
                let res;
                try {
                    res = await fetch(`${API}/transacoes${lote ? '/lote' : ''}`, {
                        method: 'POST',
                        headers: getHeaders(),
                        body: JSON.stringify(item.payload)
                    });
                } catch {
                    // Sem rede: preserva ordem e deixa a próxima rodada tentar novamente.
                    break;
                }

                const ids = idsDoItem(item);
                if (res.ok) {
                    await removerPendente(item.id);
                    setTransacoes(prev => prev.map(t => ids.includes(t.id)
                        ? { ...t, _pendingSync: false, _syncError: null }
                        : t
                    ));
                    sincronizados += ids.length;
                    continue;
                }

                const dadosErro = await res.json().catch(() => ({}));
                const erro = dadosErro.message || dadosErro.error || `HTTP ${res.status}`;
                const tentativas = (item.tentativas || 0) + 1;

                if (ehFalhaPermanente(res.status)) {
                    await atualizarPendente(item.id, { tentativas, estado: 'falha_permanente', erro });
                    setTransacoes(prev => prev.map(t => ids.includes(t.id)
                        ? { ...t, _pendingSync: true, _syncError: erro }
                        : t
                    ));
                    if (item.estado !== 'falha_permanente') falhasPermanentesNovas += 1;
                } else {
                    await atualizarPendente(item.id, { tentativas, estado: 'pendente', erro });
                }
            }

            await recarregarPendentes();

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
            sincronizandoRef.current = false;
            setIsSyncing(false);
        }
    }, [API, getHeaders, token, setTransacoes, showToast, recarregarPendentes]);

    useEffect(() => {
        if (token) {
            recarregarPendentes();
            sincronizarAgora();
        }
    }, [token, recarregarPendentes, sincronizarAgora]);

    useEffect(() => {
        window.addEventListener('online', sincronizarAgora);
        return () => window.removeEventListener('online', sincronizarAgora);
    }, [sincronizarAgora]);

    useEffect(() => {
        if (!pendentes.some(item => item.estado !== 'falha_permanente')) return;
        const intervalo = setInterval(sincronizarAgora, INTERVALO_RETRY_MS);
        return () => clearInterval(intervalo);
    }, [pendentes, sincronizarAgora]);

    const falhasPermanentes = pendentes.filter(item => item.estado === 'falha_permanente').length;
    return { pendentes, falhasPermanentes, sincronizarAgora, isSyncing };
}
