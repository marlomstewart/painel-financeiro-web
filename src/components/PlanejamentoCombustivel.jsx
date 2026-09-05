import { useEffect, useRef, useState } from 'react';

const moeda = centavos => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataCurta = data => `${data.slice(8, 10)}/${data.slice(5, 7)}`;
const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const campo = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100';
const botao = 'rounded-lg px-3 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed';
const secundario = 'rounded-lg px-3 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700 disabled:opacity-50';

function EditorRotina({ plano, salvar, ocupado }) {
    const [config, setConfig] = useState(plano.config);
    return <form className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4" onSubmit={e => {
        e.preventDefault(); salvar({ config, ajustes: plano.ajustes });
    }}>
        <p className="text-xs text-slate-500 dark:text-slate-400">Um planejamento por usuário. A rotina vale a partir deste mês; meses anteriores e meses futuros já personalizados são preservados. Ajustes por data continuam valendo.</p>
        <fieldset disabled={ocupado} className="space-y-3">
            <legend className="text-sm font-bold mb-2">Dias habituais de abastecimento</legend>
            <div className="flex flex-wrap gap-2">{diasSemana.map((nome, d) => <label key={nome} className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={config.diasSemana.includes(d)} onChange={e => setConfig(c => ({ ...c,
                    diasSemana: e.target.checked ? [...c.diasSemana, d].sort() : c.diasSemana.filter(x => x !== d) }))} />{nome}
            </label>)}</div>
            <label className="block text-sm">Valor padrão (R$)<input className={campo} type="number" min="0" max="100000" step="0.01" required
                value={config.valorCentavos === '' ? '' : config.valorCentavos / 100}
                onChange={e => setConfig(c => ({ ...c, valorCentavos: e.target.value === '' ? '' : Math.round(Number(e.target.value) * 100) }))} /></label>
            <label className="block text-sm">Categoria de despesa<select className={campo} required value={config.categoriaId || ''}
                onChange={e => setConfig(c => ({ ...c, categoriaId: e.target.value }))}>
                <option value="">Selecione uma categoria</option>{plano.categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select></label>
            <label className="block text-sm">Veículo<select className={campo} value={config.veiculoId || ''}
                onChange={e => setConfig(c => ({ ...c, veiculoId: e.target.value || null }))}>
                <option value="">Sem veículo específico</option>{plano.veiculos.filter(v => v.ativo === 1 || v.id === config.veiculoId).map(v =>
                    <option key={v.id} value={v.id}>{v.modelo}{v.ativo !== 1 ? ' (inativo)' : ''}</option>)}
            </select></label>
            <p className="text-xs text-slate-500">Com um veículo selecionado, somente lançamentos vinculados a ele atendem às previsões. O gasto total da categoria continua incluindo todos os veículos.</p>
            <button className={botao} type="submit">Salvar rotina a partir deste mês</button>
        </fieldset>
    </form>;
}

