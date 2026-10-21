/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Clock, Settings, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { Room } from '../types.ts';
import { calculateMaxUniquePairs, calculateUserVotingLimit } from '../utils/tournament.ts';

interface HostSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onUpdateSettings: (settings: {
    deadline?: string;
    allowVoterOptions?: boolean;
    maxVotesPerUser?: number;
    status?: 'active' | 'closed';
  }) => Promise<void>;
}

export const HostSettingsModal: React.FC<HostSettingsModalProps> = ({
  isOpen,
  onClose,
  room,
  onUpdateSettings,
}) => {
  const [deadline, setDeadline] = useState(room.deadline.slice(0, 16));
  const [allowVoterOptions, setAllowVoterOptions] = useState(room.allowVoterOptions);
  const [maxVotesPerUser, setMaxVotesPerUser] = useState<number>(room.maxVotesPerUser || 15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    try {
      await onUpdateSettings({
        deadline: new Date(deadline).toISOString(),
        allowVoterOptions,
        maxVotesPerUser: Math.max(1, Number(maxVotesPerUser) || 15),
      });
      setSuccessMessage('Seaded edukalt salvestatud!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1000);
    } catch {
      //
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = room.status === 'active' ? 'closed' : 'active';
    setIsSubmitting(true);
    try {
      await onUpdateSettings({
        status: nextStatus,
      });
      onClose();
    } catch {
      //
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Korraldaja seaded
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sulge aken"
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {successMessage && (
            <div className="flex items-center gap-2 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Deadline editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Muuda hääletuse tähtaega
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Voting limit: max_votes_per_user */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="host-max-votes" className="text-xs font-semibold text-slate-900 dark:text-white">
                  Hääletuslimiit (max_votes_per_user)
                </label>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mitu võrdlust iga kasutaja teha saab
                </div>
              </div>
              <input
                id="host-max-votes"
                type="number"
                min={1}
                max={100}
                value={maxVotesPerUser}
                onChange={(e) => setMaxVotesPerUser(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono text-center font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-0.5">
              <div>Paaride valem: {room.options.length}*( {room.options.length}-1 )/2 = {calculateMaxUniquePairs(room.options.length)} unikaalset paari</div>
              <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                Tegelik limiit: min({calculateMaxUniquePairs(room.options.length)}, {maxVotesPerUser}) = {calculateUserVotingLimit(room.options.length, maxVotesPerUser)} häält
              </div>
            </div>
          </div>

          {/* Allow voter options toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Osalejad saavad lisada valikuid
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Luba või keela uute valikute lisamine
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allowVoterOptions}
              onClick={() => setAllowVoterOptions(!allowVoterOptions)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                allowVoterOptions ? 'bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  allowVoterOptions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Close / Reopen Voting Early */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                room.status === 'active'
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>
                {room.status === 'active'
                  ? 'Sulge hääletus kohe ja lukusta tulemused'
                  : 'Ava hääletus uuesti osalejatele'}
              </span>
            </button>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Sulge
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-md shadow-orange-950/60 transition-colors"
            >
              {isSubmitting ? 'Salvestan...' : 'Salvesta muudatused'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
