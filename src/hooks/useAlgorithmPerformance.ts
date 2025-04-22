
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
      try {
        console.log("Fetching algorithm performance data", dateRange ? "with date filter" : "all-time");
        
        // First, get all algorithms with their all-time stats
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
            )
          `);

        if (algorithmsError) {
          console.error("Error fetching algorithms:", algorithmsError);
          throw algorithmsError;
        }

        // If we have a date range, fetch filtered predictions
        let filteredStats: Record<string, { total: number; wins: number; confidence_sum: number }> = {};
        
        if (dateRange?.start || dateRange?.end) {
          console.log("Fetching filtered predictions for date range:", 
            dateRange.start ? dateRange.start.toISOString() : 'beginning',
            "to",
            dateRange.end ? dateRange.end.toISOString() : 'now');
            
          const { data: predictions, error: predictionsError } = await supabase
            .from("algorithm_predictions")
            .select(`
              algorithm_id,
              status,
              predicted_at,
              confidence
            `)
            .gte('predicted_at', dateRange.start ? dateRange.start.toISOString() : '1970-01-01')
            .lte('predicted_at', dateRange.end ? dateRange.end.toISOString() : new Date().toISOString());

          if (predictionsError) {
            console.error("Error fetching predictions:", predictionsError);
            throw predictionsError;
          }

          // Calculate filtered stats for each algorithm
          filteredStats = predictions.reduce((acc, pred) => {
            if (!acc[pred.algorithm_id]) {
              acc[pred.algorithm_id] = {
                total: 0,
                wins: 0,
                confidence_sum: 0
              };
            }
            acc[pred.algorithm_id].total++;
            if (pred.status === 'win') acc[pred.algorithm_id].wins++;
            acc[pred.algorithm_id].confidence_sum += pred.confidence;
            return acc;
          }, {} as Record<string, { total: number; wins: number; confidence_sum: number }>);
        }

        const results: Array<BettingAlgorithm & { isFiltered: boolean; totalPicks: number; }> = [];
        
        for (const algorithm of algorithms) {
          // Use filtered stats if date range is active, otherwise use all-time stats
          const stats = dateRange?.start || dateRange?.end
            ? filteredStats[algorithm.id] || { total: 0, wins: 0, confidence_sum: 0 }
            : algorithm.algorithm_stats?.[0] || { total_predictions: 0, correct_predictions: 0, win_rate: 0, avg_confidence: 0 };

          const isFiltered = !!(dateRange?.start || dateRange?.end);

          // Calculate win rate based on whether we're using filtered or all-time stats
          const winRate = isFiltered
            ? stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0
            : stats.win_rate || 0;

          // Get recent predictions for the W/L display
          const recentPredictions = async (algorithmId: string) => {
            const { data: recentPredictions } = await supabase
              .from("algorithm_predictions")
              .select("status, predicted_at")
              .eq("algorithm_id", algorithmId)
              .order("predicted_at", { ascending: false })
              .limit(5);
              
            return (recentPredictions || [])
              .map(p => p.status === 'win' ? 'W' : 'L' as 'W' | 'L');
          };

          const recentResults = await recentPredictions(algorithm.id);

          results.push({
            name: algorithm.name,
            description: algorithm.description,
            winRate,
            recentResults,
            totalPicks: isFiltered ? stats.total : stats.total_predictions,
            isFiltered
          });
        }

        console.log("Algorithm performance data fetched:", results);
        return results;
      } catch (error) {
        console.error("Error in useAlgorithmPerformance:", error);
        throw error;
      }
    },
    refetchInterval: 60000 // Refetch every minute
  });
};
