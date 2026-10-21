/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Medal, Sparkles, Calendar, Share2, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { VotingOption } from '../types.ts';
import { computeLeaderboard } from '../utils/tournament.ts';

interface FinalResultsViewProps {
  options: VotingOption[];
  category: string;
  title: string;
  deadline: string;
  totalVotes: number;
  isHost: boolean;
  onOpenShareModal: () => void;
  onReopenVoting?: () => void;
}

export const FinalResultsView: React.FC<FinalResultsViewProps> = ({
  options,
  category,
  title,
  deadline,
  totalVotes,
  isHost,
  onOpenShareModal,
  onReopenVoting,
}) => {
  const leaderboard = computeLeaderboard(options);
  const winner = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  const formattedDeadlineDate = new Date(deadline).toLocaleString('et-EE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Top Banner */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Hääletus on lõppenud · Lõplikud tulemused</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Võitja on selgunud!
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Kategooria: <span className="font-semibold text-slate-800 dark:text-slate-200">{category}</span> — «{title}»
        </p>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <Calendar className="h-3.5 w-3.5" />
          <span>Tähtaeg kukkus: {formattedDeadlineDate}</span>
          <span aria-hidden="true">·</span>
          <span>Kokku antud: {totalVotes} häält</span>
        </div>
      </div>

      {/* Podium for Top 3 */}
      {winner && (
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-6">
          {/* 2nd Place */}
          {second && (
            <div className="order-2 md:order-1 flex flex-col items-center">
              <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center shadow-sm relative overflow-hidden">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold mb-3">
                  <Medal className="h-5 w-5" />
                </div>
                <div className="h-24 w-24 mx-auto mb-3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border">
                  {second.imageUrl ? (
                    <img src={second.imageUrl} alt={second.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-500">2. Koht</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5 truncate">
                  {second.title}
                </h3>
                <div className="mt-2 text-xs text-slate-500 font-mono">
                  {second.winRate}% võiduprotsent · {second.score} Elo
                </div>
              </div>
              <div className="h-14 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-b-xl flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold font-mono text-xl">
                2
              </div>
            </div>
          )}

          {/* 1st Place Champion */}
          <div className="order-1 md:order-2 flex flex-col items-center -mt-6">
            <div className="w-full rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 p-6 text-center shadow-xl relative overflow-hidden ring-1 ring-amber-500/20">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 mb-3">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="h-32 w-32 mx-auto mb-3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-amber-400 shadow-sm">
                {winner.imageUrl ? (
                  <img src={winner.imageUrl} alt={winner.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-slate-400" />
                  </div>
                )}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                1. Koht · Üldvõitja
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {winner.title}
              </h2>
              {winner.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {winner.description}
                </p>
              )}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold">
                <span>{winner.winRate}% Võite</span>
                <span aria-hidden="true">·</span>
                <span>{winner.score} Elo punkti</span>
              </div>
            </div>
            <div className="h-20 w-full bg-amber-500/20 dark:bg-amber-500/10 rounded-b-xl flex items-center justify-center text-amber-600 dark:text-amber-400 font-black font-mono text-2xl border-t border-amber-500/30">
              1
            </div>
          </div>

          {/* 3rd Place */}
          {third && (
            <div className="order-3 md:order-3 flex flex-col items-center">
              <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center shadow-sm relative overflow-hidden">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700/20 text-amber-700 dark:text-amber-500 font-bold mb-3">
                  <Medal className="h-5 w-5" />
                </div>
                <div className="h-24 w-24 mx-auto mb-3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border">
                  {third.imageUrl ? (
                    <img src={third.imageUrl} alt={third.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-500">3. Koht</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5 truncate">
                  {third.title}
                </h3>
                <div className="mt-2 text-xs text-slate-500 font-mono">
                  {third.winRate}% võiduprotsent · {third.score} Elo
                </div>
              </div>
              <div className="h-10 w-full bg-slate-200/40 dark:bg-slate-800/40 rounded-b-xl flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold font-mono text-xl">
                3
              </div>
            </div>
          )}
        </div>
      )}

      {/* Host Controls & Sharing Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 my-8">
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm transition-all shadow-md shadow-orange-950/60"
        >
          <Share2 className="h-4 w-4" />
          <span>Jaga tulemusi osalejatega</span>
        </button>

        {isHost && onReopenVoting && (
          <button
            onClick={onReopenVoting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161026] text-zinc-300 border border-orange-950/70 hover:border-orange-500/50 font-medium text-sm transition-colors"
          >
            <RotateCcw className="h-4 w-4 text-orange-400" />
            <span>Pikenda tähtaega / Ava uuesti</span>
          </button>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="mt-8">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          Täielik lõppseis:
        </h3>
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {leaderboard.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 font-mono font-bold text-sm text-slate-500">#{item.rank}</span>
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {item.wins} võitu / {item.matches} matši
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 font-mono">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {item.winRate}%
                </div>
                <div className="text-xs text-slate-400">{item.score} Elo</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
