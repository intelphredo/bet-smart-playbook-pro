import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export function useOddsHistory(match: Match) {
  const [history, setHistory] = useState<OddsHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRealData, setHasRealData] = useState(false);

  // Fetch real odds history from database
  const fetchHistory = useCallback(async () => {
    if (!match.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("odds_history")
        .select("*")
        .eq("match_id", match.id)
        .eq("market_type", "moneyline")
        .order("recorded_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching odds history:", error);
        setHasRealData(false);
        return;
      }

      if (data && data.length > 0) {
        const historyPoints: OddsHistoryPoint[] = data.map((record: any) => ({
          timestamp: record.recorded_at,
          homeWin: record.home_odds || 0,
          awayWin: record.away_odds || 0,
          draw: record.draw_odds,
          sportsbook: record.sportsbook_name,
        }));

        setHistory(historyPoints);
        setHasRealData(true);
      } else {
        setHasRealData(false);
      }
    } catch (error) {
      console.error("Error fetching odds history:", error);
      setHasRealData(false);
    } finally {
      setIsLoading(false);
    }
  }, [match.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Generate simulated historical data for demo when no real data exists
  const getChartData = useCallback(() => {
    // If we have real data, use it
    if (hasRealData && history.length > 0) {
      return history;
    }

    // Otherwise generate simulated data based on current odds
    if (!match.liveOdds || match.liveOdds.length === 0) {
      return [];
    }

    const simulatedHistory: OddsHistoryPoint[] = [];
    const now = new Date();
    
    // Get unique sportsbooks
    const sportsbooks = [...new Set(match.liveOdds.map(o => o.sportsbook.name))];
    
    // Generate 6 historical points over the last 6 hours
    for (let i = 5; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
      
      sportsbooks.forEach((sportsbook) => {
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
  }, [history, hasRealData, match.liveOdds]);

  // Calculate movement trends
  const getMovementTrends = useMemo(() => {
    const chartData = getChartData();
    if (chartData.length < 2) return null;

    const sportsbooks = [...new Set(chartData.map(d => d.sportsbook))];
    const trends: Record<string, { home: 'up' | 'down' | 'stable'; away: 'up' | 'down' | 'stable'; homeChange: number; awayChange: number }> = {};

    sportsbooks.forEach(sportsbook => {
      const sportsbookData = chartData.filter(d => d.sportsbook === sportsbook);
      if (sportsbookData.length >= 2) {
        const first = sportsbookData[0];
        const last = sportsbookData[sportsbookData.length - 1];

        const homeChange = last.homeWin - first.homeWin;
        const awayChange = last.awayWin - first.awayWin;

        trends[sportsbook] = {
          home: Math.abs(homeChange) < 0.02 ? 'stable' : homeChange > 0 ? 'up' : 'down',
          away: Math.abs(awayChange) < 0.02 ? 'stable' : awayChange > 0 ? 'up' : 'down',
          homeChange: Math.round(homeChange * 100) / 100,
          awayChange: Math.round(awayChange * 100) / 100,
        };
      }
    });

    return trends;
  }, [getChartData]);

  return {
    history,
    chartData: getChartData(),
    hasHistory: history.length > 0 || (match.liveOdds && match.liveOdds.length > 0),
    hasRealData,
    isLoading,
    movementTrends: getMovementTrends,
    refetch: fetchHistory,
  };
}
