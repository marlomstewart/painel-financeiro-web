# Segurança da cadeia Web — PR #1

Revisão: **18/11/2026**. Worktree `painel-financeiro-web-reconciliacao`, branch
`codex/reconciliacao-bcb`. Head inicial confirmado:
`4fc7a54f7b64ca5b619b80fe23283bed3fb8f263`.
Node 24.19.0 / npm 11.17.0; CI usa Node 24. Escopo restrito à cadeia dev/build.

## Auditoria atual antes/depois

| Auditoria completa em 18/11 | Antes, head 4fc7a54 | Após atualização dirigida |
|---|---:|---:|
| Pacotes afetados, incluindo pais | 16 | 14 |
| Altos | 12 | 12 |
| Moderados | 4 | 2 |
| Baixos / críticos | 0 / 0 | 0 / 0 |
| Auditoria sem dev | 0 | 0 |

- [Relatório completo antes](security/web-pr1-20261118-before.json) e
  [depois](security/web-pr1-20261118-after.json): pacote, versão, caminho físico,
  faixa, advisory e propagação pelos pais. Todos os caminhos afetados são dev no lockfile.
- `npm audit --json` retorna 1 por haver achados; não é falha dos testes.
  `npm audit --omit=dev --json` retorna 0. Isso não certifica ausência de falhas no produto.
- São **três advisories ativos**, não 14 vulnerabilidades independentes.
  Os 12 pacotes altos são a propagação de picomatch.
- A contagem de 05/11 (18 → 9, sem altos após correções) é histórica:
  [antes](security/web-pr1-audit-before.json) / [depois](security/web-pr1-audit-after.json).
  A base pública mudou: o advisory de picomatch foi atualizado em 17/11 e agora alcança
  4.0.7; o de deepmerge foi retirado em 16/11. Essa diferença não é regressão introduzida
  pela atualização do ESLint nem uma correção de deepmerge pelo lockfile.

### Inventário desta revisão

Caminhos relativos à raiz. M = [minimatch GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249);
G = [glob GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4);
P = [picomatch GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).

| Pacote | Versão antes → depois | Caminho | Advisory / origem |
|---|---|---|---|
| @eslint/config-array | 0.23.5 → 0.23.6 | `node_modules/@eslint/config-array` | M removido deste pai |
| eslint | 10.3.0 → 10.15.0 | `node_modules/eslint` | M removido deste pai |
| minimatch | 10.2.5 → 10.2.5 | `node_modules/minimatch`, usado por glob | M residual |
| minimatch | novas instalações 11.0.9 | `node_modules/eslint/node_modules/minimatch` e `node_modules/@eslint/config-array/node_modules/minimatch` | fora da faixa M |
| glob | 11.1.0 → 11.1.0 | `node_modules/glob` | G e M |
| picomatch | 4.0.7 → 4.0.7 | `node_modules/picomatch` | P |
| @rollup/pluginutils | 5.4.0 → 5.4.0 | `node_modules/@rollup/pluginutils` | P |
| @rollup/plugin-babel | 6.1.0 → 6.1.0 | `node_modules/@rollup/plugin-babel` | P via pluginutils |
| @rollup/plugin-node-resolve | 16.0.3 → 16.0.3 | `node_modules/@rollup/plugin-node-resolve` | P via pluginutils |
| @rollup/plugin-replace | 6.0.3 → 6.0.3 | `node_modules/@rollup/plugin-replace` | P via pluginutils |
| @vitejs/plugin-react | 6.0.1 → 6.0.1 | `node_modules/@vitejs/plugin-react` | P via pluginutils |
| fdir | 6.5.0 → 6.5.0 | `node_modules/fdir` | P |
| tinyglobby | 0.2.17 → 0.2.17 | `node_modules/tinyglobby` | P e fdir |
| vite | 8.3.6 → 8.3.6 | `node_modules/vite` | P e tinyglobby |
| vitest | 4.1.12 → 4.1.12 | `node_modules/vitest` | P e tinyglobby |
| workbox-build | 7.4.1 → 7.4.1 | `node_modules/workbox-build` | G, M e plugins Rollup/P |
| vite-plugin-pwa | 1.3.0 → 1.3.0 | `node_modules/vite-plugin-pwa` | workbox-build/P |
| deepmerge | 4.3.1 → 4.3.1 | `node_modules/deepmerge` | advisory retirado; não é achado ativo |

