# Decisões duráveis — Web FinControle

## D-001 — SPA com hooks por domínio e navegação nativa

- **Data:** não confirmada
- **Status:** aceita
- **Contexto:** o projeto é uma SPA React sem roteador externo ou store global.
- **Decisão:** `App.jsx` instancia hooks de domínio e controla tela/URL pela History API.
- **Motivo:** arquitetura existente simples e funcional para o tamanho atual do produto.
- **Consequência:** não introduzir Redux/Context/Zustand em feature pequena; reavaliar apenas em
  refatoração dedicada ao prop-drilling/re-renderização.

## D-002 — Offline opera por lote no IndexedDB

- **Data:** 03/09/2026
- **Status:** aceita
- **Contexto:** parcelas não podem sincronizar parcialmente após perda de rede.
- **Decisão:** tratar a criação offline como lote transacional e parar retries automáticos para
  falhas 4xx permanentes.
- **Motivo:** evita duplicidade, órfãos e tentativas infinitas.
- **Consequência:** a fila depende da aba aberta; não assumir background sync de Service Worker.

## D-003 — Frontend só acessa dados pela API

- **Data:** 02/09/2026
- **Status:** aceita
- **Contexto:** Supabase é banco primário, mas Data API/RLS automáticos não são o modelo adotado.
- **Decisão:** frontend usa `fetch` contra a API autenticada; não adicionar cliente Supabase.
- **Motivo:** regras financeiras, autorização e auditoria permanecem centralizadas no backend.
- **Consequência:** qualquer nova operação financeira exige rota segura na API e testes adequados.

## D-004 — Caixa conciliado não é competência orçamentária

- **Data:** 03/09/2026
- **Status:** aceita
- **Contexto:** o histórico mensal não prova o saldo real disponível no banco.
- **Decisão:** saldo confirmado pelo usuário vira marco de caixa; após ele, lançamentos pagos
  entram pela `data_pagamento`. `mesReferencia` continua para orçamento/fatura.
- **Motivo:** permitir carregar dinheiro real entre meses sem criar lançamento artificial de renda.
- **Consequência:** não alterar esse cálculo para usar competência sem reavaliar a decisão no API.
