# Segurança da cadeia Web — PR #1

Data: 05/11/2026. Base auditada: `c812a3bf85a283cbb7e0549e40fcad6eff57e57b`, branch `codex/reconciliacao-bcb`.
Node 24.19.0 / npm 11.17.0 (CI usa Node 24). Escopo: desenvolvimento, testes e build; sem alterações de API, schema, fontes financeiras, merge ou deploy.

## Auditoria antes/depois

| Auditoria completa | Antes | Depois |
|---|---:|---:|
| Pacotes afetados (inclui pais propagados) | 18 | 9 |
| Altos | 6 | 0 |
| Moderados | 9 | 7 |
| Baixos | 3 | 2 |
| Críticos | 0 | 0 |

`npm audit --omit=dev --json` após a atualização: zero. Os achados completos estão marcados como dev no lockfile; isso não é garantia de ausência de outras falhas nem prova isolada de alcance no bundle.
Os números contam pacotes afetados, não nove advisories independentes. A auditoria depende da base pública na data da consulta.

Evidências completas (incluem pacote, versão do lockfile, caminho físico, cadeia `via`, faixas e URL de cada advisory):

- [Antes](security/web-pr1-audit-before.json)
- [Depois](security/web-pr1-audit-after.json)

### Inventário por pacote e advisory

Os caminhos abaixo são relativos à raiz; sufixos repetidos representam instalações distintas.

