import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, test, vi } from 'vitest';
import App from './App';

vi.mock('./hooks/useOfflineSync', () => ({
  useOfflineSync: () => ({ pendentes: [], falhasPermanentes: 0, semDono: 0, isSyncing: false }),
}));

beforeEach(() => {
  window.history.replaceState(null, '', '/dashboard');
  const payload = btoa(JSON.stringify({ id: 1 }));
  localStorage.setItem('tokenPainel', `teste.${payload}.teste`);
  localStorage.setItem('tutorialDispensado', 'true');
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
});

const avisoCaixa = /^Caixa não reconciliado ou aguardando confirmação da API/;
const cartaoSaldo = () => screen.getByText('Saldo Líquido').closest('.cursor-pointer');

function renderizarComCaixa(caixa) {
  vi.stubGlobal('fetch', async url => {
    if (url.includes('/transacoes/caixa?')) return Response.json({ caixa });
    if (/\/(transacoes\?|cartoes$|categorias$|metas-renda$|contas-fixas$|rendas-fixas$|dividas$)/.test(url)) {
      return Response.json([]);
    }
    throw new Error('Requisição inesperada no teste do Dashboard');
  });
  render(<App />);
}

test('App exibe o aviso geral e preserva cartão e detalhe quando a API não reconcilia o caixa', async () => {
  renderizarComCaixa({ valor: null, reconciliado: false, motivo: 'recebimento_sem_data' });

  await screen.findByText('Saldo Líquido');
  assert.match(screen.getByRole('alert').textContent, avisoCaixa);
  assert.equal(within(cartaoSaldo()).getByRole('heading').textContent, 'Não reconciliado');

  fireEvent.click(cartaoSaldo());
  assert.ok(await screen.findByText(/Datas desconhecidas não foram estimadas/));
});

test('App não exibe o aviso geral depois de a API confirmar o caixa reconciliado', async () => {
  renderizarComCaixa({ valor: 125.5, reconciliado: true });

  await screen.findByText('Saldo Líquido');
  await waitFor(() => assert.match(within(cartaoSaldo()).getByRole('heading').textContent, /R\$\s*125,50/));
  assert.equal(screen.queryByText(avisoCaixa), null);
});
