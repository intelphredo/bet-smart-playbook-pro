import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ESPN_SPORT_MAP: Record<string, { sport: string; league: string }> = {
  NFL: { sport: "football", league: "nfl" },
  NBA: { sport: "basketball", league: "nba" },
  MLB: { sport: "baseball", league: "mlb" },
  NHL: { sport: "hockey", league: "nhl" },
  NCAAF: { sport: "football", league: "college-football" },
  NCAAB: { sport: "basketball", league: "mens-college-basketball" },
};

interface ESPNGameSummary {
  header: {
    competitions: Array<{
      status: {
        type: {
          completed: boolean;
          state: string;
        };
      };
      competitors: Array<{
        homeAway: string;
        score: string;
        winner?: boolean;
        team: {
          displayName: string;
          abbreviation: string;
        };
      }>;
    }>;
  };
}

interface PendingPrediction {
  id: string;
  match_id: string;
  league: string;
  algorithm_id: string;
  prediction: string;
  confidence: number;
  projected_score_home: number | null;
  projected_score_away: number | null;
  status: string;
}

async function fetchESPNGameResult(matchId: string, league: string): Promise<{
  completed: boolean;
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
  homeWon: boolean;
} | null> {
  const config = ESPN_SPORT_MAP[league];
  if (!config) return null;

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.league}/summary?event=${matchId}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.log(`ESPN API returned ${response.status} for match ${matchId}`);
      return null;
    }

    const data: ESPNGameSummary = await response.json();
    const competition = data.header?.competitions?.[0];

    if (!competition) return null;

    const completed = competition.status?.type?.completed || false;
    if (!completed) return null;

    const homeTeam = competition.competitors?.find((c) => c.homeAway === "home");
    const awayTeam = competition.competitors?.find((c) => c.homeAway === "away");

    if (!homeTeam || !awayTeam) return null;

    const homeScore = parseInt(homeTeam.score, 10);
    const awayScore = parseInt(awayTeam.score, 10);

    return {
      completed: true,
      homeScore,
      awayScore,
      homeTeam: homeTeam.team.displayName,
      awayTeam: awayTeam.team.displayName,
      homeWon: homeScore > awayScore,
    };
  } catch (error) {
    console.error(`Error fetching ESPN game ${matchId}:`, error);
    return null;
  }
}

