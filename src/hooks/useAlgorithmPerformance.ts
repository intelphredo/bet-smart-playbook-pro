
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { BettingAlgorithm } from "@/types/sports";

const REFERENCE_DATE = "2025-04-19";

export const useAlgorithmPerformance = () => {
  return useQuery({
    queryKey: ["algorithmPerformance"],
    queryFn: async () => {
      // Fetch algorithms with their predictions since the reference date
      const { data: algorithms, error: algorithmsError } = await supabase
        .from("algorithms")
        .select(`
          id,
          name,
          description,
          algorithm_predictions (
            status,
            predicted_at,
            confidence
          )
        `);

      if (algorithmsError) throw algorithmsError;

      return algorithms.map(algorithm => {
        const predictions = algorithm.algorithm_predictions || [];
        const recentPredictions = predictions
          .filter(p => p.predicted_at >= REFERENCE_DATE)
          .sort((a, b) => new Date(b.predicted_at).getTime() - new Date(a.predicted_at).getTime());
        
        const totalPredictions = recentPredictions.length;
        const wins = recentPredictions.filter(p => p.status === 'win').length;
        const winRate = totalPredictions > 0 ? Math.round((wins / totalPredictions) * 100) : 0;

        // Get last 5 results
        const recentResults = recentPredictions
          .filter(p => p.status !== 'pending')
          .slice(0, 5)
          .map(p => p.status === 'win' ? 'W' : 'L');

        return {
          name: algorithm.name,
          description: algorithm.description,
          winRate,
          recentResults,
          totalPicks: totalPredictions
        } as BettingAlgorithm;
      });
    },
    refetchInterval: 60000 // Refetch every minute
  });
};
