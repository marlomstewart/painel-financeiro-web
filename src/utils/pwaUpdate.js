const CHAVE_RECARREGAMENTO_CHUNK = 'fincontrole:pwa:chunk-reload';

export const ehFalhaDeChunk = (erro) => {
  const mensagem = String(erro?.message || erro || '');
  return /failed to fetch dynamically imported module|importing a module script failed|loading chunk .* failed|chunkloaderror|unable to preload css/i.test(mensagem);
};

export const recarregarPorChunkDesatualizado = (erro, ambiente = window) => {
  if (!ehFalhaDeChunk(erro)) return false;

  const rota = `${ambiente.location.pathname}${ambiente.location.search}${ambiente.location.hash}`;
  if (ambiente.sessionStorage.getItem(CHAVE_RECARREGAMENTO_CHUNK) === rota) return false;

  ambiente.sessionStorage.setItem(CHAVE_RECARREGAMENTO_CHUNK, rota);
  ambiente.location.reload();
  return true;
};

export const instalarRecargaPorPreloadDoVite = (ambiente = window) => {
  const tratarPreload = (evento) => {
    if (!recarregarPorChunkDesatualizado(evento.payload, ambiente)) return;
    evento.preventDefault();
  };

  ambiente.addEventListener('vite:preloadError', tratarPreload);
  return () => ambiente.removeEventListener('vite:preloadError', tratarPreload);
};
