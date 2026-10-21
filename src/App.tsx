/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { DeadlineBanner } from './components/DeadlineBanner.tsx';
import { VotingDuel } from './components/VotingDuel.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { FinalResultsView } from './components/FinalResultsView.tsx';
import { HomeView } from './components/HomeView.tsx';
import { CreateRoomModal } from './components/CreateRoomModal.tsx';
import { AddOptionModal } from './components/AddOptionModal.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { HostSettingsModal } from './components/HostSettingsModal.tsx';
import { MobileNavBar } from './components/MobileNavBar.tsx';
import { Room, TournamentHistoryItem } from './types.ts';
import { getTimeRemaining, getPairKey, calculateUserVotingLimit } from './utils/tournament.ts';
import {
  getTournamentHistory,
  saveTournamentToHistory,
  removeTournamentFromHistory,
  clearTournamentHistory,
} from './utils/history.ts';
import { Plus, AlertCircle, Home, ArrowLeft } from 'lucide-react';

export default function App() {
  // Halloween Dark mode default: true
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('duovote_halloween_dark_mode');
    if (saved !== null) return saved === 'true';
    return true; // Always default to true for the Halloween dark theme
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
    localStorage.setItem('duovote_halloween_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Active room state
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'vote' | 'leaderboard' | 'options'>('vote');
  const [userVoteCount, setUserVoteCount] = useState<number>(0);
  const [userVotedPairKeys, setUserVotedPairKeys] = useState<string[]>([]);
  const [isRefreshingLeaderboard, setIsRefreshingLeaderboard] = useState(false);

  // Tournament history persistence state
  const [history, setHistory] = useState<TournamentHistoryItem[]>(() => {
    return getTournamentHistory();
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddOptionModalOpen, setIsAddOptionModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHostSettingsModalOpen, setIsHostSettingsModalOpen] = useState(false);

  // Voter ID persistence
  const [voterId] = useState<string>(() => {
    let id = localStorage.getItem('duovote_voter_id');
    if (!id) {
      id = 'voter-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('duovote_voter_id', id);
    }
    return id;
  });

  // Load voted pairs for this user and room
  useEffect(() => {
    if (!currentRoom) return;
    try {
      const saved = localStorage.getItem(`duovote_voted_pairs_${currentRoom.id}_${voterId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setUserVotedPairKeys(parsed);
          setUserVoteCount(parsed.length);
          return;
        }
      }
    } catch {}
    setUserVotedPairKeys([]);
    setUserVoteCount(0);
  }, [currentRoom?.id, voterId]);

  // Check if current user is host of this room
  const isHost = Boolean(
    currentRoom &&
      (localStorage.getItem(`duovote_hostkey_${currentRoom.id}`) === currentRoom.hostKey ||
        currentRoom.hostKey === 'demo-host-key-12345')
  );

  // Deadline check
  const isExpired = Boolean(
    currentRoom &&
      (currentRoom.status === 'closed' || getTimeRemaining(currentRoom.deadline).isExpired)
  );

  // Fetch room data from API with fallback
  const fetchRoom = useCallback(async (roomId: string, silent: boolean = false) => {
    if (!silent) setIsLoadingRoom(true);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`);
      if (!res.ok) {
        throw new Error('Hääletustuba ei leitud');
      }
      const data: Room = await res.json();
      setCurrentRoom(data);
      setRoomError(null);

      // Persist to tournament history in localStorage
      const userIsHost = Boolean(
        localStorage.getItem(`duovote_hostkey_${data.id}`) === data.hostKey ||
          data.hostKey === 'demo-host-key-12345'
      );
      const updated = saveTournamentToHistory(
        {
          id: data.id,
          title: data.title,
          category: data.category,
          totalVotes: data.totalVotes,
          optionsCount: data.options.length,
          status: data.status,
        },
        userIsHost
      );
      setHistory(updated);
    } catch (err: any) {
      if (!silent) {
        setRoomError(err.message || 'Ühendus toaga ebaõnnestus');
        setCurrentRoom(null);
      }
    } finally {
      if (!silent) setIsLoadingRoom(false);
    }
  }, []);

  // Initial room loading from URL query parameter ?room=...
  // NOTE: If no room param in URL, do NOT load demo room automatically — show HomeView!
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam.trim()) {
      fetchRoom(roomParam.trim());
    } else {
      setIsLoadingRoom(false);
      setCurrentRoom(null);
    }
  }, [fetchRoom]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam && roomParam.trim()) {
        fetchRoom(roomParam.trim());
      } else {
        setCurrentRoom(null);
        setRoomError(null);
        setIsLoadingRoom(false);
        setHistory(getTournamentHistory());
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [fetchRoom]);

  // Real-time polling every 3 seconds to keep votes and options in sync across participants
  useEffect(() => {
    if (!currentRoom) return;
    const interval = setInterval(() => {
      fetchRoom(currentRoom.id, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentRoom?.id, fetchRoom]);

  // Join room by ID
  const handleJoinRoom = (roomId: string) => {
    const cleanId = roomId.trim().toUpperCase();
    if (!cleanId) return;
    const newUrl = `${window.location.pathname}?room=${encodeURIComponent(cleanId)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    setRoomError(null);
    setCurrentTab('vote');
    fetchRoom(cleanId);
  };

  // Navigate back to Home
  const handleGoHome = () => {
    const newUrl = window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
    setCurrentRoom(null);
    setRoomError(null);
    setIsLoadingRoom(false);
    setHistory(getTournamentHistory());
  };

  // Remove room from history
  const handleRemoveFromHistory = (roomId: string) => {
    const updated = removeTournamentFromHistory(roomId);
    setHistory(updated);
  };

  // Clear all tournament history
  const handleClearHistory = () => {
    clearTournamentHistory();
    setHistory([]);
  };

  // Handle vote submission
  const handleVote = async (winnerId: string, loserId: string, isTie: boolean = false, pairKey?: string) => {
    if (!currentRoom || isExpired) return;

    const actualKey = pairKey || getPairKey(winnerId, loserId);
    const updated = [...userVotedPairKeys, actualKey];
    setUserVotedPairKeys(updated);
    setUserVoteCount(updated.length);

    try {
      localStorage.setItem(`duovote_voted_pairs_${currentRoom.id}_${voterId}`, JSON.stringify(updated));
    } catch {}

    try {
      const res = await fetch(`/api/rooms/${currentRoom.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: currentRoom.id,
          winnerId,
          loserId,
          isTie,
          voterId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Hääletamine ebaõnnestus');
      }

      const data = await res.json();
      if (data.room) {
        setCurrentRoom(data.room);
      }
    } catch (err: any) {
      console.error('Vote error:', err);
    }
  };

  // Handle creating room
  const handleCreateRoom = async (roomData: {
    title: string;
    category: string;
    hostName: string;
    allowVoterOptions: boolean;
    maxVotesPerUser: number;
    deadline: string;
    options: Array<{ title: string; description?: string; imageUrl?: string }>;
  }) => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Loomine ebaõnnestus');
    }

    const created: Room = await res.json();
    localStorage.setItem(`duovote_hostkey_${created.id}`, created.hostKey);

    const newUrl = `${window.location.pathname}?room=${encodeURIComponent(created.id)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    setCurrentRoom(created);
    setCurrentTab('vote');
    setUserVoteCount(0);
    setUserVotedPairKeys([]);
    setIsShareModalOpen(true);

    // Save to history as host
    const updated = saveTournamentToHistory(
      {
        id: created.id,
        title: created.title,
        category: created.category,
        totalVotes: created.totalVotes,
        optionsCount: created.options.length,
        status: created.status,
      },
      true
    );
    setHistory(updated);

    return created;
  };

  // Handle adding new option
  const handleAddOption = async (optionData: {
    title: string;
    description?: string;
    imageUrl?: string;
    addedByName?: string;
  }) => {
    if (!currentRoom) return;

    const hostKey = localStorage.getItem(`duovote_hostkey_${currentRoom.id}`) || undefined;

    const res = await fetch(`/api/rooms/${currentRoom.id}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...optionData,
        addedBy: isHost ? 'host' : 'voter',
        hostKey,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Valiku lisamine ebaõnnestus');
    }

    const data = await res.json();
    if (data.room) {
      setCurrentRoom(data.room);
    }
  };

  // Handle updating host settings
  const handleUpdateHostSettings = async (settings: {
    deadline?: string;
    allowVoterOptions?: boolean;
    maxVotesPerUser?: number;
    status?: 'active' | 'closed';
  }) => {
    if (!currentRoom) return;

    const hostKey = localStorage.getItem(`duovote_hostkey_${currentRoom.id}`) || currentRoom.hostKey;

    const res = await fetch(`/api/rooms/${currentRoom.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...settings,
        hostKey,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Seadete salvestamine ebaõnnestus');
    }

    const data = await res.json();
    if (data.room) {
      setCurrentRoom(data.room);
    }
  };

  const handleManualRefresh = async () => {
    if (!currentRoom) return;
    setIsRefreshingLeaderboard(true);
    await fetchRoom(currentRoom.id, true);
    setTimeout(() => setIsRefreshingLeaderboard(false), 400);
  };

  // Check if we are in mobile vote duel mode (needs fixed 100dvh without scrolling)
  const isMobileVoteDuel = currentTab === 'vote' && !isExpired && Boolean(currentRoom);

  return (
    <div
      className={`halloween-bg text-zinc-900 dark:text-zinc-100 transition-colors ${
        isMobileVoteDuel
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col'
          : 'min-h-screen flex flex-col pb-16 md:pb-0 overflow-y-auto'
      }`}
    >
      {/* Header with brand, tabs, distinct QR/Share button, and Home link */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenHostSettings={() => setIsHostSettingsModalOpen(true)}
        onGoHome={handleGoHome}
        roomCode={currentRoom?.id}
        isHost={isHost}
        isClosed={isExpired}
        savedRoomsCount={history.length}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 ${
          isMobileVoteDuel ? 'min-h-0 flex flex-col overflow-hidden' : ''
        }`}
      >
        {isLoadingRoom ? (
          <div className="flex h-96 flex-col items-center justify-center p-4">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-orange-500 border-t-transparent mb-3" />
            <p className="text-xs font-mono text-orange-600 dark:text-orange-300/80">
              Laadin hääletustuba...
            </p>
          </div>
        ) : roomError ? (
          <div className="mx-auto max-w-md py-16 px-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 mb-4">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Hääletustuba ei leitud
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 mb-6">
              {roomError}. Kontrolli koodi või vali salvestatud turniir avalehelt.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 dark:bg-[#201435] dark:hover:bg-[#2c1c47] dark:text-orange-300 font-bold text-xs border border-orange-300 dark:border-orange-500/30 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Tagasi avalehele</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Loo uus hääletus</span>
              </button>
            </div>
          </div>
        ) : !currentRoom ? (
          /* Landing / Home View */
          <HomeView
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onJoinRoom={handleJoinRoom}
            history={history}
            onRemoveFromHistory={handleRemoveFromHistory}
            onClearHistory={handleClearHistory}
          />
        ) : (
          /* Active Room View */
          <div className={isMobileVoteDuel ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : ''}>
            {/* Top Deadline and Room Info Banner with QR / Jaga shortcut */}
            <DeadlineBanner
              deadline={currentRoom.deadline}
              category={currentRoom.category}
              title={currentRoom.title}
              totalVotes={currentRoom.totalVotes}
              optionsCount={currentRoom.options.length}
              onDeadlinePassed={() => {
                if (currentRoom.status === 'active') {
                  setCurrentRoom((prev) => (prev ? { ...prev, status: 'closed' } : null));
                }
              }}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              isHost={isHost}
            />

            {/* If deadline expired: show celebration results automatically */}
            {isExpired ? (
              <FinalResultsView
                options={currentRoom.options}
                category={currentRoom.category}
                title={currentRoom.title}
                deadline={currentRoom.deadline}
                totalVotes={currentRoom.totalVotes}
                isHost={isHost}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                onReopenVoting={() => setIsHostSettingsModalOpen(true)}
              />
            ) : currentTab === 'vote' ? (
              <VotingDuel
                options={currentRoom.options}
                maxVotesPerUser={currentRoom.maxVotesPerUser || 15}
                pairCounts={currentRoom.pairCounts || {}}
                userVotedPairKeys={userVotedPairKeys}
                onVote={handleVote}
                onOpenAddOptionModal={() => setIsAddOptionModalOpen(true)}
                canAddOptions={currentRoom.allowVoterOptions || isHost}
                totalVotesCount={currentRoom.totalVotes}
                userVoteCount={userVoteCount}
                isExpired={isExpired}
                onViewLeaderboard={() => setCurrentTab('leaderboard')}
                onVotingLimitReached={() => setCurrentTab('leaderboard')}
              />
            ) : (
              <LeaderboardView
                options={currentRoom.options}
                onStartVoting={() => setCurrentTab('vote')}
                onRefresh={handleManualRefresh}
                isRefreshing={isRefreshingLeaderboard}
                isExpired={isExpired}
                totalVotes={currentRoom.totalVotes}
                userVoteCount={userVoteCount}
                votingLimit={calculateUserVotingLimit(currentRoom.options.length, currentRoom.maxVotesPerUser || 15)}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile Ergonomic Bottom Tab Bar (shown when a room is active) */}
      {currentRoom && (
        <MobileNavBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenAddOptionModal={() => setIsAddOptionModalOpen(true)}
          onOpenHostSettings={() => setIsHostSettingsModalOpen(true)}
          onGoHome={handleGoHome}
          canAddOptions={Boolean(currentRoom.allowVoterOptions || isHost)}
          isHost={isHost}
        />
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <AddOptionModal
        isOpen={isAddOptionModalOpen}
        onClose={() => setIsAddOptionModalOpen(false)}
        onAddOption={handleAddOption}
        isHost={isHost}
      />

      {currentRoom && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          roomCode={currentRoom.id}
          title={currentRoom.title}
          category={currentRoom.category}
        />
      )}

      {currentRoom && (
        <HostSettingsModal
          isOpen={isHostSettingsModalOpen}
          onClose={() => setIsHostSettingsModalOpen(false)}
          room={currentRoom}
          onUpdateSettings={handleUpdateHostSettings}
        />
      )}
    </div>
  );
}