| Pacote | Versão antes → depois | Caminho | Advisory direto ou origem transitiva |
|---|---|---|---|
| @eslint/config-array | 0.23.5 → 0.23.5 | `node_modules/@eslint/config-array` | minimatch |
| @eslint/js | 10.0.1 → 10.0.1 | `node_modules/@eslint/js` | eslint |
| @rollup/plugin-node-resolve | 16.0.3 → 16.0.3 | `node_modules/@rollup/plugin-node-resolve` | deepmerge |
| @vitest/mocker | 4.1.11 → 4.1.12 | `node_modules/@vitest/mocker` | [GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8), [GHSA-xp26-3454-mjgp](https://github.com/advisories/GHSA-xp26-3454-mjgp) |
| brace-expansion | 5.0.9 → 5.0.12<br>2.1.4 → 2.1.7 | `node_modules/brace-expansion`<br>`node_modules/filelist/node_modules/brace-expansion` | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) |
| deepmerge | 4.3.1 → 4.3.1 | `node_modules/deepmerge` | [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) |
| eslint | 10.3.0 → 10.3.0 | `node_modules/eslint` | @eslint/config-array, minimatch |
| fast-uri | 3.1.5 → 3.1.9 | `node_modules/fast-uri` | [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8), [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc), [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf), [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp), [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3), [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj), [GHSA-w74x-v6f9-j3xg](https://github.com/advisories/GHSA-w74x-v6f9-j3xg), [GHSA-xhq7-xmqj-769h](https://github.com/advisories/GHSA-xhq7-xmqj-769h), [GHSA-wjr9-j795-jxcr](https://github.com/advisories/GHSA-wjr9-j795-jxcr), [GHSA-333x-w4r6-6crp](https://github.com/advisories/GHSA-333x-w4r6-6crp) |
| glob | 11.1.0 → 11.1.0 | `node_modules/glob` | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), minimatch |
| minimatch | 10.2.5 → 10.2.5 | `node_modules/minimatch` | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| serialize-javascript | 7.1.0 → 7.1.4 | `node_modules/serialize-javascript` | [GHSA-m5mm-p8h7-m29v](https://github.com/advisories/GHSA-m5mm-p8h7-m29v) |
| source-map-js | 1.2.1 → 1.2.2 | `node_modules/source-map-js` | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) |
| undici | 8.10.0 → 8.12.4 | `node_modules/undici` | [GHSA-3wwx-pv8p-q78v](https://github.com/advisories/GHSA-3wwx-pv8p-q78v), [GHSA-pmjh-fq2x-6v4x](https://github.com/advisories/GHSA-pmjh-fq2x-6v4x), [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r), [GHSA-rfgv-xxqx-mfg5](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5), [GHSA-3xpg-4rpp-hhhm](https://github.com/advisories/GHSA-3xpg-4rpp-hhhm), [GHSA-2jfj-6hjv-fm6j](https://github.com/advisories/GHSA-2jfj-6hjv-fm6j), [GHSA-2gqq-gqf2-x968](https://github.com/advisories/GHSA-2gqq-gqf2-x968), [GHSA-w293-vg96-wgc3](https://github.com/advisories/GHSA-w293-vg96-wgc3), [GHSA-8436-99hf-9mmv](https://github.com/advisories/GHSA-8436-99hf-9mmv), [GHSA-vp8m-p9jh-q5pm](https://github.com/advisories/GHSA-vp8m-p9jh-q5pm), [GHSA-rx4f-c7p8-82vq](https://github.com/advisories/GHSA-rx4f-c7p8-82vq), [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685), [GHSA-f72v-6w45-q472](https://github.com/advisories/GHSA-f72v-6w45-q472), [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c), [GHSA-4w7w-5xrc-9h26](https://github.com/advisories/GHSA-4w7w-5xrc-9h26), [GHSA-2m5v-pch6-74hx](https://github.com/advisories/GHSA-2m5v-pch6-74hx), [GHSA-qrxm-fqhp-jwvm](https://github.com/advisories/GHSA-qrxm-fqhp-jwvm), [GHSA-9fm3-97px-rjf6](https://github.com/advisories/GHSA-9fm3-97px-rjf6), [GHSA-55wc-3pg8-jfw6](https://github.com/advisories/GHSA-55wc-3pg8-jfw6) |
| vite | 8.2.1 → 8.3.6 | `node_modules/vite` | [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv), [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw), [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [GHSA-9jrq-w75r-8gcw](https://github.com/advisories/GHSA-9jrq-w75r-8gcw), [GHSA-rq7h-c2jc-7f22](https://github.com/advisories/GHSA-rq7h-c2jc-7f22), [GHSA-vfpm-58rq-9qcg](https://github.com/advisories/GHSA-vfpm-58rq-9qcg) |
| vite-plugin-pwa | 1.3.0 → 1.3.0 | `node_modules/vite-plugin-pwa` | workbox-build |
| vitest | 4.1.11 → 4.1.12 | `node_modules/vitest` | @vitest/mocker |
| workbox-build | 7.4.1 → 7.4.1 | `node_modules/workbox-build` | @rollup/plugin-node-resolve, glob |
| zod | 4.4.3 → 4.6.7 | `node_modules/zod` | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) |

## Atualizações dirigidas e compatibilidade

- Vite 8.2.1 → 8.3.6: correções de dev server/launch-editor; piso declarado `^8.3.6`, mesma major. [Release do mantenedor](https://github.com/vitejs/vite/releases/tag/v8.3.6).
- Vitest 4.1.11 → 4.1.12: os dois advisories de mocker, incluindo Windows. Piso `^4.1.12`; seus módulos internos seguem a versão exata do pai. [Release](https://github.com/vitest-dev/vitest/releases/tag/v4.1.12).
- `vite-plugin-pwa@1.3.0` aceita Vite `^8.0.0`; Vitest 4.1.12 também. Nenhuma migração para Vitest 5 ou plugin PWA 2.
- Transitivos atualizados **no lockfile, dentro das faixas dos pais existentes**: brace-expansion 5.0.9 → 5.0.12 e 2.1.4 → 2.1.7; fast-uri 3.1.5 → 3.1.9; serialize-javascript 7.1.0 → 7.1.4; source-map-js 1.2.1 → 1.2.2; undici 8.10.0 → 8.12.4; zod 4.4.3 → 4.6.7.
- Caminhos: brace-expansion ← minimatch/ESLint e filelist/Workbox; fast-uri ← ajv/Workbox; serialize-javascript ← plugin-terser/Workbox; source-map-js ← PostCSS/Tailwind/jsdom; undici ← jsdom; zod ← eslint-plugin-react-hooks.
- Vite atualiza seu grafo (Rolldown 1.2.3 → 1.2.16/bindings e OXC); PostCSS 8.5.26 → 8.5.32, picomatch, nanoid e a cadeia Vitest também avançaram como resultado da resolução dos pais. Todas as mudanças de versões são ascendentes e restritas ao grafo dev; dependências de runtime preservadas.
- Comandos: `npm update --package-lock-only --ignore-scripts --no-audit --no-fund vite vitest brace-expansion fast-uri serialize-javascript source-map-js undici zod`, seguido de `npm ci --no-audit --no-fund`.
- Sem `audit fix`, `--force`, overrides, faixas major incompatíveis ou downgrades automáticos. O lockfile e o piso dos dois pais diretos são versionados.
- A junction de node_modules compartilhada foi guardada fora do worktree; a instalação de teste agora é própria deste candidato. O checkout principal não teve suas dependências alteradas.

## Investigação separada e risco residual — NÃO ACEITO

### minimatch (moderado)

`eslint@10.3.0 → minimatch@10.2.5`; também `eslint → @eslint/config-array@0.23.5 → minimatch`
e `vite-plugin-pwa → workbox-build → glob → minimatch`.
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249): amplificação/DoS, faixa >=7 <11.0.1, corrigido em 11.0.1.
A versão 5.1.9 sob filelist é outra instalação e não pertence a essa faixa.
Verificados registry/latest e metadados dos pais: ESLint 10.14.0 ainda exige `^10.2.6`; config-array 0.23.5 exige `^10.2.4`; glob 11 exige `^10.1.1`.
A última publicação da major 10 é 10.2.6, também dentro da faixa do advisory: atualizar para ela ou para ESLint 10.14 não encerra o risco.
Não se injeta minimatch 11 por override. Padrões de lint/precache deste projeto são definidos no repositório; PRs maliciosos, arquivos/árvores não confiáveis e execução de build não confiável continuam sendo superfícies relevantes.

Alternativas pendentes: versão dos pais que suporte a major corrigida; backport oficial compatível; mudança de ferramenta revisada em escopo próprio.
A sugestão de ESLint 9.39.5 do audit é downgrade e não foi aplicada; não resolveria, por si só, a cadeia PWA.

### glob (moderado)

`vite-plugin-pwa@1.3.0 → workbox-build@7.4.1 → glob@11.1.0`.
[GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4): cancelamento AbortSignal não interrompe caminhada assíncrona; versões >=9 <=14.0.1, corrigido em 14.0.2.
Workbox aceita `^11.0.1`, e 11.1.0 é a última major 11 publicada. PWA 2.0.0 ainda depende de Workbox `^7.4.1`, então essa atualização major não elimina a causa.
Em `workbox-build/build/lib/get-file-details.js`, o caminho inspecionado usa `globSync`, sem AbortSignal. Isso limita a pertinência do vetor descrito naquele caminho, mas não é isenção de segurança nem aceite.
Alternativas: atualização/backport do Workbox para glob corrigido; troca do gerador de SW com testes de equivalência; fork revisado em tarefa própria. Não forçar glob 14 sob um pai que só declara 11.

### deepmerge (baixo)

`vite-plugin-pwa → workbox-build → @rollup/plugin-node-resolve@16.0.3 → deepmerge@4.3.1`.
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4): prototype poisoning nos objetos retornados; >=4.2.0 <=4.3.1, **sem versão corrigida publicada**.
O registry ainda tem 4.3.1 como latest; plugin-node-resolve 16.0.3 exige `^4.2.2`.
O uso é na mescla de opções de build do plugin, não em payload financeiro; configurações/objetos não confiáveis continuam sendo risco.
Alternativas: correção upstream e nova versão compatível; remoção/substituição dessa dependência no pai com revisão; fork/backport analisado e testado separadamente.
Não instalar versões antigas só por estarem fora da faixa citada. O downgrade PWA 1.1.0 sugerido pelo audit não foi aplicado.

Os nove pacotes residuais são: minimatch, glob, deepmerge, @eslint/config-array, eslint, @eslint/js, @rollup/plugin-node-resolve, workbox-build e vite-plugin-pwa.
**GATE de liberação pendente:** correção compatível ou decisão explícita do responsável sobre cada risco residual, com prazo/mitigações. Não há aceite implícito, nem autorização para merge/deploy.

## Validação

- Instalação limpa do lockfile, sem scripts de correção/override; verificação de versões sem downgrade e `npm ls` sem árvore inválida.
- `npm test`: 135/135 em 26 arquivos, incluindo App → Dashboard para caixa null/reconciliado, hotfix de combustível, orçamento futuro e sincronização offline.
- `npm run lint`: zero erros, 11 avisos preexistentes; nenhum novo aviso.
- `npm run build`: Vite 8.3.6, generateSW, `sw.js`, `workbox-9c191d2f.js`, 39 entradas/1932,65 KiB. Permanece chunk >500 kB.
- Precache: arquivos existem; Cobranças, Dashboard, Configurações, Investimentos, CalculadoraCompra e AvisoTaxasBcb presentes.
- Smoke local Chrome desktop 1366 px e móvel emulado 390 px: **build real anterior → novo build**, sem marcador artificial no SW, `controllerchange` e novo chunk cacheado.
- Novo chunk principal `assets/index-KYo5uW32.js`; SHA-256 do SW anterior `691c63db07cd4313a0ba0084edd9fc3a7363bf6dca12a57e357954add6e5edc9`; novo `60652b26540ab1205e188f7b695af5b448b1ec6870833aa2c355dbb41c4078d8`.
- Fila sintética criada pelas funções reais de offlineQueue: dois lotes de contas A/B, duas parcelas no lote A, tentativas/estado/erro preenchidos e um item legado sem dono. Snapshot integral antes/depois idêntico; A/B só listam seus próprios lotes e legado continua em quarentena.
- Recarregamento com rede desabilitada via emulação do Chrome: app shell disponível, IndexedDB idêntica. Após o teste, somente os três registros sintéticos foram removidos; perfis temporários encerrados/removidos, servidor local fechado.
- API externa bloqueada por CSP; nenhuma chamada ou escrita em API/banco/prod. Fontes `src/`, configuração PWA e regras financeiras sem diff.
- Roteiro local: `../fincontrole-hml-local/smoke-pwa-security-pr1.cjs`, helper Chrome dedicado; baseline gerado por npm ci/build do lockfile anterior, cópia `web-pr1-build-before-20261105`. Artefatos de laboratório fora do Git.
- CI: publicar somente na branch existente do PR #1, sem force-push. Conferir o checkout do merge sintético nos logs; sucesso de testes/build não encerra o risco residual.
