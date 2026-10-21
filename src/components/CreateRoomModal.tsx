/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Calendar,
  Sparkles,
  Users,
  Utensils,
  Plane,
  Film,
  Check,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { PRESET_CATEGORIES, calculateMaxUniquePairs, calculateUserVotingLimit } from '../utils/tournament.ts';
import { compressImageFile } from '../utils/image.ts';
import { VotingOption, Room } from '../types.ts';
import { useLanguage } from '../context/LanguageContext';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: {
    title: string;
    category: string;
    hostName: string;
    allowVoterOptions: boolean;
    maxVotesPerUser: number;
    deadline: string;
    options: Array<{
      title: string;
      description?: string;
      imageUrl?: string;
    }>;
  }) => Promise<Room | null>;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(PRESET_CATEGORIES[0]);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [title, setTitle] = useState('Õhtusöögi valik täna õhtul');
  const [hostName, setHostName] = useState('Korraldaja');
  const [allowVoterOptions, setAllowVoterOptions] = useState(true);
  const [maxVotesPerUser, setMaxVotesPerUser] = useState<number>(15);

  // Default deadline: tomorrow at 20:00
  const getDefaultDeadline = (hoursAhead: number = 24) => {
    const d = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    // format as YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = '00';
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [deadline, setDeadline] = useState(() => getDefaultDeadline(24));

  // Options pool
  const [options, setOptions] = useState<
    Array<{ id: string; title: string; description: string; imageUrl?: string }>
  >([
    {
      id: '1',
      title: 'Käsitööburgerid & Friikad',
      description: 'Mahlane veiseliha, suitsupeekon ja krõbedad friikartulid',
    },
    {
      id: '2',
      title: 'Itaalia Pitsa',
      description: 'Puuküttega ahjus küpsetatud krõbe pitsa värske basiilikuga',
    },
    {
      id: '3',
      title: 'Jaapani Ramen & Gyoza',
      description: 'Rikkalik aromaatne puljong, värsked nuudlid ja krõbedad pelmeenid',
    },
    {
      id: '4',
      title: 'Mehhiko Tacos & Guacamole',
      description: 'Vürtsikas veiseliha, pehme maisitortilla ja värske laim',
    },
  ]);

  // Backup of deleted options for Undo functionality
  const [deletedBackup, setDeletedBackup] = useState<
    Array<{ id: string; title: string; description: string; imageUrl?: string }> | null
  >(null);

  // New option form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState<string | undefined>(undefined);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCategorySelect = (cat: (typeof PRESET_CATEGORIES)[0]) => {
    setSelectedCategory(cat);
    if (cat.id !== 'custom') {
      setTitle(`${cat.name}`);
      // Fill sample options if current options list is empty or matches previous sample
      if (cat.sampleOptions.length > 0) {
        setOptions(
          cat.sampleOptions.map((s, idx) => ({
            id: String(Date.now() + idx),
            title: s.title,
            description: s.description,
            imageUrl: s.imageUrl,
          }))
        );
      }
    } else {
      setTitle('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const compressedDataUrl = await compressImageFile(file);
      setNewImage(compressedDataUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Pildi töötlemine ebaõnnestus');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddOption = () => {
    if (!newTitle.trim()) {
      setErrorMessage(t('modalOptionNamePlaceholder'));
      return;
    }
    setErrorMessage('');
    setOptions((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: newTitle.trim(),
        description: newDesc.trim(),
        imageUrl: newImage,
      },
    ]);
    setNewTitle('');
    setNewDesc('');
    setNewImage(undefined);
  };

  const handleRemoveOption = (id: string) => {
    // Save current options to backup before removing single option
    setDeletedBackup([...options]);
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const handleClearAllOptions = () => {
    if (options.length === 0) return;
    // Save snapshot of options to backup so user can undo
    setDeletedBackup([...options]);
    setOptions([]);
    setErrorMessage('');
  };

  const handleUndo = () => {
    if (!deletedBackup || deletedBackup.length === 0) return;
    setOptions(deletedBackup);
    setDeletedBackup(null);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const finalCategory =
      selectedCategory.id === 'custom' ? customCategoryName.trim() : selectedCategory.name;

    if (!finalCategory) {
      setErrorMessage('Palun määra või vali kategooria');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Palun sisesta hääletuse pealkiri');
      return;
    }

    if (options.length < 2) {
      setErrorMessage(t('modalMinOptionsNotice'));
      return;
    }

    const deadlineMs = new Date(deadline).getTime();
    if (isNaN(deadlineMs) || deadlineMs <= Date.now()) {
      setErrorMessage('Tähtaeg peab olema tulevikus');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateRoom({
        title: title.trim(),
        category: finalCategory,
        hostName: hostName.trim() || 'Korraldaja',
        allowVoterOptions,
        maxVotesPerUser: Math.max(1, Number(maxVotesPerUser) || 15),
        deadline,
        options: options.map((o) => ({
          title: o.title,
          description: o.description,
          imageUrl: o.imageUrl,
        })),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Hääletuse loomine ebaõnnestus');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
      {/* Modal card container with max-h-[95dvh] flex flex-col */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[95dvh] flex flex-col transition-colors">
        {/* Modal Header (shrink-0) */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4 sm:p-5 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('modalCreateTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('modalCreateSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form with overflow-y-auto flex-1 */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 flex flex-col">
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Category Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                {t('modalStep1Category')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-left border text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {cat.id === 'food' && <Utensils className="h-4 w-4 text-amber-500 shrink-0" />}
                      {cat.id === 'travel' && <Plane className="h-4 w-4 text-sky-500 shrink-0" />}
                      {cat.id === 'team_event' && <Users className="h-4 w-4 text-emerald-500 shrink-0" />}
                      {cat.id === 'movie' && <Film className="h-4 w-4 text-purple-500 shrink-0" />}
                      {cat.id === 'custom' && <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />}
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {selectedCategory.id === 'custom' && (
                <input
                  type="text"
                  placeholder={t('modalCustomCategoryPlaceholder')}
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="mt-2.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            {/* 2. Title & Host Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('modalStep2Title')}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('modalTitlePlaceholder')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('modalHostName')}
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder={t('modalHostPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 3. Deadline Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('modalStep3Deadline')}
                </label>
                <span className="text-[11px] text-slate-400">{t('modalDeadlineHint')}</span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {/* Quick Deadline Presets */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDeadline(getDefaultDeadline(2))}
                    className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    +2h
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadline(getDefaultDeadline(24))}
                    className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    +24h
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadline(getDefaultDeadline(72))}
                    className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    +3d
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Voting Limit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('modalStep4Limit')}
                </label>
                <span className="text-[11px] text-slate-400">{t('modalLimitHint')}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxVotesPerUser}
                  onChange={(e) => setMaxVotesPerUser(Number(e.target.value))}
                  className="w-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tegelik limiit arvestades valikute arvu: <span className="font-bold text-indigo-600 dark:text-indigo-400">{calculateUserVotingLimit(options.length, maxVotesPerUser)}</span>
                </span>
              </div>
            </div>

            {/* 5. Voter Contribution Permission Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="pr-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t('modalAllowVotersTitle')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('modalAllowVotersDesc')}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={allowVoterOptions}
                onClick={() => setAllowVoterOptions(!allowVoterOptions)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                  allowVoterOptions ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    allowVoterOptions ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 6. Options Pool with Image Upload, Instant Clear All, and Undo button */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('modalStep5Options')} ({options.length})
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">({t('modalMinOptionsNotice')})</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tagasivõtu nupp (Undo) - nähtav kui valikuid on kustutatud */}
                  {deletedBackup && deletedBackup.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900/70 border border-amber-300 dark:border-amber-500/50 rounded-lg shadow-xs transition-all cursor-pointer animate-pulse hover:animate-none"
                      title={t('modalUndoTooltip')}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{t('modalBtnUndo')} ({deletedBackup.length})</span>
                    </button>
                  )}

                  {/* Prügikasti märk / Kustuta kõik nupp */}
                  {options.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllOptions}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors cursor-pointer"
                      title={t('modalClearAllTooltip')}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>{t('modalClearAllOptions')}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* List of current options or empty state with undo shortcut */}
              {options.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-center space-y-2 mb-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Valikute nimekiri on tühi.
                  </div>
                  {deletedBackup && deletedBackup.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900/70 border border-amber-300 dark:border-amber-500/50 rounded-xl transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Võta samm tagasi ja taasta {deletedBackup.length} valikut</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                  {options.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border shrink-0 flex items-center justify-center">
                          {opt.imageUrl ? (
                            <img src={opt.imageUrl} alt={opt.title} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400">ABC</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {opt.title}
                          </div>
                          {opt.description && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {opt.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title={t('delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new option sub-card */}
              <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-850">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('modalAddOptionTitle')}
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder={t('modalOptionNamePlaceholder')}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder={t('modalOptionDescPlaceholder')}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />

                  {/* Image upload row */}
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{newImage ? t('modalBtnChangeImage') : t('modalBtnUploadImage')}</span>
                    </button>
                    {newImage && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <div className="h-6 w-6 rounded overflow-hidden border">
                          <img src={newImage} alt="Eelvaade" className="h-full w-full object-cover" />
                        </div>
                        <span>Pilt valitud</span>
                        <button
                          type="button"
                          onClick={() => setNewImage(undefined)}
                          className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {t('modalBtnAddOption')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Pinned Footer with Action Buttons */}
          <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-end gap-3 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {t('modalBtnCancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || options.length < 2}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 active:scale-[0.98] rounded-xl shadow-md shadow-orange-950/60 transition-all cursor-pointer"
            >
              {isSubmitting ? t('modalBtnSubmitting') : t('modalBtnSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
