
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
          actual_score_home: match.score.home,
          actual_score_away: match.score.away,
          accuracy_rating: calculateAccuracyRating(match),
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

// Helper function to calculate accuracy rating based on score prediction
function calculateAccuracyRating(match: Match): number {
  if (!match.prediction?.projectedScore || !match.score) return 0;
  
  const projectedDiff = Math.abs(
    match.prediction.projectedScore.home - match.prediction.projectedScore.away
  );
  const actualDiff = Math.abs(match.score.home - match.score.away);
  
  // Score difference accuracy (0-50 points)
  const diffAccuracy = Math.max(0, 50 - Math.abs(projectedDiff - actualDiff) * 10);
  
  // Winner prediction accuracy (0-50 points)
  const predictedWinner = 
    match.prediction.projectedScore.home > match.prediction.projectedScore.away ? 'home' :
    match.prediction.projectedScore.home < match.prediction.projectedScore.away ? 'away' : 'draw';
  
  const actualWinner = 
    match.score.home > match.score.away ? 'home' :
    match.score.home < match.score.away ? 'away' : 'draw';
  
  const winnerAccuracy = predictedWinner === actualWinner ? 50 : 0;
  
  return diffAccuracy + winnerAccuracy;
}
