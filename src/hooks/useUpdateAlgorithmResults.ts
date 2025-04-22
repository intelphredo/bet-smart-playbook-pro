
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/sports";

export const useUpdateAlgorithmResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (match: Match) => {
      if (!match.prediction || !match.score) return;

      const isCorrect = (() => {
        const { recommended } = match.prediction;
        if (recommended === "home" && match.score.home > match.score.away) return true;
        if (recommended === "away" && match.score.away > match.score.home) return true;
        if (recommended === "draw" && match.score.home === match.score.away) return true;
        return false;
      })();

      const { error } = await supabase
        .from("algorithm_predictions")
        .update({
          status: isCorrect ? 'win' : 'loss',
          result_updated_at: new Date().toISOString()
        })
        .eq('match_id', match.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
    }
  });
};
