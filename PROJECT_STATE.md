# Estado atual — Web FinControle

**Atualizado em:** 06/10/2026

## Objetivo atual

Checkpoint do rateio do modal de faturas concluído em 06/10: todos os participantes normalizados
da API entram no cálculo; a UI explica que gastos de terceiros incluem valores já recebidos.
Correção na branch de revisão `codex/faturas-participantes`, criada a partir de
`codex/bcb-resiliencia` (`f182a17`): a base contém BCB e AUD-007 ainda não promovidos.
Revisão/CI remota, smoke visual autenticado e promoção/deploy seguem pendentes.

## Contexto da base de revisão

Integração BCB corrigida junto à API com checkpoint final validado em 03/10: taxas com origem/datas, aviso de última
válida desatualizada, erro recuperável e simuladores pausados sem CDI, inclusive “À vista ou parcelado”.
Implementação publicada em 03/10 na branch de revisão `codex/bcb-resiliencia`, baseada no checkpoint
AUD-007: Web `716fe21`, API `5a67539`; SHAs remotos conferidos, sem promoção para `main` ou deploy.
Contrato/política canônicos: API D-026 e `docs/BCB_RESILIENCIA.md`.
CI remota, smoke visual HML e rollout API/Web/PWA pendentes; produção não usada em testes.

AUD-007 permanece publicada na branch `codex/aud-007-recebimentos-datados`, sem promoção/deploy:
Web `4c811e1`, API `c829165`, checkpoints documentais `d840f6c`/`5d5105d`.
Rollout da fila offline (AUD-001) permanece pendente de confirmação separada.

## Estado geral

- AUD-007 validada em checkpoint: Cobranças pede data efetiva, mostra recebidos quitados sem data histórica e
  permite informar data conhecida/cancelar declaração incorreta. Dashboard usa API para cortes,
  não converte NULL em zero e suspende projeção dependente de caixa não reconciliado. Nenhuma
  data antiga foi presumida; prévia orçamentária permanece independente. API D-025 é canônica.

- Checkpoint documental concluído em 12/09; README e catálogo funcional foram alinhados à
  navegação por caminhos, planejamento, abastecimentos técnicos e consumo de combustível.
- A antecipação de parcelas aceita a data em que ela ocorreu e calcula a fatura de destino a partir
  dela, em calendário de Fortaleza.
- Produção é Vercel; a API produtiva é Render/Supabase. A confirmação do deploy mais recente não
  pode ser deduzida somente do Git.
- Múltiplos participantes publicados em produção no commit `fabe894`; o bundle e a API foram
  validados tecnicamente, restando apenas o smoke test funcional autenticado no produto.
- Aplicação é React/Vite PWA sem Redux/Context global; hooks são instanciados no `App.jsx` e
  distribuídos por props.
- Navegação autenticada usa caminhos canônicos legíveis (`/dashboard`, `/novo-lancamento`,
  `/extrato` e demais módulos), sem expor `mes`/`ano` na URL. O fallback do Vercel permite
  abrir e recarregar qualquer rota diretamente.

## Entregas relevantes

- Modal de faturas usa `participantes[].valorParcela` para totalizar cada pessoa e calcular a
  fração pessoal, com soma em centavos e abate de estornos. Participantes normalizados prevalecem
  sobre campos de terceiro único; compras legadas continuam compatíveis. Recebimento não remove
  a participação na fatura: o texto orienta consultar A Receber para pendências de devolução.
- BCB: Investimentos e Calculadora mostram origem/referência/consulta e avisam taxa antiga;
  erro não fica carregando indefinidamente nem preserva números antigos como atuais. Carteira
  CDB vazia/prefixada permanece acessível; CDI null pausa simuladores, não vira zero. Hook de
  leitura compartilhado aborta requisições substituídas/desmontadas e recusa refresh de contexto
  antigo. Resposta 503 genérica de proxy não é atribuída automaticamente ao BCB.
