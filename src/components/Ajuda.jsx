import React, { useState } from 'react';
import {
    HelpCircle, ChevronDown, LayoutDashboard, Wallet, Repeat, HandCoins, Handshake,
    CreditCard, PiggyBank, Target, TrendingUp, Bike, Users, PlayCircle
} from 'lucide-react';

/**
 * @component SecaoFAQ
 * @description Bloco em acordeão com as perguntas frequentes de um módulo específico.
 */
const SecaoFAQ = ({ Icone, titulo, perguntas }) => {
    const [aberta, setAberta] = useState(false);
    const [perguntaAberta, setPerguntaAberta] = useState(null);

    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
            <button
                type="button"
                onClick={() => setAberta(!aberta)}
                className="w-full flex items-center justify-between p-4 md:p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0">
                        <Icone className="w-4.5 h-4.5" strokeWidth={2} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base text-left">{titulo}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${aberta ? 'rotate-180' : ''}`} strokeWidth={2.25} />
            </button>

            {aberta && (
                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {perguntas.map((p, i) => (
                        <div key={i}>
                            <button
                                type="button"
                                onClick={() => setPerguntaAberta(perguntaAberta === i ? null : i)}
                                className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                            >
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{p.q}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${perguntaAberta === i ? 'rotate-180' : ''}`} strokeWidth={2.25} />
                            </button>
                            {perguntaAberta === i && (
                                <p className="px-4 pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed animate-fade-in">{p.a}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * @file src/components/Ajuda.jsx
 * @description Central de Ajuda: reabre o tour de boas-vindas e traz um FAQ detalhado por módulo,
 * incluindo módulos condicionais (Garagem, Administração) conforme as permissões do usuário.
 */
export function Ajuda({ temGaragem, isAdmin, abrirTutorial }) {
    const secoes = [
        {
            Icone: LayoutDashboard,
            titulo: 'Dashboard',
            perguntas: [
                { q: 'O que significa cada card do topo?', a: '"Rendas Pagas" e "Gastos (Real)" mostram o que já entrou/saiu efetivamente da conta. "Investimentos" são os aportes já efetivados. "Faturas Abertas" é a soma dos gastos de crédito ainda pendentes. "Saldo Líquido" é o dinheiro que deve estar na sua conta agora. "Previsão Mês" projeta como o mês deve fechar, considerando o que ainda falta receber e pagar.' },
                { q: 'Por que meu Saldo Líquido mudou sem eu lançar nada?', a: 'O Saldo Líquido considera o saldo acumulado dos meses anteriores (pode desligar isso no botão "+ Mês Ant." do card). Marcar uma pendência antiga como paga, ou reverter um pagamento, também recalcula o valor na hora.' },
                { q: 'O que é o "Radar de Vencimentos"?', a: 'Mostra o que vence nos próximos 7 dias: contas fixas, dívidas e faturas de cartão fechadas. As faturas de cartão já descontam eventuais reembolsos pendentes do mesmo cartão.' },
                { q: 'Como funciona a Meta por categoria?', a: 'Defina o limite em "Metas & Categorias". No Dashboard, clique em uma categoria pra ver a análise: quanto já gastou, sua média por transação, e uma previsão de fechamento do mês no ritmo atual.' }
            ]
        },
        {
            Icone: Wallet,
            titulo: 'Lançamentos',
            perguntas: [
                { q: 'Qual a diferença entre "Novo Lançamento" e "Extrato"?', a: '"Novo Lançamento" é o formulário de cadastro. "Extrato" é a lista de tudo já lançado no mês, com filtros, busca e ações em massa (marcar como pago, excluir).' },
                { q: 'Como funciona uma compra parcelada?', a: 'Informe o número de parcelas no lançamento — o sistema cria uma transação por parcela, já na competência (mês) correta, considerando o fechamento do cartão se for crédito.' },
                { q: 'Como divido uma despesa com outra pessoa?', a: 'Marque "Compra para terceiro" e informe o nome e o valor que cabe à outra pessoa. Sua parte é automaticamente abatida no orçamento, e o valor do terceiro aparece em "A Receber".' },
                { q: 'O que é "Reembolso"?', a: 'Use quando um valor volta pra você (ex: estorno de compra). Ele abate do total de gastos do mês, em vez de somar.' },
                { q: 'Consigo anexar comprovante?', a: 'Se o seu perfil tiver essa permissão liberada por um administrador, aparece a opção de anexar um arquivo (PDF ou imagem) a cada lançamento.' }
            ]
        },
        {
            Icone: CreditCard,
            titulo: 'Cartões de Crédito',
            perguntas: [
                { q: 'O que é "Dia de Fechamento"?', a: 'É o dia em que a fatura fecha. Compras feitas a partir desse dia entram na fatura do mês seguinte automaticamente — o sistema calcula isso sozinho ao gerar contas fixas, dívidas e lançamentos recorrentes.' },
                { q: 'Como pago uma fatura?', a: 'No Dashboard, abra "Gastos no Crédito" e clique em "Pagar Fatura" no cartão desejado — isso marca todas as transações pendentes daquele cartão, no mês, como pagas de uma vez.' },
                { q: 'Por que um lançamento aparece como "Cartão Excluído/Desconhecido"?', a: 'Isso acontece só quando o cartão usado naquele lançamento foi realmente excluído do cadastro. Se o cartão ainda existe e mesmo assim aparece assim, pode reportar — é um sinal de bug.' }
            ]
        },
        {
            Icone: Repeat,
            titulo: 'Contas Fixas e Dívidas',
            perguntas: [
                { q: 'Contas Fixas e Dívidas geram lançamentos automaticamente?', a: 'Sim. Todo dia de madrugada, e também quando você clica em "Gerar Mês" nas Configurações, o sistema cria os lançamentos do mês corrente pra cada conta fixa e cada parcela de dívida ainda pendente.' },
                { q: 'O valor gerado veio diferente do que eu paguei de verdade — e agora?', a: 'Edite o lançamento já gerado (não o cadastro da conta fixa) e ajuste o valor. O cadastro em Contas Fixas serve só de "molde" pros próximos meses.' },
                { q: 'Dívida de terceiro conta como meu gasto?', a: 'Não. Marcada como dívida de terceiro, ela aparece no seu extrato pra controle, mas não entra no seu Saldo Líquido nem no seu orçamento pessoal — só quando você reembolsar/gastar de fato algo que seja seu.' }
            ]
        },
        {
            Icone: Handshake,
            titulo: 'A Receber (Terceiros)',
            perguntas: [
                { q: 'Pra que serve essa tela?', a: 'Reúne, por pessoa, tudo que ela te deve — seja de uma compra dividida (Lançamentos) ou de uma dívida cadastrada em nome dela.' },
                { q: 'Como eu cobro alguém por aqui?', a: 'Use o botão de WhatsApp em cada cobrança pra montar uma mensagem automática com o resumo do valor devido.' }
            ]
        },
        {
            Icone: PiggyBank,
            titulo: 'Rendas Fixas',
            perguntas: [
                { q: 'Rendas Fixas é a mesma coisa que uma Renda comum?', a: 'É o cadastro de uma renda recorrente (salário, aluguel recebido). O sistema lança automaticamente todo mês na data configurada — se o valor variar, edite o lançamento já gerado.' }
            ]
        },
        {
            Icone: Target,
            titulo: 'Metas & Categorias',
            perguntas: [
                { q: 'Toda categoria precisa ter meta?', a: 'Não. Categorias sem meta definida (ou com meta zerada) simplesmente não entram no cálculo de "Verba Restante das Metas" na Previsão do Mês.' },
                { q: 'Consigo criar subcategorias?', a: 'Sim, ao criar uma categoria você pode vinculá-la a uma categoria-pai já existente.' }
            ]
        },
        {
            Icone: TrendingUp,
            titulo: 'Investimentos',
            perguntas: [
                { q: 'O que são "caixinhas"?', a: 'Representam um investimento específico numa instituição (ex: CDB no banco X). Cada aporte feito é registrado dentro da caixinha correspondente.' }
            ]
        },
        ...(temGaragem ? [{
            Icone: Bike,
            titulo: 'Garagem',
            perguntas: [
                { q: 'O que o módulo Garagem controla?', a: 'Manutenções por quilometragem rodada, abastecimentos e o histórico de cada veículo cadastrado — inclusive veículos emprestados/de terceiros.' },
                { q: 'Como o sistema sabe minha quilometragem atual?', a: 'Você atualiza o odômetro ao registrar um abastecimento ou manutenção; o sistema usa o valor mais recente pra calcular quando a próxima manutenção vence.' }
            ]
        }] : []),
        ...(isAdmin ? [{
            Icone: Users,
            titulo: 'Administração',
            perguntas: [
                { q: 'O que eu consigo fazer como admin?', a: 'Criar novos usuários, resetar senhas, promover/remover administradores e liberar módulos específicos (Garagem, Anexo de Comprovantes) por pessoa.' },
                { q: 'Ao excluir um usuário, os dados dele somem de vez?', a: 'Sim — a exclusão remove em cascata todas as transações, cartões, categorias, dívidas e dados de garagem/investimentos daquele usuário. Não tem como desfazer.' }
            ]
        }] : [])
    ];

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0">
                    <HelpCircle className="w-5.5 h-5.5" strokeWidth={2} />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Central de Ajuda</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tire dúvidas comuns sobre cada módulo do sistema.</p>
                </div>
            </div>

            <button
                type="button"
                onClick={abrirTutorial}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-md transition-colors cursor-pointer active:scale-[0.99]"
            >
                <PlayCircle className="w-5 h-5" strokeWidth={2} /> Ver o tour de boas-vindas de novo
            </button>

            <div className="space-y-3">
                {secoes.map((s, i) => <SecaoFAQ key={i} {...s} />)}
            </div>
        </div>
    );
}
