/**
 * @file src/utils/offlineQueue.js
 * @description Fila de lançamentos pendentes de sincronização, persistida em IndexedDB.
 * Usada quando o cadastro de um novo lançamento falha por falta de conexão: o item fica
 * guardado localmente até o app conseguir reenviá-lo pro servidor.
 */

const DB_NAME = 'fincontrole-offline';
const DB_VERSION = 1;
const STORE_NAME = 'lancamentos_pendentes';

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
        const store = tx.objectStore(STORE_NAME);
        const resultadoPromise = executar(store);

        tx.oncomplete = () => resolve(resultadoPromise);
        tx.onerror = () => reject(tx.error);
    });
}

/** Grava um novo lançamento pendente na fila. */
export async function salvarPendente(payload) {
    await comStore('readwrite', (store) => {
        store.put({ id: payload.id, payload, criadoEm: Date.now(), tentativas: 0, erro: null });
    });
}

/** Lista todos os lançamentos ainda pendentes de sincronização. */
export async function listarPendentes() {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/** Remove um lançamento da fila (após sincronizar com sucesso). */
export async function removerPendente(id) {
    await comStore('readwrite', (store) => {
        store.delete(id);
    });
}

/** Atualiza contagem de tentativas/erro de um item da fila, sem removê-lo. */
export async function atualizarPendente(id, patch) {
    await comStore('readwrite', (store) => {
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) store.put({ ...item, ...patch });
        };
    });
}
