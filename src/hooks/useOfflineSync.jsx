import { useCallback, useEffect, useRef, useState } from 'react';
import { listarPendentes, removerPendente, atualizarPendente } from '../utils/offlineQueue';

const MAX_TENTATIVAS = 5;
const INTERVALO_RETRY_MS = 60 * 1000;

/**
 * @file src/hooks/useOfflineSync.jsx
 * @description Sincroniza em segundo plano os lançamentos que ficaram pendentes por falta de
 * conexão. Agora exporta o status 'isSyncing' para UI/UX tátil em tempo real.
 */
export function useOfflineSync({ API, getHeaders, token, setTransacoes, showToast }) {
    const [pendentes, setPendentes] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false); // 🔥 NOVO: Sensor de Sincronização
    const sincronizandoRef = useRef(false);

    const recarregarPendentes = useCallback(async () => {
        try {
            setPendentes(await listarPendentes());
        } catch (err) { console.error('Erro ao ler fila offline:', err); }
    }, []);

    const sincronizarAgora = useCallback(async () => {
        if (!token || sincronizandoRef.current) return;

        sincronizandoRef.current = true;
        setIsSyncing(true); // Acende o indicador visual na tela

        try {
            const fila = await listarPendentes();
            let sincronizados = 0;

            for (const item of fila) {
                let res;
                try {
                    res = await fetch(`${API}/transacoes`, {
                        method: 'POST', headers: getHeaders(), body: JSON.stringify(item.payload)
                    });
                } catch (err) {
                    // Falha de rede: ainda offline, aborta a rodada e tenta de novo mais tarde.
                    break;
                }

                if (res.ok) {
                    await removerPendente(item.id);
                    setTransacoes(prev => prev.map(t =>
                        t.id === item.id ? { ...t, _pendingSync: false } : t
                    ));
                    sincronizados += 1;
                } else {
                    const tentativas = (item.tentativas || 0) + 1;
                    if (tentativas >= MAX_TENTATIVAS) {
                        await atualizarPendente(item.id, { tentativas, erro: `HTTP ${res.status}` });
                    } else {
                        await atualizarPendente(item.id, { tentativas });
                    }
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
        } finally {
            sincronizandoRef.current = false;
            setIsSyncing(false); // Apaga o indicador visual
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
        if (pendentes.length === 0) return;
        const intervalo = setInterval(sincronizarAgora, INTERVALO_RETRY_MS);
        return () => clearInterval(intervalo);
    }, [pendentes.length, sincronizarAgora]);

    // 🔥 NOVO: Exportamos a flag isSyncing para a UI consumir
    return { pendentes, sincronizarAgora, isSyncing };
}