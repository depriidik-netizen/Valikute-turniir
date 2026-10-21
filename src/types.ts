/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VotingOption {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  score: number; // Elo rating, default 1200
  matches: number;
  wins: number;
  losses: number;
  ties: number;
  addedBy: 'host' | 'voter';
  addedByName?: string;
  createdAt: number;
}

export interface Room {
  id: string;
  title: string;
  category: string;
  hostName: string;
  hostKey: string;
  allowVoterOptions: boolean;
  maxVotesPerUser: number; // default 15, configurable by host
  deadline: string; // ISO date string
  options: VotingOption[];
  totalVotes: number;
  uniqueVotersCount: number;
  pairCounts?: Record<string, number>; // counts how many times each pair has been compared globally
  createdAt: number;
  status: 'active' | 'closed';
}

export interface VotePayload {
  roomId: string;
  winnerId: string;
  loserId: string;
  isTie?: boolean;
  voterId: string;
}

export interface OptionLeaderboardItem extends VotingOption {
  rank: number;
  winRate: number; // percentage 0-100
}

export interface PresetCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  sampleOptions: {
    title: string;
    description: string;
    imageUrl?: string;
  }[];
}

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
