import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ALGORITHM_IDS, getAlgorithmNameFromId } from '@/utils/predictions/algorithms';
import { subDays, startOfDay, format } from 'date-fns';

export interface AlgorithmAccuracyStats {
  algorithmId: string;
  algorithmName: string;
  totalPredictions: number;
  correctPredictions: number;
  winRate: number;
  avgConfidence: number;
  avgAccuracyRating: number;
  recentResults: ('W' | 'L')[];
  byLeague: {
    league: string;
    total: number;
    wins: number;
    winRate: number;
  }[];
  byConfidenceRange: {
    range: string;
    minConfidence: number;
    maxConfidence: number;
    total: number;
    wins: number;
    winRate: number;
  }[];
  trend: {
    date: string;
    wins: number;
    losses: number;
    winRate: number;
  }[];
}

export interface AlgorithmPrediction {
  id: string;
  matchId: string;
  league: string;
  algorithmId: string;
  prediction: string;
  confidence: number;
  projectedScoreHome: number | null;
  projectedScoreAway: number | null;
  actualScoreHome: number | null;
  actualScoreAway: number | null;
  status: 'pending' | 'won' | 'lost';
  accuracyRating: number | null;
  predictedAt: string;
  resultUpdatedAt: string | null;
}

interface UseAlgorithmAccuracyOptions {
  days?: number;
  algorithmId?: string;
}

