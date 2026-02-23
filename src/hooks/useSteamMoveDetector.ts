// Steam Move Detector Hook - Detects rapid odds movements (2+ points in 5 minutes)
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
// toast import removed - not used directly in this hook
import { Match, League } from '@/types/sports';

export interface SteamMove {
  id: string;
  matchId: string;
  matchTitle: string;
  league: string;
  sportsbook: string;
  marketType: 'spread' | 'moneyline' | 'total';
  side: 'home' | 'away' | 'over' | 'under';
  previousValue: number;
  currentValue: number;
  movement: number;
  movementPct: number;
  detectedAt: string;
  timeWindow: number; // seconds
  strength: 'moderate' | 'strong' | 'extreme';
  isAlerted: boolean;
}

interface OddsSnapshot {
  matchId: string;
  timestamp: number;
  spreads: Record<string, { home: number; away: number }>;
  totals: Record<string, { over: number; under: number; line: number }>;
  moneylines: Record<string, { home: number; away: number }>;
}

// Detection thresholds
const STEAM_THRESHOLDS = {
  SPREAD_POINTS: 2.0,      // 2+ point spread move
  TOTAL_POINTS: 2.0,       // 2+ point total move  
  MONEYLINE_MOVE: 30,      // 30+ point moneyline swing
  TIME_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  POLL_INTERVAL_MS: 30 * 1000,   // Check every 30 seconds
};

const STRENGTH_LEVELS = {
  moderate: { spread: 2.0, total: 2.0, ml: 30 },
  strong: { spread: 3.0, total: 3.0, ml: 50 },
  extreme: { spread: 4.0, total: 4.0, ml: 75 },
};

