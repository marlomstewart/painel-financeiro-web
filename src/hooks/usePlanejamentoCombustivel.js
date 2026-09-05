import { useCallback, useEffect, useState } from 'react';

export function usePlanejamentoCombustivel({ API, getHeaders, modal, temGaragem, token, dataVis, transacoes }) {
    const [resultado, setResultado] = useState(null);
    const [atualizacao, setAtualizacao] = useState(0);
    const [erro, setErro] = useState(null);
    const competencia = `${dataVis.ano}-${String(dataVis.mes).padStart(2, '0')}`;

    const requisitar = useCallback(async (mes, documento, signal) => {
        const res = await fetch(`${API}/garagem/planejamento-combustivel/${mes}`, {
            method: documento ? 'PUT' : 'GET', headers: getHeaders(), signal,
            ...(documento ? { body: JSON.stringify(documento) } : {}),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || 'Não foi possível carregar ou salvar o planejamento. Tente novamente.');
        }
        return res.json();
    }, [API, getHeaders]);

    useEffect(() => {
        if (!temGaragem || !token) return;
        const controller = new AbortController();
        requisitar(competencia, null, controller.signal).then(plano => {
            if (controller.signal.aborted) return;
            setResultado({ plano, token, transacoes, atualizacao });
            setErro(null);
        }).catch(err => {
            if (!controller.signal.aborted) {
                setResultado(null);
                setErro({ token, competencia, mensagem: err.message });
            }
        });
        return () => controller.abort();
    }, [requisitar, competencia, temGaragem, token, transacoes, atualizacao]);

    const salvar = useCallback(async (mes, documento) => {
        const plano = await requisitar(mes, documento);
        setAtualizacao(v => v + 1);
        return plano;
    }, [requisitar]);

    const abrirCalendarioGasolina = useCallback((e, mes = dataVis.mes, ano = dataVis.ano) => {
        e?.preventDefault(); e?.stopPropagation();
        modal.setConfig({ type: 'combustivel', title: 'Planejamento de combustível do veículo',
            competencia: `${ano}-${String(mes).padStart(2, '0')}`,
            carregar: requisitar, salvar, onCancel: modal.close, onClose: modal.close });
    }, [dataVis.mes, dataVis.ano, modal, requisitar, salvar]);

    const planoMes = temGaragem && token && resultado?.token === token && resultado.transacoes === transacoes
        && resultado.atualizacao === atualizacao && resultado.plano.competencia === competencia ? resultado.plano : null;
    return { planoMes, abrirCalendarioGasolina,
        erroPlanejamento: erro?.token === token && erro.competencia === competencia ? erro.mensagem : null };
}
