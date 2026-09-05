# Estado atual — Web FinControle

**Atualizado em:** 04/09/2026

## Objetivo atual

Manter o frontend estável para evolução de longo prazo e registrar contexto suficiente para novas
sessões independentes.

## Estado geral

- Correção do detalhamento do Fluxo de Caixa Projetado publicada em `main` (`588102b`) e
  confirmada em produção.
- Produção é Vercel; a API produtiva é Render/Supabase. A confirmação do deploy mais recente não
  pode ser deduzida somente do Git.
- Aplicação é React/Vite PWA sem Redux/Context global; hooks são instanciados no `App.jsx` e
  distribuídos por props.

## Entregas relevantes

- Fila offline IndexedDB preserva atomicidade de lotes e interrompe retries automáticos em falha
  permanente.
- Dashboard preserva compras divididas no saldo histórico.
- Configurações permite saldo conciliado; depois do marco, o Saldo Líquido usa datas efetivas de
  pagamento para representar caixa real entre meses.
- A busca de transações agora preserva também movimentos pagos após o marco de caixa, mesmo se a
  data de compra estiver fora da janela padrão de 24 meses. O pagamento/reversão de fatura usa
  uma operação atômica da API, em vez de uma requisição por parcela.
- O Dashboard consulta o saldo conciliado canônico da API para o mês visível; Configurações mostra
  uma prévia confirmável antes de substituir o marco.
- Extrato evidencia quando uma parcela de terceiro foi recebida sem confundir esse fato com o
  pagamento da conta; Dívidas calcula parcelas geradas como `despesa` e usa
  `terceiro_recebido` somente para dívidas para terceiros.
- CI em GitHub Actions executa testes Vitest e build a cada push/pull request.

## Trabalho em andamento

Correção da sequência de dívidas concluída localmente: o cadastro exige a competência da primeira
parcela, exibe-a no acompanhamento e alerta sobre registros legados que precisam ser ancorados.
O Extrato continua preservando lançamentos existentes; a projeção usa a competência da âncora
para não deslocar parcelas quando meses futuros já foram gerados.

## Pendências e riscos

- Confirmar no produto se o saldo conciliado de R$ 43,90 em 31/08/2026 foi salvo pelo usuário;
  essa informação não é confirmável pelo repositório.
- `npm run lint` falha por débitos preexistentes em `App.jsx`, `Configuracoes.jsx`, `useAuth.jsx`,
  `useDashboard.jsx` e configuração de globals dos testes. Tratar em objetivo próprio, sem misturar
  com feature financeira.
- Há arquivos de alta complexidade registrados no backlog da API: `Investimentos.jsx`, `Modal.jsx`,
  `Lancamentos.jsx` e `useDashboard.jsx`.

## Arquivos importantes

- `src/App.jsx`, `src/hooks/useAuth.jsx`, `src/hooks/useDashboard.jsx`
- `src/hooks/useTransacoes.jsx`, `src/hooks/useOfflineSync.jsx`
- `src/utils/offlineQueue.js`, `src/utils/cartaoUtils.js`
- `src/components/Dashboard.jsx`, `src/components/Configuracoes.jsx`, `src/components/Lancamentos.jsx`
- `src/hooks/*.test.jsx`, `.github/workflows/ci.yml`, `docs/FUNCIONALIDADES.md`

## Validações recentes

- Checkpoint do fluxo de terceiros em 04/09: uma compra parcial de R$ 33,88, com R$ 21,30 atribuídos ao terceiro, preserva o lançamento integral no Extrato; `terceiro_recebido` apenas identifica o reembolso e permanece independente do pagamento da fatura. Ao pagar o cartão, o caixa considera R$ 12,58 se o terceiro já devolveu sua parte e R$ 33,88 caso contrário, sem criar renda artificial.
- `npm test`: 13 testes aprovados no checkpoint de 04/09, incluindo as regressões de dívida própria e de terceiro.
- `npm run build`: bundle de produção aprovado no checkpoint de 04/09. Permanece somente o aviso conhecido de chunk principal acima de 500 kB.
- Progresso de dívidas validado para parcela `despesa`: dívida de terceiro avança apenas com
  `terceiro_recebido`; dívida própria continua avançando apenas com `status = pago`.
- Regressão do saldo conciliado validada: uma resposta canônica de agosto não substitui o cálculo
  de setembro; R$ 43,90 menos despesa paga de R$ 21,63 resulta em R$ 22,27.
- Smoke test em produção confirmou o Dashboard e a abertura do detalhamento de Outubro/2026 no
  Fluxo de Caixa Projetado.
- Previsão de setembro confirmada em produção: R$ 22,27 + R$ 2.463,35 − R$ 1.521,12 −
  R$ 938,39 = R$ 26,11; despesas já lançadas não são duplicadas na reserva de metas.
- `npm test`: 11 testes aprovados nesta sessão.
- `npm run build`: bundle de produção aprovado nesta sessão.
- Lint direcionado confirmou que os erros reportados são preexistentes; não houve erro novo do
  marco conciliado.
- `npm test`: 14 testes aprovados em 04/09, incluindo projeção de dívida ancorada.
- `npm run build`: aprovado em 04/09; permanece somente o aviso conhecido de chunk principal
  acima de 500 kB.

## Próximos passos recomendados

1. Após o deploy, validar no produto uma cobrança recebida de terceiro e uma dívida própria paga,
   confirmando que os dois indicadores permanecem independentes.
2. Após o deploy, editar cada dívida legada, informar a competência da parcela 1 e conferir no
   Extrato que a próxima parcela recebeu o rótulo correto sem alteração de valor/status.
3. Retomar backlog técnico apenas com objetivo confirmado e escopo isolado.
