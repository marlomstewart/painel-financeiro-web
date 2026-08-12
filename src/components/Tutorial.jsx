import React, { useState, useMemo } from 'react';
import {
    X, Sparkles, LayoutDashboard, Wallet, Repeat, HandCoins, Handshake,
    CreditCard, PiggyBank, Target, TrendingUp, Bike, Users, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';

/**
 * @file src/components/Tutorial.jsx
 * @description Tour de boas-vindas exibido no primeiro login (ou sempre que o usuário não marcar
 * "Não mostrar novamente"). Os passos são montados dinamicamente conforme as permissões do usuário
 * (Garagem, Admin), assim como o restante do sistema já faz na Sidebar.
 */
const construirPassos = ({ temGaragem, isAdmin, temComprovante }) => {
    const passos = [
        {
            Icone: Sparkles,
            titulo: 'Bem-vindo(a) ao Financeiro!',
            texto: 'Este é um tour rápido pelas funcionalidades principais. Você pode fechar a qualquer momento e revisitar tudo isso depois, no menu "Ajuda".'
        },
        {
            Icone: LayoutDashboard,
            titulo: 'Dashboard',
            texto: 'Visão geral do mês: rendas pagas, gastos reais, investimentos, faturas abertas, saldo em conta e previsão de fechamento do mês. Clique nos cards para ver o detalhamento de cada valor.'
        },
        {
            Icone: Wallet,
            titulo: 'Lançamentos',
            texto: `Registre despesas, rendas, reembolsos e investimentos em "Novo Lançamento", e acompanhe tudo em "Extrato". Dá pra parcelar e dividir com terceiros${temComprovante ? ', e como você tem a permissão liberada, também anexar comprovante a cada lançamento' : ''}.`
        },
        {
            Icone: CreditCard,
            titulo: 'Cartões de Crédito',
            texto: 'Cadastre seus cartões com dia de fechamento e vencimento. O sistema agrupa automaticamente os gastos em fatura e calcula a competência certa (mês anterior ou seguinte, conforme o fechamento).'
        },
        {
            Icone: Repeat,
            titulo: 'Contas Fixas e Dívidas',
            texto: 'Cadastre contas recorrentes (aluguel, internet) e dívidas parceladas (empréstimos, financiamentos) uma única vez — o sistema gera os lançamentos automaticamente todo mês.'
        },
        {
            Icone: Handshake,
            titulo: 'A Receber (Terceiros)',
            texto: 'Quando você paga algo em nome de outra pessoa (ou divide uma conta), marque como "terceiro" no lançamento. Aqui você acompanha quem te deve e quanto.'
        },
        {
            Icone: PiggyBank,
            titulo: 'Rendas Fixas',
            texto: 'Salário e outras entradas recorrentes, geradas automaticamente todo mês na data de recebimento configurada.'
        },
        {
            Icone: Target,
            titulo: 'Metas & Categorias',
            texto: 'Defina limites de gasto por categoria. O Dashboard te avisa quando você está perto (ou já estourou) o limite, com uma previsão de fechamento do mês no ritmo atual.'
        },
        {
            Icone: TrendingUp,
            titulo: 'Investimentos',
            texto: 'Controle seus aportes em renda fixa (CDB, caixinhas) e acompanhe a rentabilidade por instituição.'
        },
        ...(temGaragem ? [{
            Icone: Bike,
            titulo: 'Garagem',
            texto: 'Módulo liberado pra você: controle de manutenções por quilometragem, abastecimento e histórico dos seus veículos.'
        }] : []),
        ...(isAdmin ? [{
            Icone: Users,
            titulo: 'Administração',
            texto: 'Como administrador, você pode criar usuários, resetar senhas e liberar módulos (Garagem, Comprovantes) para cada pessoa.'
        }] : []),
        {
            Icone: CheckCircle2,
            titulo: 'Pronto pra começar!',
            texto: 'Sempre que tiver dúvida, volte aqui pelo menu "Ajuda" — lá tem esse tour de novo e um FAQ com as perguntas mais comuns.'
        }
    ];
    return passos;
};

export function Tutorial({ visivel, onClose, temGaragem, isAdmin, temComprovante, dispensarTutorial }) {
    const passos = useMemo(() => construirPassos({ temGaragem, isAdmin, temComprovante }), [temGaragem, isAdmin, temComprovante]);
    const [passoAtual, setPassoAtual] = useState(0);
    const [naoMostrarNovamente, setNaoMostrarNovamente] = useState(false);

    if (!visivel) return null;

    const passo = passos[passoAtual];
    const ultimoPasso = passoAtual === passos.length - 1;

    const fechar = () => {
        if (naoMostrarNovamente) dispensarTutorial();
        setPassoAtual(0);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={fechar}></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">

                <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passo {passoAtual + 1} de {passos.length}</span>
                    </div>
                    <button onClick={fechar} className="text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-full p-2 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors cursor-pointer active:scale-95">
                        <X className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center text-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0">
                        <passo.Icone className="w-8 h-8" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{passo.titulo}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{passo.texto}</p>
                </div>

                <div className="flex justify-center gap-1.5 pb-4 shrink-0">
                    {passos.map((_, i) => (
                        <span key={i} className={`h-1.5 rounded-full transition-all ${i === passoAtual ? 'w-5 bg-blue-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700'}`} />
                    ))}
                </div>

                <div className="p-5 md:p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={naoMostrarNovamente}
                            onChange={(e) => setNaoMostrarNovamente(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Não mostrar novamente ao entrar</span>
                    </label>

                    <div className="flex gap-3">
                        {passoAtual > 0 && (
                            <button
                                type="button"
                                onClick={() => setPassoAtual(p => p - 1)}
                                className="flex items-center justify-center gap-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        )}
                        {ultimoPasso ? (
                            <button
                                type="button"
                                onClick={fechar}
                                className="flex-1 flex items-center justify-center gap-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-md active:scale-95"
                            >
                                Concluir
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setPassoAtual(p => p + 1)}
                                className="flex-1 flex items-center justify-center gap-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-md active:scale-95"
                            >
                                Próximo <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
