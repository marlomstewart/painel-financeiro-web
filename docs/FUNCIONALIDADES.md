# Funcionalidades — o que o sistema faz, na visão de quem usa

Este documento descreve o Fincontrole do ponto de vista de uso — o que cada tela oferece, sem
entrar em código. Para a lógica interna por trás de cada comportamento, veja
[`REGRAS_DE_NEGOCIO.md`](https://github.com/marlomstewart/painel-financeiro-api/blob/main/docs/REGRAS_DE_NEGOCIO.md)
no repositório da API. Para a documentação técnica, veja o [`README.md`](../README.md).

## Login e primeiro acesso

- Acesso por usuário e senha, criados por um administrador (não há autocadastro).
- Usuários novos são obrigados a trocar a senha no primeiro login, com regra de senha forte
  (mínimo 12 caracteres, maiúscula, minúscula, número e caractere especial).
- No primeiro login (ou sempre que "Não mostrar novamente" não foi marcado), aparece um **tour de
  boas-vindas** passo a passo, adaptado aos módulos que você tem liberados (Garagem, Admin).
  Pode ser revisto a qualquer momento pelo menu **Ajuda**.

## Dashboard

- Visão geral do mês: quanto já entrou (rendas pagas), quanto já saiu (gastos reais), quanto foi
  investido, o total de faturas de cartão ainda em aberto, o saldo que deve estar na conta agora,
  e uma previsão de como o mês deve fechar.
- Cada card é clicável e abre o detalhamento de quais lançamentos formam aquele valor.
- **Raio-X por categoria**: clicando numa categoria com meta definida, mostra quanto já foi
  gasto/investido, sua média por transação, o maior e o menor lançamento, e uma previsão em texto
  ("no ritmo atual, você vai fechar o mês gastando X a mais que sua meta").
- **Radar de Vencimentos**: destaca contas, dívidas e faturas de cartão que vencem nos próximos 7
  dias.
- Opção de somar (ou não) o saldo acumulado dos meses anteriores ao saldo do mês atual.
- Se houver lançamentos pendentes de meses passados, um aviso permite "importar" esses valores
  pro mês atual de uma vez.

## Lançamentos (Novo Lançamento / Extrato)

- Cadastro de despesas, rendas, reembolsos e investimentos, com data, categoria e forma de
  pagamento (PIX/débito ou um cartão específico).
- Suporte a **parcelamento**: informando o número de parcelas, o sistema já cria todos os
  lançamentos futuros na competência correta.
- Suporte a **compra dividida com terceiro**: marcando essa opção, você informa quem é a pessoa e
  quanto da compra é dela — só a sua parte entra no seu orçamento pessoal, e o valor da outra
  pessoa aparece automaticamente em "A Receber".
- **Anexo de comprovante** (foto ou PDF) — disponível só para usuários com essa permissão
  liberada por um administrador.
- O Extrato lista tudo do mês, com busca, filtros avançados (categoria, forma de pagamento, faixa
  de valor/data), ordenação por coluna, e ações em lote (marcar várias transações como pagas,
  pendentes, ou excluir de uma vez).

## Cartões de Crédito

- Cadastro de cartões com nome, limite, dia de fechamento e dia de vencimento.
- Compras no crédito são automaticamente agrupadas em "faturas" por cartão e mês — o sistema
  já calcula se uma compra feita perto do fim do mês entra na fatura atual ou na próxima,
  baseado no dia de fechamento cadastrado.
- Botão **"Pagar Fatura"** marca de uma vez todos os lançamentos pendentes daquele cartão no mês
  como pagos.
- Mostra limite disponível em tempo real (limite total menos gastos do mês).

## Contas Fixas e Rendas Fixas

- Cadastre uma vez despesas recorrentes (aluguel, internet) ou entradas recorrentes (salário) —
  nome, valor padrão e dia de vencimento/recebimento.
- O sistema gera sozinho o lançamento correspondente todo mês, automaticamente.
- Se o valor real de um mês for diferente do padrão (ex: salário com desconto extra), edite o
  **lançamento já gerado no extrato**, não o cadastro — o cadastro é só o "molde" pros próximos
  meses, editar ele não muda lançamentos que já existem.

## Dívidas

- Cadastro de empréstimos e financiamentos parcelados, com valor da parcela, quantidade de
  parcelas e dia de vencimento.
- Suporte a **dívida de terceiro** ("nome sujo") — quando você empresta dinheiro ou assume uma
  dívida em nome de outra pessoa, ela é marcada como tal e some do seu controle financeiro
  pessoal, aparecendo só como algo a cobrar em "A Receber".
- Acompanha visualmente o progresso de pagamento (quantas parcelas já foram pagas de quantas no
  total).

## A Receber (Terceiros)

- Reúne, por pessoa, tudo que ela te deve — seja de uma compra dividida no cartão/PIX, seja de
  uma dívida cedida em nome dela.
- Mostra o total pendente, o que já foi pago, e o detalhamento item a item.
- Se você cadastrou o WhatsApp da pessoa (no lançamento da compra dividida ou no cadastro da
  dívida), o botão de cobrança **abre o WhatsApp direto**, já com a mensagem pronta (itens do mês,
  valor total e sua chave PIX, se você tiver cadastrado uma em Configurações). Sem telefone
  cadastrado, ele copia o texto pra área de transferência pra você colar onde preferir.

## Metas & Categorias

- Crie categorias de despesa, renda ou investimento, com uma meta opcional.
- Categoria sem meta é só organizacional. Com meta, ela passa a ser acompanhada no Dashboard
  (rotulada "Teto" para despesas, "Alvo" para investimentos/rendas) e entra na previsão de
  fechamento do mês.
- Categorias podem ser marcadas como "relacionadas à Garagem" (se o módulo estiver liberado),
  fazendo o lançamento pedir o veículo e a quilometragem.

## Investimentos

- Organize aportes em renda fixa por "caixinha" (cada uma representa uma instituição/fundo, com
  seu próprio percentual do CDI).
- O sistema calcula automaticamente, em tempo real, quanto cada aporte já rendeu (usando o CDI
  atual, buscado do Banco Central), descontando IOF (se resgatado em menos de 30 dias) e Imposto
  de Renda regressivo (conforme o tempo de aplicação).
- Este módulo funciona de forma **independente** do extrato de lançamentos — não é preciso (nem
  possível hoje) lançar um aporte como despesa e vinculá-lo a uma caixinha automaticamente.

## Garagem (módulo opcional, liberado por administrador)

- Cadastro de veículos **próprios** (com ano, quilometragem atual) ou **convidados/emprestados**
  (só pra organizar gastos eventuais, sem rastrear km ou peças).
- Controle de manutenção por item (pneus, óleo, etc.), cada um com um intervalo de km — o sistema
  avisa visualmente (barra de progresso e alertas) quando está perto ou já passou do intervalo.
  **Você precisa atualizar a quilometragem atual manualmente** de vez em quando; o sistema não
  descobre isso sozinho pelos lançamentos.
- Histórico de manutenções realizadas, por veículo.
- Calendário de "dias não rodados": pra quem tem um veículo com padrão fixo de uso (ex: só anda de
  segunda, quarta e sexta), marcar um dia excepcional (que não rodou, ou que rodou fora do
  padrão) ajusta automaticamente a meta de gastos com combustível daquele mês.
- Excluir um veículo não apaga o histórico financeiro dele no extrato.

## Configurações

- Editar nome de exibição e nome completo.
- Cadastrar sua chave PIX, usada automaticamente na mensagem de cobrança em "A Receber".
- Trocar senha.
- Vincular sua conta a um bot do Telegram, pra receber alertas de vencimento automaticamente.
- Exportar seus lançamentos em CSV.
- Disparar manualmente a geração dos lançamentos do mês (normalmente acontece sozinho de
  madrugada, mas dá pra forçar na hora).

## Ajuda

- Central de perguntas frequentes, organizada por módulo, incluindo os módulos condicionais que
  você tem liberados.
- Atalho pra rever o tour de boas-vindas a qualquer momento.

## Administração (só para administradores)

- Criar novos usuários, resetar senhas, promover/remover outros administradores.
- Liberar ou revogar, por pessoa, o acesso ao módulo Garagem e à permissão de anexar
  comprovantes.
- Excluir um usuário — ação irreversível, remove todos os dados dessa pessoa do sistema.
