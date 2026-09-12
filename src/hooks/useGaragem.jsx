import { useState, useCallback } from 'react';
import { usePlanejamentoCombustivel } from './usePlanejamentoCombustivel';
import { calcularDesgasteItem } from '../utils/desgasteVeiculo';

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
                const desgaste = calcularDesgasteItem(item, kmAtual);
                return { nome: item.nome, pct: desgaste.percentualReal, ...desgaste };
            }).filter(a => a.pct >= 60);

            if (alertas.length === 0) return;
            alertas.sort((a, b) => b.pct - a.pct);
            const linhas = alertas.map(a => {
                if (a.vencido) return `🔴 ${a.nome}: ${a.kmAcimaDaTroca.toLocaleString('pt-BR')} km acima da troca prevista (100% usado).`;
                if (a.pct >= 70) return `🟠 ${a.nome}: faltam ${a.kmRestantes.toLocaleString('pt-BR')} km (${Math.round(a.pct)}% usado)`;
                return `🟡 ${a.nome}: chegando perto, ${a.kmRestantes.toLocaleString('pt-BR')} km restantes (${Math.round(a.pct)}% usado)`;
            }).join('\n');
            await modal.alert(linhas, '⚙️ Alerta de Manutenção');
        } catch (err) { console.error('Erro ao verificar desgaste:', err); }
    }, [API, getHeaders, modal]);

    return {
        veiculosGaragem, setVeiculosGaragem, itensGaragem, setItensGaragem,
        carregarDadosGaragem, verificarDesgasteVeiculo, ...planejamento
    };
}
