/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, Flame, Plus, Shuffle, Equal, Image as ImageIcon, Trophy, CheckCircle2, ArrowRight } from 'lucide-react';
import { VotingOption } from '../types.ts';
import {
  calculateMaxUniquePairs,
  calculateUserVotingLimit,
  getPairKey,
  selectPrioritizedPair,
} from '../utils/tournament.ts';
import { useLanguage } from '../context/LanguageContext';

interface VotingDuelProps {
  options: VotingOption[];
  maxVotesPerUser?: number;
  pairCounts?: Record<string, number>;
  userVotedPairKeys: string[];
  onVote: (winnerId: string, loserId: string, isTie?: boolean, pairKey?: string) => void;
  onOpenAddOptionModal: () => void;
  canAddOptions: boolean;
  totalVotesCount: number;
  userVoteCount: number;
  isExpired: boolean;
  onViewLeaderboard: () => void;
  onVotingLimitReached: () => void;
}

export const VotingDuel: React.FC<VotingDuelProps> = ({
  options,
  maxVotesPerUser = 15,
  pairCounts = {},
  userVotedPairKeys,
  onVote,
  onOpenAddOptionModal,
  canAddOptions,
  totalVotesCount,
  userVoteCount,
  isExpired,
  onViewLeaderboard,
  onVotingLimitReached,
}) => {
  const { t } = useLanguage();
  const [currentPair, setCurrentPair] = useState<[VotingOption, VotingOption] | null>(null);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalUniquePairs = calculateMaxUniquePairs(options.length);
  const votingLimit = calculateUserVotingLimit(options.length, maxVotesPerUser);
  const isLimitReached = userVoteCount >= votingLimit && votingLimit > 0;

  // Pick new pair with priority given to globally under-exposed pairs
  const pickNewPair = useCallback((justVotedKey?: string) => {
    if (options.length < 2) {
      setCurrentPair(null);
      return;
    }

    const keysToExclude = new Set(userVotedPairKeys);
    if (justVotedKey) keysToExclude.add(justVotedKey);

    const next = selectPrioritizedPair(options, keysToExclude, pairCounts);
    setCurrentPair(next);
    setSelectedSide(null);
    setIsSubmitting(false);
  }, [options, userVotedPairKeys, pairCounts]);

  // Initial and reactive pair selection
  useEffect(() => {
    if (!isLimitReached && (!currentPair || !options.some((o) => o.id === currentPair[0]?.id) || !options.some((o) => o.id === currentPair[1]?.id))) {
      pickNewPair();
    }
  }, [options, currentPair, pickNewPair, isLimitReached]);

  // Automatically redirect to leaderboard when limit reached
  useEffect(() => {
    if (isLimitReached) {
      redirectTimerRef.current = setTimeout(() => {
        onVotingLimitReached();
      }, 1800);
    }
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [isLimitReached, onVotingLimitReached]);

  const handleChoose = (winner: VotingOption, loser: VotingOption, side: 'left' | 'right', isTie: boolean = false) => {
    if (isSubmitting || isExpired || isLimitReached) return;
    setIsSubmitting(true);
    setSelectedSide(side);

    const pairKey = getPairKey(winner.id, loser.id);

    setTimeout(() => {
      onVote(winner.id, loser.id, isTie, pairKey);
      pickNewPair(pairKey);
    }, 200);
  };

  const handleSkip = () => {
    if (!currentPair || isLimitReached) return;
    const skipKey = getPairKey(currentPair[0].id, currentPair[1].id);
    pickNewPair(skipKey);
  };

  const handleTie = () => {
    if (!currentPair || isSubmitting || isExpired || isLimitReached) return;
    handleChoose(currentPair[0], currentPair[1], 'left', true);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPair || isSubmitting || isExpired || isLimitReached) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft' || e.key === '1') {
        handleChoose(currentPair[0], currentPair[1], 'left');
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        handleChoose(currentPair[1], currentPair[0], 'right');
      } else if (e.key === ' ' || e.key === 's') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === '=' || e.key === 't') {
        e.preventDefault();
        handleTie();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPair, isSubmitting, isExpired, isLimitReached]);

  // If user reached voting limit, show celebratory success banner and redirect
  if (isLimitReached) {
    return (
      <div className="mx-auto max-w-xl py-12 px-4 text-center my-auto">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-500/40 mb-4 glow-pumpkin animate-pulse">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
          {t('duelLimitTitle')}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6 max-w-md mx-auto">
          {t('duelLimitDesc')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onViewLeaderboard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 dark:shadow-orange-950/60 transition-all cursor-pointer"
          >
            <Trophy className="h-4 w-4" />
            <span>{t('duelBtnLeaderboard')}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
          {t('duelLimitRedirect')}
        </p>
      </div>
    );
  }

  if (options.length < 2) {
    return (
      <div className="mx-auto max-w-xl py-12 px-4 text-center my-auto">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30 mb-4">
          <Flame className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
          {t('duelNeedTwo')}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          {t('duelNeedTwoDesc', { count: options.length })}
        </p>
        {canAddOptions && (
          <button
            onClick={onOpenAddOptionModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t('duelBtnSuggest')}</span>
          </button>
        )}
      </div>
    );
  }

  if (!currentPair) {
    return (
      <div className="py-12 text-center text-orange-600 dark:text-orange-300/60 text-sm my-auto">
        {t('duelSearchingPair')}
      </div>
    );
  }

  const [optionA, optionB] = currentPair;
  const currentVoteStep = Math.min(userVoteCount + 1, votingLimit);
  const progressPercent = Math.round((userVoteCount / votingLimit) * 100);

  return (
    <div className="w-full h-full max-w-5xl mx-auto flex flex-col justify-between overflow-hidden px-3 sm:px-6 py-1.5 sm:py-6">
      {/* Header instructions & voting limit progress (Compact on mobile) */}
      <div className="shrink-0 mb-1.5 sm:mb-4 flex flex-row items-center justify-between gap-2 text-left">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            <span>{t('duelStep')} {currentVoteStep} / {votingLimit}</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400">{t('duelPairs')}: {totalUniquePairs}</span>
          </div>
          <h2 className="text-sm sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight truncate sm:whitespace-normal">
            {t('duelQuestion')}
          </h2>
        </div>

        {/* Voting Limit Progress Bar & Counter */}
        <div className="w-40 sm:w-64 bg-white dark:bg-[#140e24] px-2.5 py-1.5 sm:p-3 rounded-xl border border-orange-200 dark:border-orange-950/60 text-left shrink-0 shadow-xs">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono mb-1">
            <span className="text-zinc-500 dark:text-zinc-400 hidden sm:inline">{t('duelVotesLabel')}</span>
            <span className="font-bold text-orange-600 dark:text-orange-400 tabular-nums ml-auto sm:ml-0">
              {userVoteCount} / {votingLimit} ({progressPercent}%)
            </span>
          </div>
          <div className="h-1.5 sm:h-2 w-full rounded-full bg-zinc-200 dark:bg-black/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-0.5 hidden sm:flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
            <span>min({totalUniquePairs}p, {maxVotesPerUser}max)</span>
            <span>{votingLimit - userVoteCount} {t('duelRemaining')}</span>
          </div>
        </div>
      </div>

      {/* The Duel Arena: 2 Options side by side */}
      <div className="relative flex-1 min-h-0 grid grid-cols-2 gap-2 sm:gap-6 my-auto">
        {/* Card A */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleChoose(optionA, optionB, 'left')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleChoose(optionA, optionB, 'left');
            }
          }}
          className={`group relative flex flex-col min-h-0 h-full justify-between overflow-hidden rounded-xl sm:rounded-2xl border bg-white dark:bg-[#161026] text-left transition-all duration-200 cursor-pointer select-none active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-md ${
            selectedSide === 'left'
              ? 'border-orange-500 ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/40 glow-pumpkin'
              : 'border-orange-200 dark:border-orange-950/60 hover:border-orange-400 dark:hover:border-orange-500/60 hover:shadow-orange-500/10 dark:hover:shadow-orange-950/30'
          }`}
        >
          {/* Dynamic Image Container */}
          <div className="relative flex-1 min-h-[60px] max-h-[140px] sm:max-h-none sm:aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-black/50 flex items-center justify-center shrink">
            {optionA.imageUrl ? (
              <img
                src={optionA.imageUrl}
                alt={optionA.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-3 text-zinc-400 dark:text-zinc-500">
                <ImageIcon className="h-6 w-6 sm:h-10 sm:w-10 mb-1 opacity-50" />
                <span className="text-[10px] sm:text-xs">{t('duelNoImage')}</span>
              </div>
            )}
            <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/75 backdrop-blur-sm text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold">
              {t('duelOptionA')}
            </div>
          </div>

          {/* Card Body & CTA */}
          <div className="p-2 sm:p-5 flex flex-col justify-between shrink-0 bg-white dark:bg-[#161026]">
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                {optionA.title}
              </h3>
              {optionA.description && (
                <p className="hidden sm:block mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1 sm:line-clamp-2">
                  {optionA.description}
                </p>
              )}
              <div className="mt-1 sm:mt-2 flex items-center justify-between text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {optionA.addedByName || (optionA.addedBy === 'host' ? t('host') : 'Osaleja')}
                </span>
                <span className="tabular-nums text-orange-600 dark:text-orange-300/80">{optionA.wins}V / {optionA.matches}M</span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-orange-100 dark:border-orange-950/50">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoose(optionA, optionB, 'left');
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2.5 px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 group-hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-orange-500/20 dark:shadow-orange-950/60"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{t('duelBtnPrefer')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Central VS Badge */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
          <div className="flex h-7 w-7 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-[10px] sm:text-sm shadow-xl shadow-orange-500/30 ring-2 sm:ring-4 ring-white dark:ring-[#0c0816]">
            VS
          </div>
        </div>

        {/* Card B */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleChoose(optionB, optionA, 'right')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleChoose(optionB, optionA, 'right');
            }
          }}
          className={`group relative flex flex-col min-h-0 h-full justify-between overflow-hidden rounded-xl sm:rounded-2xl border bg-white dark:bg-[#161026] text-left transition-all duration-200 cursor-pointer select-none active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-md ${
            selectedSide === 'right'
              ? 'border-orange-500 ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/40 glow-pumpkin'
              : 'border-orange-200 dark:border-orange-950/60 hover:border-orange-400 dark:hover:border-orange-500/60 hover:shadow-orange-500/10 dark:hover:shadow-orange-950/30'
          }`}
        >
          {/* Dynamic Image Container */}
          <div className="relative flex-1 min-h-[60px] max-h-[140px] sm:max-h-none sm:aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-black/50 flex items-center justify-center shrink">
            {optionB.imageUrl ? (
              <img
                src={optionB.imageUrl}
                alt={optionB.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-3 text-zinc-400 dark:text-zinc-500">
                <ImageIcon className="h-6 w-6 sm:h-10 sm:w-10 mb-1 opacity-50" />
                <span className="text-[10px] sm:text-xs">{t('duelNoImage')}</span>
              </div>
            )}
            <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/75 backdrop-blur-sm text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold">
              {t('duelOptionB')}
            </div>
          </div>

          {/* Card Body & CTA */}
          <div className="p-2 sm:p-5 flex flex-col justify-between shrink-0 bg-white dark:bg-[#161026]">
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                {optionB.title}
              </h3>
              {optionB.description && (
                <p className="hidden sm:block mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1 sm:line-clamp-2">
                  {optionB.description}
                </p>
              )}
              <div className="mt-1 sm:mt-2 flex items-center justify-between text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {optionB.addedByName || (optionB.addedBy === 'host' ? t('host') : 'Osaleja')}
                </span>
                <span className="tabular-nums text-orange-600 dark:text-orange-300/80">{optionB.wins}V / {optionB.matches}M</span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-orange-100 dark:border-orange-950/50">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoose(optionB, optionA, 'right');
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2.5 px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 group-hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-orange-500/20 dark:shadow-orange-950/60"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{t('duelBtnPrefer')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Duel Actions: Tie, Skip, Leaderboard */}
      <div className="shrink-0 pt-1 pb-1 sm:pt-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTie}
            disabled={isSubmitting || isExpired}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#140e24] border border-orange-200 dark:border-orange-950/70 hover:border-orange-400 dark:hover:border-orange-500/50 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Mõlemad variandid on võrdselt head"
          >
            <Equal className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-600 dark:text-orange-400" />
            <span>{t('duelBtnTie')}</span>
          </button>
          <button
            onClick={handleSkip}
            disabled={isSubmitting || isExpired}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#140e24] border border-orange-200 dark:border-orange-950/70 hover:border-orange-400 dark:hover:border-orange-500/50 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Võrdle teist paari"
          >
            <Shuffle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-600 dark:text-orange-400" />
            <span>{t('duelBtnSkip')}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {canAddOptions && (
            <button
              onClick={onOpenAddOptionModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-800 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-500/40 hover:bg-orange-200 dark:hover:bg-orange-900/40 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('duelBtnSuggest')}</span>
            </button>
          )}
          <button
            onClick={onViewLeaderboard}
            className="text-[11px] sm:text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors underline underline-offset-4 cursor-pointer"
          >
            {t('duelBtnLeaderboard')}
          </button>
        </div>
      </div>

      {/* Keyboard hints (Desktop only) */}
      <div className="shrink-0 hidden md:flex items-center justify-center gap-4 text-[10px] text-zinc-500 dark:text-zinc-500 font-mono pt-1">
        <span>Vihje: [1] / [←] vasak</span>
        <span aria-hidden="true">·</span>
        <span>[2] / [→] parem</span>
        <span aria-hidden="true">·</span>
        <span>[=] viik</span>
        <span aria-hidden="true">·</span>
        <span>[Tühik] jäta vahele</span>
      </div>
    </div>
  );
};
