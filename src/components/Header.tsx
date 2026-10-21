/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Swords, Trophy, Moon, Sun, Plus, Settings, QrCode, History, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentTab: 'vote' | 'leaderboard' | 'options';
  onSelectTab: (tab: 'vote' | 'leaderboard' | 'options') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCreateModal: () => void;
  onOpenShareModal: () => void;
  onOpenHostSettings?: () => void;
  onGoHome?: () => void;
  roomCode?: string;
  isHost?: boolean;
  isClosed?: boolean;
  savedRoomsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
  onOpenCreateModal,
  onOpenShareModal,
  onOpenHostSettings,
  onGoHome,
  roomCode,
  isHost,
  isClosed,
  savedRoomsCount = 0,
}) => {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-orange-200/80 dark:border-orange-950/50 bg-white/95 dark:bg-[#0e0919]/95 backdrop-blur-md transition-colors text-zinc-900 dark:text-white shadow-xs dark:shadow-none">
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between gap-2.5 sm:gap-4 px-3 sm:px-6">
        {/* Zone 1: Brand title & logo (clicking goes Home) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            aria-label={t('home')}
            title={t('home')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 group-hover:from-orange-400 group-hover:to-amber-500 transition-all">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                  {t('appTitle')}
                </span>
              </div>
              {roomCode ? (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-orange-200/60 font-mono">
                  <span>{t('code')}: {roomCode}</span>
                  {isHost && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-orange-600 dark:text-orange-400 font-bold">{t('host')}</span>
                    </>
                  )}
                  {isClosed && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-rose-600 dark:text-rose-400 font-medium">{t('closed')}</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-orange-600 dark:text-orange-400/80 font-mono font-medium">
                  {t('home')}
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation tabs (when inside a room) */}
        {roomCode ? (
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onSelectTab('vote')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentTab === 'vote'
                  ? 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30 dark:border-orange-500/40 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-orange-50/80 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              <Swords className="h-4 w-4" />
              <span>{t('navDuel')}</span>
            </button>
            <button
              onClick={() => onSelectTab('leaderboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentTab === 'leaderboard'
                  ? 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30 dark:border-orange-500/40 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-orange-50/80 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>{t('navLeaderboard')}</span>
            </button>
            {isHost && onOpenHostSettings && (
              <button
                onClick={onOpenHostSettings}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/80 dark:hover:bg-white/5 transition-colors whitespace-nowrap shrink-0"
                title={t('navHostSettings')}
              >
                <Settings className="h-4 w-4" />
                <span>{t('navHostSettings')}</span>
              </button>
            )}
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-orange-50/80 dark:hover:bg-white/5 transition-colors whitespace-nowrap shrink-0"
                title={t('navMyTournaments')}
              >
                <History className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                <span>{t('navMyTournaments')}</span>
                {savedRoomsCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40 font-mono font-bold">
                    {savedRoomsCount}
                  </span>
                )}
              </button>
            )}
          </nav>
        ) : (
          /* When on HomeView: quick badge or links */
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            {savedRoomsCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-[#170e26] border border-orange-200 dark:border-orange-950/60 text-orange-800 dark:text-orange-300">
                <History className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                <span>{t('homeSavedTournaments')}: <strong>{savedRoomsCount}</strong></span>
              </span>
            )}
          </div>
        )}

        {/* Zone 3: Actions (Distinct QR/Share button, Language toggle, Dark mode toggle, New room) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Prominent QR / Share Button for room participants, extra distinct for Host */}
          {roomCode && (
            <button
              onClick={onOpenShareModal}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md ${
                isHost
                  ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white border border-orange-400/50 shadow-orange-500/20 dark:shadow-orange-950/60 ring-2 ring-orange-500/30 active:scale-[0.98]'
                  : 'bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 dark:bg-orange-950/60 dark:hover:bg-orange-900/60 dark:text-orange-200 dark:border-orange-500/40'
              }`}
              title="QR / Jaga"
              aria-label={t('btnQrShare')}
            >
              <QrCode className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">
                {isHost ? t('btnQrShare') : t('btnQrShareShort')}
              </span>
              <span className="sm:hidden font-black">
                {t('btnQrShareShort')}
              </span>
            </button>
          )}

          {/* Language Switch Button (ET / EN) */}
          <button
            onClick={toggleLanguage}
            className="flex h-9 px-2.5 items-center justify-center gap-1 rounded-xl border border-zinc-200 dark:border-orange-950/70 bg-zinc-50 dark:bg-[#150d24] text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer text-xs font-bold font-mono"
            title={t('languageToggleTitle')}
            aria-label={t('languageToggleTitle')}
          >
            <Globe className="h-3.5 w-3.5 opacity-60" />
            <span className={language === 'et' ? 'text-orange-600 dark:text-orange-400 font-extrabold' : 'opacity-60'}>
              ET
            </span>
            <span className="opacity-30">/</span>
            <span className={language === 'en' ? 'text-orange-600 dark:text-orange-400 font-extrabold' : 'opacity-60'}>
              EN
            </span>
          </button>

          {/* Dark / Light mode toggle */}
          <button
            onClick={onToggleDarkMode}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-orange-950/70 bg-zinc-50 dark:bg-[#150d24] text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
            aria-label={isDarkMode ? t('toggleThemeLight') : t('toggleThemeDark')}
            title={isDarkMode ? t('toggleThemeLight') : t('toggleThemeDark')}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-orange-400" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-700" />
            )}
          </button>

          {/* Create room button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.98] rounded-xl shadow-md shadow-orange-500/20 dark:shadow-orange-950/60 transition-all whitespace-nowrap shrink-0 border border-orange-500/30 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('btnNewTournament')}</span>
            <span className="sm:hidden">{t('btnNewTournamentShort')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
