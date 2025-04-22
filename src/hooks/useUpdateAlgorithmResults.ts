
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/sports";
import { toast } from "sonner";

export const useUpdateAlgorithmResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (match: Match) => {
      if (!match.prediction || !match.score) {
        console.error("Missing prediction or score data for match:", match.id);
        toast.error("Missing prediction or score data");
        return;
      }

      try {
        console.log(`Updating prediction results for match ${match.id}`);
        console.log("Match data:", {
          id: match.id,
          league: match.league,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          score: match.score,
          prediction: match.prediction
        });
        
        const isCorrect = (() => {
          const { recommended } = match.prediction;
          if (recommended === "home" && match.score.home > match.score.away) return true;
          if (recommended === "away" && match.score.away > match.score.home) return true;
          if (recommended === "draw" && match.score.home === match.score.away) return true;
          return false;
        })();

        console.log(`Prediction was ${isCorrect ? 'correct' : 'incorrect'}`);

        // Get the algorithm_id from the prediction if available, or use a default
        const algorithmId = match.prediction.algorithmId || "default-algorithm";

        // First check if a prediction exists for this match
        const { data: existingPrediction, error: fetchError } = await supabase
          .from("algorithm_predictions")
          .select("id, status, algorithm_id")
          .eq("match_id", match.id)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching prediction:", fetchError);
          throw fetchError;
        }

        if (existingPrediction) {
          // Update existing prediction
          console.log(`Updating existing prediction for match ${match.id}`);
          
          // If the status is already set to win or loss, don't update again
          if (existingPrediction.status === 'win' || existingPrediction.status === 'loss') {
            console.log(`Prediction for match ${match.id} already has final result: ${existingPrediction.status}`);
            toast.info("This prediction already has a final result");
            return;
          }
          
          const { error } = await supabase
            .from("algorithm_predictions")
            .update({
              status: isCorrect ? 'win' : 'loss',
              actual_score_home: match.score.home,
              actual_score_away: match.score.away,
              accuracy_rating: calculateAccuracyRating(match),
              result_updated_at: new Date().toISOString()
            })
            .eq('id', existingPrediction.id);

          if (error) {
            console.error("Error updating prediction:", error);
            throw error;
          }
        } else {
          // Create new prediction with results
          console.log(`Creating new prediction with results for match ${match.id}`);
          
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
              status: isCorrect ? 'win' : 'loss',
              actual_score_home: match.score.home,
              actual_score_away: match.score.away,
              accuracy_rating: calculateAccuracyRating(match),
              result_updated_at: new Date().toISOString(),
              predicted_at: new Date().toISOString()
            });

          if (error) {
            console.error("Error creating prediction with results:", error);
            throw error;
          }
        }
        
        console.log(`Successfully updated prediction results for match ${match.id}`);
      } catch (error) {
        console.error("Error in useUpdateAlgorithmResults:", error);
        toast.error("Failed to update algorithm results");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
      toast.success("Algorithm results updated successfully");
    },
    onError: (error) => {
      console.error("Mutation error in useUpdateAlgorithmResults:", error);
      toast.error(`Failed to update results: ${error.message}`);
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