export function useSteamMoveDetector(
  matches: Match[],
  options: {
    enabled?: boolean;
    alertsEnabled?: boolean;
    leagues?: League[];
  } = {}
) {
  const { enabled = true, alertsEnabled = true, leagues } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [steamMoves, setSteamMoves] = useState<SteamMove[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const oddsHistoryRef = useRef<Map<string, OddsSnapshot[]>>(new Map());
  const alertedMovesRef = useRef<Set<string>>(new Set());

  // Get strength level based on movement magnitude
  const getStrength = (movement: number, type: 'spread' | 'total' | 'moneyline'): SteamMove['strength'] => {
    const key = type === 'moneyline' ? 'ml' : type;
    if (Math.abs(movement) >= STRENGTH_LEVELS.extreme[key]) return 'extreme';
    if (Math.abs(movement) >= STRENGTH_LEVELS.strong[key]) return 'strong';
    return 'moderate';
  };

  // Extract current odds from match
  const extractOddsSnapshot = useCallback((match: Match): OddsSnapshot | null => {
    if (!match.liveOdds || match.liveOdds.length === 0) return null;

    const homeTeamName = typeof match.homeTeam === 'string' ? match.homeTeam : match.homeTeam.name;
    const awayTeamName = typeof match.awayTeam === 'string' ? match.awayTeam : match.awayTeam.name;

    const snapshot: OddsSnapshot = {
      matchId: match.id,
      timestamp: Date.now(),
      spreads: {},
      totals: {},
      moneylines: {},
    };

    for (const odds of match.liveOdds) {
      const book = odds.sportsbook.name;
      
      // Moneylines
      snapshot.moneylines[book] = {
        home: odds.homeWin,
        away: odds.awayWin,
      };

      // Spreads
      if (odds.spread) {
        snapshot.spreads[book] = {
          home: odds.spread.homeSpread,
          away: odds.spread.awaySpread,
        };
      }

      // Totals
      if (odds.totals) {
        snapshot.totals[book] = {
          over: odds.totals.overOdds,
          under: odds.totals.underOdds,
          line: odds.totals.total,
        };
      }
    }

    return snapshot;
  }, []);

  // Compare snapshots to detect steam moves
  const detectSteamMoves = useCallback((
    matchId: string,
    matchTitle: string,
    league: string,
    currentSnapshot: OddsSnapshot,
    historicalSnapshots: OddsSnapshot[]
  ): SteamMove[] => {
    const detected: SteamMove[] = [];
    const now = Date.now();
    const cutoff = now - STEAM_THRESHOLDS.TIME_WINDOW_MS;

    // Find oldest snapshot within time window
    const relevantSnapshots = historicalSnapshots.filter(s => s.timestamp >= cutoff);
    if (relevantSnapshots.length === 0) return detected;

    const oldestSnapshot = relevantSnapshots[0];
    const timeWindowSecs = Math.round((now - oldestSnapshot.timestamp) / 1000);

    // Check each sportsbook for movements
    for (const book of Object.keys(currentSnapshot.spreads)) {
      const oldSpread = oldestSnapshot.spreads[book];
      const newSpread = currentSnapshot.spreads[book];

      if (oldSpread && newSpread) {
        // Home spread movement
        const homeSpreadMove = newSpread.home - oldSpread.home;
        if (Math.abs(homeSpreadMove) >= STEAM_THRESHOLDS.SPREAD_POINTS) {
          const moveId = `${matchId}-spread-home-${book}-${Math.floor(now / 60000)}`;
          detected.push({
            id: moveId,
            matchId,
            matchTitle,
            league,
            sportsbook: book,
            marketType: 'spread',
            side: homeSpreadMove > 0 ? 'away' : 'home', // If spread increases, money on away
            previousValue: oldSpread.home,
            currentValue: newSpread.home,
            movement: homeSpreadMove,
            movementPct: Math.abs(homeSpreadMove / Math.abs(oldSpread.home || 1)) * 100,
            detectedAt: new Date().toISOString(),
            timeWindow: timeWindowSecs,
            strength: getStrength(homeSpreadMove, 'spread'),
            isAlerted: false,
          });
        }
      }
    }

    // Check totals
    for (const book of Object.keys(currentSnapshot.totals)) {
      const oldTotal = oldestSnapshot.totals[book];
      const newTotal = currentSnapshot.totals[book];

      if (oldTotal && newTotal) {
        const totalMove = newTotal.line - oldTotal.line;
        if (Math.abs(totalMove) >= STEAM_THRESHOLDS.TOTAL_POINTS) {
          const moveId = `${matchId}-total-${book}-${Math.floor(now / 60000)}`;
          detected.push({
            id: moveId,
            matchId,
            matchTitle,
            league,
            sportsbook: book,
            marketType: 'total',
            side: totalMove > 0 ? 'over' : 'under',
            previousValue: oldTotal.line,
            currentValue: newTotal.line,
            movement: totalMove,
            movementPct: Math.abs(totalMove / oldTotal.line) * 100,
            detectedAt: new Date().toISOString(),
            timeWindow: timeWindowSecs,
            strength: getStrength(totalMove, 'total'),
            isAlerted: false,
          });
        }
      }
    }

    // Check moneylines
    for (const book of Object.keys(currentSnapshot.moneylines)) {
      const oldML = oldestSnapshot.moneylines[book];
      const newML = currentSnapshot.moneylines[book];

      if (oldML && newML) {
        const homeMLMove = newML.home - oldML.home;
        if (Math.abs(homeMLMove) >= STEAM_THRESHOLDS.MONEYLINE_MOVE) {
          const moveId = `${matchId}-ml-home-${book}-${Math.floor(now / 60000)}`;
          detected.push({
            id: moveId,
            matchId,
            matchTitle,
            league,
            sportsbook: book,
            marketType: 'moneyline',
            side: homeMLMove < 0 ? 'home' : 'away', // If home ML drops, money on home
            previousValue: oldML.home,
            currentValue: newML.home,
            movement: homeMLMove,
            movementPct: Math.abs(homeMLMove / Math.abs(oldML.home)) * 100,
            detectedAt: new Date().toISOString(),
            timeWindow: timeWindowSecs,
            strength: getStrength(homeMLMove, 'moneyline'),
            isAlerted: false,
          });
        }
      }
    }

    return detected;
  }, []);

  // Save steam move to database
  const saveSteamMove = useCallback(async (move: SteamMove) => {
    if (!user) return;

    try {
      await supabase.from('user_alerts').insert({
        user_id: user.id,
        type: 'steam_move',
        title: `Steam Move: ${move.matchTitle}`,
        message: `${move.strength.toUpperCase()} ${move.marketType} move detected! ${move.side.toUpperCase()} moved ${move.movement > 0 ? '+' : ''}${move.movement.toFixed(1)} points in ${Math.round(move.timeWindow / 60)} mins on ${move.sportsbook}`,
        match_id: move.matchId,
        metadata: {
          ...move,
          alertType: 'steam_move',
        },
      });
    } catch (error) {
      console.error('Error saving steam move alert:', error);
    }
  }, [user]);

  // Main monitoring function
  const monitorMatches = useCallback(() => {
    if (!enabled || matches.length === 0) return;

    setIsMonitoring(true);
    const newSteamMoves: SteamMove[] = [];

    for (const match of matches) {
      // Filter by league if specified
      if (leagues && !leagues.includes(match.league)) continue;

      const homeTeamName = typeof match.homeTeam === 'string' ? match.homeTeam : match.homeTeam.name;
      const awayTeamName = typeof match.awayTeam === 'string' ? match.awayTeam : match.awayTeam.name;
      const matchTitle = `${awayTeamName} @ ${homeTeamName}`;

      const snapshot = extractOddsSnapshot(match);
      if (!snapshot) continue;

      // Get or create history for this match
      const history = oddsHistoryRef.current.get(match.id) || [];
      
      // Add current snapshot to history
      history.push(snapshot);
      
      // Keep only snapshots within time window + buffer
      const cutoff = Date.now() - STEAM_THRESHOLDS.TIME_WINDOW_MS * 2;
      const trimmedHistory = history.filter(s => s.timestamp >= cutoff);
      oddsHistoryRef.current.set(match.id, trimmedHistory);

      // Detect steam moves
      if (trimmedHistory.length >= 2) {
        const detected = detectSteamMoves(
          match.id,
          matchTitle,
          match.league,
          snapshot,
          trimmedHistory
        );

        for (const move of detected) {
          // Check if already alerted
          if (!alertedMovesRef.current.has(move.id)) {
            alertedMovesRef.current.add(move.id);
            newSteamMoves.push(move);

            // Save to database only (toast notifications disabled)
            if (alertsEnabled) {
              saveSteamMove(move);
            }
          }
        }
      }
    }

    if (newSteamMoves.length > 0) {
      setSteamMoves(prev => [...newSteamMoves, ...prev].slice(0, 50));
    }

    setIsMonitoring(false);
  }, [matches, enabled, alertsEnabled, leagues, extractOddsSnapshot, detectSteamMoves, saveSteamMove]);

  // Set up polling interval
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    monitorMatches();

    // Poll for changes
    const interval = setInterval(monitorMatches, STEAM_THRESHOLDS.POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [enabled, monitorMatches]);

  // Clean up old alerted moves periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      // Clear alerted moves older than 1 hour
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const newAlerted = new Set<string>();
      alertedMovesRef.current.forEach(id => {
        const timestamp = parseInt(id.split('-').pop() || '0', 10) * 60000;
        if (timestamp > oneHourAgo) {
          newAlerted.add(id);
        }
      });
      alertedMovesRef.current = newAlerted;
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  // Statistics
  const stats = {
    totalDetected: steamMoves.length,
    extreme: steamMoves.filter(m => m.strength === 'extreme').length,
    strong: steamMoves.filter(m => m.strength === 'strong').length,
    moderate: steamMoves.filter(m => m.strength === 'moderate').length,
    byMarket: {
      spread: steamMoves.filter(m => m.marketType === 'spread').length,
      total: steamMoves.filter(m => m.marketType === 'total').length,
      moneyline: steamMoves.filter(m => m.marketType === 'moneyline').length,
    },
  };

  return {
    steamMoves,
    stats,
    isMonitoring,
    clearAlerts: () => setSteamMoves([]),
  };
}
