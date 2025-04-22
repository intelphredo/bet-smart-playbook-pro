
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/sports";

export const useSavePrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (match: Match) => {
      if (!match.prediction) return;

      const { error } = await supabase
        .from("algorithm_predictions")
        .insert({
          match_id: match.id,
          league: match.league,
          algorithm_id: match.prediction.algorithmId,
          prediction: match.prediction.recommended,
          confidence: match.prediction.confidence,
          projected_score_home: match.prediction.projectedScore.home,
          projected_score_away: match.prediction.projectedScore.away,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
    }
  });
};
