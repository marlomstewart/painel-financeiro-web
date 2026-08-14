import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Sentry from './sentry.js'
import './index.css'
import App from './App.jsx'

/**
 * @function TelaDeErro
 * @description Fallback exibido pelo Sentry.ErrorBoundary quando um erro de renderização derruba
 * a árvore do React. Antes disso não existia — um erro assim deixava a tela em branco, sem
 * nenhuma pista pro usuário do que aconteceu.
 */
const TelaDeErro = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#0b1120] p-6">
    <div className="max-w-sm text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8">
      <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Algo deu errado</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Encontramos um erro inesperado nesta tela. Já fomos notificados automaticamente — tente recarregar a página.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition cursor-pointer"
      >
        Recarregar
      </button>
    </div>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<TelaDeErro />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
