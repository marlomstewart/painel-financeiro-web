import { expect, test } from 'vitest';
import { montarLinkWhatsApp } from './whatsappUtils';

const telefone = '5585999990000';
const texto = 'Oi João, tudo bem? ✌️\n🛍 Revisão da moto\n💵 R$ 124,22\n🗓 10/10\n💰 Total\nChave PIX: chave-de-teste 🚀';

test.each([
    ['Windows', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, false],
    ['macOS', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' }, false],
    ['Linux', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' }, false],
    ['Android', { userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile' }, true],
    ['iPhone', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS)' }, true],
    ['iPad', { userAgent: 'Mozilla/5.0 (iPad; CPU OS)' }, true],
    ['client hints mobile', { userAgentData: { mobile: true } }, true],
    ['client hints desktop', { userAgentData: { mobile: false } }, false],
    ['agente desconhecido', {}, false],
])('link de %s preserva emojis, acentos e quebras de linha sem dupla codificação', (_, navegador, movel) => {
    const link = montarLinkWhatsApp(telefone, texto, navegador);
    const url = new URL(link);

    expect(url.origin).toBe(movel ? 'https://wa.me' : 'https://web.whatsapp.com');
    expect(url.pathname).toBe(movel ? `/${telefone}` : '/send/');
    if (!movel) expect(url.searchParams.get('phone')).toBe(telefone);
    expect(url.searchParams.get('text')).toBe(texto);
    expect(link).not.toContain('%EF%BF%BD');
    expect(link).not.toContain('%25F0');
});
