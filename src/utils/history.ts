/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TournamentHistoryItem {
  id: string;
  title: string;
  category?: string;
  isHost?: boolean;
  lastVisited: number;
  totalVotes?: number;
  optionsCount?: number;
  status?: 'active' | 'closed';
}

export const TOURNAMENT_HISTORY_KEY = 'duovote_tournament_history';

interface SimpleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function resolveStorage(customStorage?: SimpleStorage): SimpleStorage | null {
  if (customStorage) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function getTournamentHistory(customStorage?: SimpleStorage): TournamentHistoryItem[] {
  const storage = resolveStorage(customStorage);
  if (!storage) return [];

  try {
    const raw = storage.getItem(TOURNAMENT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (b.lastVisited || 0) - (a.lastVisited || 0));
  } catch {
    return [];
  }
}

export function saveTournamentToHistory(
  room: {
    id: string;
    title: string;
    category?: string;
    totalVotes?: number;
    optionsCount?: number;
    status?: 'active' | 'closed';
  },
  isHost?: boolean,
  customStorage?: SimpleStorage
): TournamentHistoryItem[] {
  const storage = resolveStorage(customStorage);
  if (!storage || !room || !room.id) return [];

  const history = getTournamentHistory(storage);
  const existingIdx = history.findIndex((item) => item.id.toUpperCase() === room.id.toUpperCase());

  const previousHostStatus = existingIdx >= 0 ? history[existingIdx].isHost : false;
  const determinedHost = isHost !== undefined ? isHost : previousHostStatus;

  const newItem: TournamentHistoryItem = {
    id: room.id.toUpperCase(),
    title: room.title || (existingIdx >= 0 ? history[existingIdx].title : `Turniir ${room.id}`),
    category: room.category || (existingIdx >= 0 ? history[existingIdx].category : undefined),
    isHost: Boolean(determinedHost),
    lastVisited: Date.now(),
    totalVotes: room.totalVotes !== undefined ? room.totalVotes : (existingIdx >= 0 ? history[existingIdx].totalVotes : 0),
    optionsCount: room.optionsCount !== undefined ? room.optionsCount : (existingIdx >= 0 ? history[existingIdx].optionsCount : 0),
    status: room.status || (existingIdx >= 0 ? history[existingIdx].status : 'active'),
  };

  const filtered = history.filter((item) => item.id.toUpperCase() !== room.id.toUpperCase());
  const updated = [newItem, ...filtered];

  try {
    storage.setItem(TOURNAMENT_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save tournament to history:', err);
  }

  return updated;
}

export function removeTournamentFromHistory(
  roomId: string,
  customStorage?: SimpleStorage
): TournamentHistoryItem[] {
  const storage = resolveStorage(customStorage);
  if (!storage) return [];

  const history = getTournamentHistory(storage);
  const updated = history.filter((item) => item.id.toUpperCase() !== roomId.toUpperCase());

  try {
    storage.setItem(TOURNAMENT_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove tournament from history:', err);
  }

  return updated;
}

export function clearTournamentHistory(customStorage?: SimpleStorage): void {
  const storage = resolveStorage(customStorage);
  if (!storage) return;

  try {
    storage.removeItem(TOURNAMENT_HISTORY_KEY);
  } catch (err) {
    console.error('Failed to clear tournament history:', err);
  }
}