- A fila IndexedDB nova grava o ID da conta em cada lote, lista/sincroniza apenas itens do usuário
  autenticado e valida a sessão novamente após operações assíncronas. IDs locais incluem a conta
  para evitar colisões. Entradas antigas sem proprietário permanecem no aparelho, bloqueadas para
  envio e indicadas de forma genérica no ícone da nuvem; clicar nele orienta procurar suporte.
  O logout limpa os lançamentos em memória e uma resposta antiga não deve preencher a nova sessão.
  A criação envia à API a identidade declarada junto ao JWT. O commit `a29e9b1` está em
  `origin/main`, e o bundle público contém o novo cabeçalho e o aviso de legado; o smoke
  autenticado A→B continua pendente.
- O Extrato pede a “Data em que você pagou” antes de marcar um item como pago; o pagamento em
  lote pede a mesma data e a repete na confirmação. O campo começa no dia atual de Fortaleza.
  Cancelar não altera o lançamento, e a seleção do lote só é limpa após sucesso. A data segue
  para a API sem alterar a competência ou o recebimento de terceiros. A publicação e o teste
  autenticado no produto devem ser confirmados separadamente.
- Novo Lançamento permite adicionar vários participantes a uma compra compartilhada, informando
  nome, telefone opcional e valor devido no total da compra. A tela mostra total atribuído e parte
  do titular; Extrato, detalhes e A Receber exibem os valores por parcela e o recebimento de cada
  pessoa. O cartão de participantes usa alto contraste e linguagem financeira simples, explicando
  que o FinControle faz o ajuste de centavos automaticamente. A fila offline preserva os totais
  canônicos enviados à API e monta somente uma prévia local do rateio enquanto aguarda sincronização.
- O Extrato exporta em CSV exatamente as linhas visíveis após competência, busca, status e filtros
  avançados. O arquivo é compatível com Excel brasileiro e informa data de compra, valor da parcela,
  cartão/forma de pagamento, competência, status, grupo e identificação de parcela.
- A PWA recupera falhas conhecidas de chunk sob demanda após deploy com uma única recarga
  controlada por rota/sessão; erros não relacionados continuam no ErrorBoundary.
- Ao consultar uma competência futura, o Dashboard apresenta uma prévia independente: rendas
  previstas menos gastos, faturas abertas e a estimativa de metas baseada no progresso já realizado.
  Ela não incorpora Saldo Líquido, saldo inicial, saldo acumulado ou pagamentos já realizados.
  Faturas mostram o total por cartão e os valores de terceiros, enquanto o resultado usa somente a
  parte pessoal do titular. Metas sem progresso na competência futura usam somente como referência
  o progresso real do mês atual, nunca o valor restante até o teto; ao virar mês atual, voltam a
  mostrar exclusivamente os lançamentos da própria competência.
- O detalhamento do Extrato permite antecipar parcelas futuras pendentes de uma compra parcelada no
  crédito. Antes da prévia, o usuário informa a data da antecipação; a confirmação mostra essa data,
  quantidade, total e fatura canônica de destino. Antecipar não quita nem modifica os dados
  financeiros da compra. Parcelamentos novos recebem `grupo_id` no cadastro; séries antigas completas
  no formato `(1/total)` também exibem a ação e são vinculadas pela API somente ao confirmar.
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
- Dashboard separa saída integral por pagamento e entradas datadas dos terceiros no saldo
  histórico. Não reduz setembro por um recebimento feito em outubro (AUD-007).
- Dívidas e financiamentos para terceiros agora são excluídos também do Fluxo de Caixa Projetado;
  recebimentos registrados no Extrato reduzem o total geral de A Receber sem alterar o status da
  conta/fatura.
- Configurações permite saldo conciliado; depois do marco, o Saldo Líquido usa datas efetivas de
  pagamento e recebimento para representar caixa real entre meses. Novo marco confirmado pode
  cobrir legado observado antes dele, mas não reconciliar retroativamente períodos anteriores.
- A busca de transações agora preserva também movimentos pagos após o marco de caixa, mesmo se a
  data de compra estiver fora da janela padrão de 24 meses. O pagamento/reversão de fatura usa
  uma operação atômica da API, em vez de uma requisição por parcela.
- O Dashboard consulta o caixa canônico da API com ou sem marco para o mês visível; Configurações mostra
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

