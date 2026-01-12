import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/sports";
import { toast } from "sonner";

export const useSavePrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ match, isLive = false }: { match: Match; isLive?: boolean }) => {
      if (!match.prediction) {
        console.error("No prediction found for match:", match.id);
        toast.error("No prediction data available to save");
        return;
      }

      try {
        // Get algorithm ID or use Statistical Edge as default
        const algorithmId = match.prediction.algorithmId || "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1";
        
        console.log(`Saving ${isLive ? 'live' : 'pre-live'} prediction for match ${match.id} with algorithm ${algorithmId}`);
        console.log("Prediction data:", {
          match_id: match.id,
          league: match.league,
          algorithm_id: algorithmId,
          prediction: match.prediction.recommended,
          confidence: match.prediction.confidence,
          projected_scores: match.prediction.projectedScore,
          is_live_prediction: isLive
        });

        // First check if prediction already exists for this match
        const { data: existingPrediction, error: checkError } = await supabase
          .from("algorithm_predictions")
          .select("id")
          .eq("match_id", match.id)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking for existing prediction:", checkError);
          throw checkError;
        }

        if (existingPrediction) {
          console.log(`Prediction for match ${match.id} already exists, updating`);
          
          const { error } = await supabase
            .from("algorithm_predictions")
            .update({
              prediction: match.prediction.recommended,
              confidence: match.prediction.confidence,
              projected_score_home: match.prediction.projectedScore.home,
              projected_score_away: match.prediction.projectedScore.away,
              predicted_at: new Date().toISOString(),
              is_live_prediction: isLive
            })
            .eq("match_id", match.id);

          if (error) throw error;
        } else {
          console.log(`Creating new ${isLive ? 'live' : 'pre-live'} prediction for match ${match.id}`);
          
          const { error } = await supabase
            .from("algorithm_predictions")
            .insert({
              match_id: match.id,
              league: match.league,
              algorithm_id: algorithmId,
              prediction: match.prediction.recommended,
              confidence: match.prediction.confidence,
              projected_score_home: match.prediction.projectedScore.home,
              projected_score_away: match.prediction.projectedScore.away,
              status: 'pending',
              predicted_at: new Date().toISOString(),
              is_live_prediction: isLive
            });

          if (error) throw error;
        }
        
        console.log(`Successfully saved ${isLive ? 'live' : 'pre-live'} prediction for match ${match.id}`);
      } catch (error) {
        console.error("Error in useSavePrediction:", error);
        toast.error("Failed to save prediction");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
      queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
      toast.success("Prediction saved successfully");
    },
    onError: (error) => {
      console.error("Mutation error in useSavePrediction:", error);
      toast.error(`Failed to save prediction: ${error.message}`);
    }
  });
};

// This hook will be used to automatically save predictions
// for matches that become live or are updated
// We're keeping the existing code but adding another hook
// that will be triggered when matches change status
