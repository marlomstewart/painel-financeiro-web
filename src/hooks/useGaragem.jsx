import { useState, useCallback, useMemo } from 'react';

/**
 * Hook Customizado: useGaragem
 * Gerencia a lógica de negócio atrelada à frota de veículos automotores.
 */
export function useGaragem({ API, getHeaders, modal, nomeUsuario, transacoes, showToast }) {
    // Nota: O estado chama-se "diasNaoRodados" por herança do Back-end, mas conceitualmente
    // atua como um array de "Exceções à Regra" (Faltas em dias úteis ou Extras em dias de folga).
    const [veiculosGaragem, setVeiculosGaragem] = useState([]);
    const [diasNaoRodados, setDiasNaoRodados] = useState([]);

    const carregarDadosGaragem = useCallback(async () => {
        if (nomeUsuario.toLowerCase() !== 'stewart') return;
        try {
            const resGar = await fetch(`${API}/garagem/veiculos`, { headers: getHeaders() });
            if (resGar.ok) setVeiculosGaragem(await resGar.json());
            const resDias = await fetch(`${API}/garagem/dias-nao-rodados`, { headers: getHeaders() });
            if (resDias.ok) setDiasNaoRodados(await resDias.json());
        } catch (err) { console.error("Erro garagem:", err); }
    }, [API, getHeaders, nomeUsuario]);

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

    /**
     * Calcula a Meta de Gasolina usando Lógica Bidirecional de Exceções.
     * Dias base (Seg, Qua, Sex): somam R$ 23 por padrão. Se marcados, abatem R$ 23.
     * Dias de folga (Ter, Qui, Sab, Dom): não somam por padrão. Se marcados, somam R$ 23.
     */
    const calcularMetaGasolina = useCallback((mes, ano) => {
        let metaCalculada = 0;
        const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();

        for (let dia = 1; dia <= ultimoDiaDoMes; dia++) {
            const dataAtual = new Date(ano, mes - 1, dia);
            const diaDaSemana = dataAtual.getDay();
            const dataString = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

            const isMarcadoComoExcecao = diasNaoRodados.includes(dataString);
            const isDiaTrabalhoBase = (diaDaSemana === 1 || diaDaSemana === 3 || diaDaSemana === 5); // Segunda, Quarta, Sexta

            if (isDiaTrabalhoBase) {
                // Se é dia de trabalho padrão e NÃO está marcado, soma 23.
                // Se está marcado (falta), não soma nada.
                if (!isMarcadoComoExcecao) {
                    metaCalculada += 23;
                }
            } else {
                // Se é dia de folga e ESTÁ marcado, soma 23 (rodei extra).
                // Se não está marcado, não soma nada.
                if (isMarcadoComoExcecao) {
                    metaCalculada += 23;
                }
            }
        }

        return metaCalculada;
    }, [diasNaoRodados]);

    const alertaMoto = useMemo(() => {
        if (nomeUsuario.toLowerCase() !== 'stewart') return null;
        const transacoesComKm = transacoes.filter(t => t.kmMoto).sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));
        if (transacoesComKm.length > 0) {
            const kmAtual = Number(transacoesComKm[0].kmMoto);
            const ultimaTroca = transacoesComKm.find(t => t.categoria === 'Manutenção da moto' && t.descricao.toLowerCase().includes('leo'));
            const kmUltimaTroca = ultimaTroca ? Number(ultimaTroca.kmMoto) : kmAtual;
            const kmRodados = kmAtual - kmUltimaTroca;
            const limiteTrocaOleo = 1000;
            const kmFaltantes = limiteTrocaOleo - kmRodados;
            return { kmAtual, kmFaltantes, alertaCritico: kmFaltantes <= 150 };
        }
        return null;
    }, [nomeUsuario, transacoes]);

    /**
     * Abstração do Calendário Interativo.
     * Retorna true ou false para a UI saber se o banco salvou a ação de fato.
     */
    const abrirCalendarioGasolina = useCallback((e, mesVis, anoVis) => {
        e.preventDefault(); e.stopPropagation(); modal.close();
        setTimeout(() => {
            modal.setConfig({
                type: 'calendario', title: '📅 Ajuste de Uso da Biz 125', mes: mesVis, ano: anoVis, diasMarcados: diasNaoRodados,
                onToggle: async (dataStr) => {
                    try {
                        const res = await fetch(`${API}/garagem/dias-nao-rodados/toggle`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ data: dataStr }) });
                        if (res.ok) {
                            const json = await res.json();
                            setDiasNaoRodados(prev => json.status === 'added' ? [...prev, dataStr] : prev.filter(d => d !== dataStr));
                            return true; // Sucesso na rede
                        }
                        showToast('Erro ao sincronizar calendário. Tente novamente.', 'error');
                        return false; // Erro de servidor (500)
                    } catch (err) {
                        console.error('Erro calendário', err);
                        showToast('Erro de rede ou Timeout. Verifique a conexão.', 'error');
                        return false; // Erro de internet caída
                    }
                },
                onCancel: modal.close, onClose: modal.close
            });
        }, 150);
    }, [API, getHeaders, modal, diasNaoRodados, showToast]);

    return {
        veiculosGaragem, setVeiculosGaragem, diasNaoRodados, setDiasNaoRodados,
        carregarDadosGaragem, verificarDesgasteVeiculo, calcularMetaGasolina,
        alertaMoto, abrirCalendarioGasolina
    };
}