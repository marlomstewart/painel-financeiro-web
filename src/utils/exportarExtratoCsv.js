import { ehPagamentoCredito, nomeCartao } from './cartaoUtils';

const cabecalho = [
  'Data da compra', 'Descrição registrada', 'Valor da parcela', 'Cartão / forma de pagamento',
  'Competência da fatura', 'Mês da fatura', 'Ano da fatura', 'Status', 'Grupo',
  'Identificação da compra parcelada'
];

const escaparCampoCsv = (valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`;

const formatarData = (data) => {
  const [ano, mes, dia] = String(data || '').slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '';
};

const formatarValor = (valor) => Number(valor || 0).toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false
});

const descreverPagamento = (formaPagamento, cartoes) => {
  if (ehPagamentoCredito(formaPagamento)) return `Crédito: ${nomeCartao(formaPagamento, cartoes)}`;
  if (formaPagamento === 'pix') return 'PIX / Dinheiro';
  if (formaPagamento === 'debito') return 'Débito';
  return formaPagamento || '';
};

const identificarParcela = (descricao) => {
  const parcela = String(descricao || '').match(/\((\d+)\/(\d+)\)\s*$/);
  return parcela ? `${parcela[1]}/${parcela[2]}` : '';
};

export function montarCsvExtrato(transacoes, cartoes = []) {
  const linhas = transacoes.map(t => [
    formatarData(t.dataCompra),
    t.descricao,
    formatarValor(t.valorParcela),
    descreverPagamento(t.formaPagamento, cartoes),
    `${String(t.mesReferencia || '').padStart(2, '0')}/${t.anoReferencia || ''}`,
    t.mesReferencia,
    t.anoReferencia,
    t.status,
    t.grupo_id,
    identificarParcela(t.descricao)
  ]);

  return `\uFEFF${[cabecalho, ...linhas].map(linha => linha.map(escaparCampoCsv).join(';')).join('\r\n')}`;
}

export function baixarCsvExtrato(csv, nomeArquivo, documento = document) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = documento.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
