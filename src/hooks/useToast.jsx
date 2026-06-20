import { useState, useCallback } from 'react';

/**
 * Hook Customizado: useToast
 * Gerencia o estado e o tempo de vida das notificações flutuantes na tela.
 */
export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'error') => {
        setToast({ message, type });
        // Remove a notificação da tela automaticamente após 3.5 segundos
        setTimeout(() => {
            setToast(null);
        }, 3500);
    }, []);

    return { toast, showToast };
}