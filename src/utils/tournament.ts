/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { VotingOption, OptionLeaderboardItem, PresetCategory } from '../types.ts';

export const INITIAL_ELO = 1200;
export const K_FACTOR = 32;

/**
 * Calculates new Elo ratings for two participants given the match outcome.
 * scoreA: 1 if A won, 0 if B won, 0.5 for tie
 */
export function calculateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  kFactor: number = K_FACTOR
): { newRatingA: number; newRatingB: number; deltaA: number; deltaB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const scoreB = 1 - scoreA;

  const deltaA = Math.round(kFactor * (scoreA - expectedA));
  const deltaB = Math.round(kFactor * (scoreB - expectedB));

  return {
    newRatingA: Math.max(100, ratingA + deltaA),
    newRatingB: Math.max(100, ratingB + deltaB),
    deltaA,
    deltaB,
  };
}

/**
 * Applies a match result to an array of options and returns a new updated array.
 */
export function recordMatchResult(
  options: VotingOption[],
  winnerId: string,
  loserId: string,
  isTie: boolean = false
): VotingOption[] {
  const optionA = options.find((o) => o.id === winnerId);
  const optionB = options.find((o) => o.id === loserId);

  if (!optionA || !optionB) return options;

  const scoreA = isTie ? 0.5 : 1;
  const { newRatingA, newRatingB } = calculateElo(optionA.score, optionB.score, scoreA);

  return options.map((opt) => {
    if (opt.id === winnerId) {
      return {
        ...opt,
        score: newRatingA,
        matches: opt.matches + 1,
        wins: opt.wins + (isTie ? 0 : 1),
        ties: opt.ties + (isTie ? 1 : 0),
      };
    }
    if (opt.id === loserId) {
      return {
        ...opt,
        score: newRatingB,
        matches: opt.matches + 1,
        losses: opt.losses + (isTie ? 0 : 1),
        ties: opt.ties + (isTie ? 1 : 0),
      };
    }
    return opt;
  });
}

/**
 * Sorts and computes leaderboard stats.
 */
export function computeLeaderboard(options: VotingOption[]): OptionLeaderboardItem[] {
  const sorted = [...options].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const winRateB = b.matches > 0 ? b.wins / b.matches : 0;
    const winRateA = a.matches > 0 ? a.wins / a.matches : 0;
    if (winRateB !== winRateA) return winRateB - winRateA;
    return b.matches - a.matches;
  });

  return sorted.map((item, index) => {
    const winRate = item.matches > 0 ? Math.round((item.wins / item.matches) * 100) : 0;
    return {
      ...item,
      rank: index + 1,
      winRate,
    };
  });
}

/**
 * Calculates total possible unique pairs: n * (n - 1) / 2
 */
export function calculateMaxUniquePairs(n: number): number {
  if (n < 2) return 0;
  return Math.floor((n * (n - 1)) / 2);
}

/**
 * Calculates user voting limit: min( n*(n-1)/2, maxVotesPerUser )
 */
export function calculateUserVotingLimit(optionsCount: number, maxVotesPerUser: number = 15): number {
  const maxPairs = calculateMaxUniquePairs(optionsCount);
  if (maxPairs === 0) return 0;
  return Math.min(maxPairs, Math.max(1, maxVotesPerUser));
}

/**
 * Canonical identifier for a pair of options regardless of order.
 */
export function getPairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}::${idB}` : `${idB}::${idA}`;
}

/**
 * Returns all unique pairs among options.
 */
export function getAllPossiblePairs(
  options: VotingOption[]
): Array<{ optionA: VotingOption; optionB: VotingOption; pairKey: string }> {
  const pairs: Array<{ optionA: VotingOption; optionB: VotingOption; pairKey: string }> = [];
  for (let i = 0; i < options.length; i++) {
    for (let j = i + 1; j < options.length; j++) {
      pairs.push({
        optionA: options[i],
        optionB: options[j],
        pairKey: getPairKey(options[i].id, options[j].id),
      });
    }
  }
  return pairs;
}

/**
 * Selects an intelligent next pair to vote on:
 * 1. Excludes pairs this user has already voted on.
 * 2. Prioritizes pairs that have been compared fewest times globally across all participants.
 * 3. Tie-breaks by total matches of both options.
 */
export function selectPrioritizedPair(
  options: VotingOption[],
  userVotedPairKeys: Set<string> | string[] = new Set(),
  globalPairCounts: Record<string, number> = {}
): [VotingOption, VotingOption] | null {
  if (options.length < 2) return null;

  const votedSet = userVotedPairKeys instanceof Set ? userVotedPairKeys : new Set(userVotedPairKeys);
  const allPairs = getAllPossiblePairs(options);

  // Filter out pairs already voted on by this user
  const availablePairs = allPairs.filter((p) => !votedSet.has(p.pairKey));

  if (availablePairs.length === 0) {
    return null;
  }

  // Sort candidate pairs:
  // Primary: global exposure count (ascending - fewest times shown globally first)
  // Secondary: combined matches of both options (ascending - under-tested options first)
  availablePairs.sort((a, b) => {
    const globalCountA = globalPairCounts[a.pairKey] || 0;
    const globalCountB = globalPairCounts[b.pairKey] || 0;
    if (globalCountA !== globalCountB) {
      return globalCountA - globalCountB;
    }

    const matchesA = a.optionA.matches + a.optionB.matches;
    const matchesB = b.optionA.matches + b.optionB.matches;
    if (matchesA !== matchesB) {
      return matchesA - matchesB;
    }

    return Math.random() - 0.5;
  });

  const bestPair = availablePairs[0];

  // Randomize display order (left vs right)
  return Math.random() > 0.5
    ? [bestPair.optionA, bestPair.optionB]
    : [bestPair.optionB, bestPair.optionA];
}

/**
 * Legacy wrapper for pair selection.
 */
export function selectNextPair(
  options: VotingOption[],
  lastPairIds?: [string, string]
): [VotingOption, VotingOption] | null {
  const userVoted = lastPairIds ? [getPairKey(lastPairIds[0], lastPairIds[1])] : [];
  return selectPrioritizedPair(options, userVoted);
}

/**
 * Time and deadline helpers.
 */
export function getTimeRemaining(
  deadlineIso: string,
  nowMs: number = Date.now()
): {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formattedText: string;
} {
  const targetMs = new Date(deadlineIso).getTime();
  const totalMs = targetMs - nowMs;
  const isExpired = totalMs <= 0;

  if (isExpired) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formattedText: 'Tähtaeg on möödas (Hääletus suletud)',
    };
  }

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  let formattedText = '';
  if (days > 0) {
    formattedText = `${days}p ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    formattedText = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    formattedText = `${minutes}m ${seconds}s`;
  }

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    formattedText,
  };
}