- Rateio do modal de faturas com checkpoint aprovado em `codex/faturas-participantes`; pendentes
  revisão/CI remota e smoke visual autenticado. A base inclui BCB/AUD-007: considerar essas
  dependências antes de promover/deployar, ou isolar a correção para um hotfix independente.
- BCB com checkpoint final aprovado e implementação publicada em `codex/bcb-resiliencia`
  (Web `716fe21`, API `5a67539`), sem promoção/deploy. CI só dispara em main/master/develop
  ou PR; publicação desta branch não comprova CI remota. Abrir revisão/CI como próximo passo.
  Considerar dependência AUD-007 na revisão/promoção; preparar smoke visual HML e rollout
  compatível da API/Web/PWA. Falha DNS e recuperação no ambiente hospedado não confirmadas.
- AUD-007: publicada em branch de revisão (`4c811e1`) junto à API (`c829165`), sem promoção para
  `main`. CI atual só dispara por push em main/master/develop ou PR; abrir revisão/CI remota.
  Smoke visual HML e rollout coordenado seguem pendentes. Exigir
  recarregamento da PWA e não misturar instâncias antigas escrevendo recebimentos.

- Confirmar o SHA ativo no Render após a publicação da API `7349f07` e validar criação online
  pela Web. Uma PWA antiga sem o cabeçalho receberá 403 e precisará atualizar.
- Após o deploy conjunto, fazer teste manual A→B no mesmo navegador, inclusive com uma fila
  legada sem dono; não inserir dados reais para esse teste.
- Definir procedimento assistido para recuperar filas antigas sem identificação após confirmar a
  conta proprietária, sem atribuição automática nem exclusão silenciosa.
- Confirmar após o deploy conjunto, em um lançamento de teste, a data escolhida no pagamento
  individual e em lote, a saída do Radar e a permanência do recebimento do terceiro.
- Múltiplos participantes publicados e validados tecnicamente em produção; aguardam somente smoke
  test funcional autenticado.
- Exclusão independente de abastecimento e lançamento vinculados concluída; aguarda deploy conjunto
  e smoke test em produção.
- Painel de consumo de combustível por veículo próprio concluído localmente; aguarda deploy conjunto
  e validação visual em produção.
- Competência da primeira parcela de Dívidas passou a usar seletores explícitos de mês e ano,
  preservando os campos numéricos do contrato da API; aguarda deploy e validação visual em produção.
- Correção de peças vencidas e padronização dos painéis internos da Garagem concluída localmente;
  aguarda deploy e validação visual responsiva.
- Custos Associados da Garagem agora filtram despesas por competência e têm navegação mensal local;
  aguardam deploy e validação visual.
- Antecipação de parcelas com data informada concluída localmente; aguarda deploy conjunto e
  validação autenticada.
- Prévia da competência futura do Dashboard concluída; aguarda deploy web e validação autenticada
  com contas e compras de cartão em competências distintas, compras compartilhadas e metas que
  tenham ou não progresso no mês atual.
- Fluxo de Caixa Projetado usa cartões acessíveis, compactos e com moeda; o detalhamento agora
  inclui faturas de cartão já lançadas por competência, o total da fatura, somente a fração
  pessoal e os gastos que a compõem. Valores de terceiros continuam visíveis, mas não afetam o
  saldo; aguarda deploy e smoke test autenticado em desktop e celular.

## Pendências e riscos

- BCB: cache da API se perde no restart; sem taxa válida, posições dependentes recebem 503.
  Web antiga não identifica metadados nem aceita CDI null; atualização compatível necessária.
  Rentabilidade continua estimativa simplificada, não cotação oficial/rendimento histórico.
- AUD-007: pendente smoke visual integrado em HML, CI e deploy conjunto. Datas antigas desconhecidas
  não foram estimadas; um novo fechamento cobre somente os cortes posteriores. PWA antiga não
  envia data e pode tratar NULL como zero: atualizar durante janela controlada. A API antiga ignora
  datas, portanto não manter versões mistas. Devolução real/recebimento parcial e AUD-009 separados.

- Confirmar no produto se o saldo conciliado de R$ 43,90 em 31/08/2026 foi salvo pelo usuário;
  essa informação não é confirmável pelo repositório.
