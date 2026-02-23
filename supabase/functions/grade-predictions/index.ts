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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

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

    // Only grade predictions for leagues ESPN supports
    const supportedLeagues = Object.keys(ESPN_SPORT_MAP);
    console.log(`Starting prediction grading for leagues: ${supportedLeagues.join(", ")}`);

    // Get pending predictions — newest first, only for supported leagues, only real match IDs
    const { data: pendingPredictions, error: fetchError } = await supabase
      .from("algorithm_predictions")
      .select("*")
      .eq("status", "pending")
      .is("result_updated_at", null)
      .in("league", supportedLeagues)
      .order("predicted_at", { ascending: false })
      .limit(200);

    if (fetchError) {
      console.error("Error fetching pending predictions:", fetchError);
      throw fetchError;
    }

    // Filter to only numeric ESPN match IDs (skip test data like "ncaab-test-008")
    const validPredictions = (pendingPredictions || []).filter(
      (p) => /^\d+$/.test(p.match_id)
    );

    console.log(`Found ${pendingPredictions?.length || 0} pending, ${validPredictions.length} with valid ESPN match IDs`);

    if (validPredictions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            graded: 0,
            checked: pendingPredictions?.length || 0,
            skipped_invalid_ids: (pendingPredictions?.length || 0) - validPredictions.length,
            message: "No valid pending predictions to grade",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate by match_id to avoid fetching ESPN multiple times for the same game
    const uniqueMatchIds = new Map<string, string>(); // match_id -> league
    for (const p of validPredictions) {
      if (!uniqueMatchIds.has(p.match_id)) {
        uniqueMatchIds.set(p.match_id, p.league);
      }
    }

    console.log(`Fetching ESPN results for ${uniqueMatchIds.size} unique games`);

    // Fetch ESPN results for all unique games in parallel batches
    const BATCH_SIZE = 10;
    const gameResults = new Map<string, Awaited<ReturnType<typeof fetchESPNGameResult>>>();
    const matchEntries = Array.from(uniqueMatchIds.entries());

    for (let i = 0; i < matchEntries.length; i += BATCH_SIZE) {
      const batch = matchEntries.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(([matchId, league]) =>
          fetchESPNGameResult(matchId, league).then((result) => ({ matchId, result }))
        )
      );
      for (const { matchId, result } of results) {
        gameResults.set(matchId, result);
      }
    }

    // Count completed games
    const completedGames = Array.from(gameResults.values()).filter((r) => r?.completed).length;
    console.log(`ESPN results: ${completedGames} completed out of ${uniqueMatchIds.size} checked`);

    let gradedCount = 0;
    let skippedCount = 0;
    const statsUpdates: Map<string, { wins: number; total: number; confidenceSum: number }> = new Map();
    const updatePromises: Promise<void>[] = [];

    // Grade all predictions using cached ESPN results
    for (const prediction of validPredictions as PendingPrediction[]) {
      const result = gameResults.get(prediction.match_id);
      if (!result || !result.completed) {
        skippedCount++;
        continue;
      }

      // Determine if prediction was correct
      const predictionLower = prediction.prediction?.toLowerCase() || "";

      const predictedHome =
        predictionLower.includes(result.homeTeam.toLowerCase()) ||
        predictionLower.includes("home");

      // Handle "draw" predictions
      const predictedDraw = predictionLower.includes("draw") || predictionLower.includes("tie");
      const isDraw = result.homeScore === result.awayScore;

      let isCorrect: boolean;
      if (predictedDraw) {
        isCorrect = isDraw;
      } else if (isDraw) {
        isCorrect = false; // Predicted a winner but game drew
      } else {
        isCorrect = predictedHome ? result.homeWon : !result.homeWon;
      }

      const newStatus = isCorrect ? "won" : "lost";

      const accuracyRating = calculateAccuracyRating(
        { home: prediction.projected_score_home, away: prediction.projected_score_away },
        { home: result.homeScore, away: result.awayScore },
        isCorrect
      );

      const matchTitle = `${result.awayTeam} @ ${result.homeTeam}`;

      updatePromises.push(
        supabase
          .from("algorithm_predictions")
          .update({
            status: newStatus,
            actual_score_home: result.homeScore,
            actual_score_away: result.awayScore,
            accuracy_rating: accuracyRating,
            result_updated_at: new Date().toISOString(),
            home_team: result.homeTeam,
            away_team: result.awayTeam,
            match_title: matchTitle,
          })
          .eq("id", prediction.id)
          .is("result_updated_at", null)
          .then(({ error }) => {
            if (error) {
              console.error(`Error updating prediction ${prediction.id}:`, error);
              return;
            }
            gradedCount++;
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

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    console.log(`Graded ${gradedCount} predictions (${skippedCount} games not yet completed)`);

    // Update algorithm_stats table
    for (const [algId, stats] of statsUpdates) {
      const { data: currentStats } = await supabase
        .from("algorithm_stats")
        .select("*")
        .eq("algorithm_id", algId)
        .single();

      if (currentStats) {
        const newTotal = currentStats.total_predictions + stats.total;
        const newCorrect = currentStats.correct_predictions + stats.wins;
        const newWinRate = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;

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
          checked: validPredictions.length,
          unique_games: uniqueMatchIds.size,
          completed_games: completedGames,
          skipped_not_completed: skippedCount,
          skipped_invalid_ids: (pendingPredictions?.length || 0) - validPredictions.length,
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
