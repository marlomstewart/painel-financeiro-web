import { expect, test } from 'vitest';
import { montarCsvExtrato } from './exportarExtratoCsv';

test('gera CSV para Excel com campos completos, acentos e vírgulas preservados', () => {
  const csv = montarCsvExtrato([{
    dataCompra: '2026-09-26', descricao: 'Mercado, pão e "café" (1/3)', valorParcela: 1234.5,
    formaPagamento: 'credito_cartao_principal', mesReferencia: 10, anoReferencia: 2026,
    status: 'pendente', grupo_id: 'compra-outubro'
  }], [{ id: 'cartao_principal', nome: 'Cartão Ação' }]);

  expect(csv).toContain('\uFEFF"Data da compra";"Descrição registrada"');
  expect(csv).toContain('"26/09/2026";"Mercado, pão e ""café"" (1/3)";"1234,50"');
  expect(csv).toContain('"Crédito: Cartão Ação";"10/2026";"10";"2026";"pendente";"compra-outubro";"1/3"');
});

test('preserva a competência da fatura mesmo quando a data de compra é de outro mês', () => {
  const csv = montarCsvExtrato([{
    dataCompra: '2026-09-26', descricao: 'Compra antes do fechamento', valorParcela: 50,
    formaPagamento: 'pix', mesReferencia: 10, anoReferencia: 2026, status: 'pago'
  }]);

  expect(csv).toContain('"26/09/2026";"Compra antes do fechamento";"50,00";"PIX / Dinheiro";"10/2026"');
});