- `npm run lint` não possui erros. Restam 11 avisos de hooks sobre carregamentos iniciados em efeitos
  e dependências que exigem refatoração gradual com cancelamento/testes de ciclo de vida.
- Há arquivos de alta complexidade registrados no backlog da API: `Investimentos.jsx`, `Modal.jsx`,
  `Lancamentos.jsx` e `useDashboard.jsx`.

## Arquivos importantes

- `src/App.jsx`, `src/hooks/useAuth.jsx`, `src/utils/urlEstado.js`, `vercel.json`,
  `src/hooks/useDashboard.jsx`
- `src/hooks/useTransacoes.jsx`, `src/hooks/useOfflineSync.jsx`
- `src/utils/offlineQueue.js`, `src/utils/cartaoUtils.js`, `src/utils/pwaUpdate.js`,
  `src/utils/exportarExtratoCsv.js`
- `src/components/Dashboard.jsx`, `src/components/Configuracoes.jsx`, `src/components/Lancamentos.jsx`
- `src/hooks/*.test.jsx`, `.github/workflows/ci.yml`, `docs/FUNCIONALIDADES.md`

## Validações recentes

- Modal de faturas em 06/10: 95/95 testes em 24 arquivos, incluindo quatro regressões novas de
  participantes múltiplos, prioridade sobre legado, recebimento independente, estorno e centavos,
  e terceiro único parcial/integral. Teste integrado renderiza o modal e verifica a orientação
  sobre A Receber. Lint zero erros/11 avisos preexistentes; build/PWA aprovado com aviso conhecido
  do chunk >500 kB. Diff completo e whitespace revisados; sem smoke visual em produção ou deploy.
  D-010/D-015 já cobrem a regra: nenhuma nova decisão técnica.

- Checkpoint final BCB em 03/10: `npm test` repetido, 91/91 em 23 arquivos;
  16 regressões novas cobrem 503 tipado/genérico,
  recuperação, descarte de dado anterior, taxa antiga, requisição atrasada, troca/desmontagem,
  refresh antigo ignorado, CDI null sem veredito, carteira vazia e erro de Tesouro sem total falso.
  Lint zero erros/11 avisos: dois efeitos anteriores foram centralizados em um hook com cancelamento,
  preservando um aviso desse padrão; outros avisos fora do escopo. Build/PWA aprovado, aviso conhecido
  do chunk >500 kB. Diff/whitespace/padrões de segredo revisados e catálogo atualizado;
  API 185/185 e unitários 98/98.
  BCB/Sentry simulados nos novos testes, SQL real só na suíte existente de `fincontrole-hml`.
  Nenhuma nova decisão Web independente: política/contrato registrados na API D-026.
  Smoke visual hospedado, CI remota e deploy não executados.
  Publicação da implementação conferida por `git ls-remote` nos dois repositórios;
  `origin/main` permaneceu Web `19381a8` / API `1da24c6`. Nenhum PR ou deploy criado nesta etapa.
- Checkpoint final AUD-007 em 03/10: 75/75 testes em 19 arquivos, cobrindo setembro/outubro, recebimento posterior ao
  marco, legado desconhecido, estado NULL, prompts cancelados, falha HTTP e ações de Cobranças.
  Lint: zero erros/12 avisos preexistentes. Build/PWA aprovado, com aviso conhecido do chunk >500 kB.
  Diff completo, arquivos novos, whitespace e padrões de credenciais revisados/aprovados.
  README e catálogo funcional deixaram de descrever a compensação pela flag atual. D-015
  revisada e D-005 alinhada à autoridade canônica, sem nova decisão de arquitetura no checkpoint.
  API: suíte completa 160/160, unitários 73/73 e sintaxe de 27 arquivos aprovados.
  API validada somente com dados sintéticos HML; nenhum smoke visual hospedado/produtivo executado.

- AUD-001 em 29/09: `npm test` aprovou 67 testes em 18 arquivos, incluindo A→B, troca de sessão
  durante resposta pendente, quarentena de fila legada e isolamento de operações IndexedDB.
  `npm run build` passou; `npm run lint` concluiu com zero erros e 12 avisos conhecidos. O chunk
  principal ainda excede 500 kB.
