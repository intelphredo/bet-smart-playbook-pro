import { useState, useEffect, useCallback } from "react";
import { Match, LiveOdds } from "@/types/sports";

export interface OddsHistoryPoint {
  timestamp: string;
  homeWin: number;
  awayWin: number;
  draw?: number;
  sportsbook: string;
}

export interface OddsHistory {
  matchId: string;
  history: OddsHistoryPoint[];
}

// In-memory storage for odds history (resets on page refresh)
const oddsHistoryStore: Map<string, OddsHistoryPoint[]> = new Map();

export function useOddsHistory(match: Match) {
  const [history, setHistory] = useState<OddsHistoryPoint[]>([]);

  // Update history when odds change
  const updateHistory = useCallback(() => {
    if (!match.liveOdds || match.liveOdds.length === 0) return;

    const matchId = match.id;
    const existingHistory = oddsHistoryStore.get(matchId) || [];
    const now = new Date().toISOString();

    // Add new data points for each sportsbook
    const newPoints: OddsHistoryPoint[] = [];
    
    match.liveOdds.forEach((odds: LiveOdds) => {
      // Check if we already have a recent entry for this sportsbook (within 1 minute)
      const recentEntry = existingHistory.find(h => 
        h.sportsbook === odds.sportsbook.name &&
        new Date(h.timestamp).getTime() > Date.now() - 60000
      );

      if (!recentEntry) {
        newPoints.push({
          timestamp: now,
          homeWin: odds.homeWin,
          awayWin: odds.awayWin,
          draw: odds.draw,
          sportsbook: odds.sportsbook.name
        });
      }
    });

    if (newPoints.length > 0) {
      const updatedHistory = [...existingHistory, ...newPoints];
      // Keep only last 50 data points per match
      const trimmedHistory = updatedHistory.slice(-50);
      oddsHistoryStore.set(matchId, trimmedHistory);
      setHistory(trimmedHistory);
    } else {
      setHistory(existingHistory);
    }
  }, [match.id, match.liveOdds]);

  useEffect(() => {
    updateHistory();
  }, [updateHistory]);

  // Generate simulated historical data for demo purposes
  const getChartData = useCallback(() => {
    if (history.length === 0 && match.liveOdds && match.liveOdds.length > 0) {
      // Generate simulated historical data based on current odds
      const simulatedHistory: OddsHistoryPoint[] = [];
      const now = new Date();
      
      // Get unique sportsbooks
      const sportsbooks = [...new Set(match.liveOdds.map(o => o.sportsbook.name))];
      
      // Generate 6 historical points over the last 6 hours
      for (let i = 5; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
        
        sportsbooks.forEach((sportsbook, idx) => {
          const currentOdds = match.liveOdds?.find(o => o.sportsbook.name === sportsbook);
          if (currentOdds) {
            // Add slight random variation to simulate historical movement
            const variation = (Math.random() - 0.5) * 0.1;
            const homeVariation = 1 + variation * (5 - i) / 5;
            const awayVariation = 1 - variation * (5 - i) / 5;
            
            simulatedHistory.push({
              timestamp,
              homeWin: Math.round(currentOdds.homeWin * homeVariation * 100) / 100,
              awayWin: Math.round(currentOdds.awayWin * awayVariation * 100) / 100,
              draw: currentOdds.draw ? Math.round(currentOdds.draw * 100) / 100 : undefined,
              sportsbook
            });
          }
        });
      }
      
      // Add current odds as final point
      match.liveOdds.forEach(odds => {
        simulatedHistory.push({
          timestamp: now.toISOString(),
          homeWin: odds.homeWin,
          awayWin: odds.awayWin,
          draw: odds.draw,
          sportsbook: odds.sportsbook.name
        });
      });
      
      return simulatedHistory;
    }
    
    return history;
  }, [history, match.liveOdds]);

  return {
    history,
    chartData: getChartData(),
    hasHistory: history.length > 0 || (match.liveOdds && match.liveOdds.length > 0)
  };
}
