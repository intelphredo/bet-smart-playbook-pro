import { useMemo } from 'react';
import { useSportsData } from './useSportsData';
import { applyAlgorithmPredictions, AlgorithmType, ALGORITHM_IDS } from '@/utils/predictions/algorithms';
import { Match } from '@/types/sports';
import { parseISO, isToday, addDays, isBefore } from 'date-fns';

export interface RecommendedPick {
  match: Match;
  algorithmId: string;
  algorithmName: string;
  confidence: number;
  expectedValue: number;
  recommendation: 'home' | 'away' | 'draw';
  recommendedTeam: string;
  odds: number;
  evPercentage: number;
  kellyStakeUnits: number;
  projectedScore: {
    home: number;
    away: number;
  };
}

const ALGORITHM_NAMES: Record<AlgorithmType, string> = {
  ML_POWER_INDEX: 'ML Power Index',
  VALUE_PICK_FINDER: 'Value Pick Finder',
  STATISTICAL_EDGE: 'Statistical Edge',
};

/**
 * Hook to get recommended picks from the prediction engine
 * Filters for high-confidence, positive EV picks from upcoming matches
 */
export function useRecommendedPicks(options: {
  minConfidence?: number;
  minEV?: number;
  limit?: number;
  algorithm?: AlgorithmType;
  includeTodayOnly?: boolean;
} = {}) {
  const {
    minConfidence = 55,
    minEV = 0,
    limit = 10,
    algorithm = 'STATISTICAL_EDGE',
    includeTodayOnly = false,
  } = options;

  const {
    upcomingMatches,
    isLoading,
    error,
    lastRefreshTime,
    refetchWithTimestamp,
  } = useSportsData({
    league: 'ALL',
    refreshInterval: 60000,
    includeSchedule: true,
    useExternalApis: true,
  });

  const recommendedPicks = useMemo(() => {
    if (!Array.isArray(upcomingMatches) || upcomingMatches.length === 0) return [];

    // Filter matches based on date
    const now = new Date();
    const maxDate = includeTodayOnly ? now : addDays(now, 7);
    
    const filteredMatches = upcomingMatches.filter((match) => {
      try {
        const matchDate = parseISO(match.startTime);
        if (includeTodayOnly) {
          return isToday(matchDate);
        }
        return isBefore(matchDate, maxDate);
      } catch {
        return false;
      }
    });

    // Apply algorithm predictions
    const predictedMatches = applyAlgorithmPredictions(filteredMatches, algorithm);

    // Convert to recommended picks and filter by criteria
    const picks: RecommendedPick[] = predictedMatches
      .filter((match) => {
        const prediction = match.prediction;
        if (!prediction) return false;
        
        const confidence = prediction.confidence || 0;
        const evPercentage = prediction.evPercentage || 0;
        
        return confidence >= minConfidence && evPercentage >= minEV;
      })
      .map((match) => {
        const prediction = match.prediction!;
        const recommendation = prediction.recommended;
        const recommendedTeam = 
          recommendation === 'home' 
            ? match.homeTeam.name 
            : recommendation === 'away' 
              ? match.awayTeam.name 
              : 'Draw';
        const odds = 
          recommendation === 'home' 
            ? match.odds.homeWin 
            : recommendation === 'away' 
              ? match.odds.awayWin 
              : match.odds.draw || 0;

        return {
          match,
          algorithmId: ALGORITHM_IDS[algorithm],
          algorithmName: ALGORITHM_NAMES[algorithm],
          confidence: prediction.confidence,
          expectedValue: prediction.expectedValue || 0,
          recommendation,
          recommendedTeam,
          odds,
          evPercentage: prediction.evPercentage || 0,
          kellyStakeUnits: prediction.kellyStakeUnits || 0,
          projectedScore: prediction.projectedScore,
        };
      })
      // Sort by expected value (highest first)
      .sort((a, b) => b.evPercentage - a.evPercentage)
      .slice(0, limit);

    return picks;
  }, [upcomingMatches, algorithm, minConfidence, minEV, limit, includeTodayOnly]);

  // Get top picks by different criteria
  const topByConfidence = useMemo(() => 
    [...recommendedPicks].sort((a, b) => b.confidence - a.confidence).slice(0, 3),
    [recommendedPicks]
  );

  const topByEV = useMemo(() => 
    [...recommendedPicks].sort((a, b) => b.evPercentage - a.evPercentage).slice(0, 3),
    [recommendedPicks]
  );

  return {
    picks: recommendedPicks,
    topByConfidence,
    topByEV,
    isLoading,
    error,
    lastRefreshTime,
    refetch: refetchWithTimestamp,
    totalUpcoming: Array.isArray(upcomingMatches) ? upcomingMatches.length : 0,
  };
}
