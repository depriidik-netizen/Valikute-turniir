/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTournamentHistory,
  saveTournamentToHistory,
  removeTournamentFromHistory,
  clearTournamentHistory,
} from './history.ts';

function createMockStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) || null,
    setItem: (key: string, value: string) => map.set(key, value),
    removeItem: (key: string) => map.delete(key),
  };
}

test('getTournamentHistory returns empty array when empty', () => {
  const storage = createMockStorage();
  const history = getTournamentHistory(storage);
  assert.deepEqual(history, []);
});

test('saveTournamentToHistory adds new room and maintains recent order', () => {
  const storage = createMockStorage();

  saveTournamentToHistory({ id: 'ROOM-1', title: 'Esimene tuba', category: 'Toit' }, false, storage);
  saveTournamentToHistory({ id: 'ROOM-2', title: 'Teine tuba', category: 'Film' }, true, storage);

  const history = getTournamentHistory(storage);
  assert.equal(history.length, 2);
  assert.equal(history[0].id, 'ROOM-2');
  assert.equal(history[0].title, 'Teine tuba');
  assert.equal(history[0].isHost, true);

  assert.equal(history[1].id, 'ROOM-1');
  assert.equal(history[1].isHost, false);
});

test('saveTournamentToHistory updates existing room without duplicates', () => {
  const storage = createMockStorage();

  saveTournamentToHistory({ id: 'ROOM-1', title: 'Algne pealkiri' }, false, storage);
  saveTournamentToHistory({ id: 'ROOM-1', title: 'Uuendatud pealkiri', totalVotes: 5 }, false, storage);

  const history = getTournamentHistory(storage);
  assert.equal(history.length, 1);
  assert.equal(history[0].id, 'ROOM-1');
  assert.equal(history[0].title, 'Uuendatud pealkiri');
  assert.equal(history[0].totalVotes, 5);
});

test('removeTournamentFromHistory removes specific room', () => {
  const storage = createMockStorage();

  saveTournamentToHistory({ id: 'ROOM-1', title: 'Esimene' }, false, storage);
  saveTournamentToHistory({ id: 'ROOM-2', title: 'Teine' }, false, storage);

  removeTournamentFromHistory('ROOM-1', storage);

  const history = getTournamentHistory(storage);
  assert.equal(history.length, 1);
  assert.equal(history[0].id, 'ROOM-2');
});

test('clearTournamentHistory removes all saved tournaments', () => {
  const storage = createMockStorage();

  saveTournamentToHistory({ id: 'ROOM-1', title: 'Esimene' }, false, storage);
  clearTournamentHistory(storage);

  assert.deepEqual(getTournamentHistory(storage), []);
});
