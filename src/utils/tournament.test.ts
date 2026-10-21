/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateElo,
  recordMatchResult,
  computeLeaderboard,
  selectNextPair,
  getTimeRemaining,
  calculateMaxUniquePairs,
  calculateUserVotingLimit,
  getPairKey,
  selectPrioritizedPair,
} from './tournament.ts';
import type { VotingOption } from '../types.ts';

test('calculateElo correctly awards winner and penalizes loser', () => {
  const ratingA = 1200;
  const ratingB = 1200;
  // A wins (scoreA = 1)
  const result = calculateElo(ratingA, ratingB, 1, 32);
  assert.equal(result.deltaA, 16);
  assert.equal(result.deltaB, -16);
  assert.equal(result.newRatingA, 1216);
  assert.equal(result.newRatingB, 1184);
});

test('calculateElo handles tie without major rating swing', () => {
  const ratingA = 1200;
  const ratingB = 1200;
  // Tie (scoreA = 0.5)
  const result = calculateElo(ratingA, ratingB, 0.5, 32);
  assert.equal(result.deltaA, 0);
  assert.equal(result.deltaB, 0);
  assert.equal(result.newRatingA, 1200);
  assert.equal(result.newRatingB, 1200);
});

test('recordMatchResult updates match counts and stats', () => {
  const options: VotingOption[] = [
    {
      id: 'opt1',
      title: 'Pitsa',
      score: 1200,
      matches: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      addedBy: 'host',
      createdAt: 1000,
    },
    {
      id: 'opt2',
      title: 'Sushi',
      score: 1200,
      matches: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      addedBy: 'host',
      createdAt: 1000,
    },
  ];

  const updated = recordMatchResult(options, 'opt1', 'opt2');
  const opt1 = updated.find((o) => o.id === 'opt1')!;
  const opt2 = updated.find((o) => o.id === 'opt2')!;

  assert.equal(opt1.matches, 1);
  assert.equal(opt1.wins, 1);
  assert.equal(opt1.losses, 0);
  assert.ok(opt1.score > 1200);

  assert.equal(opt2.matches, 1);
  assert.equal(opt2.wins, 0);
  assert.equal(opt2.losses, 1);
  assert.ok(opt2.score < 1200);
});

test('computeLeaderboard ranks higher Elo options first', () => {
  const options: VotingOption[] = [
    {
      id: 'low',
      title: 'Madal',
      score: 1100,
      matches: 2,
      wins: 0,
      losses: 2,
      ties: 0,
      addedBy: 'host',
      createdAt: 1000,
    },
    {
      id: 'high',
      title: 'Kõrge',
      score: 1350,
      matches: 3,
      wins: 3,
      losses: 0,
      ties: 0,
      addedBy: 'host',
      createdAt: 1000,
    },
    {
      id: 'mid',
      title: 'Keskmine',
      score: 1200,
      matches: 2,
      wins: 1,
      losses: 1,
      ties: 0,
      addedBy: 'host',
      createdAt: 1000,
    },
  ];

  const leaderboard = computeLeaderboard(options);
  assert.equal(leaderboard[0].id, 'high');
  assert.equal(leaderboard[0].rank, 1);
  assert.equal(leaderboard[0].winRate, 100);

  assert.equal(leaderboard[1].id, 'mid');
  assert.equal(leaderboard[1].rank, 2);
  assert.equal(leaderboard[1].winRate, 50);

  assert.equal(leaderboard[2].id, 'low');
  assert.equal(leaderboard[2].rank, 3);
  assert.equal(leaderboard[2].winRate, 0);
});

test('selectNextPair returns two distinct options', () => {
  const options: VotingOption[] = [
    { id: '1', title: 'A', score: 1200, matches: 0, wins: 0, losses: 0, ties: 0, addedBy: 'host', createdAt: 1 },
    { id: '2', title: 'B', score: 1200, matches: 0, wins: 0, losses: 0, ties: 0, addedBy: 'host', createdAt: 2 },
    { id: '3', title: 'C', score: 1200, matches: 0, wins: 0, losses: 0, ties: 0, addedBy: 'host', createdAt: 3 },
  ];

  const pair = selectNextPair(options);
  assert.ok(pair !== null);
  assert.notEqual(pair[0].id, pair[1].id);
});

