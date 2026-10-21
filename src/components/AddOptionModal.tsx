/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, Upload, Plus, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { compressImageFile } from '../utils/image.ts';

interface AddOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOption: (optionData: {
    title: string;
    description?: string;
    imageUrl?: string;
    addedByName?: string;
  }) => Promise<void>;
  isHost?: boolean;
}

export const AddOptionModal: React.FC<AddOptionModalProps> = ({
  isOpen,
  onClose,
  onAddOption,
  isHost,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [voterName, setVoterName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
    } catch (err: any) {
      setError('Pildi laadimine ebaõnnestus: ' + err.message);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Valiku nimi on kohustuslik');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onAddOption({
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl,
        addedByName: voterName.trim() || undefined,
      });
      // reset
      setTitle('');
      setDescription('');
      setImageUrl(undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Valiku lisamine ebaõnnestus');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isHost ? 'Lisa turniirile uus valik' : 'Paku turniirile oma valik'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              See valik lisatakse koheselt hääletuspaari nimekirja.
            </p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valiku nimi / pealkiri *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="nt Pärnu rannapuhkus"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lühike kirjeldus või miks valida (valikuline)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="nt Suurepärased rannad, hubased kohvikud ja soe vesi"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {!isHost && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sinu nimi (valikuline)
              </label>
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="nt Mari"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* File Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pildi lisamine failidest
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {imageUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                <img src={imageUrl} alt="Eelvaade" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl(undefined)}
                  className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-lg p-1 text-xs hover:bg-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-xs transition-colors"
              >
                <Upload className="h-6 w-6 mb-1 text-indigo-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {isProcessingImage ? 'Pilti töödeldakse...' : 'Vali pilt oma seadmest'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WebP</span>
              </button>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Tühista
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 rounded-xl shadow-md shadow-orange-950/60 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Lisan...' : 'Lisa valik'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
