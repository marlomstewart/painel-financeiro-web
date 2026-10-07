/** Evita a página intermediária de wa.me no desktop, que pode corromper emojis. */
export function montarLinkWhatsApp(telefone, texto, navegador = globalThis.navigator) {
    const dispositivoMovel = navegador?.userAgentData?.mobile === true
        || /Android|iPhone|iPad|iPod/i.test(navegador?.userAgent || '');
    const textoCodificado = encodeURIComponent(texto);

    return dispositivoMovel
        ? `https://wa.me/${telefone}?text=${textoCodificado}`
        : `https://web.whatsapp.com/send/?phone=${telefone}&text=${textoCodificado}`;
}
