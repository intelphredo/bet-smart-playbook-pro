import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BettingAlgorithm } from "@/types/sports";
import { fetchAllPredictions } from "@/utils/fetchAllPredictions";
import { logger } from "@/utils/logger";
import { queryKeys } from "@/config/queryKeys";

interface UseAlgorithmPerformanceProps {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

// Define clear interfaces for our different stats types
interface AllTimeStats {
  total_predictions: number;
  correct_predictions: number;
  win_rate: number;
  avg_confidence: number;
}

interface FilteredStats {
  total: number;
  wins: number;
  confidence_sum: number;
}

// Helper function to check if we're dealing with filtered or all-time stats
function isAllTimeStats(stats: AllTimeStats | FilteredStats): stats is AllTimeStats {
  return 'total_predictions' in stats;
}

export const useAlgorithmPerformance = ({ dateRange }: UseAlgorithmPerformanceProps = {}) => {
  return useQuery({
    queryKey: queryKeys.algorithms.performance(dateRange),
    queryFn: async () => {
      try {
        logger.debug("Fetching algorithm performance data", dateRange ? "with date filter" : "all-time");
        
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
          logger.error("Error fetching algorithms: " + algorithmsError.message);
          throw algorithmsError;
        }

        // If we have a date range, fetch filtered predictions
        let filteredStats: Record<string, FilteredStats> = {};
        
        if (dateRange?.start || dateRange?.end) {
          logger.debug(`Fetching filtered predictions for date range: ${
            dateRange.start ? dateRange.start.toISOString() : 'beginning'
          } to ${dateRange.end ? dateRange.end.toISOString() : 'now'}`);
            
          const predictions = await fetchAllPredictions({
            startDate: dateRange.start ? dateRange.start.toISOString() : '1970-01-01',
            endDate: dateRange.end ? dateRange.end.toISOString() : new Date().toISOString(),
          });

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
          }, {} as Record<string, FilteredStats>);
        }

        const results: Array<BettingAlgorithm & { isFiltered: boolean; totalPicks: number; }> = [];
        
        for (const algorithm of algorithms) {
          // Use filtered stats if date range is active, otherwise use all-time stats
          const isFiltered = !!(dateRange?.start || dateRange?.end);
          const algorithmStats = isFiltered
            ? filteredStats[algorithm.id] || { total: 0, wins: 0, confidence_sum: 0 }
            : algorithm.algorithm_stats?.[0] || { total_predictions: 0, correct_predictions: 0, win_rate: 0, avg_confidence: 0 };
          
          let winRate: number;
          let totalPicks: number;

          // Calculate win rate and total picks based on whether we're using filtered or all-time stats
          if (isFiltered) {
            // For filtered stats
            const stats = algorithmStats as FilteredStats;
            winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
            totalPicks = stats.total;
          } else {
            // For all-time stats
            const stats = algorithmStats as AllTimeStats;
            winRate = stats.win_rate || 0;
            totalPicks = stats.total_predictions || 0;
          }

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
            totalPicks,
            isFiltered
          });
        }

        logger.debug("Algorithm performance data fetched:", results.length, "algorithms");
        return results;
      } catch (error) {
        logger.error("Error in useAlgorithmPerformance: " + String(error));
        throw error;
      }
    },
    refetchInterval: 60000 // Refetch every minute
  });
};
