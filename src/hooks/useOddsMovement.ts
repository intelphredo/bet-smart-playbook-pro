import { useState, useEffect, useRef, useMemo } from "react";
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
  isRecent: boolean; // True if change happened in last 5 minutes
}

interface OddsSnapshot {
  homeWin: number;
  awayWin: number;
  spread?: number;
  total?: number;
  timestamp: number;
}

const MOVEMENT_THRESHOLD = 0.02; // Minimum change to register as movement
const RECENT_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function useOddsMovement(liveOdds?: LiveOdds[], matchId?: string): OddsMovement | null {
  const previousOddsRef = useRef<Map<string, OddsSnapshot>>(new Map());
  const [movement, setMovement] = useState<OddsMovement | null>(null);

  const primaryOdds = useMemo(() => getPrimaryOdds(liveOdds || []), [liveOdds]);

  useEffect(() => {
    if (!primaryOdds || !matchId) {
      setMovement(null);
      return;
    }

    const key = `${matchId}-${primaryOdds.sportsbook.id}`;
    const now = Date.now();
    
    const currentSnapshot: OddsSnapshot = {
      homeWin: primaryOdds.homeWin,
      awayWin: primaryOdds.awayWin,
      spread: primaryOdds.spread?.homeSpread,
      total: primaryOdds.totals?.total,
      timestamp: now,
    };

    const previousSnapshot = previousOddsRef.current.get(key);

    if (previousSnapshot) {
      const homeChange = currentSnapshot.homeWin - previousSnapshot.homeWin;
      const awayChange = currentSnapshot.awayWin - previousSnapshot.awayWin;
      const spreadChange = currentSnapshot.spread !== undefined && previousSnapshot.spread !== undefined
        ? currentSnapshot.spread - previousSnapshot.spread
        : undefined;
      const totalChange = currentSnapshot.total !== undefined && previousSnapshot.total !== undefined
        ? currentSnapshot.total - previousSnapshot.total
        : undefined;

      const getDirection = (change: number): MovementDirection => {
        if (Math.abs(change) < MOVEMENT_THRESHOLD) return 'stable';
        return change > 0 ? 'up' : 'down';
      };

      const isRecent = now - previousSnapshot.timestamp < RECENT_THRESHOLD_MS;

      setMovement({
        homeDirection: getDirection(homeChange),
        awayDirection: getDirection(awayChange),
        homeChange: Math.round(homeChange * 100) / 100,
        awayChange: Math.round(awayChange * 100) / 100,
        spreadDirection: spreadChange !== undefined ? getDirection(spreadChange) : undefined,
        spreadChange: spreadChange !== undefined ? Math.round(spreadChange * 10) / 10 : undefined,
        totalDirection: totalChange !== undefined ? getDirection(totalChange) : undefined,
        totalChange: totalChange !== undefined ? Math.round(totalChange * 10) / 10 : undefined,
        lastUpdated: new Date(now).toISOString(),
        isRecent,
      });
    }

    // Store current snapshot for next comparison
    previousOddsRef.current.set(key, currentSnapshot);

  }, [primaryOdds, matchId]);

  return movement;
}

// Simulated movement for demo purposes when no real changes detected
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
      isRecent: seed < 20, // ~20% show as recent
    };
  }, [primaryOdds]);
}