- Em 25/09, `npm test` aprovou 62 testes, incluindo escolha e cancelamento da data no
  pagamento individual e envio da data no lote. `npm run build` passou; `npm run lint` teve
  zero erros e 12 avisos preexistentes em arquivos fora desta mudança.
- Fluxo de Caixa Projetado em 23/09: faturas de cartão já lançadas passaram a reduzir o saldo na
  competência correspondente apenas pela fração pessoal. O detalhamento apresenta total da fatura,
  valor pessoal considerado, terceiros excluídos e gastos pessoais. A cobertura unitária e do hook
  inclui compra dividida, lançamento pago, conta fixa já materializada e dívida de terceiro no
  cartão; `npm test` aprovou 59 testes, lint terminou sem erros (12 avisos preexistentes) e o build
  concluiu com o aviso conhecido do chunk principal acima de 500 kB.
- Fluxo de Caixa Projetado em 23/09: cards responsivos agora exibem moeda, saldo previsto ao fim
  de cada mês, explicação do cálculo e memória detalhada ao toque. O cálculo continua excluindo
  dívidas de terceiros do saldo e agora expõe o valor excluído como informação. Testes do Dashboard,
  hook e utilitário passaram; `npm test` aprovou 55 testes, lint ficou sem erros e o build concluiu.
- Competência de Dívidas em 23/09: substituído o controle nativo de mês por seletores acessíveis
  de mês/ano, com empilhamento no celular. O teste de componente confirma o payload
  `mes_primeira_parcela`/`ano_primeira_parcela`; `npm test` aprovou 55 testes, `npm run lint`
  terminou sem erros e `npm run build` concluiu com o aviso conhecido do chunk principal acima de 500 kB.
- Múltiplos participantes em 22/09: `npm test` aprovou 46 testes, incluindo 8 cenários direcionados
  de `useTransacoes` e `Cobrancas`; `npm run lint` terminou sem erros (mantendo os 12 avisos
  conhecidos) e `npm run build` concluiu com o aviso já conhecido do chunk principal acima de 500 kB.
  Na API, `npm test` aprovou 55 testes contra o Supabase de homologação restaurado, incluindo o
  contrato integrado de distribuição, recebimento, caixa, antecipação, legado e isolamento.
- Publicação em 22/09: `origin/main` aponta para `fabe894`, a CI concluiu com sucesso e o bundle
  servido por `fincontrole.online` contém os controles de múltiplos participantes. A API publicada
  está pronta e conectada ao Supabase.
- Manutenção de lint em 13/09: imports e variáveis legadas foram removidos, testes Vitest receberam
  globals explícitos, Fast Refresh foi limitado a componentes e o progresso de dívidas foi extraído
  para utilitário. Dependências supérfluas de fatura e de data dinâmica do Dashboard também foram
  removidas. `npm run lint` concluiu sem erros (12 avisos conhecidos), `npm test` aprovou 44
  testes e `npm run build` concluiu; permanece apenas o aviso de chunk principal acima de 500 kB.
- Exportação CSV do Extrato validada em 22/09: 50 testes cobrem formatação para Excel, competência
  de fatura distinta da data de compra e o botão que usa apenas a tabela visível; lint concluiu sem
  erros (12 avisos conhecidos) e build de produção concluiu com o aviso de chunk principal acima de
  500 kB.
- Prévia de competência futura validada em 22/09: testes do Dashboard e do hook cobrem rendas
  fixas e lançadas, contas e dívidas recorrentes, compras de cartão separadas das faturas, reserva
  residual de metas e a ausência de Saldo Líquido/fluxo acumulado. `npm test` aprovou 53 testes,
  `npm run lint` terminou sem erros (12 avisos conhecidos) e `npm run build` concluiu com o aviso
  conhecido de chunk principal acima de 500 kB.
- Ajuste de faturas da prévia em 22/09: o total por cartão e a parcela atribuída a cada terceiro
  permanecem visíveis no detalhamento, mas o card e o Resultado previsto consideram apenas a parte
  pessoal. O teste do hook cobre uma compra compartilhada com dois participantes e conta fixa no
  mesmo cartão.
