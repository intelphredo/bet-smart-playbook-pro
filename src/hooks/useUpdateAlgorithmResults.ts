import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/sports";
import { toast } from "sonner";

export const useUpdateAlgorithmResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (match: Match) => {
      if (!match.prediction || !match.score) {
        throw new Error("Missing prediction or score data");
      }

      const { recommended } = match.prediction;
      const { home: homeScore, away: awayScore } = match.score;
      
      // Determine if prediction was correct
      const homeWon = homeScore > awayScore;
      const awayWon = awayScore > homeScore;
      const isDraw = homeScore === awayScore;
      
      const isCorrect = 
        (recommended === "home" && homeWon) ||
        (recommended === "away" && awayWon) ||
        (recommended === "draw" && isDraw);

      // Use database status format: 'won' or 'lost'
      const status = isCorrect ? 'won' : 'lost';
      const algorithmId = match.prediction.algorithmId || "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1";

      // Check for existing prediction
      const { data: existing, error: fetchError } = await supabase
        .from("algorithm_predictions")
        .select("id, status")
        .eq("match_id", match.id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to fetch prediction: ${fetchError.message}`);
      }

      if (existing) {
        // Already finalized - don't update again
        if (existing.status === 'won' || existing.status === 'lost') {
          return { skipped: true, reason: 'already_finalized', status: existing.status };
        }
        
        const { error: updateError } = await supabase
          .from("algorithm_predictions")
          .update({
            status,
            actual_score_home: homeScore,
            actual_score_away: awayScore,
            accuracy_rating: calculateAccuracyRating(match),
            result_updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          throw new Error(`Failed to update prediction: ${updateError.message}`);
        }

        return { updated: true, id: existing.id, status, isCorrect };
      } else {
        // Create new prediction with results
        const { data: inserted, error: insertError } = await supabase
          .from("algorithm_predictions")
          .insert({
            match_id: match.id,
            league: match.league,
            algorithm_id: algorithmId,
            prediction: recommended,
            confidence: match.prediction.confidence,
            projected_score_home: match.prediction.projectedScore?.home ?? null,
            projected_score_away: match.prediction.projectedScore?.away ?? null,
            status,
            actual_score_home: homeScore,
            actual_score_away: awayScore,
            accuracy_rating: calculateAccuracyRating(match),
            result_updated_at: new Date().toISOString(),
            predicted_at: new Date().toISOString()
          })
          .select("id")
          .single();

        if (insertError) {
          throw new Error(`Failed to create prediction: ${insertError.message}`);
        }

        return { created: true, id: inserted.id, status, isCorrect };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
      queryClient.invalidateQueries({ queryKey: ["algorithmAccuracy"] });
      queryClient.invalidateQueries({ queryKey: ["recentPredictions"] });
      
      if (result?.skipped) {
        toast.info("Prediction already has a final result");
      } else {
        toast.success(`Result recorded: ${result?.isCorrect ? 'Correct!' : 'Incorrect'}`);
      }
    },
    onError: (error: Error) => {
      console.error("Error in useUpdateAlgorithmResults:", error);
      toast.error(error.message || "Failed to update results");
    }
  });
};

// Helper function to calculate accuracy rating based on score prediction
function calculateAccuracyRating(match: Match): number {
  if (!match.prediction?.projectedScore || !match.score) return 0;
  
  const projectedHome = match.prediction.projectedScore.home ?? 0;
  const projectedAway = match.prediction.projectedScore.away ?? 0;
  const actualHome = match.score.home;
  const actualAway = match.score.away;
  
  const projectedDiff = Math.abs(projectedHome - projectedAway);
  const actualDiff = Math.abs(actualHome - actualAway);
  
  // Score difference accuracy (0-25 points)
  const diffAccuracy = Math.max(0, 25 - Math.abs(projectedDiff - actualDiff) * 3);
  
  // Individual score accuracy (0-25 points)
  const homeError = Math.abs(projectedHome - actualHome);
  const awayError = Math.abs(projectedAway - actualAway);
  const avgError = (homeError + awayError) / 2;
  const scoreAccuracy = Math.max(0, 25 - avgError * 2);
  
  // Winner prediction accuracy (0-50 points)
  const predictedWinner = projectedHome > projectedAway ? 'home' :
                          projectedHome < projectedAway ? 'away' : 'draw';
  
  const actualWinner = actualHome > actualAway ? 'home' :
                       actualHome < actualAway ? 'away' : 'draw';
  
  const winnerAccuracy = predictedWinner === actualWinner ? 50 : 0;
  
  return Math.min(100, Math.round(diffAccuracy + scoreAccuracy + winnerAccuracy));
}
