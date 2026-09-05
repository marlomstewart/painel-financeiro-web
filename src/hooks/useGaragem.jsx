import { useState, useCallback } from 'react';
import { usePlanejamentoCombustivel } from './usePlanejamentoCombustivel';

/**
 * Hook Customizado: useGaragem
 * Gerencia a lógica de negócio atrelada à frota de veículos automotores.
 */
export function useGaragem({ API, getHeaders, modal, temGaragem, token, dataVis, transacoes }) {
    const planejamento = usePlanejamentoCombustivel({ API, getHeaders, modal, temGaragem, token, dataVis, transacoes });
    const [veiculosGaragem, setVeiculosGaragem] = useState([]);
    const [itensGaragem, setItensGaragem] = useState([]);

    const carregarDadosGaragem = useCallback(async () => {
        if (!temGaragem) return;
        try {
            const resGar = await fetch(`${API}/garagem/veiculos`, { headers: getHeaders() });
            if (resGar.ok) setVeiculosGaragem(await resGar.json());
            const resItens = await fetch(`${API}/garagem/itens`, { headers: getHeaders() });
            if (resItens.ok) setItensGaragem(await resItens.json());
        } catch (err) { console.error("Erro garagem:", err); }
    }, [API, getHeaders, temGaragem]);

    const verificarDesgasteVeiculo = useCallback(async (veiculoId, kmAtual) => {
        try {
            const res = await fetch(`${API}/garagem/veiculos/${veiculoId}/itens`, { headers: getHeaders() });
            if (!res.ok) return;
            const itens = await res.json();
            const alertas = itens.map(item => {
                const kmDesdeUltima = kmAtual - Number(item.km_ultima_troca);
                const pct = (kmDesdeUltima / Number(item.intervalo_km)) * 100;
                const kmFaltando = Math.max(Number(item.intervalo_km) - kmDesdeUltima, 0);
                return { nome: item.nome, pct, kmFaltando };
            }).filter(a => a.pct >= 60);

            if (alertas.length === 0) return;
            alertas.sort((a, b) => b.pct - a.pct);
            const linhas = alertas.map(a => {
                if (a.pct >= 100) return `🔴 ${a.nome}: JÁ PASSOU do intervalo! (${Math.round(a.pct)}%)`;
                if (a.pct >= 70) return `🟠 ${a.nome}: faltam ${a.kmFaltando.toLocaleString('pt-BR')} km (${Math.round(a.pct)}% usado)`;
                return `🟡 ${a.nome}: chegando perto, ${a.kmFaltando.toLocaleString('pt-BR')} km restantes (${Math.round(a.pct)}% usado)`;
            }).join('\n');
            await modal.alert(linhas, '⚙️ Alerta de Manutenção');
        } catch (err) { console.error('Erro ao verificar desgaste:', err); }
    }, [API, getHeaders, modal]);

    return {
        veiculosGaragem, setVeiculosGaragem, itensGaragem, setItensGaragem,
        carregarDadosGaragem, verificarDesgasteVeiculo, ...planejamento
    };
}
