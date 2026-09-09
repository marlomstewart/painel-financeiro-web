# Estado atual — Web FinControle

**Atualizado em:** 09/09/2026

## Objetivo atual

Manter o frontend estável para evolução de longo prazo e registrar contexto suficiente para novas
sessões independentes.

## Estado geral

- Correção do detalhamento do Fluxo de Caixa Projetado publicada em `main` (`588102b`) e
  confirmada em produção.
- Checkpoint da antecipação de parcelas concluído em 08/09; a entrega aguarda apenas deploy e
  validação autenticada.
- Produção é Vercel; a API produtiva é Render/Supabase. A confirmação do deploy mais recente não
  pode ser deduzida somente do Git.
- Aplicação é React/Vite PWA sem Redux/Context global; hooks são instanciados no `App.jsx` e
  distribuídos por props.
- Navegação pública usa caminhos amigáveis, com fallback de SPA na Vercel. A History API nativa
  preserva voltar/avançar; `mes` e `ano` permanecem como parâmetros de consulta.

## Entregas relevantes

- O detalhamento do Extrato permite antecipar parcelas futuras pendentes de uma compra parcelada no
  crédito. A confirmação mostra quantidade, total e fatura canônica de destino; antecipar não quita
  nem modifica os dados financeiros da compra.
- Metas & Categorias, A Receber e Planejamento de combustível receberam ajustes responsivos:
  nomes de categorias de Garagem ocupam até duas linhas, a cobrança mostra somente pessoas com
  pendência na competência visível, descrições e valores longos se adaptam ao celular, e o mês de
  combustível usa seletor próprio com navegação e escolha de mês/ano sem tocar no Extrato.
- O calendário fixo da gasolina foi substituído por planejamento configurável na Garagem: categoria,
  veículo opcional, dias habituais e valor padrão. Cada abastecimento pode ser antecipado no mês,
  ajustado ou cancelado; o Dashboard reserva somente previsões ainda não atendidas por lançamentos.
- O Raio-X de cada meta estratégica agora abre também sem progresso (0%), preserva total,
  média e previsão com valores seguros, e apresenta estado vazio para maior/menor gasto. Quando
  houver movimento, o modal lista os lançamentos pessoais da categoria na competência visível,
  do mais recente ao mais antigo, em área rolável.
- Fila offline IndexedDB preserva atomicidade de lotes e interrompe retries automáticos em falha
  permanente.
- Dashboard preserva compras divididas no saldo histórico.
- Dívidas e financiamentos para terceiros agora são excluídos também do Fluxo de Caixa Projetado;
  recebimentos registrados no Extrato reduzem o total geral de A Receber sem alterar o status da
  conta/fatura.
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
- Aberturas diretas em módulos protegidos guardam a URL solicitada em `/login?retorno=...` e a
  restauram após autenticação. JWTs localmente expirados são descartados antes do carregamento;
  tokens inválidos são tratados quando a API recusa a primeira sincronização.

## Trabalho em andamento

Nenhuma implementação em curso. A antecipação de parcelas, além das correções anteriores, aguarda
deploy conjunto e validação autenticada no produto.

## Pendências e riscos

- Confirmar no produto se o saldo conciliado de R$ 43,90 em 31/08/2026 foi salvo pelo usuário;
  essa informação não é confirmável pelo repositório.
- `npm run lint` falha por débitos preexistentes em `App.jsx`, `Configuracoes.jsx`, `useAuth.jsx`,
  `useDashboard.jsx` e configuração de globals dos testes. Tratar em objetivo próprio, sem misturar
  com feature financeira.
- Há arquivos de alta complexidade registrados no backlog da API: `Investimentos.jsx`, `Modal.jsx`,
  `Lancamentos.jsx` e `useDashboard.jsx`.

## Arquivos importantes

- `src/App.jsx`, `src/hooks/useAuth.jsx`, `src/utils/urlEstado.js`, `vercel.json`,
  `src/hooks/useDashboard.jsx`
- `src/hooks/useTransacoes.jsx`, `src/hooks/useOfflineSync.jsx`
- `src/utils/offlineQueue.js`, `src/utils/cartaoUtils.js`
- `src/components/Dashboard.jsx`, `src/components/Configuracoes.jsx`, `src/components/Lancamentos.jsx`
- `src/hooks/*.test.jsx`, `.github/workflows/ci.yml`, `docs/FUNCIONALIDADES.md`

