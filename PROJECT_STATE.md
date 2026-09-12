# Estado atual — Web FinControle

**Atualizado em:** 11/09/2026

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
- Navegação autenticada usa caminhos canônicos legíveis (`/dashboard`, `/novo-lancamento`,
  `/extrato` e demais módulos), sem expor `mes`/`ano` na URL. O fallback do Vercel permite
  abrir e recarregar qualquer rota diretamente.

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
- O detalhe de veículo próprio permite registrar abastecimento técnico com quilometragem, litros,
  preço, total calculado, tanque cheio e observação. Ao vincular uma despesa existente, informar
  litros ou preço por litro calcula o outro campo a partir do valor do Extrato; o histórico mostra
  a ficha técnica sem criar nova previsão.
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
- URLs internas migraram de parâmetros de consulta para caminhos semânticos; links antigos com
  `?tela=` ainda abrem e são normalizados no próximo estado da aplicação.

## Trabalho em andamento

- Exclusão independente de abastecimento e lançamento vinculados concluída; aguarda deploy conjunto
  e smoke test em produção.
- Painel de consumo de combustível por veículo próprio concluído localmente; aguarda deploy conjunto
  e validação visual em produção.
- Correção de peças vencidas e padronização dos painéis internos da Garagem concluída localmente;
  aguarda deploy e validação visual responsiva.
- Custos Associados da Garagem agora filtram despesas por competência e têm navegação mensal local;
  aguardam deploy e validação visual.

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
- Roteamento por caminhos validado em 11/09: testes da URL cobrem Dashboard, Novo Lançamento,
  links legados, competência fora da URL e retorno pós-login; `npm test` aprovou 35 testes e
  `npm run build` concluiu com o aviso conhecido de chunk principal acima de 500 kB.
- Smoke test de abastecimentos em produção em 11/09: uma categoria de teste, um abastecimento e
  uma despesa PIX de R$ 25,00 foram criados uma única vez e vinculados; o odômetro avançou de
  10.000 para 10.010 km e o Extrato confirmou o lançamento. A categoria aparece no formulário
  após recarregar a Garagem.
- Correção de categorias em 11/09: a meta inicial agora é `0,00`, coerente com o campo opcional,
  e não bloqueia o envio nativo do formulário. O teste de componente cobre o cadastro simples;
  testes focados e build concluíram com sucesso. A API não precisou mudar e sua regressão completa
  em homologação aprovou 39 testes.
- Ajuste de cálculo do vínculo em 11/09: `npm test` aprovou 36 testes Vitest e `npm run build`
  concluiu com o aviso conhecido de chunk principal acima de 500 kB. A API aprovou 40 testes de
  integração em homologação, incluindo a rejeição de valor técnico divergente do Extrato.
- Exclusão independente preparada em 11/09: a Garagem mostra confirmação ao apagar a ficha
  técnica vinculada e o Extrato avisa ao apagar a despesa vinculada. Nenhuma confirmação oferece
  exclusão em cascata; a API validou os dois sentidos em homologação com 42 testes aprovados.
- Painel de consumo concluído em 11/09: a Garagem consome o resumo técnico canônico da API para
  exibir último abastecimento, médias de km/L, custo/km e preço/litro, distância desde o último
  tanque cheio e comparação com a média anterior. Veículos convidados não recebem o card; parciais
  não entram nas médias. `npm test` aprovou 36 testes e `npm run build` concluiu com o aviso
  conhecido de chunk acima de 500 kB.
- Garagem revisada em 11/09: peças vencidas mantêm barra em 100%, exibem quilômetros acima da
  troca prevista e usam o mesmo cálculo dos alertas. Rastreador, Histórico Clínico e Custos
  Associados agora preservam cabeçalho fora da área rolável e altura alinhada no desktop, sem
  comprimir a leitura no mobile. `npm test` aprovou 39 testes e `npm run build` concluiu com o
  aviso conhecido de chunk acima de 500 kB.
- Custos Associados ajustados em 11/09: o painel exibe somente despesas do veículo na competência
  selecionada, com navegação entre meses sem alterar o Dashboard. A descrição agora usa o termo
  familiar “Extrato”, em vez de “Livro-Razão”. `npm test` aprovou 39 testes e `npm run build`
  concluiu com o aviso conhecido de chunk acima de 500 kB.
- Formulário e consumo da Garagem ajustados em 11/09: o vínculo de despesa usa seletor visual com
  descrição, data e valor; preço por litro aceita máscara monetária. O card exibe também custo
  médio por dia útil retornado pela API. `npm test` aprovou 40 testes e o build concluiu com o aviso
  conhecido de chunk principal acima de 500 kB.
- Quilometragem do abastecimento ajustada em 11/09: o campo aceita a escrita brasileira, com ponto
  para milhar e vírgula para decimal, e normaliza o valor antes de enviar à API. O teste focado da
  Garagem aprovou `84.437` e `84.660,5`; build concluído com o aviso conhecido de chunk principal
  acima de 500 kB.
- Histórico e consumo de abastecimentos ajustados em 11/09: a Garagem filtra visualmente os últimos
  30 dias, 3 meses ou todo o histórico, sem alterar registros. O indicador passou a identificar o
  custo por dia útil e os dias úteis observados em Aracaju/SE. Teste focado e build concluíram com
  sucesso, preservando o aviso conhecido de chunk principal acima de 500 kB.

## Próximos passos recomendados

1. Após o deploy web, validar abertura direta sem sessão em `/extrato`, o retorno à rota após
   login e uma recarga autenticada em `/dashboard`, `/novo-lancamento` e `/extrato`.
2. Após o deploy conjunto, validar autenticado a antecipação de uma compra parcelada em crédito:
   destino antes/depois do melhor dia, fatura quitada pulada e quitação posterior normal.
3. Após o deploy conjunto, validar visualmente o vínculo existente preenchendo somente litros e,
   em nova tentativa, somente preço por litro; ambos devem calcular o outro campo sem criar uma
   nova despesa.
4. Após o deploy conjunto, validar os avisos de exclusão e confirmar que cada módulo preserva o
   registro do outro.
5. Após o deploy conjunto, validar o card de consumo com dois tanques cheios e um parcial,
   confirmando médias, distância e estado de dados insuficientes.
6. Após o deploy web, validar peças vencidas em % e km, além da rolagem dos três painéis em
   desktop e mobile.
7. Após o deploy web, validar a navegação mensal de Custos Associados e a ausência de despesas
   fora da competência selecionada.
8. Após o deploy conjunto, validar o seletor de vínculo com descrição, data e valor, a máscara do
   preço por litro e o custo médio diário para dois tanques cheios em dias diferentes.
9. Após o deploy web, validar no formulário de abastecimento a quilometragem com ponto de milhar e
   vírgula decimal, confirmando o valor no histórico e no Extrato vinculado.
10. Após o deploy conjunto, validar os filtros de histórico e o custo por dia útil, incluindo um
    intervalo que atravesse fim de semana ou feriado de Aracaju/SE.
11. Retomar backlog técnico apenas com objetivo confirmado e escopo isolado.