`node_modules/filelist/node_modules/minimatch@5.1.9` está fora da faixa M.
O relatório JSON mantém separadas as instalações e as cadeias de propagação.

## Correção compatível aplicada

- ESLint **10.3.0 → 10.15.0**, piso declarado `^10.15.0`, mesma major e Node compatível.
  O pai agora declara minimatch `^11.0.5`; config-array **0.23.5 → 0.23.6** também.
  Ambas as instalações resolvem **11.0.9**, acima da correção 11.0.1.
- Atualizações internas exigidas pelo novo pai incluem config-helpers 0.7.0, plugin-kit 0.7.3,
  file-entry-cache 11.1.5/flat-cache 6.1.23 e suas dependências. Todas dev; versões preexistentes
  só avançaram. Dependências de runtime, Vite/Vitest/Workbox e configuração PWA não mudaram.
- Comando dirigido: `npm update --package-lock-only --ignore-scripts --no-audit --no-fund eslint @eslint/config-array`;
  seguido de `npm ci --no-audit --no-fund`. `npm ls` confirmou árvore válida.
- Sem audit fix, force, downgrade ou override. A correção cobre a cadeia ESLint;
  **não** encerra minimatch sob glob/Workbox.
- Nenhuma alteração em fontes financeiras, hotfix de combustível, integração do aviso de
  caixa, fila offline, API, schema ou produção. Nenhuma nova decisão técnica durável;
  `DECISIONS.md` permanece inalterado.

## Reavaliação dos pais e propostas individuais

Versões consultadas no registry em 18/11 com `npm view <pacote> version dependencies engines --json`.
Prazos abaixo são **propostas para decisão**, não compromissos assumidos nem aceite de risco.

### minimatch — moderado, residual somente na cadeia Workbox

**Estado:** M afeta >=7 <11.0.1. glob 11.1.0 exige `^10.1.1`; a última 10.x é 10.2.6,
também vulnerável. Workbox 7.4.1 exige glob `^11.0.1`. ESLint já foi corrigido nesta revisão.
A migração para minimatch 11 sob glob 11 exigiria romper o contrato do pai.

**Exposição demonstrada:** instalação 10.2.5 usada pelo glob do gerador de precache.
Workbox chama globSync em `build/lib/get-file-details.js`; os padrões vêm da configuração
versionada. Não foi demonstrada entrada de dados financeiros da API nesse matcher, nem exploração
remota no bundle. Padrões/árvores alterados por PR ou dependência não confiável continuam superfície
de DoS no processo de build; audit sem dev zerado não elimina essa superfície.

**Mitigação:** nesta revisão, padrões/configuração e cadeia PWA foram preservados e o build teve
entrada controlada. Recomenda-se restringir builds não confiáveis a runners isolados, sem segredos,
com limites de tempo/memória e revisão de padrões e lockfiles antes de executá-los.
Esses controles adicionais de runner são proposta; não foram implantados neste PR.

**Alternativas / esforço / prazo:** aguardar pai compatível ou backport upstream (integração estimada
0,5–1 dia após publicação, sem prometer data do mantenedor); avaliar fork revisado de Workbox/glob
ou migração do gerador (2–4 dias, com equivalência de precache/atualização/fila).
Proposta: nova consulta até **20/11**, decidir alternativa até **25/11**.

**Recomendação:** manter gate de segurança pendente; priorizar solução no pai compartilhado com glob,
sem override nem downgrade. Nenhum aceite registrado.

### glob — moderado, vetor do advisory não demonstrado no caminho inspecionado

**Estado:** G afeta >=9 <=14.0.1, corrigido em 14.0.2; latest 14.0.6.
A última 11.x continua 11.1.0. Workbox latest 7.4.1 mantém `^11.0.1`.
PWA latest 2.0.0 também usa Workbox `^7.4.1`; atualizar esse pai para 2 não resolve a causa.

**Exposição demonstrada:** glob está no build PWA, mas o caminho de inventário inspecionado usa
**globSync sem AbortSignal**. O advisory trata de travessia assíncrona após cancelamento;
esse vetor específico não foi reproduzido no caminho usado pelo precache. Isso limita a exposição
demonstrada, sem certificar todos os usos transitivos ou autorizar isenção.

**Mitigação:** manter diretórios/padrões de build controlados e timeout externo do processo/runner;
não depender de AbortSignal para encerrar trabalho não confiável. CI existente tem timeout de job;
limites adicionais de recursos/isolamento permanecem proposta, não controle novo implantado.