## Validações recentes

- Antecipação de crédito validada localmente em 08/09: `npm test` aprovou 32 testes e `npm run build`
  concluiu; o fluxo usa somente `utils/cartaoUtils.js` para reconhecer crédito e recarrega o Extrato
  depois da confirmação. Permanece o aviso conhecido de chunk principal acima de 500 kB.
- Responsividade validada por testes de componente: categorias com tag Garagem preservam nome e
  ações; cobranças filtram a competência e o detalhamento usa grades empilháveis; o planejamento
  troca competência por navegação e seletores próprios. `npm test` aprovou 32 testes e `npm run
  build` foi concluído em 07/09, com apenas o aviso conhecido de chunk principal acima de 500 kB.
- Checkpoint do fluxo de terceiros em 04/09: uma compra parcial de R$ 33,88, com R$ 21,30 atribuídos ao terceiro, preserva o lançamento integral no Extrato; `terceiro_recebido` apenas identifica o reembolso e permanece independente do pagamento da fatura. Ao pagar o cartão, o caixa considera R$ 12,58 se o terceiro já devolveu sua parte e R$ 33,88 caso contrário, sem criar renda artificial.
- Progresso de dívidas validado para parcela `despesa`: dívida de terceiro avança apenas com
  `terceiro_recebido`; dívida própria continua avançando apenas com `status = pago`.
- Regressão do saldo conciliado validada: uma resposta canônica de agosto não substitui o cálculo
  de setembro; R$ 43,90 menos despesa paga de R$ 21,63 resulta em R$ 22,27.
- Smoke test em produção confirmou o Dashboard e a abertura do detalhamento de Outubro/2026 no
  Fluxo de Caixa Projetado.
- Previsão de setembro confirmada em produção: R$ 22,27 + R$ 2.463,35 − R$ 1.521,12 −
  R$ 938,39 = R$ 26,11; despesas já lançadas não são duplicadas na reserva de metas.
- Raio-X de metas validado em 04/09: abre sem lançamentos e lista os lançamentos filtrados por
  categoria/competência quando existirem; `npm test` aprovou 16 testes e `npm run build` foi
  concluído com apenas o aviso conhecido de chunk principal acima de 500 kB.
- Lint direcionado em `useDashboard` e seus testes continua com débitos preexistentes (incluindo
  configuração que não reconhece `test`); a comparação com `HEAD` não identificou erro novo.
- Regressões de terceiros e planejamento em 07/09: `A Receber` reduz uma parcela de dívida já
  recebida no Extrato; dívida de terceiro não reduz o Fluxo de Caixa Projetado; os três estados da
  mensagem de combustível (em dia, acima do planejado e concluído) foram validados em teste.
- Revisão documental em 07/09: `git diff --check` aprovou as alterações; `npm test` aprovou 32
  testes e `npm run build` concluiu com apenas o aviso conhecido de chunk acima de 500 kB. Não houve
  mudança de código, configuração, infraestrutura ou decisão técnica.
- Migração de URLs por caminho em 09/09: testes de utilitário cobrem caminhos, compatibilidade de
  leitura de links antigos e retorno pós-login. `npm test` aprovou 35 testes, `npm run build`
  concluiu (mantido apenas o aviso conhecido do chunk principal), e a prévia respondeu `200` para
  `/extrato?mes=9&ano=2026`. O commit `fbf4217` foi publicado em produção; o bundle e a rota
  direta em `fincontrole.online` foram confirmados.

## Próximos passos recomendados

1. Validar manualmente em produção uma abertura direta sem sessão em `/extrato?mes=9&ano=2026`,
   o retorno à rota após login e uma recarga autenticada em cada módulo crítico.
2. Após o deploy conjunto, validar autenticado a antecipação de uma compra parcelada em crédito:
   destino antes/depois do melhor dia, fatura quitada pulada e quitação posterior normal.
3. Validar também os fluxos pendentes de terceiros e planejamento de combustível já documentados.
4. Retomar backlog técnico apenas com objetivo confirmado e escopo isolado.
