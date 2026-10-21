/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRoom,
  createRoom,
  submitVote,
  addOptionToRoom,
  updateRoomSettings,
  isSupabaseConfigured,
} from '../../server/db.ts';

test('Supabase configuration detector works correctly', () => {
  // In dev environment without real keys, returns false
  const configured = isSupabaseConfigured();
  assert.equal(typeof configured, 'boolean');
});

test('Database fetches demo room REIS-2026', async () => {
  const room = await getRoom('REIS-2026');
  assert.ok(room, 'Demo room should exist');
  assert.equal(room?.id, 'REIS-2026');
  assert.equal(room?.title, 'Tiimi Suvereisi Sihtkoht');
  assert.ok(room?.options.length >= 2, 'Should have at least 2 options');
});

test('Database creates a new tournament room with options', async () => {
  const testId = `TEST-${Date.now().toString(36).toUpperCase()}`;
  const deadline = new Date(Date.now() + 86400000).toISOString();

  const newRoom = await createRoom({
    id: testId,
    title: 'Lemmik Supabase Funktsioon',
    category: 'Arendus',
    hostName: 'TestHost',
    hostKey: 'secret-key-123',
    allowVoterOptions: true,
    maxVotesPerUser: 10,
    deadline,
    options: [
      { title: 'PostgreSQL Row Level Security', description: 'Turvaline juurdepääs' },
      { title: 'Storage Buckets', description: 'Kiire piltide salvestus' },
      { title: 'Realtime Subscriptions', description: 'Kohene andmete uuendus' },
    ],
  });

  assert.equal(newRoom.id, testId);
  assert.equal(newRoom.title, 'Lemmik Supabase Funktsioon');
  assert.equal(newRoom.options.length, 3);
  assert.equal(newRoom.totalVotes, 0);

  // Read back
  const fetched = await getRoom(testId);
  assert.ok(fetched);
  assert.equal(fetched?.id, testId);
  assert.equal(fetched?.options.length, 3);
});

test('Database submits pairwise vote and updates Elo ratings', async () => {
  const testId = `VOTE-${Date.now().toString(36).toUpperCase()}`;
  const deadline = new Date(Date.now() + 86400000).toISOString();

  const room = await createRoom({
    id: testId,
    title: 'Test Vote Room',
    category: 'Test',
    hostName: 'Tester',
    hostKey: 'key-123',
    allowVoterOptions: true,
    maxVotesPerUser: 10,
    deadline,
    options: [
      { title: 'Valik 1', description: '' },
      { title: 'Valik 2', description: '' },
    ],
  });

  const optA = room.options[0].id;
  const optB = room.options[1].id;

  const afterVote = await submitVote(testId, optA, optB, false);
  assert.equal(afterVote.totalVotes, 1);
  const updatedA = afterVote.options.find((o) => o.id === optA);
  const updatedB = afterVote.options.find((o) => o.id === optB);

  assert.ok(updatedA && updatedB);
  assert.ok(updatedA.score > 1200, 'Winner Elo should increase');
  assert.ok(updatedB.score < 1200, 'Loser Elo should decrease');
  assert.equal(updatedA.wins, 1);
  assert.equal(updatedB.losses, 1);
});

test('Database allows adding options and updating room settings', async () => {
  const testId = `OPT-${Date.now().toString(36).toUpperCase()}`;
  const deadline = new Date(Date.now() + 86400000).toISOString();

  await createRoom({
    id: testId,
    title: 'Options Add Test',
    category: 'Test',
    hostName: 'Tester',
    hostKey: 'host-secret',
    allowVoterOptions: true,
    maxVotesPerUser: 10,
    deadline,
    options: [
      { title: 'Algne 1', description: '' },
      { title: 'Algne 2', description: '' },
    ],
  });

  const { option, room } = await addOptionToRoom(testId, {
    title: 'Uus Lisatud Valik',
    description: 'Voteri poolt pakutud',
    addedBy: 'voter',
    addedByName: 'Mari',
  });

  assert.equal(option.title, 'Uus Lisatud Valik');
  assert.equal(option.addedByName, 'Mari');
  assert.equal(room.options.length, 3);

  // Update room settings
  const updated = await updateRoomSettings(testId, 'host-secret', {
    maxVotesPerUser: 25,
  });
  assert.equal(updated.maxVotesPerUser, 25);
});
