# Manual operacional — Web FinControle

## Objetivo e escopo

SPA PWA multiusuário do FinControle. Consome exclusivamente a API Node/Express do repositório
irmão `painel-financeiro-api`; não acessa Supabase diretamente.

## Stack e estrutura

- React 19, Vite, Tailwind, PWA e `fetch` com JWT em `localStorage`.
- `src/App.jsx`: raiz, estado de navegação pela History API e composição dos hooks.
- `src/hooks/`: estado por domínio; `useDashboard`, `useTransacoes`, `useAuth` e
  `useOfflineSync` são os mais sensíveis.
- `src/components/`: telas e componentes de interface.
- `src/utils/offlineQueue.js`: fila IndexedDB para lotes offline; `src/utils/cartaoUtils.js`:
  interpretação segura de cartão.
- Referências canônicas de infraestrutura/regras ficam no repositório API em
  `docs/INFRAESTRUTURA.md` e `docs/REGRAS_DE_NEGOCIO.md`.

## Comandos

```bash
npm install
npm run dev
npm test
npm run build
npm run lint
```

CI executa testes e build. O lint possui débitos existentes; ao alterar arquivos, corrija erros
novos e não esconda problemas globais sem investigação separada.

## Regras e segurança que não podem ser quebradas

- Nunca expor token, senha, URI ou valores do `.env`; `VITE_*` é público no bundle.
- O frontend não deve falar diretamente com Supabase nem confiar só em validação visual: regras e
  autorização pertencem à API.
- Use `utils/cartaoUtils.js`, nunca `split('_')`, para `credito_<id>`.
- Compras divididas distinguem valor total do banco e fração pessoal; preserve
  `terceiro_recebido` como estado independente de `status`.
- Fila offline envia todas as parcelas como um lote e não deve fazer retry infinito de erro 4xx
  permanente.
- Caixa após saldo conciliado usa `data_pagamento`; competência continua sendo `mesReferencia`.

## Contexto para novas sessões

Antes de uma alteração significativa:

1. Leia este arquivo e `PROJECT_STATE.md`.
2. Consulte `DECISIONS.md` somente nas áreas relacionadas à tarefa.
3. Verifique `git status`.
4. Investigue apenas os módulos necessários ao objetivo atual.

Não trate chats anteriores como fonte permanente de verdade: código e documentação versionada são
a fonte principal. Evite ler o repositório inteiro, imprimir arquivos/logs enormes ou repetir
contexto já documentado quando uma investigação direcionada bastar.

Use chats separados por objetivo (feature, bug complexo, refatoração, integração, mudança
arquitetural, investigação ou release). Tarefas pequenas do mesmo objetivo podem continuar no
chat; ao mudar substancialmente de objetivo, abra novo chat e retome pelo repositório.

## Manutenção da memória

- Após alteração relevante, atualize `PROJECT_STATE.md` como snapshot, removendo o obsoleto.
- Registre em `DECISIONS.md` somente decisões técnicas duráveis; não use-o como changelog.
- Mantenha este `AGENTS.md` curto e estável, sem histórico do projeto.
- Faça checkpoint em etapa grande, decisão arquitetural, troca de objetivo ou antes de compactação:
  valide código, atualize estado, registre decisão se necessário, remova obsoletos e deixe o
  próximo passo explícito.
