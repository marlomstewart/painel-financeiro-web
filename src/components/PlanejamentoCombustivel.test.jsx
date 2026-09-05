import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PlanejamentoCombustivel } from './PlanejamentoCombustivel';
import { criarPlano } from '../testUtils/planoCombustivel';

afterEach(cleanup);
function montar(salvar = vi.fn(async (mes, doc) => criarPlano(mes, doc))) {
    const carregar = vi.fn(async mes => criarPlano(mes));
    render(<PlanejamentoCombustivel competenciaInicial="2026-09" carregar={carregar} salvar={salvar} />);
    return { salvar, carregar };
}

test('antecipa sexta para quinta com valor parcial e mostra o resultado salvo', async () => {
    const { salvar } = montar();
    fireEvent.click(await screen.findByRole('button', { name: /Abastecimento 11\/09/ }));
    fireEvent.change(screen.getByLabelText('Data prevista'), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText('Valor previsto (R$)'), { target: { value: '11.50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar abastecimento' }));
    await screen.findByText(/Planejamento salvo/);
    expect(salvar.mock.calls[0][1].ajustes).toEqual([{ origem: '2026-09-11', data: '2026-09-10', valorCentavos: 1150,
        cancelado: false, transacaoId: null, automatico: true }]);
    expect(screen.getByRole('button', { name: /Abastecimento 10\/09, R\$\s*11,50/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Abastecimento 11/09, sem previsão' })).toBeTruthy();
});

test('salva dias, categoria, veículo e valor da rotina pela Garagem', async () => {
    const { salvar } = montar();
    fireEvent.click(await screen.findByRole('button', { name: 'Configurar rotina' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sex' }));
    fireEvent.change(screen.getByLabelText('Valor padrão (R$)'), { target: { value: '25.50' } });
    fireEvent.change(screen.getByLabelText('Veículo'), { target: { value: 'moto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rotina a partir deste mês' }));
    await screen.findByText(/Planejamento salvo/);
    expect(salvar.mock.calls[0][1].config).toEqual({ diasSemana: [1, 3], categoriaId: 'gas', veiculoId: 'moto', valorCentavos: 2550 });
    expect(screen.getByText('Veículo de teste · Gasolina')).toBeTruthy();
});

test('erro de rede mantém edição e não anuncia sucesso; novo envio é possível', async () => {
    const salvar = vi.fn().mockRejectedValueOnce(new Error('Sem conexão')).mockImplementation(async (mes, doc) => criarPlano(mes, doc));
    montar(salvar);
    fireEvent.click(await screen.findByRole('button', { name: /Abastecimento 11\/09/ }));
    fireEvent.change(screen.getByLabelText('Valor previsto (R$)'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar abastecimento' }));
    await screen.findByRole('alert');
    expect(screen.queryByText(/Planejamento salvo/)).toBeNull();
    expect(screen.getByLabelText('Valor previsto (R$)').value).toBe('10');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar abastecimento' }));
    await screen.findByText(/Planejamento salvo/);
    expect(salvar).toHaveBeenCalledTimes(2);
});

test('bloqueia envio duplo enquanto salva e recarrega ao trocar de mês', async () => {
    let concluir;
    const salvar = vi.fn((mes, doc) => new Promise(resolve => { concluir = () => resolve(criarPlano(mes, doc)); }));
    const { carregar } = montar(salvar);
    fireEvent.click(await screen.findByRole('button', { name: /Abastecimento 11\/09/ }));
    const botao = screen.getByRole('button', { name: 'Cancelar previsão' });
    fireEvent.click(botao); fireEvent.click(botao);
    expect(salvar).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Mês do planejamento').disabled).toBe(true);
    concluir(); await screen.findByText(/Planejamento salvo/);
    fireEvent.change(screen.getByLabelText('Mês do planejamento'), { target: { value: '2026-10' } });
    await screen.findByRole('button', { name: /Abastecimento 01\/10/ });
    await waitFor(() => expect(carregar.mock.calls.at(-1)[0]).toBe('2026-10'));
});
