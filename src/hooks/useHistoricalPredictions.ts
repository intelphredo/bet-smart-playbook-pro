import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subWeeks, subMonths, startOfDay, eachDayOfInterval } from "date-fns";

export type TimeRange = "1d" | "7d" | "14d" | "1m" | "3m" | "all";
export type PredictionType = "all" | "live" | "prelive";

export interface HistoricalPrediction {
  id: string;
  match_id: string;
  league: string | null;
  algorithm_id: string | null;
  prediction: string | null;
  confidence: number | null;
  projected_score_home: number | null;
  projected_score_away: number | null;
  actual_score_home: number | null;
  actual_score_away: number | null;
  status: string;
  accuracy_rating: number | null;
  predicted_at: string;
  result_updated_at: string | null;
  is_live_prediction: boolean | null;
  home_team: string | null;
  away_team: string | null;
  match_title: string | null;
}

export interface DailyStats {
  date: string;
  dateLabel: string;
  won: number;
  lost: number;
  pending: number;
  total: number;
  winRate: number;
  cumulativeWinRate: number;
  avgConfidence: number;
}

export interface LeaguePerformance {
  league: string;
  won: number;
  lost: number;
  pending: number;
  total: number;
  winRate: number;
}

export interface PredictionStats {
  total: number;
  won: number;
  lost: number;
  pending: number;
  winRate: number;
  avgConfidence: number;
  byLeague: Record<string, { won: number; lost: number; pending: number }>;
  dailyStats: DailyStats[];
  leaguePerformance: LeaguePerformance[];
  confidenceVsAccuracy: { confidence: number; winRate: number; count: number }[];
  liveStats: { total: number; won: number; lost: number; pending: number; winRate: number };
  preliveStats: { total: number; won: number; lost: number; pending: number; winRate: number };
}

const getDateFromRange = (range: TimeRange): Date | null => {
  const now = new Date();
  switch (range) {
    case "1d":
      return subDays(now, 1);
    case "7d":
      return subDays(now, 7);
    case "14d":
      return subDays(now, 14);
    case "1m":
      return subMonths(now, 1);
    case "3m":
      return subMonths(now, 3);
    case "all":
    default:
      return null;
  }
};

const getDaysForRange = (range: TimeRange): number => {
  switch (range) {
    case "1d": return 1;
    case "7d": return 7;
    case "14d": return 14;
    case "1m": return 30;
    case "3m": return 90;
    case "all": return 30; // Default to 30 days for chart
    default: return 14;
  }
};