**Alternativas / esforço / prazo:** backport na major 11 ou suporte oficial de Workbox ao glob corrigido
(0,5–1 dia de integração após release); fork revisado/gerador alternativo (2–4 dias, estimativa
compartilhada com a investigação minimatch, não somar duas migrações).
Reavaliar até **20/11**; proposta de decisão do responsável até **25/11**.

**Recomendação:** preservar o gerador aprovado até existir migração revisada, mantendo o risco como
pendência explícita. Não forçar glob 14 no pai que declara 11; nenhum aceite registrado.

### picomatch — alto, sem versão corrigida publicada

**Estado:** P, atualizado em 17/11, afeta <=4.0.7; latest 4.0.7, sem first_patched_version.
Caminhos: Vite/Vitest → picomatch e tinyglobby → fdir/picomatch; PWA → Workbox → plugins Rollup
→ pluginutils → picomatch. pluginutils latest 5.5.1 ainda exige `^4.0.2`; tinyglobby 0.2.17,
`^4.0.4`; Vite latest 8.3.8 mantém `^4.0.7`. Nenhum desses avanços encerra o advisory;
não foram misturadas atualizações sem correção demonstrada.

**Exposição demonstrada:** prova local limitada no picomatch 4.0.7 instalado: compilar `+(*a)b`
e testar `'a'.repeat(10) + '!'` terminou em menos de 1 ms; com 28 caracteres o processo filho
atingiu **2 s** e foi encerrado por timeout externo, memória limitada a 128 MiB.
Isso demonstra ReDoS do componente, **não** exploração do Dashboard/servidor.
pluginutils/createFilter e tinyglobby compilam padrões; node-resolve cria filtros de `sideEffects`
de pacotes. Configuração/metadata de dependências ou PR não confiável pode fornecer padrões;
não foi demonstrado caminho de lançamento financeiro até essas APIs.

**Mitigação:** prova executada só em filho descartável, sem serviço nem rede. Para a cadeia real,
recomenda-se revisão de padrões/metadata/lockfiles, runners descartáveis sem segredos,
limite externo de memória/tempo e não executar builds de origem não confiável em estação/runner
privilegiado. O timeout de job existente não interrompe seletivamente uma regex síncrona;
os controles adicionais são proposta, não uma correção aplicada.

**Alternativas / esforço / prazo:** correção upstream compatível (0,5–1 dia de integração/regressões
após release); backport/fork revisado do matcher e pais em tarefa isolada (2–3 dias);
substituir os consumidores de globbing exigiria estimativa própria (3–5 dias).
Proposta: triagem até **19/11**, nova consulta em **20/11**, decisão de caminho até **23/11**.

**Recomendação:** tratar como **bloqueio de segurança para liberação** até correção revisada ou
decisão explícita do responsável com mitigação/prazo. CI verde não resolve ReDoS.
Não instalar versões antigas só para sair de uma faixa; nenhum aceite registrado.

### deepmerge — advisory retirado, não é risco residual ativo desta auditoria

deepmerge 4.3.1 continua latest, sob Workbox → node-resolve 16.0.3 (`^4.2.2`).
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) foi retirado
em **16/11/2026 18:55:38 UTC**: o mantenedor da base informa que não descreve vulnerabilidade.
A API pública do advisory e a auditoria atual foram conferidas. A mescla de opções do plugin
não mudou; nenhuma atualização de versão foi usada para alegar correção.

Removido da lista de riscos ativos por **retirada do advisory**, sem aceite e sem downgrade.
O snapshot de 05/11 preserva a classificação histórica. Recomendação: acompanhar upstream
na próxima revisão regular; investigação adicional só se surgir evidência/advisory novo
(triagem estimada 0,5 dia). Não há prazo de correção de vulnerabilidade ativa a assumir aqui.

## Validações locais — 18/11

- `npm ci`: instalação própria e limpa; `npm ls minimatch glob deepmerge picomatch --all` válido.
  Revisão do lockfile confirmou mudanças somente dev, sem downgrade.
- `npm test`: **135/135**, 26 arquivos. Inclui App → Dashboard com caixa null/reconciliado,
  hotfix de combustível, orçamento futuro e isolamento/sincronização offline.
