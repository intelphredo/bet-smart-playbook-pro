import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export interface PredictionStats {
  total: number;
  won: number;
  lost: number;
  pending: number;
  winRate: number;
  avgConfidence: number;
  byLeague: Record<string, { won: number; lost: number; pending: number }>;
}

export const useHistoricalPredictions = (limit: number = 50) => {
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

      // Calculate stats
      const stats: PredictionStats = {
        total: predictions.length,
        won: predictions.filter(p => p.status === "won").length,
        lost: predictions.filter(p => p.status === "lost").length,
        pending: predictions.filter(p => p.status === "pending").length,
        winRate: 0,
        avgConfidence: 0,
        byLeague: {},
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

      return { predictions, stats };
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
