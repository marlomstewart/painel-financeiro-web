import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';
import {
  salvarLotePendente, salvarPendente, listarPendentes, contarPendentesSemDono,
  removerPendente, atualizarPendente,
} from './offlineQueue';

let registros;

function requisicao(tx, executar) {
  const request = {};
  tx.pendentes += 1;
  setTimeout(() => {
    try {
      request.result = executar();
      request.onsuccess?.();
    } catch (erro) {
      request.error = erro;
      request.onerror?.();
    }
    tx.pendentes -= 1;
    if (tx.pendentes === 0) setTimeout(() => tx.oncomplete?.(), 0);
  }, 0);
  return request;
}

beforeEach(() => {
  registros = new Map();
  const db = {
    objectStoreNames: { contains: () => false },
    createObjectStore: () => {},
    transaction: () => {
      const tx = { pendentes: 0 };
      tx.objectStore = () => ({
        put: item => requisicao(tx, () => registros.set(item.id, structuredClone(item))),
        get: id => requisicao(tx, () => structuredClone(registros.get(id))),
        getAll: () => requisicao(tx, () => [...registros.values()].map(item => structuredClone(item))),
        delete: id => requisicao(tx, () => registros.delete(id)),
      });
      return tx;
    },
  };
  vi.stubGlobal('indexedDB', {
    open: () => {
      const request = { result: db };
      setTimeout(() => { request.onupgradeneeded?.(); request.onsuccess?.(); }, 0);
      return request;
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

test('A e B têm filas separadas, e nem exclusão nem atualização atravessa contas', async () => {
  const idA = await salvarLotePendente([{ id: 'mesma-compra' }], '1');
  const idB = await salvarLotePendente([{ id: 'mesma-compra' }], '2');
  assert.notEqual(idA, idB);
  assert.deepEqual((await listarPendentes('1')).map(item => item.id), [idA]);
  assert.deepEqual((await listarPendentes('2')).map(item => item.id), [idB]);

  await atualizarPendente(idA, '2', { estado: 'falha_permanente', payload: { alterado: true } });
  await removerPendente(idA, '2');
  assert.equal((await listarPendentes('1'))[0].estado, 'pendente');
  await atualizarPendente(idA, '1', { estado: 'falha_permanente', payload: { alterado: true } });
  assert.deepEqual((await listarPendentes('1'))[0].payload, { transacoes: [{ id: 'mesma-compra' }] });
  await removerPendente(idA, '1');
  assert.deepEqual(await listarPendentes('1'), []);
  assert.equal((await listarPendentes('2')).length, 1);
});

test('fila antiga sem proprietário permanece em quarentena e não é atribuída a A ou B', async () => {
  registros.set('legado-antigo', { id: 'legado-antigo', payload: { id: 'segredo' }, criadoEm: 1 });
  await salvarPendente({ id: 'novo' }, '1');
  assert.equal(await contarPendentesSemDono(), 1);
  assert.equal((await listarPendentes('1')).length, 1);
  assert.deepEqual(await listarPendentes('2'), []);
  await removerPendente('legado-antigo', '1');
  assert.ok(registros.has('legado-antigo'));
  await assert.rejects(() => listarPendentes(undefined));
});
