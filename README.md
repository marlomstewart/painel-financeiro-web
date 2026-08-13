# painel-financeiro-web

Frontend do **Fincontrole**, um painel de controle financeiro pessoal multiusuário. Cada pessoa
loga com sua própria conta e enxerga só os próprios dados — despesas, rendas, cartões, dívidas,
investimentos e (opcionalmente) um módulo de garagem/veículos.

Em produção, roda em **[fincontrole.online](https://fincontrole.online)**, hospedado na Vercel.

Este README documenta o frontend. Para o backend, veja o README do repositório
[`painel-financeiro-api`](https://github.com/marlomstewart/painel-financeiro-api). Para como o
sistema inteiro está hospedado (domínio, DNS, monitoramento, backup), veja
[`INFRAESTRUTURA.md`](https://github.com/marlomstewart/painel-financeiro-api/blob/main/docs/INFRAESTRUTURA.md)
no repositório da API.

## Stack

- **React 19** + **Vite** — SPA, sem roteamento por URL (a navegação entre telas é controlada por
  estado no `App.jsx`, não por `react-router`).
- **Tailwind CSS** (via `@tailwindcss/vite`) — estilização utilitária, com suporte a tema claro/escuro.
- **lucide-react** — ícones.
- Consome a API via `fetch`, autenticado por token JWT guardado no `localStorage`.

## Rodando localmente

```bash
npm install
```

Crie um arquivo `.env` na raiz (não versionado) apontando para a API que você quer usar:

```
VITE_API_URL=http://localhost:3000/api
```

```bash
npm run dev
```

Abre em `http://localhost:5173`. Para apontar para a API de produção em vez de uma local, troque
o valor de `VITE_API_URL` — mas lembre que a API em produção restringe CORS a domínios específicos
(veja `server.js` no repo da API), então testar contra produção só funciona se `localhost:5173`
estiver na lista de origens permitidas.

## Estrutura de pastas

```
src/
├── App.jsx              # raiz: login, carregamento inicial, roteamento por estado (telaAtiva)
├── components/          # uma tela ou peça de UI por arquivo (ver tabela de módulos abaixo)
├── hooks/                # um hook por domínio de dados (useAuth, useTransacoes, useDashboard...)
└── utils/
    └── cartaoUtils.js    # extração do id do cartão a partir de formaPagamento ("credito_<id>")
```

Não há Redux/Context API global — cada hook em `hooks/` encapsula seu próprio estado (`useState`)
e é instanciado uma vez em `App.jsx`, que repassa os dados e funções como props pros componentes.

## Módulos (o que cada tela faz)

| Tela | Arquivo | Resumo |
|---|---|---|
| Dashboard | `Dashboard.jsx` + `useDashboard.jsx` | Visão geral do mês: rendas pagas, gastos reais, investimentos, faturas abertas, saldo em conta, previsão de fechamento do mês, alertas de vencimento (`AlertasDashboard.jsx`) |
| Lançamentos | `Lancamentos.jsx` + `useTransacoes.jsx` | Cadastro e extrato de despesas/rendas/reembolsos/investimentos. Suporta parcelamento, divisão com terceiros e anexo de comprovante (se liberado) |
| Cartões de Crédito | `Cartoes.jsx` + `useCartoesFaturas.jsx` | Cadastro de cartões (dia de fechamento/vencimento/limite) e agrupamento automático de gastos em fatura |
| Contas Fixas | `ContasFixas.jsx` | Despesas recorrentes (aluguel, internet) — geradas automaticamente todo mês pelo motor no backend |
| Dívidas | `Dividas.jsx` | Empréstimos/financiamentos parcelados, incluindo dívidas registradas em nome de terceiros |
| A Receber (Terceiros) | `Cobrancas.jsx` | Consolidado do que cada pessoa deve (de compras divididas ou dívidas de terceiros), com atalho pra cobrar via WhatsApp |
| Rendas Fixas | `RendasFixas.jsx` | Entradas recorrentes (salário), geradas automaticamente todo mês |
| Metas & Categorias | `MetasCategorias.jsx` | Limites de gasto por categoria, usados na previsão do Dashboard |
| Investimentos | `Investimentos.jsx` + `useInvestimentos.jsx` | Aportes em renda fixa, organizados por "caixinha"/instituição |
| Garagem | `Garagem.jsx` + `useGaragem.jsx` | **Condicional** (`temGaragem`): manutenção por km, abastecimento e histórico de veículos |
| Configurações | `Configuracoes.jsx` | Perfil, troca de senha, vínculo com Telegram, exportação CSV, geração manual do mês |
| Tutorial / Ajuda | `Tutorial.jsx` / `Ajuda.jsx` | Tour de boas-vindas (condicional por permissão) e central de FAQ por módulo |
| Administração | `Admin.jsx` | **Condicional** (`isAdmin`): CRUD de usuários, liberar/revogar módulos por pessoa |

## Conceitos importantes pra entender o código

- **"Minha fração" vs "Total da conta"**: em compras divididas com terceiros, o sistema mantém
  duas contas paralelas — o valor **integral** (o que realmente saiu/entrou da conta bancária) e a
  **fração que é sua** (`getMeuValor()` em `useDashboard.jsx`, abate `thirdPartyValue`). O
  Dashboard usa as duas, em cards diferentes.
- **Permissões por usuário**: `temGaragem`, `temComprovante` e `isAdmin` vêm do token JWT no login
  (`useAuth.jsx`) e controlam o que aparece na Sidebar, no Tutorial e na Central de Ajuda. Um
  administrador libera essas flags por usuário na tela de Admin.
- **`formaPagamento` e `cartao_id`**: pagamentos no crédito são guardados como a string
  `"credito_<id-do-cartão>"` no campo `formaPagamento`. Use sempre os helpers de
  `utils/cartaoUtils.js` (`ehPagamentoCredito`, `extrairCartaoId`, `resolverCartao`, `nomeCartao`)
  pra ler esse valor — nunca faça `split('_')` manual (o id do cartão pode conter underscore).

## Deploy

Hospedado na **Vercel** (plano Hobby/free), branch `main` = produção. A variável de ambiente
`VITE_API_URL` (Vercel → Settings → Environment Variables) precisa ser atualizada e o projeto
**redeployado** manualmente sempre que ela mudar — a Vite embute esse valor no bundle no momento
do build, não em tempo de execução.

Domínio customizado: `fincontrole.online` (e `www.fincontrole.online`), DNS gerenciado na
Hostinger. Detalhes completos em
[`INFRAESTRUTURA.md`](https://github.com/marlomstewart/painel-financeiro-api/blob/main/docs/INFRAESTRUTURA.md).
