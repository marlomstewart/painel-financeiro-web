import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AvisoTaxasBcb, ErroInvestimentos } from './AvisoTaxasBcb';
const selic = { valor: 14.25, dataReferencia: '2026-10-02', consultadoEm: '2026-10-03T12:00:00Z', fonte: 'BCB/SGS', serie: 432, desatualizado: false };

it('taxa antiga exibe aviso, referência, consulta e limite do snapshot', () => {
    render(<AvisoTaxasBcb taxas={[{ cdiEstimado: true, indicadores: { selic: { ...selic, desatualizado: true } } }]} />);
    expect(screen.getByRole('alert').textContent).toMatch(/desatualizada/);
    expect(screen.getByText(/referência 02\/10\/2026 · consulta 03\/10\/2026/)).toBeTruthy();
    expect(screen.getByText(/snapshot automático não é atualizado/)).toBeTruthy();
    expect(screen.getByText(/CDI aproximado/)).toBeTruthy();
});

it('indicadores válidos identificam estimativa sem aviso de indisponibilidade', () => {
    render(<AvisoTaxasBcb taxas={[{ indicadores: { selic } }]} />);
    expect(screen.getByRole('status').textContent).toMatch(/estimada/);
    expect(screen.queryByRole('alert')).toBeNull();
});

it('erro permite tentar novamente e não exibe valores fictícios', () => {
    const tentarNovamente = vi.fn();
    render(<ErroInvestimentos mensagem="Taxas do Banco Central indisponíveis." tentarNovamente={tentarNovamente} />);
    expect(screen.getByRole('alert').textContent).toMatch(/Não foi possível calcular/);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(tentarNovamente).toHaveBeenCalledOnce();
});
