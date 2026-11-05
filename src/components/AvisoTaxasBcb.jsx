export function ErroInvestimentos({ mensagem, tentarNovamente }) {
    return (
        <div role="alert" className="p-6 rounded-2xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-slate-800 dark:text-slate-100 space-y-3">
            <h2 className="text-lg font-bold">Não foi possível calcular a rentabilidade</h2>
            <p>{mensagem}</p>
            <button type="button" onClick={tentarNovamente} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">Tentar novamente</button>
        </div>
    );
}

export function AvisoTaxasBcb({ taxas = [] }) {
    const indicadores = taxas.flatMap(t => Object.entries(t?.indicadores || {})).filter(([, taxa]) => taxa);
    const unicos = indicadores.filter(([nome], i) => indicadores.findIndex(([outro]) => outro === nome) === i);
    const cdiIndisponivel = taxas.some(t => t?.cdiIndisponivel);
    if (!unicos.length && !cdiIndisponivel) return null;
    const degradado = indicadores.some(([, taxa]) => taxa.desatualizado);
    const data = valor => /^\d{4}-\d{2}-\d{2}/.test(valor || '') ? valor.slice(0, 10).split('-').reverse().join('/') : 'não informada';
    return (
        <div role={degradado || cdiIndisponivel ? 'alert' : 'status'} className={`p-4 rounded-xl border text-sm space-y-1 ${degradado || cdiIndisponivel ? 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
            <p className="font-bold">{degradado ? 'BCB indisponível: estimativa com a última taxa válida, desatualizada.' : cdiIndisponivel ? 'BCB indisponível para os simuladores de CDI.' : 'Rentabilidade estimada com indicadores BCB/SGS.'}</p>
            {degradado && <p>O snapshot automático não é atualizado para contas que dependem dessas taxas desatualizadas.</p>}
            {cdiIndisponivel && <p>CDI indisponível: simuladores pausados. A carteira de renda fixa sem aportes e os títulos prefixados não dependem dessa taxa.</p>}
            {unicos.map(([nome, taxa]) => <p key={nome}>{nome === 'selic' ? 'Selic' : 'IPCA 12 meses'}: referência {data(taxa.dataReferencia)} · consulta {data(taxa.consultadoEm)} · {taxa.fonte} {taxa.serie}</p>)}
            {taxas.some(t => t?.cdiEstimado) && <p>CDI aproximado pela Selic − 0,10 ponto percentual; não é rentabilidade histórica garantida.</p>}
        </div>
    );
}