- Referência de metas na prévia em 22/09: quando não há progresso na competência futura, o painel
  e a estimativa usam o avanço real do mês atual. Lançamento já existente no mês futuro aparece
  somente em Gastos/Faturas. A referência não é gravada nem continua quando a competência se torna
  atual.
- Correção da estimativa de metas em 22/09: a prévia usa o gasto/progresso realizado como valor
  estimado, e não a diferença até a meta. Lançamentos existentes no mês futuro continuam somente
  em Gastos/Faturas, evitando duplicidade.
- Recuperação de PWA validada em 12/09: 43 testes cobrem também reconhecimento de erro de chunk,
  recarga única e o evento `vite:preloadError`; build de produção concluído com o aviso conhecido
  de chunk principal acima de 500 kB.
- Antecipação com data informada validada em 13/09: teste do hook confirma o calendário, a prévia e
  a confirmação com a mesma data; `npm test -- --run src/hooks/useTransacoes.test.jsx` aprovou 3
  testes e `npm run build` concluiu. A API validou os limites antes/no/depois do melhor dia e a
  fatura quitada. Permanece o aviso conhecido de chunk principal acima de 500 kB.
- Compatibilidade de parcelamentos antigos validada em 13/09: o Extrato identifica séries completas
  sem grupo pelo padrão `(n/total)`, e a API aprovou em homologação a antecipação de uma compra
  legada com três parcelas, preservando status e caixa.
- Responsividade validada por testes de componente: categorias com tag Garagem preservam nome e
  ações; cobranças filtram a competência e o detalhamento usa grades empilháveis; o planejamento
  troca competência por navegação e seletores próprios. `npm test` aprovou 32 testes e `npm run
  build` foi concluído em 07/09, com apenas o aviso conhecido de chunk principal acima de 500 kB.
- Fluxo de terceiros: o lançamento integral no Extrato e o pagamento da fatura permanecem
  independentes do recebimento. AUD-007 substitui a compensação pela flag atual: saída integral
  no pagamento, entrada própria datada no recebimento, sem renda duplicada no Extrato.
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

1. Abrir revisão/CI da correção do modal de faturas e validar uma compra com dois participantes,
   um recebido e outro pendente, além de estorno e terceiro único legado. Confirmar que o rateio
   permanece após recebimento e que as pendências são consultadas em A Receber. Avaliar a base
   BCB/AUD-007 antes de qualquer promoção para produção.

2. Abrir revisão/CI das branches BCB publicadas; preparar smoke integrado HML de falha/cache/recuperação
   antes do rollout API/Web/PWA. Branch baseada em AUD-007: não promovê-la como hotfix independente
   sem revisar essa dependência. Seguir `painel-financeiro-api/docs/BCB_RESILIENCIA.md`.

3. Abrir revisão/CI das branches AUD-007 publicadas e preparar ambiente HML com API/Web
   compatíveis para smoke visual desktop/celular antes da promoção para `main` e rollout produtivo.
4. Seguir `painel-financeiro-api/docs/RECEBIMENTOS_TERCEIROS.md` para atualizar a PWA, confirmar
   datas antigas conhecidas ou estabelecer fechamento bancário, sem inferir histórico.

1. Após o deploy web, validar abertura direta sem sessão em `/extrato`, o retorno à rota após
   login e uma recarga autenticada em `/dashboard`, `/novo-lancamento` e `/extrato`.
2. Após o deploy conjunto, validar autenticado a antecipação de uma compra parcelada em crédito:
   data antes/no/depois do melhor dia, fatura quitada pulada e quitação posterior normal.
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
11. Após o deploy web, conferir a exportação de uma fatura cuja compra tenha data em mês anterior,
    garantindo que a competência e os filtros ativos do Extrato coincidam com o CSV.
12. Após o deploy web, abrir uma competência futura no Dashboard e conferir rendas, contas, dívida,
    compra de cartão antes/depois do melhor dia e reserva de metas, confirmando que a prévia não
    mostra saldo inicial nem duplica valores na fatura.
13. Retomar backlog técnico apenas com objetivo confirmado e escopo isolado.