export function useAlgorithmAccuracy(options: UseAlgorithmAccuracyOptions = {}) {
  const { days = 30, algorithmId } = options;

  return useQuery({
    queryKey: ['algorithmAccuracy', days, algorithmId],
    queryFn: async (): Promise<AlgorithmAccuracyStats[]> => {
      const startDate = startOfDay(subDays(new Date(), days)).toISOString();
      
      // Build query
      let query = supabase
        .from('algorithm_predictions')
        .select('*')
        .gte('predicted_at', startDate)
        .order('predicted_at', { ascending: false });

      if (algorithmId) {
        query = query.eq('algorithm_id', algorithmId);
      }

      const { data: predictions, error } = await query;

      if (error) {
        console.error('Error fetching algorithm predictions:', error);
        throw error;
      }

      // Group by algorithm
      const algorithmMap = new Map<string, typeof predictions>();
      
      for (const pred of predictions || []) {
        const algId = pred.algorithm_id || 'unknown';
        if (!algorithmMap.has(algId)) {
          algorithmMap.set(algId, []);
        }
        algorithmMap.get(algId)!.push(pred);
      }

      // Calculate stats for each algorithm
      const results: AlgorithmAccuracyStats[] = [];

      for (const [algId, preds] of algorithmMap) {
        const settledPreds = preds.filter(p => p.status === 'won' || p.status === 'lost');
        const wins = settledPreds.filter(p => p.status === 'won').length;
        const total = settledPreds.length;

        // Recent results (last 10)
        const recentResults = settledPreds
          .slice(0, 10)
          .map(p => (p.status === 'won' ? 'W' : 'L') as 'W' | 'L');

        // By league breakdown
        const leagueMap = new Map<string, { total: number; wins: number }>();
        for (const pred of settledPreds) {
          const league = pred.league || 'Unknown';
          if (!leagueMap.has(league)) {
            leagueMap.set(league, { total: 0, wins: 0 });
          }
          const stats = leagueMap.get(league)!;
          stats.total++;
          if (pred.status === 'won') stats.wins++;
        }

        const byLeague = Array.from(leagueMap.entries()).map(([league, stats]) => ({
          league,
          total: stats.total,
          wins: stats.wins,
          winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
        })).sort((a, b) => b.total - a.total);

        // By confidence range
        const confidenceRanges = [
          { range: '50-59%', minConfidence: 50, maxConfidence: 59 },
          { range: '60-69%', minConfidence: 60, maxConfidence: 69 },
          { range: '70-79%', minConfidence: 70, maxConfidence: 79 },
          { range: '80%+', minConfidence: 80, maxConfidence: 100 },
        ];

        const byConfidenceRange = confidenceRanges.map(range => {
          const inRange = settledPreds.filter(
            p => (p.confidence || 0) >= range.minConfidence && 
                 (p.confidence || 0) <= range.maxConfidence
          );
          const rangeWins = inRange.filter(p => p.status === 'won').length;
          return {
            ...range,
            total: inRange.length,
            wins: rangeWins,
            winRate: inRange.length > 0 ? (rangeWins / inRange.length) * 100 : 0,
          };
        });

        // Daily trend (last 7 days)
        const trendMap = new Map<string, { wins: number; losses: number }>();
        for (let i = 0; i < 7; i++) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          trendMap.set(date, { wins: 0, losses: 0 });
        }

        for (const pred of settledPreds) {
          const date = format(new Date(pred.predicted_at), 'yyyy-MM-dd');
          if (trendMap.has(date)) {
            const stats = trendMap.get(date)!;
            if (pred.status === 'won') stats.wins++;
            else stats.losses++;
          }
        }

        const trend = Array.from(trendMap.entries())
          .map(([date, stats]) => ({
            date: format(new Date(date), 'MMM d'),
            wins: stats.wins,
            losses: stats.losses,
            winRate: stats.wins + stats.losses > 0 
              ? (stats.wins / (stats.wins + stats.losses)) * 100 
              : 0,
          }))
          .reverse();

        // Calculate averages
        const avgConfidence = preds.length > 0
          ? preds.reduce((sum, p) => sum + (p.confidence || 0), 0) / preds.length
          : 0;

        const ratedPreds = settledPreds.filter(p => p.accuracy_rating !== null);
        const avgAccuracyRating = ratedPreds.length > 0
          ? ratedPreds.reduce((sum, p) => sum + (p.accuracy_rating || 0), 0) / ratedPreds.length
          : 0;

        results.push({
          algorithmId: algId,
          algorithmName: getAlgorithmNameFromId(algId),
          totalPredictions: total,
          correctPredictions: wins,
          winRate: total > 0 ? (wins / total) * 100 : 0,
          avgConfidence,
          avgAccuracyRating,
          recentResults,
          byLeague,
          byConfidenceRange,
          trend,
        });
      }

      // Sort by total predictions (most active first)
      return results.sort((a, b) => b.totalPredictions - a.totalPredictions);
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
}

// Hook to fetch recent predictions with details
export function useRecentPredictions(options: { limit?: number; algorithmId?: string } = {}) {
  const { limit = 20, algorithmId } = options;

  return useQuery({
    queryKey: ['recentPredictions', limit, algorithmId],
    queryFn: async (): Promise<AlgorithmPrediction[]> => {
      let query = supabase
        .from('algorithm_predictions')
        .select('*')
        .order('predicted_at', { ascending: false })
        .limit(limit);

      if (algorithmId) {
        query = query.eq('algorithm_id', algorithmId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recent predictions:', error);
        throw error;
      }

      return (data || []).map(p => ({
        id: p.id,
        matchId: p.match_id,
        league: p.league || 'Unknown',
        algorithmId: p.algorithm_id || 'unknown',
        prediction: p.prediction || '',
        confidence: p.confidence || 0,
        projectedScoreHome: p.projected_score_home,
        projectedScoreAway: p.projected_score_away,
        actualScoreHome: p.actual_score_home,
        actualScoreAway: p.actual_score_away,
        status: (p.status === 'won' ? 'won' : p.status === 'lost' ? 'lost' : 'pending') as 'pending' | 'won' | 'lost',
        accuracyRating: p.accuracy_rating,
        predictedAt: p.predicted_at,
        resultUpdatedAt: p.result_updated_at,
      }));
    },
    staleTime: 30000,
  });
}
