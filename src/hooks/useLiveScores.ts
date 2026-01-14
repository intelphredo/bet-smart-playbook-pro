/**
 * Smart Live Scores Hook
 * 
 * Implements tiered polling based on:
 * - League priority (Tier 1/2/3)
 * - Game state (pre/live/finished)
 * - User bets (critical priority for games with bets)
 * 
 * Features:
 * - Dynamic polling intervals
 * - Exponential backoff on errors
 * - Automatic stop for finished games
 * - WebSocket for critical games
 * - Batched requests by league
 * - Delta updates for efficiency
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { League, Match } from '@/types/sports';
import { LiveScoreData, ConnectionStatus, MatchSubscription } from '@/types/live-scores';
import { 
  getPollingInterval, 
  calculateBackoffDelay, 
  isDataStale, 
  groupMatchesByLeague,
  getLeagueTier,
  WEBSOCKET_CONFIG,
  GameState,
} from '@/config/live-scores';
import { liveScoreWebSocket } from '@/services/live-score-websocket';
import { liveScoreMonitor } from '@/services/live-score-monitoring';
import { isMatchLive, isMatchFinished } from '@/utils/matchStatus';
import { fetchESPNEvents } from '@/services/espnApi';

interface UseLiveScoresOptions {
  /** Matches to track */
  matches: Match[];
  /** Match IDs that have user bets (get priority) */
  matchesWithBets?: string[];
  /** Enable/disable polling */
  enabled?: boolean;
  /** Use WebSocket for critical games */
  useWebSocket?: boolean;
  /** Callback when score changes */
  onScoreChange?: (matchId: string, score: { home: number; away: number }) => void;
}

interface UseLiveScoresResult {
  /** Updated scores by match ID */
  scores: Map<string, LiveScoreData>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Connection status */
  connectionStatus: ConnectionStatus;
  /** Subscription info for each match */
  subscriptions: Map<string, MatchSubscription>;
  /** Force refresh all scores */
  refresh: () => void;
  /** Last update timestamp */
  lastUpdate: Date | null;
  /** Stats for debugging */
  stats: {
    activePolling: number;
    activeWebSocket: number;
    staleCount: number;
    errorCount: number;
  };
}

/**
 * Determine game state from match status
 */
function getGameState(match: Match): GameState {
  const status = match.status?.toLowerCase() || '';
  
  if (isMatchFinished(status)) return 'finished';
  if (isMatchLive(status)) {
    if (status.includes('halftime') || status.includes('half time')) return 'halftime';
    return 'live';
  }
  if (status.includes('delay') || status.includes('postpone')) return 'delayed';
  return 'pre';
}

/**
 * Convert Match to LiveScoreData
 */
function matchToLiveScore(match: Match): LiveScoreData {
  const gameState = getGameState(match);
  
  return {
    matchId: match.id,
    league: match.league,
    score: {
      home: match.score?.home ?? 0,
      away: match.score?.away ?? 0,
    },
    period: match.score?.period || '',
    clock: '',
    gameState,
    events: [],
    lastUpdate: match.lastUpdated || new Date().toISOString(),
    updateType: 'full',
    changedFields: [],
    source: 'polling',
    isStale: isDataStale(match.lastUpdated),
    connectionQuality: 'good',
  };
}

