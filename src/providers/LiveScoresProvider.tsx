/**
 * Live Scores Provider
 * 
 * Provides centralized live score updates to all child components
 * using the tiered polling system.
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { Match, League } from '@/types/sports';
import { LiveScoreData, ConnectionStatus, MatchSubscription } from '@/types/live-scores';
import { useLiveScores } from '@/hooks/useLiveScores';

interface LiveScoresContextValue {
  /** Get live score for a specific match */
  getScore: (matchId: string) => LiveScoreData | undefined;
  /** Check if a match has live data */
  hasLiveData: (matchId: string) => boolean;
  /** Get the updated score for a match (from live data or original) */
  getUpdatedScore: (matchId: string, originalScore?: { home?: number; away?: number }) => { home: number; away: number };
  /** Get the period/status for a match */
  getPeriod: (matchId: string, originalPeriod?: string) => string;
  /** Check if data is stale for a match */
  isStale: (matchId: string) => boolean;
  /** Get the last update time for a match */
  getLastUpdate: (matchId: string) => string | null;
  /** Connection status */
  connectionStatus: ConnectionStatus;
  /** Force refresh all scores */
  refresh: () => void;
  /** Stats for debugging */
  stats: {
    activePolling: number;
    activeWebSocket: number;
    staleCount: number;
    errorCount: number;
  };
  /** All subscriptions */
  subscriptions: Map<string, MatchSubscription>;
  /** Loading state */
  isLoading: boolean;
}

const LiveScoresContext = createContext<LiveScoresContextValue | null>(null);

interface LiveScoresProviderProps {
  children: React.ReactNode;
  /** All matches to track */
  matches: Match[];
  /** Match IDs that have user bets (priority updates) */
  matchesWithBets?: string[];
  /** Enable/disable live updates */
  enabled?: boolean;
  /** Callback when score changes */
  onScoreChange?: (matchId: string, score: { home: number; away: number }) => void;
}

export function LiveScoresProvider({
  children,
  matches,
  matchesWithBets = [],
  enabled = true,
  onScoreChange,
}: LiveScoresProviderProps) {
  const {
    scores,
    isLoading,
    connectionStatus,
    subscriptions,
    refresh,
    stats,
  } = useLiveScores({
    matches,
    matchesWithBets,
    enabled,
    useWebSocket: true,
    onScoreChange,
  });

  const getScore = useCallback((matchId: string): LiveScoreData | undefined => {
    return scores.get(matchId);
  }, [scores]);

  const hasLiveData = useCallback((matchId: string): boolean => {
    return scores.has(matchId);
  }, [scores]);

  const getUpdatedScore = useCallback((
    matchId: string, 
    originalScore?: { home?: number; away?: number }
  ): { home: number; away: number } => {
    const liveScore = scores.get(matchId);
    if (liveScore) {
      return liveScore.score;
    }
    return {
      home: originalScore?.home ?? 0,
      away: originalScore?.away ?? 0,
    };
  }, [scores]);

  const getPeriod = useCallback((matchId: string, originalPeriod?: string): string => {
    const liveScore = scores.get(matchId);
    if (liveScore?.period) {
      return liveScore.clock 
        ? `${liveScore.period} ${liveScore.clock}`
        : liveScore.period;
    }
    return originalPeriod || '';
  }, [scores]);

  const isStale = useCallback((matchId: string): boolean => {
    const liveScore = scores.get(matchId);
    return liveScore?.isStale ?? false;
  }, [scores]);

  const getLastUpdate = useCallback((matchId: string): string | null => {
    const liveScore = scores.get(matchId);
    return liveScore?.lastUpdate ?? null;
  }, [scores]);

  const value = useMemo<LiveScoresContextValue>(() => ({
    getScore,
    hasLiveData,
    getUpdatedScore,
    getPeriod,
    isStale,
    getLastUpdate,
    connectionStatus,
    refresh,
    stats,
    subscriptions,
    isLoading,
  }), [
    getScore,
    hasLiveData,
    getUpdatedScore,
    getPeriod,
    isStale,
    getLastUpdate,
    connectionStatus,
    refresh,
    stats,
    subscriptions,
    isLoading,
  ]);

  return (
    <LiveScoresContext.Provider value={value}>
      {children}
    </LiveScoresContext.Provider>
  );
}

/**
 * Hook to access live scores context
 */
export function useLiveScoresContext(): LiveScoresContextValue {
  const context = useContext(LiveScoresContext);
  if (!context) {
    // Return a noop implementation if not inside provider
    return {
      getScore: () => undefined,
      hasLiveData: () => false,
      getUpdatedScore: (_, original) => ({ home: original?.home ?? 0, away: original?.away ?? 0 }),
      getPeriod: (_, original) => original || '',
      isStale: () => false,
      getLastUpdate: () => null,
      connectionStatus: {
        type: 'polling',
        isConnected: false,
        lastHeartbeat: null,
        reconnectAttempts: 0,
        quality: 'disconnected',
        activeConnections: 0,
        maxConnections: 3,
      },
      refresh: () => {},
      stats: { activePolling: 0, activeWebSocket: 0, staleCount: 0, errorCount: 0 },
      subscriptions: new Map(),
      isLoading: false,
    };
  }
  return context;
}

/**
 * Hook to get live score for a specific match
 */
export function useMatchLiveScore(matchId: string) {
  const { getScore, hasLiveData, isStale, getLastUpdate } = useLiveScoresContext();
  
  return {
    liveScore: getScore(matchId),
    hasLiveData: hasLiveData(matchId),
    isStale: isStale(matchId),
    lastUpdate: getLastUpdate(matchId),
  };
}

export default LiveScoresProvider;