export const useHistoricalPredictions = (
  timeRange: TimeRange = "14d",
  predictionType: PredictionType = "all"
) => {
  return useQuery({
    queryKey: ["historicalPredictions", timeRange, predictionType],
    queryFn: async (): Promise<{ predictions: HistoricalPrediction[]; stats: PredictionStats }> => {
      // Fetch all predictions matching time range - we'll sort client-side for proper ordering
      let query = supabase
        .from("algorithm_predictions")
        .select("*");

      // Apply time range filter based on when prediction was created OR graded
      const startDate = getDateFromRange(timeRange);
      if (startDate) {
        // Include predictions made OR graded within the time range
        query = query.or(`predicted_at.gte.${startDate.toISOString()},result_updated_at.gte.${startDate.toISOString()}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching historical predictions:", error);
        throw error;
      }

      // Use database column for is_live_prediction, with fallback for old records
      // Sort by most recent activity: graded predictions by result_updated_at, pending by predicted_at
      let predictions = (data || []).map(p => ({
        ...p,
        // Use the database column if set, otherwise infer for backwards compatibility
        is_live_prediction: p.is_live_prediction ?? (
          p.match_id?.includes("live") || 
          (p.actual_score_home !== null && p.projected_score_home === null) ||
          (p.algorithm_id?.includes("live"))
        )
      })) as HistoricalPrediction[];

      // Sort: settled predictions (won/lost) by result_updated_at DESC, then pending by predicted_at DESC
      predictions.sort((a, b) => {
        const aIsSettled = a.status === 'won' || a.status === 'lost';
        const bIsSettled = b.status === 'won' || b.status === 'lost';
        
        // Get the relevant timestamp for sorting
        const aTime = aIsSettled && a.result_updated_at 
          ? new Date(a.result_updated_at).getTime() 
          : new Date(a.predicted_at).getTime();
        const bTime = bIsSettled && b.result_updated_at 
          ? new Date(b.result_updated_at).getTime() 
          : new Date(b.predicted_at).getTime();
        
        return bTime - aTime; // Descending (most recent first)
      });

      // Filter by prediction type
      if (predictionType === "live") {
        predictions = predictions.filter(p => p.is_live_prediction);
      } else if (predictionType === "prelive") {
        predictions = predictions.filter(p => !p.is_live_prediction);
      }

      // Calculate live vs prelive stats
      const livePredictions = predictions.filter(p => p.is_live_prediction);
      const prelivePredictions = predictions.filter(p => !p.is_live_prediction);

      const calcTypeStats = (preds: HistoricalPrediction[]) => {
        const won = preds.filter(p => p.status === "won").length;
        const lost = preds.filter(p => p.status === "lost").length;
        const pending = preds.filter(p => p.status === "pending").length;
        const settled = won + lost;
        return {
          total: preds.length,
          won,
          lost,
          pending,
          winRate: settled > 0 ? (won / settled) * 100 : 0,
        };
      };

      // Calculate basic stats
      const stats: PredictionStats = {
        total: predictions.length,
        won: predictions.filter(p => p.status === "won").length,
        lost: predictions.filter(p => p.status === "lost").length,
        pending: predictions.filter(p => p.status === "pending").length,
        winRate: 0,
        avgConfidence: 0,
        byLeague: {},
        dailyStats: [],
        leaguePerformance: [],
        confidenceVsAccuracy: [],
        liveStats: calcTypeStats(livePredictions),
        preliveStats: calcTypeStats(prelivePredictions),
      };

      // Calculate win rate (excluding pending)
      const settled = stats.won + stats.lost;
      stats.winRate = settled > 0 ? (stats.won / settled) * 100 : 0;

      // Calculate average confidence
      const confidences = predictions.filter(p => p.confidence).map(p => p.confidence!);
      stats.avgConfidence = confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0;

      // Group by league
      predictions.forEach(p => {
        const league = p.league || "Unknown";
        if (!stats.byLeague[league]) {
          stats.byLeague[league] = { won: 0, lost: 0, pending: 0 };
        }
        if (p.status === "won") stats.byLeague[league].won++;
        else if (p.status === "lost") stats.byLeague[league].lost++;
        else stats.byLeague[league].pending++;
      });

      // Calculate daily stats for charts based on time range
      const daysToShow = getDaysForRange(timeRange);
      const today = startOfDay(new Date());
      const rangeStart = subDays(today, daysToShow - 1);
      const dateRange = eachDayOfInterval({ start: rangeStart, end: today });

      let cumulativeWon = 0;
      let cumulativeLost = 0;

      stats.dailyStats = dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayPredictions = predictions.filter(p => {
          const predDate = format(new Date(p.predicted_at), "yyyy-MM-dd");
          return predDate === dateStr;
        });

        const won = dayPredictions.filter(p => p.status === "won").length;
        const lost = dayPredictions.filter(p => p.status === "lost").length;
        const pending = dayPredictions.filter(p => p.status === "pending").length;
        const total = dayPredictions.length;
        const daySettled = won + lost;
        const winRate = daySettled > 0 ? (won / daySettled) * 100 : 0;

        cumulativeWon += won;
        cumulativeLost += lost;
        const cumulativeSettled = cumulativeWon + cumulativeLost;
        const cumulativeWinRate = cumulativeSettled > 0 
          ? (cumulativeWon / cumulativeSettled) * 100 
          : 0;

        const dayConfidences = dayPredictions.filter(p => p.confidence).map(p => p.confidence!);
        const avgConfidence = dayConfidences.length > 0
          ? dayConfidences.reduce((a, b) => a + b, 0) / dayConfidences.length
          : 0;

        return {
          date: dateStr,
          dateLabel: format(date, "MMM d"),
          won,
          lost,
          pending,
          total,
          winRate,
          cumulativeWinRate,
          avgConfidence,
        };
      });

      // Calculate league performance for chart
      stats.leaguePerformance = Object.entries(stats.byLeague).map(([league, data]) => {
        const total = data.won + data.lost + data.pending;
        const leagueSettled = data.won + data.lost;
        const winRate = leagueSettled > 0 ? (data.won / leagueSettled) * 100 : 0;
        return { league, ...data, total, winRate };
      }).sort((a, b) => b.total - a.total);

      // Calculate confidence vs accuracy buckets
      const confidenceBuckets: Record<number, { won: number; lost: number }> = {};
      predictions.filter(p => p.confidence && p.status !== "pending").forEach(p => {
        const bucket = Math.floor(p.confidence! / 10) * 10;
        if (!confidenceBuckets[bucket]) {
          confidenceBuckets[bucket] = { won: 0, lost: 0 };
        }
        if (p.status === "won") confidenceBuckets[bucket].won++;
        else confidenceBuckets[bucket].lost++;
      });

      stats.confidenceVsAccuracy = Object.entries(confidenceBuckets)
        .map(([conf, data]) => {
          const total = data.won + data.lost;
          return {
            confidence: parseInt(conf),
            winRate: total > 0 ? (data.won / total) * 100 : 0,
            count: total,
          };
        })
        .sort((a, b) => a.confidence - b.confidence);

      return { predictions, stats };
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
