/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Swords,
  Plus,
  ArrowRight,
  Trophy,
  History,
  Trash2,
  Sparkles,
  Clock,
  CheckCircle2,
  Crown,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { TournamentHistoryItem } from '../types.ts';
import { useLanguage } from '../context/LanguageContext';

interface HomeViewProps {
  onOpenCreateModal: () => void;
  onJoinRoom: (roomId: string) => void;
  history: TournamentHistoryItem[];
  onRemoveFromHistory: (roomId: string) => void;
  onClearHistory: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenCreateModal,
  onJoinRoom,
  history,
  onRemoveFromHistory,
  onClearHistory,
}) => {
  const { t, language } = useLanguage();
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // In-app confirmation dialog state for single item deletion and full history clear
  const [itemToDelete, setItemToDelete] = useState<TournamentHistoryItem | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = joinCodeInput.trim();
    if (!cleaned) {
      setJoinError(t('homeJoinErrorEnterCode'));
      return;
    }

    // If user pasted a full URL with ?room=...
    if (cleaned.includes('room=')) {
      try {
        const url = new URL(cleaned.startsWith('http') ? cleaned : `http://dummy.com/${cleaned}`);
        const code = url.searchParams.get('room');
        if (code) cleaned = code;
      } catch {
        const match = cleaned.match(/room=([A-Za-z0-9_-]+)/);
        if (match) cleaned = match[1];
      }
    }

    cleaned = cleaned.toUpperCase();
    setJoinError(null);
    onJoinRoom(cleaned);
  };

  const handleQuickDemo = () => {
    onJoinRoom('REIS-2026');
  };

  const formatLastVisited = (timestamp: number) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 2) return t('homeJustNow');
    if (diffMinutes < 60) return `${diffMinutes} ${t('homeMinAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('homeHoursAgo')}`;
    if (diffDays === 1) return t('homeYesterday');
    return new Date(timestamp).toLocaleDateString(language === 'en' ? 'en-US' : 'et-EE', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-2 sm:pt-4">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
          {t('homeHeroTitle1')}{' '}
          <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
            {t('homeHeroTitle2')}
          </span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto leading-relaxed">
          {t('homeHeroSubtitle')}
        </p>
      </div>

      {/* Main Interaction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Card 1: Create New Tournament */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#1c132c] dark:to-[#140d21] border border-orange-200 dark:border-orange-900/40 hover:border-orange-400 dark:hover:border-orange-500/60 shadow-xl shadow-orange-500/5 dark:shadow-orange-950/30 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-orange-500/10 dark:hover:shadow-orange-900/20">
          <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-orange-500/10 dark:from-orange-600/15 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30">
                <Plus className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  {t('homeNewGameBadge')}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                  {t('homeCreateTitle')}
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {t('homeCreateDesc')}
            </p>

            <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>{t('homeBullet1')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>{t('homeBullet2')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>{t('homeBullet3')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 relative z-10">
            <button
              onClick={onOpenCreateModal}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/20 dark:shadow-orange-950/80 active:scale-[0.98] transition-all cursor-pointer border border-orange-400/30"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t('homeBtnCreateTournament')}</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Card 2: Join Existing Tournament */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#1a1228] dark:to-[#120b1e] border border-orange-200 dark:border-orange-950/60 hover:border-orange-400 dark:hover:border-orange-500/40 shadow-xl shadow-orange-500/5 dark:shadow-orange-950/30 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 dark:bg-[#26173b] border border-orange-300 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 shadow-xs">
                <Swords className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-300/80">
                  {t('homeJoinBadge')}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                  {t('homeJoinTitle')}
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {t('homeJoinDesc')}
            </p>

            <form onSubmit={handleJoinSubmit} className="space-y-3 pt-2">
              <div>
                <label htmlFor="room-code-input" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t('homeJoinInputLabel')}
                </label>
                <div className="relative">
                  <input
                    id="room-code-input"
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => {
                      setJoinCodeInput(e.target.value.toUpperCase());
                      if (joinError) setJoinError(null);
                    }}
                    placeholder={t('homeJoinInputPlaceholder')}
                    className="w-full uppercase font-mono tracking-wider px-4 py-3 rounded-xl bg-orange-50/40 dark:bg-[#0e0819] border border-orange-200 dark:border-orange-950/80 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm transition-all outline-none"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  {joinCodeInput && (
                    <button
                      type="button"
                      onClick={() => setJoinCodeInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                      title={t('homeClearInput')}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {joinError && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1.5">{joinError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 dark:bg-[#28183d] dark:hover:bg-[#341f50] border border-orange-400 dark:border-orange-500/40 text-white dark:text-orange-300 dark:hover:text-white font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>{t('homeBtnJoinTournament')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Quick Demo Shortcut */}
          <div className="pt-4 border-t border-orange-100 dark:border-orange-950/50 mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{t('homeQuickDemoQuestion')}</span>
            <button
              onClick={handleQuickDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-100/70 hover:bg-orange-200 text-orange-900 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30 font-mono text-[11px] transition-colors cursor-pointer"
            >
              <span>{t('homeQuickDemoAction')}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Minu turniirid (Mängude ajalugu) Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-500/30 text-orange-700 dark:text-orange-400">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>{t('homeHistoryTitle')}</span>
                {history.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30 font-mono font-medium">
                    {history.length}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setIsConfirmingClearAll(true)}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 cursor-pointer"
              title={t('homeClearHistoryTitle')}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('homeClearHistoryBtn')}</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200 dark:border-orange-950/80 bg-white/70 dark:bg-[#120b1f]/50 p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-900/40">
              <Trophy className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {t('homeEmptyHistoryTitle')}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 max-w-sm mx-auto">
              {t('homeEmptyHistoryDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl bg-white dark:bg-[#170f24] hover:bg-orange-50/50 dark:hover:bg-[#1e1430] border border-orange-200/80 dark:border-orange-950/70 hover:border-orange-400 dark:hover:border-orange-500/50 p-4 transition-all duration-200 shadow-sm dark:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-orange-50 dark:bg-[#0d0718] text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-950">
                      {item.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.isHost && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs">
                          <Crown className="h-2.5 w-2.5" />
                          {t('host')}
                        </span>
                      )}
                      {item.status === 'closed' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400">
                          {t('closed')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title={t('homeRemoveFromHistory')}
                        aria-label={`${t('homeRemoveFromHistory')} ${item.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                    {item.title}
                  </h3>
                  {item.category && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                      {item.category}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-orange-100 dark:border-orange-950/50 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1 text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {formatLastVisited(item.lastVisited)}
                  </span>
                  <button
                    onClick={() => onJoinRoom(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-600/20 hover:bg-orange-500 dark:hover:bg-orange-600 text-orange-800 dark:text-orange-300 hover:text-white dark:hover:text-white font-bold text-xs transition-all border border-orange-300 dark:border-orange-500/30 cursor-pointer"
                  >
                    <span>{t('homeOpenTournament')}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature Explainer */}
      <div className="rounded-2xl bg-white/80 dark:bg-[#120a1e]/80 border border-orange-200/80 dark:border-orange-950/50 p-6 sm:p-8 space-y-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 text-center">
          {t('homeHowItWorksTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30 font-black text-sm">
              1
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{t('homeStep1Title')}</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t('homeStep1Desc')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30 font-black text-sm">
              2
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{t('homeStep2Title')}</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t('homeStep2Desc')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30 font-black text-sm">
              3
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{t('homeStep3Title')}</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t('homeStep3Desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for deleting an individual tournament */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xl text-left space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {t('homeConfirmRemoveSingleTitle')}
                </h3>
                <span className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-bold">{itemToDelete.id}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {t('homeConfirmRemoveSingleDesc', { title: itemToDelete.title, id: itemToDelete.id })}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveFromHistory(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-sm cursor-pointer"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for clearing all history */}
      {isConfirmingClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xl text-left space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {t('homeConfirmClearAllTitle')}
                </h3>
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {t('homeConfirmClearAllDesc')}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                  setIsConfirmingClearAll(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-sm cursor-pointer"
              >
                {t('homeHistoryClear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
