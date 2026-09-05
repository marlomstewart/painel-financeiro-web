export function criarPlano(competencia = '2026-09', documento = {}) {
    const config = documento.config || { diasSemana: [1, 3, 5], valorCentavos: 2300, categoriaId: 'gas', veiculoId: null };
    const ajustes = documento.ajustes || [];
    const [ano, mes] = competencia.split('-').map(Number);
    const dias = Array.from({ length: new Date(ano, mes, 0).getDate() }, (_, i) => {
        const origem = `${competencia}-${String(i + 1).padStart(2, '0')}`;
        const ajuste = ajustes.find(a => a.origem === origem);
        return { origem, data: origem, valorCentavos: config.diasSemana.includes(new Date(`${origem}T12:00:00Z`).getUTCDay()) ? config.valorCentavos : 0,
            cancelado: false, transacaoId: null, automatico: true, ajustado: Boolean(ajuste), ...ajuste };
    });
    const total = dias.reduce((s, d) => s + (d.cancelado ? 0 : d.valorCentavos), 0);
    return { competencia, versao: 'versao-teste', config, ajustes, dias, candidatos: [], categoriaNome: 'Gasolina',
        categorias: [{ id: 'gas', nome: 'Gasolina', tipo: 'despesa' }], veiculos: [{ id: 'moto', modelo: 'Veículo de teste', ativo: 1 }],
        resumo: { planejadoCentavos: total, restanteCentavos: total, registradoCentavos: 0, previstoCentavos: total } };
}
