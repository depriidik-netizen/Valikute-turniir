/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, QrCode } from 'lucide-react';
import { getTimeRemaining } from '../utils/tournament.ts';

interface DeadlineBannerProps {
  deadline: string;
  category: string;
  title: string;
  totalVotes: number;
  optionsCount: number;
  onDeadlinePassed?: () => void;
  compactOnMobile?: boolean;
  onOpenShareModal?: () => void;
  isHost?: boolean;
}

export const DeadlineBanner: React.FC<DeadlineBannerProps> = ({
  deadline,
  category,
  title,
  totalVotes,
  optionsCount,
  onDeadlinePassed,
  onOpenShareModal,
  isHost,
}) => {
  const [timeInfo, setTimeInfo] = useState(() => getTimeRemaining(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      const info = getTimeRemaining(deadline);
      setTimeInfo(info);
      if (info.isExpired && onDeadlinePassed) {
        onDeadlinePassed();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onDeadlinePassed]);

  return (
    <div className="w-full bg-orange-50/90 dark:bg-[#120c22]/90 border-b border-orange-200 dark:border-orange-950/40 py-2 sm:py-3 px-3 sm:px-6 transition-colors text-zinc-900 dark:text-white shrink-0">
      <div className="mx-auto max-w-6xl flex flex-row items-center justify-between gap-2">
        {/* Left: Decision Category & Title */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-orange-300/70 truncate">
            <span className="font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">{category}</span>
            <span aria-hidden="true">·</span>
            <span>{optionsCount} valikut</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="font-mono tabular-nums hidden sm:inline">{totalVotes} häält antud</span>
          </div>
          <h1 className="text-sm sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
            {title}
          </h1>
        </div>

        {/* Right: QR Share quick button & Deadline countdown indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
                isHost
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:brightness-110 border border-orange-400/50'
                  : 'bg-white text-zinc-700 hover:text-orange-600 border border-orange-200 dark:bg-[#1e1333] dark:text-zinc-300 dark:hover:text-white dark:border-orange-500/20'
              }`}
              title="Näita QR koodi ja jaga turniiri"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isHost ? 'Näita QR koodi / Jaga' : 'Jaga'}</span>
            </button>
          )}

          {timeInfo.isExpired ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-300 dark:border-rose-800/60">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Suletud</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-orange-950 dark:text-orange-200 bg-white dark:bg-[#1e1333] px-2.5 py-1 sm:py-1.5 rounded-lg border border-orange-200 dark:border-orange-500/20 shadow-xs">
              <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
              <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400">Aega jäänud:</span>
              <span className="font-mono font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                {timeInfo.formattedText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
