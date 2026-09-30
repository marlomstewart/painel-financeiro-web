/**
 * @file src/utils/offlineQueue.js
 * @description Fila IndexedDB para lançamentos sem rede. Um lançamento parcelado é persistido
 * como um único lote, preservando no aparelho a mesma atomicidade do endpoint /transacoes/lote.
 */

const DB_NAME = 'fincontrole-offline';
const DB_VERSION = 1;
const STORE_NAME = 'lancamentos_pendentes';

function exigirUsuarioId(usuarioId) {
    const valor = String(usuarioId ?? '');
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(valor)) {
        throw new Error('Não foi possível identificar a conta da fila offline.');
    }
    return valor;
}

function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function comStore(modo, executar) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, modo);
        executar(tx.objectStore(STORE_NAME));

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

/**
 * Persiste todas as parcelas de uma compra em uma única escrita IndexedDB. O ID determinístico
 * também evita duplicar o lote se o usuário recarregar o app antes da rede voltar.
 */
export async function salvarLotePendente(transacoes, usuarioId) {
    if (!Array.isArray(transacoes) || transacoes.length === 0 || !transacoes[0]?.id) {
        throw new Error('Não foi possível guardar um lote offline sem transações válidas.');
    }

    const dono = exigirUsuarioId(usuarioId);
    const id = `lote_${dono}_${transacoes[0].id}`;
    await comStore('readwrite', (store) => {
        store.put({
            id,
            usuarioId: dono,
            tipo: 'lote',
            payload: { transacoes },
            criadoEm: Date.now(),
            tentativas: 0,
            estado: 'pendente',
            erro: null
        });
    });
    return id;
}

/**
 * Compatibilidade com o formato de um único lançamento. Mesmo esse formato exige proprietário;
 * registros antigos sem proprietário ficam preservados, mas nunca entram em sincronização.
 */
export async function salvarPendente(payload, usuarioId) {
    const dono = exigirUsuarioId(usuarioId);
    await comStore('readwrite', (store) => {
        store.put({ id: `legado_${dono}_${payload.id}`, usuarioId: dono, tipo: 'legado', payload, criadoEm: Date.now(), tentativas: 0, estado: 'pendente', erro: null });
    });
}

/** Lista somente itens desta conta; registros anteriores à correção não são atribuídos por inferência. */
export async function listarPendentes(usuarioId) {
    const dono = exigirUsuarioId(usuarioId);
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result
            .filter(item => item.usuarioId === dono)
            .sort((a, b) => a.criadoEm - b.criadoEm));
        request.onerror = () => reject(request.error);
    });
}

/** Informa apenas a quantidade de entradas legadas em quarentena, sem expor seus dados. */
export async function contarPendentesSemDono() {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result.filter(item => !item.usuarioId).length);
        request.onerror = () => reject(request.error);
    });
}

/** Remove um item somente após sucesso confirmado pelo servidor. */
export async function removerPendente(id, usuarioId) {
    const dono = exigirUsuarioId(usuarioId);
    await comStore('readwrite', (store) => {
        const request = store.get(id);
        request.onsuccess = () => {
            if (request.result?.usuarioId === dono) store.delete(id);
        };
    });
}

/** Atualiza estado, contagem e erro de um item sem sobrescrever seu payload. */
export async function atualizarPendente(id, usuarioId, patch) {
    const dono = exigirUsuarioId(usuarioId);
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item?.usuarioId === dono) {
                store.put({
                    ...item,
                    ...(patch.tentativas !== undefined ? { tentativas: patch.tentativas } : {}),
                    ...(patch.estado !== undefined ? { estado: patch.estado } : {}),
                    ...(patch.erro !== undefined ? { erro: patch.erro } : {})
                });
            }
        };
        getRequest.onerror = () => reject(getRequest.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}
