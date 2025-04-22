
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/sports";
import { toast } from "sonner";

export const useSavePrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (match: Match) => {
      if (!match.prediction) {
        console.warn("No prediction found for match:", match.id);
        return;
      }

      try {
        // Initialize algorithmId with a default value if not present
        // In a real-world scenario, you would need to ensure this is populated correctly
        const algorithmId = match.prediction.algorithmId || "default-algorithm-id";
        
        console.log(`Saving prediction for match ${match.id} with algorithm ${algorithmId}`);

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
            status: 'pending'
          });

        if (error) {
          console.error("Error saving prediction:", error);
          throw error;
        }
        
        console.log(`Successfully saved prediction for match ${match.id}`);
      } catch (error) {
        console.error("Error in useSavePrediction:", error);
        toast.error("Failed to save prediction");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
      toast.success("Prediction saved successfully");
    },
    onError: (error) => {
      console.error("Mutation error in useSavePrediction:", error);
    }
  });
};
