import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

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
}

export const useHistoricalPredictions = (limit: number = 100) => {
  return useQuery({
    queryKey: ["historicalPredictions", limit],
    queryFn: async (): Promise<{ predictions: HistoricalPrediction[]; stats: PredictionStats }> => {
      const { data, error } = await supabase
        .from("algorithm_predictions")
        .select("*")
        .order("predicted_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching historical predictions:", error);
        throw error;
      }

      const predictions = (data || []) as HistoricalPrediction[];

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

      // Calculate daily stats for charts (last 14 days)
      const today = startOfDay(new Date());
      const twoWeeksAgo = subDays(today, 13);
      const dateRange = eachDayOfInterval({ start: twoWeeksAgo, end: today });

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
        const settled = won + lost;
        const winRate = settled > 0 ? (won / settled) * 100 : 0;

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
        const settled = data.won + data.lost;
        const winRate = settled > 0 ? (data.won / settled) * 100 : 0;
        return { league, ...data, total, winRate };
      }).sort((a, b) => b.total - a.total);

      // Calculate confidence vs accuracy buckets
      const confidenceBuckets: Record<number, { won: number; lost: number }> = {};
      predictions.filter(p => p.confidence && p.status !== "pending").forEach(p => {
        // Round to nearest 10 (50-59 -> 50, 60-69 -> 60, etc.)
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
