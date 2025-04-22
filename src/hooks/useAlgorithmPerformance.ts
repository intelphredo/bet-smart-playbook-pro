
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BettingAlgorithm } from "@/types/sports";

export const useAlgorithmPerformance = () => {
  return useQuery({
    queryKey: ["algorithmPerformance"],
    queryFn: async () => {
      // Fetch algorithms with their stats
      const { data: algorithms, error: algorithmsError } = await supabase
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

      if (algorithmsError) throw algorithmsError;

      return algorithms.map(algorithm => {
        // Use optional chaining and provide default values to handle potential undefined stats
        const stats = algorithm.algorithm_stats?.[0] || {
          total_predictions: 0,
          correct_predictions: 0,
          win_rate: 0,
          avg_confidence: 0
        };
        
        const recentPredictions = (algorithm.algorithm_predictions || [])
          .sort((a, b) => new Date(b.predicted_at).getTime() - new Date(a.predicted_at).getTime())
          .slice(0, 5)
          .map(p => p.status === 'win' ? 'W' : 'L');

        return {
          name: algorithm.name,
          description: algorithm.description,
          winRate: Math.round(stats.win_rate || 0),
          recentResults: recentPredictions,
          totalPicks: stats.total_predictions || 0
        } as BettingAlgorithm;
      });
    },
    refetchInterval: 60000 // Refetch every minute
  });
};
