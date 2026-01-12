import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/sports";
import { toast } from "sonner";

export const useSavePrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ match, isLive = false }: { match: Match; isLive?: boolean }) => {
      if (!match.prediction) {
        throw new Error("No prediction data available");
      }

      // Get algorithm ID or use Statistical Edge as default
      const algorithmId = match.prediction.algorithmId || "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1";
      
      // Use upsert for atomic operation - more efficient than check then insert/update
      const predictionData = {
        match_id: match.id,
        league: match.league,
        algorithm_id: algorithmId,
        prediction: match.prediction.recommended,
        confidence: Math.max(0, Math.min(100, match.prediction.confidence)),
        projected_score_home: match.prediction.projectedScore?.home ?? null,
        projected_score_away: match.prediction.projectedScore?.away ?? null,
        predicted_at: new Date().toISOString(),
        is_live_prediction: isLive,
        status: 'pending',
      };

      // First check if prediction already exists
      const { data: existing, error: checkError } = await supabase
        .from("algorithm_predictions")
        .select("id, status")
        .eq("match_id", match.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking prediction:", checkError);
        throw new Error(`Failed to check existing prediction: ${checkError.message}`);
      }

      if (existing) {
        // Don't overwrite finalized predictions
        if (existing.status === 'won' || existing.status === 'lost') {
          console.log(`Prediction for ${match.id} already finalized, skipping update`);
          return { updated: false, reason: 'already_finalized' };
        }

        const { error: updateError } = await supabase
          .from("algorithm_predictions")
          .update({
            prediction: predictionData.prediction,
            confidence: predictionData.confidence,
            projected_score_home: predictionData.projected_score_home,
            projected_score_away: predictionData.projected_score_away,
            predicted_at: predictionData.predicted_at,
            is_live_prediction: predictionData.is_live_prediction,
          })
          .eq("id", existing.id);

        if (updateError) {
          throw new Error(`Failed to update prediction: ${updateError.message}`);
        }

        return { updated: true, id: existing.id };
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("algorithm_predictions")
          .insert(predictionData)
          .select("id")
          .single();

        if (insertError) {
          throw new Error(`Failed to insert prediction: ${insertError.message}`);
        }

        return { created: true, id: inserted.id };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
      queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
      queryClient.invalidateQueries({ queryKey: ["algorithmAccuracy"] });
      
      if (result?.reason === 'already_finalized') {
        toast.info("Prediction already finalized");
      } else {
        toast.success("Prediction saved");
      }
    },
    onError: (error: Error) => {
      console.error("Error in useSavePrediction:", error);
      toast.error(error.message || "Failed to save prediction");
    }
  });
};
