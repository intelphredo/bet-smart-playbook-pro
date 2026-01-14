import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LiveOdds } from "@/types/sports";
import { getPrimaryOdds, PRIMARY_SPORTSBOOK } from "@/utils/sportsbook";

export type MovementDirection = 'up' | 'down' | 'stable';

export interface OddsMovement {
  homeDirection: MovementDirection;
  awayDirection: MovementDirection;
  homeChange: number;
  awayChange: number;
  spreadDirection?: MovementDirection;
  spreadChange?: number;
  totalDirection?: MovementDirection;
  totalChange?: number;
  lastUpdated: string;
  isRecent: boolean;
  hasRealData: boolean;
}

export interface OddsHistoryPoint {
  timestamp: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  sportsbookId: string;
  sportsbookName: string;
}

const MOVEMENT_THRESHOLD = 0.02;
const RECENT_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Hook to fetch real odds movement data from database
 */
export function useRealOddsMovement(matchId?: string, liveOdds?: LiveOdds[]): OddsMovement | null {
  const [movement, setMovement] = useState<OddsMovement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const primaryOdds = useMemo(() => getPrimaryOdds(liveOdds || []), [liveOdds]);

  useEffect(() => {
    if (!matchId || !primaryOdds) {
      setMovement(null);
      return;
    }

    const fetchOddsHistory = async () => {
      setIsLoading(true);
      try {
        // Fetch last 2 odds records for this match and sportsbook
        const { data, error } = await supabase
          .from("odds_history")
          .select("*")
          .eq("match_id", matchId)
          .eq("market_type", "moneyline")
          .ilike("sportsbook_id", `%${PRIMARY_SPORTSBOOK}%`)
          .order("recorded_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching odds history:", error);
          setMovement(null);
          return;
        }

        if (data && data.length >= 2) {
          const latest = data[0];
          const previous = data[1];
          
          const homeChange = (latest.home_odds || 0) - (previous.home_odds || 0);
          const awayChange = (latest.away_odds || 0) - (previous.away_odds || 0);
          
          const getDirection = (change: number): MovementDirection => {
            if (Math.abs(change) < MOVEMENT_THRESHOLD) return 'stable';
            return change > 0 ? 'up' : 'down';
          };

          const recordedAt = new Date(latest.recorded_at || latest.created_at || '');
          const isRecent = Date.now() - recordedAt.getTime() < RECENT_THRESHOLD_MS;

          setMovement({
            homeDirection: getDirection(homeChange),
            awayDirection: getDirection(awayChange),
            homeChange: Math.round(homeChange * 100) / 100,
            awayChange: Math.round(awayChange * 100) / 100,
            lastUpdated: recordedAt.toISOString(),
            isRecent,
            hasRealData: true,
          });
        } else {
          // Not enough data for movement calculation
          setMovement(null);
        }
      } catch (err) {
        console.error("Error in useRealOddsMovement:", err);
        setMovement(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOddsHistory();
  }, [matchId, primaryOdds]);

  return movement;
}

/**
 * Hook to fetch full odds history for charts
 */
export function useOddsHistoryData(matchId?: string, sportsbookFilter?: string) {
  const [history, setHistory] = useState<OddsHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRealData, setHasRealData] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!matchId) {
      setHistory([]);
      setHasRealData(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from("odds_history")
        .select("*")
        .eq("match_id", matchId)
        .eq("market_type", "moneyline")
        .order("recorded_at", { ascending: true })
        .limit(100);

      if (sportsbookFilter) {
        query = query.ilike("sportsbook_id", `%${sportsbookFilter}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching odds history:", error);
        setHistory([]);
        setHasRealData(false);
        return;
      }

      if (data && data.length > 0) {
        const historyPoints: OddsHistoryPoint[] = data.map((record) => ({
          timestamp: record.recorded_at || record.created_at || '',
          homeOdds: record.home_odds || 0,
          awayOdds: record.away_odds || 0,
          drawOdds: record.draw_odds || undefined,
          sportsbookId: record.sportsbook_id,
          sportsbookName: record.sportsbook_name,
        }));

        setHistory(historyPoints);
        setHasRealData(true);
      } else {
        setHistory([]);
        setHasRealData(false);
      }
    } catch (err) {
      console.error("Error in useOddsHistoryData:", err);
      setHistory([]);
      setHasRealData(false);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, sportsbookFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, hasRealData, refetch: fetchHistory };
}

/**
 * Hook for simulated movement when no real data exists
 * Falls back to this when real data isn't available
 */
export function useSimulatedMovement(liveOdds?: LiveOdds[]): OddsMovement | null {
  const primaryOdds = useMemo(() => getPrimaryOdds(liveOdds || []), [liveOdds]);
  
  return useMemo(() => {
    if (!primaryOdds) return null;

    // Generate pseudo-random but consistent movement based on odds values
    const seed = (primaryOdds.homeWin * 100 + primaryOdds.awayWin * 100) % 100;
    
    // Create movement patterns based on the seed
    const homeMovement = seed % 3; // 0=stable, 1=up, 2=down
    const awayMovement = (seed + 1) % 3;
    
    const directions: MovementDirection[] = ['stable', 'up', 'down'];
    
    // Only show movement for ~40% of matches to keep it realistic
    if (seed > 40) {
      return null;
    }

    return {
      homeDirection: directions[homeMovement],
      awayDirection: directions[awayMovement],
      homeChange: homeMovement === 1 ? 0.05 : homeMovement === 2 ? -0.03 : 0,
      awayChange: awayMovement === 1 ? 0.04 : awayMovement === 2 ? -0.06 : 0,
      lastUpdated: new Date().toISOString(),
      isRecent: seed < 20,
      hasRealData: false,
    };
  }, [primaryOdds]);
}

/**
 * Combined hook that uses real data when available, falls back to simulated
 */
export function useOddsMovement(matchId?: string, liveOdds?: LiveOdds[]): OddsMovement | null {
  const realMovement = useRealOddsMovement(matchId, liveOdds);
  const simulatedMovement = useSimulatedMovement(liveOdds);

  // Prefer real data when available
  return realMovement?.hasRealData ? realMovement : simulatedMovement;
}

/**
 * Hook for subscribing to real-time odds updates
 */
export function useRealtimeOddsUpdates(matchId?: string) {
  const [latestOdds, setLatestOdds] = useState<OddsHistoryPoint | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`odds-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'odds_history',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const record = payload.new as any;
          if (record.market_type === 'moneyline') {
            setLatestOdds({
              timestamp: record.recorded_at || record.created_at,
              homeOdds: record.home_odds || 0,
              awayOdds: record.away_odds || 0,
              drawOdds: record.draw_odds,
              sportsbookId: record.sportsbook_id,
              sportsbookName: record.sportsbook_name,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  return latestOdds;
}
