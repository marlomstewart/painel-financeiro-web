/**
 * @file src/utils/offlineQueue.js
 * @description Fila IndexedDB para lançamentos sem rede. Um lançamento parcelado é persistido
 * como um único lote, preservando no aparelho a mesma atomicidade do endpoint /transacoes/lote.
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
export async function salvarLotePendente(transacoes) {
    if (!Array.isArray(transacoes) || transacoes.length === 0 || !transacoes[0]?.id) {
        throw new Error('Não foi possível guardar um lote offline sem transações válidas.');
    }

    const id = `lote_${transacoes[0].id}`;
    await comStore('readwrite', (store) => {
        store.put({
            id,
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
 * Compatibilidade com registros gravados antes da fila por lote. Novos fluxos devem usar
 * salvarLotePendente; estes itens antigos continuam podendo ser enviados sem perda de dados.
 */
export async function salvarPendente(payload) {
    await comStore('readwrite', (store) => {
        store.put({ id: payload.id, tipo: 'legado', payload, criadoEm: Date.now(), tentativas: 0, estado: 'pendente', erro: null });
    });
}

/** Lista itens pendentes em ordem de criação, incluindo falhas permanentes para a UI informar. */
export async function listarPendentes() {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result.sort((a, b) => a.criadoEm - b.criadoEm));
        request.onerror = () => reject(request.error);
    });
}

/** Remove um item somente após sucesso confirmado pelo servidor. */
export async function removerPendente(id) {
    await comStore('readwrite', (store) => store.delete(id));
}

/** Atualiza estado, contagem e erro de um item sem sobrescrever seu payload. */
export async function atualizarPendente(id, patch) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) store.put({ ...item, ...patch });
        };
        getRequest.onerror = () => reject(getRequest.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}