- `npm run lint`: **zero erros / 11 avisos existentes**, sem aviso novo.
- `npm run build`: Vite 8.3.6 / generateSW; `sw.js`, `workbox-9c191d2f.js`,
  **39 entradas / 1932,65 KiB**. Aviso existente de chunk >500 kB.
- A cadeia PWA e seus artefatos não mudaram nesta revisão: SW antes/depois SHA-256
  `60652b26540ab1205e188f7b695af5b448b1ec6870833aa2c355dbb41c4078d8`.
  Comparados os 37 arquivos de saída: todos byte a byte idênticos ao baseline 4fc7a54.
  Build anterior de 18/11 preservado no laboratório; bundle principal segue
  `assets/index-KYo5uW32.js`. Nenhum marcador artificial foi inserido no SW.
- Reexecutado smoke de atualização **real entre builds distintos**: baseline c812a3b gerado
  em 05/11 (SW `691c63db07cd4313a0ba0084edd9fc3a7363bf6dca12a57e357954add6e5edc9`)
  → build atual. Não é troca de controlador 4fc7a54 → ESLint atualizado, pois seus SW são idênticos.
- Chrome desktop **1366 px** e móvel emulado **390 px**: controllerchange, novo chunk cacheado,
  app shell recarregado offline e snapshot integral da fila idêntico. Dois lotes A/B, duas
  parcelas no lote A, tentativas/estado/erro e legado sem dono preservados; A/B enxergam
  somente seus lotes e o legado permanece em quarentena.
- Precache contém os 39 arquivos existentes, incluindo Cobranças, Dashboard, Configurações,
  Investimentos, CalculadoraCompra e AvisoTaxasBcb.
- Removidos somente os três registros sintéticos por perfil; assert da fila vazia passou.
  Perfis/processos temporários encerrados/removidos e servidor loopback fechado.
  API externa bloqueada por CSP; sem chamadas/escritas em API, banco ou produção.
- Roteiros no laboratório fora do Git:
  `../fincontrole-hml-local/smoke-pwa-security-pr1.cjs` e
  `../fincontrole-hml-local/probe-picomatch-pr1.cjs`.
  Emulação não certifica dispositivo físico ou ambiente hospedado.

## Certificação de CI e publicação

- PR [Web #1](https://github.com/marlomstewart/painel-financeiro-web/pull/1), draft;
  base confirmada `d6bccdbd7ba4998f2e0739ef12d25b8e560ca0b8`.
- Candidato anterior `4fc7a54f7b64ca5b619b80fe23283bed3fb8f263`:
  [CI 42044602309](https://github.com/marlomstewart/painel-financeiro-web/actions/runs/42044602309)
  **success**, reconferida em 18/11. Checkout efetivamente testado nos logs:
  `2ad48ca3051d705f60003b5569c678aae0537217`, merge sintético desse head com a base.
  135 testes e build/PWA aprovados. Não foi execução isolada do head.
- Correção publicada sem force-push no head
  `f18649c0bc0da5c14770b4dbb82c0eb8453f66b9`:
  [CI 44301401844](https://github.com/marlomstewart/painel-financeiro-web/actions/runs/44301401844)
  **success** em 18/11; job `134791752280`. Checkout confirmado nos logs e pelos pais Git:
  `322aacb944f6f0157235363609418f832fa8a8ed` (base `d6bccdb` + head `f18649c`).
  Instalação limpa, **135/135 testes em 26 arquivos** e build/PWA **39 entradas / 1932,61 KiB**.
  A medida remota Linux difere da local Windows; não se presume igualdade dos hashes entre SOs.
- O checkpoint posterior destes certificados altera somente documentação; preserva o lockfile
  e as fontes certificados acima. A CI do último head documental também deve ser conferida no
  [PR](https://github.com/marlomstewart/painel-financeiro-web/pull/1), distinguindo seu checkout
  de merge do head da branch. Não é teste isolado do head.
- CI atual executa testes/build; lint e smoke PWA acima são validações locais.
  CI verde não é aceite dos riscos residuais, autorização de merge ou deploy.

**Pendências:** minimatch/Workbox, glob/Workbox e picomatch continuam sem aceite;
as propostas acima aguardam decisão do responsável ou correção upstream compatível.
Demais gates financeiros/HML, dispositivo físico e rollout conjunto seguem o plano
`../painel-financeiro-api/docs/RECONCILIACAO_MAIN_HML.md`, que não foi alterado.
