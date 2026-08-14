/**
 * @file src/sentry.js
 * @description Inicializa o Sentry (monitoramento de erro) o mais cedo possível, antes do React
 * montar. Sem performance tracing e sem Session Replay de propósito — nenhum dos dois vem
 * habilitado por padrão no SDK, e não adicionamos aqui: é um app financeiro, e captura de tela ou
 * corpo de requisição por padrão poderia vazar valor de transação, descrição de gasto ou nome de
 * terceiro numa cobrança.
 */
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;
const ambiente = import.meta.env.PROD ? 'producao' : 'desenvolvimento';

if (dsn) {
    Sentry.init({
        dsn,
        environment: ambiente,
        sendDefaultPii: false,
        beforeBreadcrumb(breadcrumb) {
            // Descarta breadcrumbs de console — evita que um log de depuração esquecido em
            // algum componente vaze dado sensível junto do erro reportado.
            if (breadcrumb.category === 'console') return null;
            return breadcrumb;
        },
    });
    console.log(`🛰️ Sentry inicializado (ambiente: ${ambiente}).`);
} else {
    console.log('ℹ️ VITE_SENTRY_DSN não configurado — monitoramento de erro desativado.');
}

export default Sentry;
