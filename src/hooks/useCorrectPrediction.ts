import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PredictionCorrection {
  id: string;
  prediction?: 'home' | 'away' | 'draw';
  confidence?: number;
  projected_score_home?: number;
  projected_score_away?: number;
  actual_score_home?: number;
  actual_score_away?: number;
  status?: 'pending' | 'win' | 'loss';
  is_live_prediction?: boolean;
  league?: string;
}

interface BulkCorrection {
  match_id: string;
  actual_score_home: number;
  actual_score_away: number;
}

export const useCorrectPrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (correction: PredictionCorrection) => {
      const { id, ...updateData } = correction;

      // Calculate status if actual scores are provided but status isn't
      if (updateData.actual_score_home !== undefined && 
          updateData.actual_score_away !== undefined && 
          !updateData.status) {
        // Fetch the current prediction to determine if it was correct
        const { data: existing, error: fetchError } = await supabase
          .from("algorithm_predictions")
          .select("prediction")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;

        const prediction = updateData.prediction || existing.prediction;
        const homeWon = updateData.actual_score_home > updateData.actual_score_away;
        const awayWon = updateData.actual_score_away > updateData.actual_score_home;
        const isDraw = updateData.actual_score_home === updateData.actual_score_away;

        const isCorrect = 
          (prediction === 'home' && homeWon) ||
          (prediction === 'away' && awayWon) ||
          (prediction === 'draw' && isDraw);

        updateData.status = isCorrect ? 'win' : 'loss';
      }

      // Add result_updated_at if we're updating actual scores
      const finalUpdate = {
        ...updateData,
        ...(updateData.actual_score_home !== undefined && {
          result_updated_at: new Date().toISOString()
        })
      };

      const { error } = await supabase
        .from("algorithm_predictions")
        .update(finalUpdate)
        .eq("id", id);

      if (error) throw error;

      return { id, ...finalUpdate };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
      queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
      queryClient.invalidateQueries({ queryKey: ["algorithmAccuracy"] });
      queryClient.invalidateQueries({ queryKey: ["recentPredictions"] });
      toast.success("Prediction corrected successfully");
    },
    onError: (error) => {
      console.error("Error correcting prediction:", error);
      toast.error(`Failed to correct prediction: ${error.message}`);
    }
  });
};

export const useBulkCorrectPredictions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (corrections: BulkCorrection[]) => {
      const results = { updated: 0, failed: 0, errors: [] as string[] };

      for (const correction of corrections) {
        try {
          // Fetch the prediction for this match
          const { data: existing, error: fetchError } = await supabase
            .from("algorithm_predictions")
            .select("id, prediction")
            .eq("match_id", correction.match_id)
            .maybeSingle();

          if (fetchError) {
            results.errors.push(`Match ${correction.match_id}: ${fetchError.message}`);
            results.failed++;
            continue;
          }

          if (!existing) {
            results.errors.push(`Match ${correction.match_id}: No prediction found`);
            results.failed++;
            continue;
          }

          // Determine if prediction was correct
          const homeWon = correction.actual_score_home > correction.actual_score_away;
          const awayWon = correction.actual_score_away > correction.actual_score_home;
          const isDraw = correction.actual_score_home === correction.actual_score_away;

          const isCorrect = 
            (existing.prediction === 'home' && homeWon) ||
            (existing.prediction === 'away' && awayWon) ||
            (existing.prediction === 'draw' && isDraw);

          // Calculate accuracy rating
          const accuracyRating = calculateAccuracyFromScores(
            existing.prediction,
            correction.actual_score_home,
            correction.actual_score_away
          );

          const { error: updateError } = await supabase
            .from("algorithm_predictions")
            .update({
              actual_score_home: correction.actual_score_home,
              actual_score_away: correction.actual_score_away,
              status: isCorrect ? 'win' : 'loss',
              accuracy_rating: accuracyRating,
              result_updated_at: new Date().toISOString()
            })
            .eq("id", existing.id);

          if (updateError) {
            results.errors.push(`Match ${correction.match_id}: ${updateError.message}`);
            results.failed++;
          } else {
            results.updated++;
          }
        } catch (error) {
          results.errors.push(`Match ${correction.match_id}: ${error.message}`);
          results.failed++;
        }
      }

      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
      queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
      queryClient.invalidateQueries({ queryKey: ["algorithmAccuracy"] });
      queryClient.invalidateQueries({ queryKey: ["recentPredictions"] });
      
      if (data.updated > 0) {
        toast.success(`Corrected ${data.updated} predictions`);
      }
      if (data.failed > 0) {
        toast.error(`Failed to correct ${data.failed} predictions`);
      }
    },
    onError: (error) => {
      console.error("Error in bulk correction:", error);
      toast.error(`Bulk correction failed: ${error.message}`);
    }
  });
};

// Helper to recalculate accuracy from scores
function calculateAccuracyFromScores(
  prediction: string,
  actualHome: number,
  actualAway: number
): number {
  const actualDiff = Math.abs(actualHome - actualAway);
  
  // Winner prediction accuracy (0-50 points)
  const actualWinner = 
    actualHome > actualAway ? 'home' :
    actualHome < actualAway ? 'away' : 'draw';
  
  const winnerAccuracy = prediction === actualWinner ? 50 : 0;
  
  // Base score for getting the margin close (0-50 points)
  // Without projected scores, we give partial credit based on margin
  const marginAccuracy = Math.max(0, 50 - actualDiff * 5);
  
  return winnerAccuracy + marginAccuracy;
}
