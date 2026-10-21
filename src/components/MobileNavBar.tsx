/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Swords, Trophy, PlusCircle, Settings, QrCode, Home } from 'lucide-react';

interface MobileNavBarProps {
  currentTab: 'vote' | 'leaderboard' | 'options';
  onSelectTab: (tab: 'vote' | 'leaderboard' | 'options') => void;
  onOpenShareModal: () => void;
  onOpenAddOptionModal: () => void;
  onOpenHostSettings?: () => void;
  onGoHome?: () => void;
  canAddOptions: boolean;
  isHost?: boolean;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenShareModal,
  onOpenAddOptionModal,
  onOpenHostSettings,
  onGoHome,
  canAddOptions,
  isHost,
}) => {
  return (
    <nav
      aria-label="Mobiilne menüü"
      className="md:hidden shrink-0 w-full bg-white/95 dark:bg-[#0d0818]/95 backdrop-blur-md border-t border-orange-200 dark:border-orange-950/60 z-30 transition-colors"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
        {/* Duel Tab */}
        <button
          onClick={() => onSelectTab('vote')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors cursor-pointer ${
            currentTab === 'vote'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <Swords className={`h-4 w-4 ${currentTab === 'vote' ? 'text-orange-600 dark:text-orange-400' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Võrdlus</span>
        </button>

        {/* Leaderboard Tab */}
        <button
          onClick={() => onSelectTab('leaderboard')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors cursor-pointer ${
            currentTab === 'leaderboard'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <Trophy className={`h-4 w-4 ${currentTab === 'leaderboard' ? 'text-orange-600 dark:text-orange-400' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Edetabel</span>
        </button>

        {/* QR / Share Button - Prominent for Host and participants */}
        <button
          onClick={onOpenShareModal}
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-orange-600 dark:text-orange-300 hover:text-orange-700 dark:hover:text-white transition-colors cursor-pointer"
          title="Näita QR koodi ja jaga"
        >
          <div className="relative">
            <QrCode className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            {isHost && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-[#0d0818]" />
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5 text-orange-600 dark:text-orange-300">
            QR / Jaga
          </span>
        </button>

        {/* Add option if allowed */}
        {canAddOptions && (
          <button
            onClick={onOpenAddOptionModal}
            className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-zinc-600 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="text-[10px] tracking-tight mt-0.5">Lisa valik</span>
          </button>
        )}

        {/* Host settings or Home */}
        {isHost && onOpenHostSettings ? (
          <button
            onClick={onOpenHostSettings}
            className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-zinc-600 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 transition-colors cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            <span className="text-[10px] tracking-tight mt-0.5">Seaded</span>
          </button>
        ) : onGoHome ? (
          <button
            onClick={onGoHome}
            className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-zinc-600 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 transition-colors cursor-pointer"
            title="Avaleht"
          >
            <Home className="h-4 w-4" />
            <span className="text-[10px] tracking-tight mt-0.5">Avaleht</span>
          </button>
        ) : null}
      </div>
    </nav>
  );
};