export function useLiveScores({
  matches,
  matchesWithBets = [],
  enabled = true,
  useWebSocket = true,
  onScoreChange,
}: UseLiveScoresOptions): UseLiveScoresResult {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Map<string, LiveScoreData>>(new Map());
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    type: 'polling',
    isConnected: false,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    quality: 'disconnected',
    activeConnections: 0,
    maxConnections: WEBSOCKET_CONFIG.MAX_CONNECTIONS,
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Refs for cleanup and tracking
  const pollingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const errorCountRef = useRef<Map<string, number>>(new Map());
  const finishedStopTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const previousScoresRef = useRef<Map<string, { home: number; away: number }>>(new Map());
  const webSocketUnsubsRef = useRef<Map<string, () => void>>(new Map());

  // Group matches by league for batched fetching
  const matchesByLeague = useMemo(() => {
    return groupMatchesByLeague(matches);
  }, [matches]);

  // Determine which matches need WebSocket (critical priority)
  const criticalMatches = useMemo(() => {
    return matches.filter(match => {
      const isLive = isMatchLive(match.status);
      const hasBet = matchesWithBets.includes(match.id);
      const isTier1 = getLeagueTier(match.league) === 1;
      return isLive && (hasBet || isTier1);
    });
  }, [matches, matchesWithBets]);

  // Subscribe to WebSocket status changes
  useEffect(() => {
    const unsubscribe = liveScoreWebSocket.onStatusChange((status) => {
      setConnectionStatus(status);
    });
    return unsubscribe;
  }, []);

  /**
   * Fetch scores for a batch of matches in a league
   */
  const fetchLeagueScores = useCallback(async (league: League, matchIds: string[]): Promise<LiveScoreData[]> => {
    const startTime = performance.now();
    try {
      const events = await fetchESPNEvents(league);
      const latency = performance.now() - startTime;
      
      // Record successful request to monitor
      liveScoreMonitor.recordRequest(league, true, latency);
      
      // Filter to only requested matches and convert
      const liveScores: LiveScoreData[] = [];
      
      for (const event of events) {
        if (matchIds.some(id => event.id === id || id.includes(event.id))) {
          const match = matches.find(m => m.id === event.id || event.id.includes(m.id));
          if (match) {
            liveScores.push(matchToLiveScore({
              ...match,
              score: event.score,
              status: match.status,
              lastUpdated: new Date().toISOString(),
            }));
          }
        }
      }
      
      return liveScores;
    } catch (err) {
      const latency = performance.now() - startTime;
      liveScoreMonitor.recordRequest(league, false, latency);
      console.error(`[LiveScores] Error fetching ${league}:`, err);
      throw err;
    }
  }, [matches]);

  /**
   * Handle score update (from polling or WebSocket)
   */
  const handleScoreUpdate = useCallback((liveScore: LiveScoreData) => {
    setScores(prev => {
      const updated = new Map(prev);
      updated.set(liveScore.matchId, liveScore);
      return updated;
    });

    // Record update to monitor
    liveScoreMonitor.recordScoreUpdate(liveScore.matchId);
    liveScoreMonitor.recordMatchState(liveScore.matchId, liveScore.league, liveScore.gameState === 'live');

    // Check for score changes
    const prevScore = previousScoresRef.current.get(liveScore.matchId);
    if (prevScore && 
        (prevScore.home !== liveScore.score.home || prevScore.away !== liveScore.score.away)) {
      onScoreChange?.(liveScore.matchId, liveScore.score);
    }
    previousScoresRef.current.set(liveScore.matchId, liveScore.score);

    setLastUpdate(new Date());
    setError(null);
    
    // Reset error count on success
    errorCountRef.current.set(liveScore.matchId, 0);
  }, [onScoreChange]);

  /**
   * Handle fetch error with backoff
   */
  const handleFetchError = useCallback((matchId: string, err: Error) => {
    const currentCount = errorCountRef.current.get(matchId) || 0;
    errorCountRef.current.set(matchId, currentCount + 1);
    
    if (currentCount === 0) {
      setError(err);
    }
    
    return calculateBackoffDelay(currentCount);
  }, []);

  /**
   * Start polling for a match
   */
  const startPolling = useCallback((match: Match) => {
    // Clear existing timer
    const existingTimer = pollingTimersRef.current.get(match.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const gameState = getGameState(match);
    const hasBet = matchesWithBets.includes(match.id);
    
    // Don't poll finished games (unless recently finished)
    if (gameState === 'finished') {
      if (!finishedStopTimersRef.current.has(match.id)) {
        // Stop polling after 5 minutes
        const stopTimer = setTimeout(() => {
          pollingTimersRef.current.delete(match.id);
          finishedStopTimersRef.current.delete(match.id);
        }, 5 * 60 * 1000);
        finishedStopTimersRef.current.set(match.id, stopTimer);
      }
    }

    // Calculate polling interval
    let interval = getPollingInterval(match.league, gameState);
    
    // Faster polling for matches with bets
    if (hasBet && gameState === 'live') {
      interval = Math.min(interval, 5000); // Max 5 seconds for bet matches
    }
    
    // Apply backoff if there were errors
    const errorCount = errorCountRef.current.get(match.id) || 0;
    if (errorCount > 0) {
      interval = Math.max(interval, calculateBackoffDelay(errorCount));
    }

    const poll = async () => {
      try {
        const scores = await fetchLeagueScores(match.league, [match.id]);
        scores.forEach(handleScoreUpdate);
      } catch (err) {
        const backoffDelay = handleFetchError(match.id, err as Error);
        interval = backoffDelay;
      }

      // Schedule next poll
      if (enabled && gameState !== 'finished') {
        const timer = setTimeout(poll, interval);
        pollingTimersRef.current.set(match.id, timer);
      }
    };

    // Start polling
    const timer = setTimeout(poll, interval);
    pollingTimersRef.current.set(match.id, timer);
  }, [matchesWithBets, enabled, fetchLeagueScores, handleScoreUpdate, handleFetchError]);

  /**
   * Setup WebSocket subscriptions for critical matches
   */
  useEffect(() => {
    if (!enabled || !useWebSocket) return;

    for (const match of criticalMatches) {
      if (webSocketUnsubsRef.current.has(match.id)) continue;

      const priority = matchesWithBets.includes(match.id) ? 0 : 1;
      
      const unsub = liveScoreWebSocket.subscribe(
        match.id,
        match.league,
        priority,
        handleScoreUpdate
      );
      
      webSocketUnsubsRef.current.set(match.id, unsub);
    }

    // Cleanup old subscriptions
    for (const [matchId, unsub] of webSocketUnsubsRef.current.entries()) {
      if (!criticalMatches.some(m => m.id === matchId)) {
        unsub();
        webSocketUnsubsRef.current.delete(matchId);
      }
    }
  }, [criticalMatches, enabled, useWebSocket, matchesWithBets, handleScoreUpdate]);

  /**
   * Setup polling for non-WebSocket matches
   */
  useEffect(() => {
    if (!enabled) return;

    for (const match of matches) {
      // Skip if using WebSocket
      if (liveScoreWebSocket.hasConnection(match.id)) continue;

      const gameState = getGameState(match);
      
      // Only poll live games and recently finished
      if (gameState === 'live' || 
          (gameState === 'finished' && finishedStopTimersRef.current.has(match.id)) ||
          gameState === 'halftime') {
        startPolling(match);
      }
    }

    return () => {
      // Cleanup timers
      for (const timer of pollingTimersRef.current.values()) {
        clearTimeout(timer);
      }
      pollingTimersRef.current.clear();
    };
  }, [matches, enabled, startPolling]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clear all timers
      for (const timer of pollingTimersRef.current.values()) {
        clearTimeout(timer);
      }
      for (const timer of finishedStopTimersRef.current.values()) {
        clearTimeout(timer);
      }
      // Unsubscribe WebSockets
      for (const unsub of webSocketUnsubsRef.current.values()) {
        unsub();
      }
    };
  }, []);

  /**
   * Build subscriptions map for debugging
   */
  const subscriptions = useMemo(() => {
    const subs = new Map<string, MatchSubscription>();
    
    for (const match of matches) {
      const gameState = getGameState(match);
      const hasBet = matchesWithBets.includes(match.id);
      const hasWebSocket = liveScoreWebSocket.hasConnection(match.id);
      const scoreData = scores.get(match.id);
      
      subs.set(match.id, {
        matchId: match.id,
        league: match.league,
        priority: hasBet ? 'critical' : getLeagueTier(match.league) === 1 ? 'high' : 'normal',
        hasUserBet: hasBet,
        connectionType: hasWebSocket ? 'websocket' : 'polling',
        pollingInterval: getPollingInterval(match.league, gameState),
        lastUpdate: scoreData?.lastUpdate || null,
        errorCount: errorCountRef.current.get(match.id) || 0,
        isActive: gameState === 'live' || pollingTimersRef.current.has(match.id),
      });
    }
    
    return subs;
  }, [matches, matchesWithBets, scores]);

  /**
   * Calculate stats
   */
  const stats = useMemo(() => {
    let staleCount = 0;
    let errorCount = 0;
    
    for (const [matchId, score] of scores.entries()) {
      if (score.isStale) staleCount++;
      errorCount += errorCountRef.current.get(matchId) || 0;
    }
    
    return {
      activePolling: pollingTimersRef.current.size,
      activeWebSocket: connectionStatus.activeConnections,
      staleCount,
      errorCount,
    };
  }, [scores, connectionStatus.activeConnections]);

  /**
   * Force refresh all scores
   */
  const refresh = useCallback(async () => {
    const allMatchIds = matches.map(m => m.id);
    
    for (const [league, leagueMatches] of matchesByLeague.entries()) {
      try {
        const matchIds = leagueMatches.map(m => m.id);
        const scores = await fetchLeagueScores(league, matchIds);
        scores.forEach(handleScoreUpdate);
      } catch (err) {
        console.error(`[LiveScores] Failed to refresh ${league}:`, err);
      }
    }
  }, [matches, matchesByLeague, fetchLeagueScores, handleScoreUpdate]);

  return {
    scores,
    isLoading: scores.size === 0 && matches.length > 0,
    error,
    connectionStatus,
    subscriptions,
    refresh,
    lastUpdate,
    stats,
  };
}

export default useLiveScores;
