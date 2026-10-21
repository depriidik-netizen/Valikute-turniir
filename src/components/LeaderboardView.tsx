/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trophy, Medal, Swords, ArrowUpDown, Image as ImageIcon, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { VotingOption } from '../types.ts';
import { computeLeaderboard } from '../utils/tournament.ts';

interface LeaderboardViewProps {
  options: VotingOption[];
  onStartVoting: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isExpired: boolean;
  totalVotes: number;
  userVoteCount?: number;
  votingLimit?: number;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  options,
  onStartVoting,
  onRefresh,
  isRefreshing,
  isExpired,
  totalVotes,
  userVoteCount = 0,
  votingLimit = 0,
}) => {
  const [sortBy, setSortBy] = useState<'elo' | 'winrate' | 'matches'>('elo');

  const leaderboardItems = computeLeaderboard(options);

  // Apply secondary sort if selected
  const displayedItems = [...leaderboardItems].sort((a, b) => {
    if (sortBy === 'winrate') {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.score - a.score;
    }
    if (sortBy === 'matches') {
      if (b.matches !== a.matches) return b.matches - a.matches;
      return b.score - a.score;
    }
    return a.rank - b.rank; // default elo rank
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold text-sm border border-orange-300 dark:border-orange-500/40 shadow-xs">
          <Trophy className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700/40 text-zinc-700 dark:text-zinc-300 font-extrabold text-sm border border-zinc-300 dark:border-zinc-600/50">
          <Medal className="h-4 w-4" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-700/25 text-amber-700 dark:text-amber-500 font-extrabold text-sm border border-amber-300 dark:border-amber-600/40">
          <Medal className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-500 font-mono text-sm">
        #{rank}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 text-zinc-900 dark:text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            <Trophy className="h-4 w-4" />
            <span>Reaalajas Edetabel</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white mt-0.5">
            Eelistatuimate valikute pingerida
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
            Põhineb paarisvõrdluste tulemustel ja Elo reitingusüsteemil. Kokku antud {totalVotes} häält.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#161026] border border-orange-200 dark:border-orange-950/70 rounded-xl hover:border-orange-400 dark:hover:border-orange-500/50 transition-colors cursor-pointer shadow-xs"
              title="Värskenda tulemusi"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-orange-600 dark:text-orange-400' : ''}`} />
              <span>Värskenda</span>
            </button>
          )}

          {!isExpired && (
            userVoteCount >= votingLimit && votingLimit > 0 ? (
              <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-800 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50 rounded-xl border border-orange-300 dark:border-orange-500/40">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Hääled antud ({userVoteCount}/{votingLimit})</span>
              </span>
            ) : (
              <button
                onClick={onStartVoting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-md shadow-orange-500/20 dark:shadow-orange-950/60 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Swords className="h-4 w-4" />
                <span>Jätka hääletamist</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Voter limit reached banner */}
      {userVoteCount >= votingLimit && votingLimit > 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-orange-100 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-500/40 text-xs text-orange-950 dark:text-orange-200">
          <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-zinc-900 dark:text-white">Hääletuslimiit täis!</span> Oled sooritanud kõik lubatud {userVoteCount} võrdlust ({votingLimit} max). Sinu valikud on arvesse võetud ja mõjutavad siinset reaalajas edetabelit.
          </div>
        </div>
      )}

      {/* Sort Filter Tabs */}
      <div className="mb-4 flex items-center justify-between border-b border-orange-200/80 dark:border-orange-950/50 pb-3">
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <ArrowUpDown className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
          <span>Sorteeri:</span>
          <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-[#140e24] p-0.5 border border-zinc-200 dark:border-orange-950/60">
            <button
              onClick={() => setSortBy('elo')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                sortBy === 'elo'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Elo reiting
            </button>
            <button
              onClick={() => setSortBy('winrate')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                sortBy === 'winrate'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Võiduprotsent
            </button>
            <button
              onClick={() => setSortBy('matches')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                sortBy === 'matches'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Matšide arv
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="overflow-hidden rounded-2xl border border-orange-200 dark:border-orange-950/60 bg-white dark:bg-[#161026] shadow-sm dark:shadow-xl">
        <div className="divide-y divide-orange-100 dark:divide-orange-950/40">
          {displayedItems.map((item) => {
            const isWinner = item.rank === 1 && totalVotes > 0;
            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 transition-colors gap-3 ${
                  isWinner
                    ? 'bg-orange-50/60 hover:bg-orange-50/90 dark:bg-orange-950/20 dark:hover:bg-orange-950/30'
                    : 'hover:bg-orange-50/40 dark:hover:bg-white/5'
                }`}
              >
                {/* Left: Rank, Image Thumbnail, Title */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="shrink-0">{getRankBadge(item.rank)}</div>

                  <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-black/60 flex items-center justify-center border border-orange-200 dark:border-orange-950/60">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                        {item.title}
                      </h3>
                      {isWinner && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-500/40 px-2 py-0.5 rounded-md">
                          <Sparkles className="h-3 w-3" />
                          <span>Liider</span>
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-md mt-0.5">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      <span>Lisas: {item.addedByName || (item.addedBy === 'host' ? 'Host' : 'Osaleja')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{item.matches} matši peetud</span>
                    </div>
                  </div>
                </div>

                {/* Right: Elo score & Win Rate bar */}
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-64 shrink-0 pl-11 sm:pl-0">
                  {/* Progress Bar & Win Rate */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1 font-mono">
                      <span className="text-zinc-500 dark:text-zinc-400">Võiduprotsent</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                        {item.winRate}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-black/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.rank === 1
                            ? 'bg-gradient-to-r from-orange-600 to-amber-500'
                            : item.rank === 2
                            ? 'bg-orange-500'
                            : 'bg-zinc-400 dark:bg-zinc-600'
                        }`}
                        style={{ width: `${item.winRate}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono tabular-nums">
                      {item.wins}V - {item.losses}K
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="text-right shrink-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Elo reiting</div>
                    <div className="text-base sm:text-lg font-bold font-mono text-zinc-900 dark:text-white tabular-nums">
                      {item.score}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