function calculateAccuracyRating(
  projected: { home: number | null; away: number | null },
  actual: { home: number; away: number },
  predictedCorrectWinner: boolean
): number {
  let score = 0;

  // 50 points for correct winner
  if (predictedCorrectWinner) {
    score += 50;
  }

  // Up to 50 points for score accuracy
  if (projected.home !== null && projected.away !== null) {
    const projectedDiff = Math.abs(projected.home - projected.away);
    const actualDiff = Math.abs(actual.home - actual.away);
    const diffError = Math.abs(projectedDiff - actualDiff);

    // Score decreases as error increases
    const diffScore = Math.max(0, 25 - diffError * 3);

    // Also check individual score accuracy
    const homeError = Math.abs((projected.home || 0) - actual.home);
    const awayError = Math.abs((projected.away || 0) - actual.away);
    const avgError = (homeError + awayError) / 2;
    const individualScore = Math.max(0, 25 - avgError * 2);

    score += diffScore + individualScore;
  }

  return Math.round(score);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting prediction grading process");

    // Get all pending predictions that haven't been graded
    const { data: pendingPredictions, error: fetchError } = await supabase
      .from("algorithm_predictions")
      .select("*")
      .eq("status", "pending")
      .is("result_updated_at", null)
      .limit(100);

    if (fetchError) {
      console.error("Error fetching pending predictions:", fetchError);
      throw fetchError;
    }

    if (!pendingPredictions || pendingPredictions.length === 0) {
      console.log("No pending predictions to grade");
      return new Response(
        JSON.stringify({ success: true, data: { graded: 0, message: "No pending predictions" } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingPredictions.length} pending predictions to check`);

    let gradedCount = 0;
    const statsUpdates: Map<string, { wins: number; total: number; confidenceSum: number }> = new Map();
    const updatePromises: Promise<void>[] = [];

    // Process predictions in batches for better performance
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < pendingPredictions.length; i += BATCH_SIZE) {
      const batch = (pendingPredictions as PendingPrediction[]).slice(i, i + BATCH_SIZE);
      
      // Fetch results in parallel for the batch
      const resultsPromises = batch.map(prediction => 
        fetchESPNGameResult(prediction.match_id, prediction.league || "NBA")
          .then(result => ({ prediction, result }))
      );
      
      const batchResults = await Promise.all(resultsPromises);
      
      for (const { prediction, result } of batchResults) {
        if (!result || !result.completed) {
          continue; // Game not finished yet
        }

        // Determine if prediction was correct
        const predictionLower = prediction.prediction?.toLowerCase() || "";
        
        // Check if predicted home or away win
        const predictedHome = 
          predictionLower.includes(result.homeTeam.toLowerCase()) ||
          predictionLower.includes("home");
        
        const isCorrect = predictedHome ? result.homeWon : !result.homeWon;
        const newStatus = isCorrect ? "won" : "lost";

        // Calculate accuracy rating
        const accuracyRating = calculateAccuracyRating(
          { home: prediction.projected_score_home, away: prediction.projected_score_away },
          { home: result.homeScore, away: result.awayScore },
          isCorrect
        );

        // Queue update promise
        updatePromises.push(
          supabase
            .from("algorithm_predictions")
            .update({
              status: newStatus,
              actual_score_home: result.homeScore,
              actual_score_away: result.awayScore,
              accuracy_rating: accuracyRating,
              result_updated_at: new Date().toISOString(),
            })
            .eq("id", prediction.id)
            .is("result_updated_at", null)
            .then(({ error }) => {
              if (error) {
                console.error(`Error updating prediction ${prediction.id}:`, error);
                return;
              }
              gradedCount++;
              console.log(`Graded prediction ${prediction.id}: ${newStatus} (${accuracyRating} accuracy)`);
            })
        );

        // Track stats for algorithm_stats update
        const algId = prediction.algorithm_id;
        if (!statsUpdates.has(algId)) {
          statsUpdates.set(algId, { wins: 0, total: 0, confidenceSum: 0 });
        }
        const stats = statsUpdates.get(algId)!;
        stats.total++;
        if (isCorrect) stats.wins++;
        stats.confidenceSum += prediction.confidence || 0;
      }
    }
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // Update algorithm_stats table
    for (const [algId, stats] of statsUpdates) {
      // Get current stats
      const { data: currentStats } = await supabase
        .from("algorithm_stats")
        .select("*")
        .eq("algorithm_id", algId)
        .single();

      if (currentStats) {
        const newTotal = currentStats.total_predictions + stats.total;
        const newCorrect = currentStats.correct_predictions + stats.wins;
        const newWinRate = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;
        
        // Weighted average for confidence
        const oldConfidenceWeight = currentStats.total_predictions * currentStats.avg_confidence;
        const newConfidenceWeight = stats.confidenceSum;
        const newAvgConfidence = newTotal > 0 ? (oldConfidenceWeight + newConfidenceWeight) / newTotal : 0;

        await supabase
          .from("algorithm_stats")
          .update({
            total_predictions: newTotal,
            correct_predictions: newCorrect,
            win_rate: Math.round(newWinRate * 100) / 100,
            avg_confidence: Math.round(newAvgConfidence * 100) / 100,
          })
          .eq("algorithm_id", algId);

        console.log(`Updated stats for algorithm ${algId}: ${newCorrect}/${newTotal} (${newWinRate.toFixed(1)}%)`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Prediction grading completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          graded: gradedCount,
          checked: pendingPredictions.length,
          algorithms_updated: statsUpdates.size,
          duration_ms: duration,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in grade-predictions:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