function EditorAbastecimento({ dia, plano, salvar, fechar, ocupado }) {
    const [data, setData] = useState(dia.data);
    const [valor, setValor] = useState(String((dia.ajustado ? dia.valorCentavos : (dia.valorCentavos || plano.config.valorCentavos)) / 100));
    const [vinculo, setVinculo] = useState(dia.transacaoId || (dia.automatico ? 'automatico' : 'nenhum'));
    const gravar = cancelado => salvar({ config: plano.config, ajustes: [...plano.ajustes.filter(a => a.origem !== dia.origem), {
        origem: dia.origem, data, valorCentavos: Math.round(Number(valor) * 100), cancelado,
        transacaoId: cancelado || ['automatico', 'nenhum'].includes(vinculo) ? null : vinculo,
        automatico: vinculo === 'automatico',
    }] });
    const ultimoDia = plano.dias.at(-1).origem;
    return <form className="space-y-3 rounded-xl border border-blue-300 dark:border-blue-800 p-3" onSubmit={e => { e.preventDefault(); gravar(false); }}>
        <p className="text-sm font-bold">Abastecimento de {dataCurta(dia.origem)}</p>
        <fieldset disabled={ocupado} className="space-y-3">
            <label className="block text-sm">Data prevista<input className={campo} type="date" required min={`${plano.competencia}-01`} max={ultimoDia}
                value={data} onChange={e => setData(e.target.value)} /></label>
            <p className="text-xs text-slate-500">Para antecipar, escolha outra data neste mês. A previsão original será movida, sem duplicação.</p>
            <label className="block text-sm">Valor previsto (R$)<input className={campo} type="number" min="0" max="100000" step="0.01" required value={valor} onChange={e => setValor(e.target.value)} /></label>
            <label className="block text-sm">Lançamento que atende a esta previsão<select className={campo} value={vinculo} onChange={e => setVinculo(e.target.value)}>
                <option value="automatico">Reconhecer pela data, se houver um único lançamento</option>
                <option value="nenhum">Ainda não lançado — manter previsão</option>
                {plano.candidatos.map(t => <option key={t.id} value={t.id}>{dataCurta(t.data)} · {t.descricao} · {moeda(t.valorCentavos)}</option>)}
            </select></label>
            {dia.realizadoId && <p className="text-xs text-emerald-700 dark:text-emerald-400">Já lançado: {moeda(dia.realizadoCentavos)}. Não é reservado novamente.</p>}
            {dia.aviso && <p role="status" className="text-xs text-amber-700 dark:text-amber-400">{dia.aviso}</p>}
            <div className="flex flex-wrap gap-2">
                <button type="submit" className={botao}>Salvar abastecimento</button>
                <button type="button" className={secundario} onClick={() => gravar(true)}>Cancelar previsão</button>
                {dia.ajustado && <button type="button" className={secundario} onClick={() => salvar({ config: plano.config,
                    ajustes: plano.ajustes.filter(a => a.origem !== dia.origem) })}>Restaurar padrão</button>}
                <button type="button" className={secundario} onClick={fechar}>Voltar ao calendário</button>
            </div>
        </fieldset>
    </form>;
}