/**
 * Preset categories for rapid setup by host.
 */
export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: 'food',
    name: 'Õhtusöök ja Toitlustus',
    iconName: 'Utensils',
    description: 'Kuhu täna sööma minna või mida tellida?',
    sampleOptions: [
      {
        title: 'Käsitööburgerid & Friikad',
        description: 'Mahlane veiseliha, suitsupeekon ja krõbedad friikartulid',
      },
      {
        title: 'Itaalia Pitsa',
        description: 'Puuküttega ahjus küpsetatud krõbe pitsa värske basiilikuga',
      },
      {
        title: 'Jaapani Ramen & Gyoza',
        description: 'Rikkalik aromaatne puljong, värsked nuudlid ja krõbedad pelmeenid',
      },
      {
        title: 'Mehhiko Tacos & Guacamole',
        description: 'Vürtsikas veiseliha, pehme maisitortilla ja värske laim',
      },
      {
        title: 'Sushi & Poke Kauss',
        description: 'Värske lõhe, avokaado, edamame oad ja sojakaste',
      },
    ],
  },
  {
    id: 'travel',
    name: 'Reisisihtkoht ja Puhkus',
    iconName: 'Plane',
    description: 'Kuhu sõidame järgmisele nädalavahetuse või suvepuhkusele?',
    sampleOptions: [
      {
        title: 'Rooma, Itaalia',
        description: 'Ajaloolised monumendid, gelato ja iidsed tänavad',
      },
      {
        title: 'Barcelona, Hispaania',
        description: 'Gaudi arhitektuur, liivarand ja elav tapas-kultuur',
      },
      {
        title: 'Praha, Tšehhi',
        description: 'Muinasjutulised lossid, vanalinn ja hubased pruulikojad',
      },
      {
        title: 'Lissabon, Portugal',
        description: 'Värvikad plaaditud majad, pastéis de nata ja ookeanivaated',
      },
      {
        title: 'Islandi Ringreis',
        description: 'Geisrid, mustad liivarannad, kosed ja virmalised',
      },
    ],
  },
  {
    id: 'team_event',
    name: 'Meeskonnaüritus & Tiimiõhtu',
    iconName: 'Users',
    description: 'Mis tegevust teeme ühiseks tiimiõhtuks või tähistamiseks?',
    sampleOptions: [
      {
        title: 'Kardisõidu Karikas',
        description: 'Adrenaliinirikas võidusõit ja ajavõtuga superfinaal',
      },
      {
        title: 'Põgenemistuba',
        description: 'Loogikamõistatuste lahendamine ja meeskonnatöö pinge all',
      },
      {
        title: 'Ühine Kokanduskoolitus',
        description: 'Professionaalse koka käe all kolmekäigulise õhtusöögi valmistamine',
      },
      {
        title: 'Lauamängude & Viktoriini Õhtu',
        description: 'Hubane seltskonnamängude ja humoorika mälumängu turniir',
      },
      {
        title: 'Kanuu- või Räätsamatk',
        description: 'Värske õhk, kaunis loodus ja lõkkel valmistatud tee',
      },
    ],
  },
  {
    id: 'movie',
    name: 'Filmiõhtu Valik',
    iconName: 'Film',
    description: 'Millist filmi või sarja täna üheskoos vaatame?',
    sampleOptions: [
      {
        title: 'Sci-Fi Kosmoseodüsseia',
        description: 'Sügav visuaalne teadusulme ja ajaga manipuleerimine',
      },
      {
        title: 'Põnevusfilm & Detektiivilugu',
        description: 'Ootamatute pööretega kriminaalne mõrvamüsteerium',
      },
      {
        title: 'Kergemeelne Komöödia',
        description: 'Lõbus ja naerurohke vaatamine pingevabaks õhtuks',
      },
      {
        title: 'Klassikaline Õudusfilm',
        description: 'Pingeid kruviv psühholoogiline thriller',
      },
    ],
  },
  {
    id: 'custom',
    name: 'Muu kohandatud valik',
    iconName: 'Sparkles',
    description: 'Loo täiesti oma teema ja pane kirja oma valikud',
    sampleOptions: [],
  },
];
