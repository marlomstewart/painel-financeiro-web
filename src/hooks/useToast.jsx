import { useState, useCallback, useRef } from 'react';

/**
 * Hook Customizado: useToast
 * Gerencia uma fila de notificações flutuantes na tela. Suporta múltiplos toasts
 * simultâneos (empilhados) — cada um some sozinho após seu próprio timer.
 */
export function useToast() {
    const [toasts, setToasts] = useState([]);
    const proximoId = useRef(0);

    const showToast = useCallback((message, type = 'error') => {
        const id = proximoId.current++;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    return { toasts, showToast };
}
