import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/sports";
import { toast } from "sonner";

/**
 * Hook for saving predictions to the database.
 * 
 * IMPORTANT: Once a pre-live prediction is saved, it is LOCKED and cannot be modified.
 * This ensures prediction integrity and prevents any changes after initial creation.
 * Only new predictions (no existing record for match_id + algorithm_id) will be inserted.
 */
export const useSavePrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ match, isLive = false }: { match: Match; isLive?: boolean }) => {
      if (!match.prediction) {
        throw new Error("No prediction data available");
      }

      // Get algorithm ID or use Statistical Edge as default
      const algorithmId = match.prediction.algorithmId || "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1";
      
      // First check if prediction already exists for this match + algorithm
      const { data: existing, error: checkError } = await supabase
        .from("algorithm_predictions")
        .select("id, status, prediction, confidence, predicted_at")
        .eq("match_id", match.id)
        .eq("algorithm_id", algorithmId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking prediction:", checkError);
        throw new Error(`Failed to check existing prediction: ${checkError.message}`);
      }

      // LOCKED: If a prediction already exists, DO NOT modify it
      // This ensures pre-live predictions stay immutable
      if (existing) {
        console.log(`[PredictionLock] Prediction for ${match.id} (${algorithmId}) already exists and is LOCKED`, {
          existingPrediction: existing.prediction,
          existingConfidence: existing.confidence,
          predictedAt: existing.predicted_at,
          status: existing.status,
        });
        
        return { 
          locked: true, 
          id: existing.id, 
          reason: 'already_locked',
          existingPrediction: existing.prediction,
          existingConfidence: existing.confidence,
        };
      }

      // Only insert NEW predictions - never update existing ones
      const predictionData = {
        match_id: match.id,
        league: match.league,
        algorithm_id: algorithmId,
        prediction: match.prediction.recommended,
        confidence: Math.max(0, Math.min(100, match.prediction.confidence)),
        projected_score_home: match.prediction.projectedScore?.home ?? null,
        projected_score_away: match.prediction.projectedScore?.away ?? null,
        home_team: match.homeTeam.name,
        away_team: match.awayTeam.name,
        match_title: `${match.awayTeam.name} @ ${match.homeTeam.name}`,
        predicted_at: new Date().toISOString(),
        is_live_prediction: isLive,
        status: 'pending',
      };

      const { data: inserted, error: insertError } = await supabase
        .from("algorithm_predictions")
        .insert(predictionData)
        .select("id")
        .single();

      if (insertError) {
        // Handle unique constraint violation gracefully (race condition)
        if (insertError.code === '23505') {
          console.log(`[PredictionLock] Race condition: Prediction already exists for ${match.id}`);
          return { locked: true, reason: 'race_condition_locked' };
        }
        throw new Error(`Failed to insert prediction: ${insertError.message}`);
      }

      console.log(`[PredictionLock] New prediction saved and LOCKED for ${match.id}`, {
        prediction: predictionData.prediction,
        confidence: predictionData.confidence,
      });

      return { created: true, id: inserted.id, locked: true };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
      queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
      queryClient.invalidateQueries({ queryKey: ["algorithmAccuracy"] });
      queryClient.invalidateQueries({ queryKey: ["lockedPredictions"] });
      
      if (result?.reason === 'already_locked' || result?.reason === 'race_condition_locked') {
        toast.info("Prediction already locked");
      } else if (result?.created) {
        toast.success("Prediction saved & locked");
      }
    },
    onError: (error: Error) => {
      console.error("Error in useSavePrediction:", error);
      toast.error(error.message || "Failed to save prediction");
    }
  });
};
