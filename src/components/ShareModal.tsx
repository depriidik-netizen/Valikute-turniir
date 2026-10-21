/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Share2, QrCode, Swords, ArrowRight } from 'lucide-react';
import { getQrCodeSvgUrl } from '../utils/qr.ts';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  title: string;
  category: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  title,
  category,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareUrl = `${origin}?room=${encodeURIComponent(roomCode)}`;
  const qrSvg = getQrCodeSvgUrl(shareUrl, 220);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Hääleta: ${title}`,
        text: `Tule ja aita valida parim variant teemas «${title}»!`,
        url: shareUrl,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#150e24] border border-orange-200 dark:border-orange-950/80 shadow-2xl p-5 sm:p-6 transition-colors my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-orange-100 dark:border-orange-950/60">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Turniir on valmis!</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              «{title}» ({category})
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Sulge aken"
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-orange-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Room Code Callout */}
          <div className="text-center p-3.5 rounded-xl bg-orange-50 dark:bg-[#1b122e] border border-orange-200 dark:border-orange-900/40">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-600 dark:text-zinc-400">
              Ruumi kood
            </span>
            <div className="text-2xl font-black font-mono tracking-widest text-orange-600 dark:text-orange-400 mt-0.5">
              {roomCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedCode ? 'Kood kopeeritud!' : 'Kopeeri kood'}</span>
            </button>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-orange-200 dark:border-orange-950/60 bg-white dark:bg-[#100a1c]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
              <QrCode className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span>Skaneeri telefoniga osalemiseks:</span>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-xs border border-zinc-200">
              <img
                src={qrSvg}
                alt={`QR kood toale ${roomCode}`}
                className="h-36 w-36 sm:h-40 sm:w-40"
              />
            </div>
          </div>

          {/* Direct Link */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Otselink hääletusele:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-orange-950/80 bg-zinc-50 dark:bg-[#0d0718] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-200 truncate focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 dark:bg-orange-950 dark:hover:bg-orange-900 dark:text-orange-200 text-xs font-bold shrink-0 transition-colors border border-orange-300 dark:border-orange-500/30 cursor-pointer"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copiedLink ? 'Kopeeritud' : 'Kopeeri link'}</span>
              </button>
            </div>
          </div>

          {/* Native Share button if available */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-zinc-200 dark:border-orange-950/60 bg-zinc-50 dark:bg-[#1a1128] hover:bg-orange-50 dark:hover:bg-[#221635] text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Jaga telefoni rakendustega</span>
            </button>
          )}

          {/* Primary Action Button: Start Voting Now */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 dark:shadow-orange-950/80 cursor-pointer border border-orange-400/30"
            >
              <Swords className="h-4 w-4" />
              <span>Alusta hääletamist (Mine duellide juurde)</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
            <p className="text-[11px] text-center text-zinc-500 dark:text-zinc-500 mt-2">
              Saad seda QR koodi ja linki alati uuesti avada päise nupust «QR / Jaga».
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