export function PlanejamentoCombustivel({ competenciaInicial, carregar, salvar }) {
    const [competencia, setCompetencia] = useState(competenciaInicial);
    const [plano, setPlano] = useState(null);
    const [erro, setErro] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [ocupado, setOcupado] = useState(false);
    const [rotina, setRotina] = useState(false);
    const [origem, setOrigem] = useState(null);
    const [recarga, setRecarga] = useState(0);
    const salvando = useRef(false);
    useEffect(() => {
        const controller = new AbortController();
        carregar(competencia, null, controller.signal).then(p => {
            if (!controller.signal.aborted) { setPlano(p); setErro(''); }
        }).catch(e => { if (!controller.signal.aborted) setErro(e.message); });
        return () => controller.abort();
    }, [competencia, carregar, recarga]);

    const gravar = async documento => {
        if (salvando.current) return;
        salvando.current = true; setOcupado(true); setErro(''); setMensagem('');
        try {
            const novo = await salvar(competencia, { ...documento, versao: plano.versao });
            setPlano(novo); setOrigem(null); setRotina(false); setMensagem('Planejamento salvo. Nenhum lançamento do Extrato foi alterado.');
        } catch (e) { setErro(e.message); }
        finally { salvando.current = false; setOcupado(false); }
    };
    const visivel = plano?.competencia === competencia ? plano : null;
    const dia = visivel?.dias.find(d => d.origem === origem);
    const nomeVeiculo = visivel?.veiculos.find(v => v.id === visivel.config.veiculoId)?.modelo || 'Veículo';
    return <div className="space-y-4 text-slate-800 dark:text-slate-100">
        <label className="block text-sm font-semibold">Mês do planejamento<input type="month" aria-label="Mês do planejamento" min="2000-01" max="2100-12" className={campo} value={competencia} disabled={ocupado}
            onChange={e => { if (e.target.value) { setCompetencia(e.target.value); setOrigem(null); setRotina(false); setMensagem(''); setErro(''); } }} /></label>
        <p className="text-xs text-slate-500 dark:text-slate-400">Planeje quando abastecer e quanto reservar. Folga não cancela combustível automaticamente. Registre o valor efetivamente gasto no Extrato.</p>
        {erro && <div role="alert" className="rounded-lg bg-rose-50 dark:bg-rose-950 p-3 text-sm text-rose-700 dark:text-rose-300">{erro}
            <button disabled={ocupado} className={`${secundario} mt-2 block`} onClick={() => { setPlano(null); setOrigem(null); setRotina(false); setRecarga(x => x + 1); }}>Recarregar planejamento</button></div>}
        {mensagem && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">{mensagem}</p>}
        {!visivel && !erro && <p role="status">Carregando planejamento…</p>}
        {visivel && <>
            <div className="flex items-center justify-between gap-2"><p className="text-sm font-bold break-words">{nomeVeiculo} · {visivel.categoriaNome || 'Selecione uma categoria'}</p>
                <button className={secundario} disabled={ocupado} onClick={() => { setRotina(!rotina); setOrigem(null); }}>{rotina ? 'Fechar configuração' : 'Configurar rotina'}</button></div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                {[['Planejado no mês', visivel.resumo.planejadoCentavos], ['Já lançado na categoria', visivel.resumo.registradoCentavos],
                    ['Ainda a reservar', visivel.resumo.restanteCentavos], ['Previsão da categoria', visivel.resumo.previstoCentavos]].map(([titulo, v]) =>
                    <div key={titulo} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"><p>{titulo}</p><strong className="block mt-1 text-base">{moeda(v)}</strong></div>)}
            </div>
            {rotina && <EditorRotina key={`${visivel.competencia}-${visivel.versao}`} plano={visivel} salvar={gravar} ocupado={ocupado} />}
            {!visivel.categoriaNome && <p role="status" className="text-sm text-amber-700 dark:text-amber-400">Configure uma categoria de despesa para integrar este planejamento ao Dashboard.</p>}
            <p className="text-xs text-slate-500">Toque em uma data para adicionar, ajustar ou antecipar um abastecimento. Verde: já lançado. Azul: previsto. Cancelados aparecem abaixo.</p>
            <div className="grid grid-cols-7 gap-1 text-center">
                {diasSemana.map(d => <span key={d} className="text-[10px] font-bold py-1">{d}</span>)}
                {Array.from({ length: new Date(`${competencia}-01T12:00:00Z`).getUTCDay() }, (_, i) => <span key={`vazio-${i}`} />)}
                {visivel.dias.map(base => {
                    const evento = visivel.dias.find(d => d.data === base.origem && !d.cancelado && d.valorCentavos > 0);
                    const cor = evento?.realizadoId ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500' : evento ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500' : 'border-slate-200 dark:border-slate-700';
                    return <button type="button" key={base.origem} disabled={ocupado} aria-label={`Abastecimento ${dataCurta(base.origem)}${evento ? `, ${moeda(evento.valorCentavos)}` : ', sem previsão'}`}
                        className={`rounded-lg border min-h-14 py-2 min-w-0 ${cor} disabled:opacity-50`} onClick={() => { setOrigem(evento?.origem || base.origem); setRotina(false); setMensagem(''); }}>
                        <span className="block text-sm font-bold">{Number(base.origem.slice(8))}</span>
                        {evento && <span className="block text-[9px] sm:text-[10px]">{(evento.valorCentavos / 100).toLocaleString('pt-BR')}</span>}
                    </button>;
                })}
            </div>
            {dia && <EditorAbastecimento key={`${dia.origem}-${visivel.versao}`} dia={dia} plano={visivel} salvar={gravar} fechar={() => setOrigem(null)} ocupado={ocupado} />}
            {visivel.dias.some(d => d.cancelado || d.data !== d.origem || d.aviso) && <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                <p className="text-xs font-bold">Ajustes e pendências de conferência</p>
                {visivel.dias.filter(d => d.cancelado || d.data !== d.origem || d.aviso).map(d => <button key={d.origem} disabled={ocupado} className="block text-left text-xs underline py-1" onClick={() => { setOrigem(d.origem); setRotina(false); }}>
                    {dataCurta(d.origem)}: {d.cancelado ? 'previsão cancelada' : d.data !== d.origem ? `movido para ${dataCurta(d.data)} · ${moeda(d.valorCentavos)}` : 'revisar vínculo'}{d.aviso ? ` — ${d.aviso}` : ''}
                </button>)}
            </div>}
        </>}
    </div>;
}