test('getTimeRemaining detects expired vs active deadline', () => {
  const pastIso = new Date(Date.now() - 60000).toISOString();
  const pastResult = getTimeRemaining(pastIso);
  assert.equal(pastResult.isExpired, true);

  const futureIso = new Date(Date.now() + 3600000).toISOString();
  const futureResult = getTimeRemaining(futureIso);
  assert.equal(futureResult.isExpired, false);
  assert.ok(futureResult.totalMs > 0);
});

test('calculateMaxUniquePairs calculates n*(n-1)/2 correctly', () => {
  // 4 options -> 4*3/2 = 6
  assert.equal(calculateMaxUniquePairs(4), 6);
  // 10 options -> 10*9/2 = 45
  assert.equal(calculateMaxUniquePairs(10), 45);
  // 2 options -> 2*1/2 = 1
  assert.equal(calculateMaxUniquePairs(2), 1);
  // 1 option -> 0
  assert.equal(calculateMaxUniquePairs(1), 0);
  // 0 options -> 0
  assert.equal(calculateMaxUniquePairs(0), 0);
});

test('calculateUserVotingLimit picks the smaller of max unique pairs and max_votes_per_user', () => {
  // 4 options, maxVotesPerUser 15 -> min(6, 15) = 6
  assert.equal(calculateUserVotingLimit(4, 15), 6);
  // 10 options, maxVotesPerUser 15 -> min(45, 15) = 15
  assert.equal(calculateUserVotingLimit(10, 15), 15);
  // 10 options, maxVotesPerUser 8 -> min(45, 8) = 8
  assert.equal(calculateUserVotingLimit(10, 8), 8);
  // 3 options, maxVotesPerUser 15 -> min(3, 15) = 3
  assert.equal(calculateUserVotingLimit(3, 15), 3);
});

test('selectPrioritizedPair prioritizes globally least-voted pairs and avoids already voted pairs', () => {
  const options: VotingOption[] = [
    { id: 'optA', title: 'A', score: 1200, matches: 0, wins: 0, losses: 0, ties: 0, addedBy: 'host', createdAt: 1 },
    { id: 'optB', title: 'B', score: 1200, matches: 0, wins: 0, losses: 0, ties: 0, addedBy: 'host', createdAt: 2 },
    { id: 'optC', title: 'C', score: 1200, matches: 0, wins: 0, losses: 0, ties: 0, addedBy: 'host', createdAt: 3 },
  ];

  // Global counts: A::B has been voted 5 times, B::C has been voted 3 times, A::C has 0 votes
  const globalPairCounts: Record<string, number> = {
    [getPairKey('optA', 'optB')]: 5,
    [getPairKey('optB', 'optC')]: 3,
    [getPairKey('optA', 'optC')]: 0,
  };

  // User has not voted on any pair yet -> should pick A::C because it has lowest global count (0)
  const pair1 = selectPrioritizedPair(options, new Set(), globalPairCounts);
  assert.ok(pair1 !== null);
  const pair1Key = getPairKey(pair1[0].id, pair1[1].id);
  assert.equal(pair1Key, getPairKey('optA', 'optC'));

  // User now votes on A::C. Next pick should be B::C (global count 3 vs A::B count 5)
  const pair2 = selectPrioritizedPair(options, new Set([getPairKey('optA', 'optC')]), globalPairCounts);
  assert.ok(pair2 !== null);
  const pair2Key = getPairKey(pair2[0].id, pair2[1].id);
  assert.equal(pair2Key, getPairKey('optB', 'optC'));

  // If user voted on all 3 pairs, returns null
  const pair3 = selectPrioritizedPair(
    options,
    new Set([getPairKey('optA', 'optB'), getPairKey('optB', 'optC'), getPairKey('optA', 'optC')]),
    globalPairCounts
  );
  assert.equal(pair3, null);
});

