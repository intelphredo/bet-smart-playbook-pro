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

// Maps database status to normalized format
function normalizeStatus(dbStatus: string | null): 'pending' | 'win' | 'loss' {
  if (dbStatus === 'won' || dbStatus === 'win') return 'win';
  if (dbStatus === 'lost' || dbStatus === 'loss') return 'loss';
  return 'pending';
}

// Maps input status to database format
function toDbStatus(status: 'pending' | 'win' | 'loss'): string {
  if (status === 'win') return 'won';
  if (status === 'loss') return 'lost';
  return 'pending';
}

// Determines winner from prediction text
function extractPredictionSide(predictionText: string | null): 'home' | 'away' | 'draw' | null {
  if (!predictionText) return null;
  const lower = predictionText.toLowerCase();
  if (lower.includes('draw') || lower.includes('tie')) return 'draw';
  if (lower.includes('home')) return 'home';
  if (lower.includes('away')) return 'away';
  // Try to infer from team name position (first team mentioned is usually home)
  return null;
}

export const useCorrectPrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (correction: PredictionCorrection) => {
      const { id, ...updateData } = correction;

      if (!id) {
        throw new Error('Prediction ID is required');
      }

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

        if (fetchError) {
          console.error('Error fetching prediction:', fetchError);
          throw new Error(`Failed to fetch prediction: ${fetchError.message}`);
        }

        const predictionSide = updateData.prediction || extractPredictionSide(existing?.prediction);
        const homeWon = updateData.actual_score_home > updateData.actual_score_away;
        const awayWon = updateData.actual_score_away > updateData.actual_score_home;
        const isDraw = updateData.actual_score_home === updateData.actual_score_away;

        // Check prediction text for team name match
        const predictionLower = existing?.prediction?.toLowerCase() || '';
        const isCorrect = 
          (predictionSide === 'home' && homeWon) ||
          (predictionSide === 'away' && awayWon) ||
          (predictionSide === 'draw' && isDraw) ||
          (homeWon && predictionLower.includes('home')) ||
          (awayWon && predictionLower.includes('away'));

        updateData.status = isCorrect ? 'win' : 'loss';
      }

      // Build final update object with proper DB format
      const finalUpdate: Record<string, unknown> = {};
      
      if (updateData.actual_score_home !== undefined) {
        finalUpdate.actual_score_home = updateData.actual_score_home;
        finalUpdate.result_updated_at = new Date().toISOString();
      }
      if (updateData.actual_score_away !== undefined) {
        finalUpdate.actual_score_away = updateData.actual_score_away;
      }
      if (updateData.status) {
        finalUpdate.status = toDbStatus(updateData.status);
      }
      if (updateData.confidence !== undefined) {
        finalUpdate.confidence = Math.max(0, Math.min(100, updateData.confidence));
      }
      if (updateData.projected_score_home !== undefined) {
        finalUpdate.projected_score_home = updateData.projected_score_home;
      }
      if (updateData.projected_score_away !== undefined) {
        finalUpdate.projected_score_away = updateData.projected_score_away;
      }
      if (updateData.is_live_prediction !== undefined) {
        finalUpdate.is_live_prediction = updateData.is_live_prediction;
      }

      if (Object.keys(finalUpdate).length === 0) {
        throw new Error('No valid updates provided');
      }

      const { error } = await supabase
        .from("algorithm_predictions")
        .update(finalUpdate)
        .eq("id", id);

      if (error) {
        console.error('Error updating prediction:', error);
        throw new Error(`Failed to update prediction: ${error.message}`);
      }

      return { id, ...finalUpdate };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
      queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
      queryClient.invalidateQueries({ queryKey: ["algorithmAccuracy"] });
      queryClient.invalidateQueries({ queryKey: ["recentPredictions"] });
      toast.success("Prediction corrected successfully");
    },
    onError: (error: Error) => {
      console.error("Error correcting prediction:", error);
      toast.error(error.message || "Failed to correct prediction");
    }
  });
};

export const useBulkCorrectPredictions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (corrections: BulkCorrection[]) => {
      if (!corrections.length) {
        throw new Error('No corrections provided');
      }

      const results = { updated: 0, failed: 0, errors: [] as string[] };
      
      // Fetch all predictions in one query for better performance
      const matchIds = corrections.map(c => c.match_id);
      const { data: existingPredictions, error: fetchError } = await supabase
        .from("algorithm_predictions")
        .select("id, match_id, prediction")
        .in("match_id", matchIds);

      if (fetchError) {
        throw new Error(`Failed to fetch predictions: ${fetchError.message}`);
      }

      // Create a map for quick lookup
      const predictionMap = new Map(
        (existingPredictions || []).map(p => [p.match_id, p])
      );

      // Process updates in parallel batches
      const BATCH_SIZE = 10;
      
      for (let i = 0; i < corrections.length; i += BATCH_SIZE) {
        const batch = corrections.slice(i, i + BATCH_SIZE);
        
        const updatePromises = batch.map(async (correction) => {
          try {
            const existing = predictionMap.get(correction.match_id);

            if (!existing) {
              results.errors.push(`Match ${correction.match_id}: No prediction found`);
              results.failed++;
              return;
            }

            // Determine if prediction was correct
            const homeWon = correction.actual_score_home > correction.actual_score_away;
            const awayWon = correction.actual_score_away > correction.actual_score_home;
            const isDraw = correction.actual_score_home === correction.actual_score_away;

            const predictionLower = existing.prediction?.toLowerCase() || '';
            const isCorrect = 
              (predictionLower.includes('home') && homeWon) ||
              (predictionLower.includes('away') && awayWon) ||
              (predictionLower.includes('draw') && isDraw) ||
              (homeWon && !predictionLower.includes('away')) ||
              (awayWon && !predictionLower.includes('home'));

            // Calculate accuracy rating
            const accuracyRating = calculateAccuracyFromScores(
              existing.prediction || '',
              correction.actual_score_home,
              correction.actual_score_away
            );

            const { error: updateError } = await supabase
              .from("algorithm_predictions")
              .update({
                actual_score_home: correction.actual_score_home,
                actual_score_away: correction.actual_score_away,
                status: isCorrect ? 'won' : 'lost',
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
            const message = error instanceof Error ? error.message : 'Unknown error';
            results.errors.push(`Match ${correction.match_id}: ${message}`);
            results.failed++;
          }
        });

        await Promise.all(updatePromises);
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
    onError: (error: Error) => {
      console.error("Error in bulk correction:", error);
      toast.error(error.message || "Bulk correction failed");
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
  const predictionLower = prediction.toLowerCase();
  
  // Winner prediction accuracy (0-50 points)
  const actualWinner = 
    actualHome > actualAway ? 'home' :
    actualHome < actualAway ? 'away' : 'draw';
  
  const predictedHome = predictionLower.includes('home') || 
    (!predictionLower.includes('away') && !predictionLower.includes('draw'));
  const predictedAway = predictionLower.includes('away');
  const predictedDraw = predictionLower.includes('draw') || predictionLower.includes('tie');
  
  const isCorrect = 
    (predictedHome && actualWinner === 'home') ||
    (predictedAway && actualWinner === 'away') ||
    (predictedDraw && actualWinner === 'draw');
  
  const winnerAccuracy = isCorrect ? 50 : 0;
  
  // Base score for getting the margin close (0-50 points)
  const marginAccuracy = Math.max(0, 50 - actualDiff * 3);
  
  return Math.min(100, winnerAccuracy + marginAccuracy);
}
