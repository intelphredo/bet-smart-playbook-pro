import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Algorithm IDs - must match frontend
const ALGORITHM_IDS = {
  ML_POWER_INDEX: "f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8",
  VALUE_PICK_FINDER: "3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2",
  STATISTICAL_EDGE: "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1",
};

const ESPN_SPORT_MAP: Record<string, { sport: string; league: string }> = {
  NFL: { sport: "football", league: "nfl" },
  NBA: { sport: "basketball", league: "nba" },
  MLB: { sport: "baseball", league: "mlb" },
  NHL: { sport: "hockey", league: "nhl" },
  NCAAF: { sport: "football", league: "college-football" },
  NCAAB: { sport: "basketball", league: "mens-college-basketball" },
  SOCCER: { sport: "soccer", league: "eng.1" },
};

interface ESPNEvent {
  id: string;
  name: string;
  date: string;
  status: {
    type: {
      state: string;
      completed: boolean;
    };
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      homeAway: string;
      score: string;
      team: {
        id: string;
        displayName: string;
        abbreviation: string;
        logo?: string;
      };
      records?: Array<{ summary: string }>;
    }>;
    odds?: Array<{
      details: string;
      overUnder: number;
      homeTeamOdds: { moneyLine: number };
      awayTeamOdds: { moneyLine: number };
    }>;
  }>;
}

// Simple prediction algorithm (server-side)
function generatePrediction(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number,
  league: string
): { recommended: "home" | "away"; confidence: number; projectedHome: number; projectedAway: number } {
  // Convert American odds to implied probability
  const homeProb = homeOdds > 0 
    ? 100 / (homeOdds + 100) 
    : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100);
  const awayProb = awayOdds > 0 
    ? 100 / (awayOdds + 100) 
    : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100);

  // Add small home advantage and randomness for variety
  const homeAdvantage = 0.03;
  const adjustedHomeProb = homeProb + homeAdvantage;

  const recommended = adjustedHomeProb >= 0.5 ? "home" : "away";
  const confidence = Math.min(80, Math.max(50, Math.round((recommended === "home" ? adjustedHomeProb : awayProb) * 100)));

  // Project scores based on league averages
  const leagueScores: Record<string, { avg: number; variance: number }> = {
    NBA: { avg: 112, variance: 8 },
    NFL: { avg: 23, variance: 7 },
    MLB: { avg: 4.5, variance: 2 },
    NHL: { avg: 3, variance: 1.5 },
    NCAAF: { avg: 28, variance: 10 },
    NCAAB: { avg: 72, variance: 8 },
    SOCCER: { avg: 1.3, variance: 0.8 },
  };

  const scores = leagueScores[league] || { avg: 100, variance: 10 };
  const projectedHome = Math.round(scores.avg + (recommended === "home" ? scores.variance * 0.3 : -scores.variance * 0.2));
  const projectedAway = Math.round(scores.avg + (recommended === "away" ? scores.variance * 0.3 : -scores.variance * 0.2));

  return { recommended, confidence, projectedHome, projectedAway };
}

async function fetchUpcomingGames(league: string): Promise<ESPNEvent[]> {
  const config = ESPN_SPORT_MAP[league];
  if (!config) return [];

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.league}/scoreboard`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`ESPN API error for ${league}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events: ESPNEvent[] = data.events || [];

    // Filter for upcoming games only (scheduled, not started)
    return events.filter((ev) => {
      const state = ev.status?.type?.state;
      return state === "pre" || (!ev.status?.type?.completed && state !== "in");
    });
  } catch (error) {
    console.error(`Error fetching ${league} games:`, error);
    return [];
  }
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

    console.log("Starting prediction save process");

    // Get request body for optional parameters
    let targetLeagues = ["NBA", "NFL", "MLB", "NHL", "NCAAB", "NCAAF", "SOCCER"];
    let algorithmId = ALGORITHM_IDS.STATISTICAL_EDGE;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.leagues) targetLeagues = body.leagues;
        if (body.algorithmId) algorithmId = body.algorithmId;
      } catch {
        // Use defaults
      }
    }

    // Fetch upcoming games from all leagues in parallel
    const gamePromises = targetLeagues.map(async (league) => {
      const games = await fetchUpcomingGames(league);
      return games.map((game) => ({ game, league }));
    });
    
    const gamesResults = await Promise.all(gamePromises);
    const allGames = gamesResults.flat();

    console.log(`Found ${allGames.length} upcoming games`);

    if (allGames.length === 0) {
      return new Response(
        JSON.stringify({ success: true, data: { saved: 0, message: "No upcoming games found" } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing predictions to avoid duplicates
    const matchIds = allGames.map((g) => g.game.id);
    const { data: existingPredictions } = await supabase
      .from("algorithm_predictions")
      .select("match_id, algorithm_id")
      .in("match_id", matchIds)
      .eq("algorithm_id", algorithmId);

    const existingSet = new Set(
      (existingPredictions || []).map((p) => `${p.match_id}-${p.algorithm_id}`)
    );

    // Generate and save predictions for new games
    const predictionsToInsert: any[] = [];

    for (const { game, league } of allGames) {
      const key = `${game.id}-${algorithmId}`;
      if (existingSet.has(key)) {
        continue; // Skip existing prediction
      }

      const competition = game.competitions?.[0];
      if (!competition?.competitors) continue;

      const homeTeam = competition.competitors.find((c) => c.homeAway === "home");
      const awayTeam = competition.competitors.find((c) => c.homeAway === "away");

      if (!homeTeam || !awayTeam) continue;

      // Get odds if available
      const odds = competition.odds?.[0];
      const homeOdds = odds?.homeTeamOdds?.moneyLine || -110;
      const awayOdds = odds?.awayTeamOdds?.moneyLine || -110;

      // Generate prediction
      const prediction = generatePrediction(
        homeTeam.team.displayName,
        awayTeam.team.displayName,
        homeOdds,
        awayOdds,
        league
      );

      const predictionText = prediction.recommended === "home" 
        ? `${homeTeam.team.displayName} Win`
        : `${awayTeam.team.displayName} Win`;

      const homeTeamName = homeTeam.team.displayName;
      const awayTeamName = awayTeam.team.displayName;
      const matchTitle = `${awayTeamName} @ ${homeTeamName}`;

      predictionsToInsert.push({
        match_id: game.id,
        league,
        algorithm_id: algorithmId,
        prediction: predictionText,
        confidence: prediction.confidence,
        projected_score_home: prediction.projectedHome,
        projected_score_away: prediction.projectedAway,
        status: "pending",
        is_live_prediction: false,
        predicted_at: new Date().toISOString(),
        home_team: homeTeamName,
        away_team: awayTeamName,
        match_title: matchTitle,
      });
    }

    console.log(`Saving ${predictionsToInsert.length} new predictions`);

    if (predictionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("algorithm_predictions")
        .insert(predictionsToInsert);

      if (insertError) {
        console.error("Error inserting predictions:", insertError);
        throw insertError;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Prediction save completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          saved: predictionsToInsert.length,
          skipped: allGames.length - predictionsToInsert.length,
          leagues: targetLeagues,
          duration_ms: duration,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in save-predictions:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
