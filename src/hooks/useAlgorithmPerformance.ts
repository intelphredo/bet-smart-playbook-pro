
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BettingAlgorithm } from "@/types/sports";

interface UseAlgorithmPerformanceProps {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export const useAlgorithmPerformance = ({ dateRange }: UseAlgorithmPerformanceProps = {}) => {
  return useQuery({
    queryKey: ["algorithmPerformance", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("algorithms")
        .select(`
          id,
          name,
          description,
          algorithm_stats (
            total_predictions,
            correct_predictions,
            win_rate,
            avg_confidence
          ),
          algorithm_predictions (
            status,
            predicted_at
          )
        `);

      const { data: algorithms, error: algorithmsError } = await query;

      if (algorithmsError) throw algorithmsError;

      return algorithms.map(algorithm => {
        // Use optional chaining and provide default values
        const stats = algorithm.algorithm_stats?.[0] || {
          total_predictions: 0,
          correct_predictions: 0,
          win_rate: 0,
          avg_confidence: 0
        };
        
        let predictions = algorithm.algorithm_predictions || [];

        // Apply date range filter if provided
        if (dateRange?.start || dateRange?.end) {
          predictions = predictions.filter(pred => {
            const predDate = new Date(pred.predicted_at);
            if (dateRange.start && predDate < dateRange.start) return false;
            if (dateRange.end && predDate > dateRange.end) return false;
            return true;
          });
        }

        // Get recent predictions
        const recentPredictions = predictions
          .sort((a, b) => new Date(b.predicted_at).getTime() - new Date(a.predicted_at).getTime())
          .slice(0, 5)
          .map(p => p.status === 'win' ? 'W' : 'L');

        // Calculate win rate for filtered predictions
        const totalPicks = predictions.length;
        const wins = predictions.filter(p => p.status === 'win').length;
        const winRate = totalPicks > 0 ? Math.round((wins / totalPicks) * 100) : 0;

        return {
          name: algorithm.name,
          description: algorithm.description,
          winRate,
          recentResults: recentPredictions,
          totalPicks
        } as BettingAlgorithm;
      });
    },
    refetchInterval: 60000 // Refetch every minute
  });
};
