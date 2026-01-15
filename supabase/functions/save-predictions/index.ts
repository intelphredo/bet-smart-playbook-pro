import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

// Algorithm IDs - must match frontend
const ALGORITHM_IDS = {
  ML_POWER_INDEX: "f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8",
  VALUE_PICK_FINDER: "3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2",
  STATISTICAL_EDGE: "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1",
};

const ALGORITHM_NAMES = {
  [ALGORITHM_IDS.ML_POWER_INDEX]: "ML Power Index",
  [ALGORITHM_IDS.VALUE_PICK_FINDER]: "Value Pick Finder",
  [ALGORITHM_IDS.STATISTICAL_EDGE]: "Statistical Edge",
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

interface AlgorithmPrediction {
  recommended: "home" | "away";
  confidence: number;
  projectedHome: number;
  projectedAway: number;
}

// ML Power Index - Emphasizes historical data and form
function generateMLPowerIndexPrediction(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number,
  league: string,
  homeRecord?: string,
  awayRecord?: string
): AlgorithmPrediction {
  const homeProb = homeOdds > 0 
    ? 100 / (homeOdds + 100) 
    : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100);
  const awayProb = awayOdds > 0 
    ? 100 / (awayOdds + 100) 
    : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100);

  // ML Power Index puts more weight on records/form
  let adjustedHomeProb = homeProb + 0.03; // Base home advantage
  
  // Parse records if available (e.g., "10-5")
  if (homeRecord && awayRecord) {
    const parseRecord = (r: string) => {
      const parts = r.split("-").map(Number);
      return parts.length >= 2 ? parts[0] / (parts[0] + parts[1]) : 0.5;
    };
    const homeWinPct = parseRecord(homeRecord);
    const awayWinPct = parseRecord(awayRecord);
    const recordDiff = homeWinPct - awayWinPct;
    adjustedHomeProb += recordDiff * 0.15; // Higher weight on records
  }

  // League-specific adjustments for ML model
  if (league === "NBA") adjustedHomeProb += 0.02;
  else if (league === "NFL") adjustedHomeProb += 0.015;
  else if (league === "MLB") adjustedHomeProb -= 0.01;

  const recommended = adjustedHomeProb >= 0.5 ? "home" : "away";
  const rawConfidence = recommended === "home" ? adjustedHomeProb : (1 - adjustedHomeProb);
  const confidence = Math.min(82, Math.max(48, Math.round(rawConfidence * 100)));

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
  const projectedHome = Math.round(scores.avg + (recommended === "home" ? scores.variance * 0.35 : -scores.variance * 0.25));
  const projectedAway = Math.round(scores.avg + (recommended === "away" ? scores.variance * 0.35 : -scores.variance * 0.25));

  return { recommended, confidence, projectedHome, projectedAway };
}

// Value Pick Finder - Focuses on finding betting value through odds analysis
function generateValuePickPrediction(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number,
  league: string
): AlgorithmPrediction {
  const homeProb = homeOdds > 0 
    ? 100 / (homeOdds + 100) 
    : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100);
  const awayProb = awayOdds > 0 
    ? 100 / (awayOdds + 100) 
    : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100);

  // Value Pick Finder looks for market inefficiencies
  // Higher confidence on underdogs when odds are close
  const impliedTotal = homeProb + awayProb;
  const vig = impliedTotal - 1;
  
  // Adjust for perceived value
  const adjustedHomeProb = homeProb - (vig / 2);
  const adjustedAwayProb = awayProb - (vig / 2);
  
  // Value algorithm slightly favors underdogs in close matchups
  let valueAdjustment = 0;
  if (Math.abs(homeOdds - awayOdds) < 50) {
    // Close game - look for value on underdog
    valueAdjustment = homeOdds > awayOdds ? 0.03 : -0.03;
  }

  const finalHomeProb = adjustedHomeProb + 0.02 + valueAdjustment; // Small home edge
  
  const recommended = finalHomeProb >= 0.5 ? "home" : "away";
  const rawConfidence = recommended === "home" ? finalHomeProb : (1 - finalHomeProb);
  const confidence = Math.min(78, Math.max(52, Math.round(rawConfidence * 100)));

  const leagueScores: Record<string, { avg: number; variance: number }> = {
    NBA: { avg: 112, variance: 9 },
    NFL: { avg: 23, variance: 8 },
    MLB: { avg: 4.5, variance: 2.5 },
    NHL: { avg: 3, variance: 1.8 },
    NCAAF: { avg: 28, variance: 11 },
    NCAAB: { avg: 72, variance: 9 },
    SOCCER: { avg: 1.3, variance: 1 },
  };

  const scores = leagueScores[league] || { avg: 100, variance: 10 };
  const projectedHome = Math.round(scores.avg + (recommended === "home" ? scores.variance * 0.3 : -scores.variance * 0.2));
  const projectedAway = Math.round(scores.avg + (recommended === "away" ? scores.variance * 0.3 : -scores.variance * 0.2));

  return { recommended, confidence, projectedHome, projectedAway };
}

// Statistical Edge - Primary algorithm, considers situational factors
function generateStatisticalEdgePrediction(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number,
  league: string,
  homeRecord?: string,
  awayRecord?: string
): AlgorithmPrediction {
  const homeProb = homeOdds > 0 
    ? 100 / (homeOdds + 100) 
    : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100);
  const awayProb = awayOdds > 0 
    ? 100 / (awayOdds + 100) 
    : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100);

  // Statistical Edge considers multiple factors
  let adjustedHomeProb = homeProb;
  
  // 1. Home court/field advantage varies by sport
  const homeAdvantages: Record<string, number> = {
    NBA: 0.035,
    NFL: 0.025,
    MLB: 0.02,
    NHL: 0.03,
    NCAAF: 0.04,
    NCAAB: 0.045,
    SOCCER: 0.03,
  };
  adjustedHomeProb += homeAdvantages[league] || 0.03;
  
  // 2. Record analysis with moderate weight
  if (homeRecord && awayRecord) {
    const parseRecord = (r: string) => {
      const parts = r.split("-").map(Number);
      return parts.length >= 2 ? parts[0] / (parts[0] + parts[1]) : 0.5;
    };
    const homeWinPct = parseRecord(homeRecord);
    const awayWinPct = parseRecord(awayRecord);
    adjustedHomeProb += (homeWinPct - awayWinPct) * 0.1;
  }
  
  // 3. Situational adjustment (simulated - in production would check rest days, travel, etc.)
  const situationalBonus = Math.random() * 0.02 - 0.01; // -1% to +1%
  adjustedHomeProb += situationalBonus;

  const recommended = adjustedHomeProb >= 0.5 ? "home" : "away";
  const rawConfidence = recommended === "home" ? adjustedHomeProb : (1 - adjustedHomeProb);
  const confidence = Math.min(85, Math.max(50, Math.round(rawConfidence * 100)));

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting for save predictions
  const rateLimitResult = await checkRateLimit(req, {
    ...RATE_LIMITS.SCHEDULED,
    endpoint: "save-predictions",
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult, corsHeaders);
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

    console.log("Starting prediction save process for all 3 algorithms");

    // Get request body for optional parameters
    let targetLeagues = ["NBA", "NFL", "MLB", "NHL", "NCAAB", "NCAAF", "SOCCER"];
    let generateAllAlgorithms = true;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.leagues) targetLeagues = body.leagues;
        if (body.generateAllAlgorithms !== undefined) generateAllAlgorithms = body.generateAllAlgorithms;
      } catch {
        // Use defaults
      }
    }

    // Determine which algorithms to generate
    const algorithmsToGenerate = generateAllAlgorithms 
      ? [ALGORITHM_IDS.STATISTICAL_EDGE, ALGORITHM_IDS.ML_POWER_INDEX, ALGORITHM_IDS.VALUE_PICK_FINDER]
      : [ALGORITHM_IDS.STATISTICAL_EDGE]; // Default to primary only

    // Fetch upcoming games from all leagues in parallel
    const gamePromises = targetLeagues.map(async (league) => {
      const games = await fetchUpcomingGames(league);
      return games.map((game) => ({ game, league }));
    });
    
    const gamesResults = await Promise.all(gamePromises);
    const allGames = gamesResults.flat();

    console.log(`Found ${allGames.length} upcoming games across ${targetLeagues.length} leagues`);

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
      .in("algorithm_id", algorithmsToGenerate);

    const existingSet = new Set(
      (existingPredictions || []).map((p) => `${p.match_id}-${p.algorithm_id}`)
    );

    // Generate and save predictions for new games - all 3 algorithms
    const predictionsToInsert: any[] = [];

    for (const { game, league } of allGames) {
      const competition = game.competitions?.[0];
      if (!competition?.competitors) continue;

      const homeTeam = competition.competitors.find((c) => c.homeAway === "home");
      const awayTeam = competition.competitors.find((c) => c.homeAway === "away");

      if (!homeTeam || !awayTeam) continue;

      // Get odds if available
      const odds = competition.odds?.[0];
      const homeOdds = odds?.homeTeamOdds?.moneyLine || -110;
      const awayOdds = odds?.awayTeamOdds?.moneyLine || -110;
      
      // Get records if available
      const homeRecord = homeTeam.records?.[0]?.summary;
      const awayRecord = awayTeam.records?.[0]?.summary;

      const homeTeamName = homeTeam.team.displayName;
      const awayTeamName = awayTeam.team.displayName;
      const matchTitle = `${awayTeamName} @ ${homeTeamName}`;

      // Generate predictions for each algorithm
      for (const algorithmId of algorithmsToGenerate) {
        const key = `${game.id}-${algorithmId}`;
        if (existingSet.has(key)) {
          continue; // Skip existing prediction
        }

        let prediction: AlgorithmPrediction;
        
        switch (algorithmId) {
          case ALGORITHM_IDS.ML_POWER_INDEX:
            prediction = generateMLPowerIndexPrediction(
              homeTeamName, awayTeamName, homeOdds, awayOdds, league, homeRecord, awayRecord
            );
            break;
          case ALGORITHM_IDS.VALUE_PICK_FINDER:
            prediction = generateValuePickPrediction(
              homeTeamName, awayTeamName, homeOdds, awayOdds, league
            );
            break;
          case ALGORITHM_IDS.STATISTICAL_EDGE:
          default:
            prediction = generateStatisticalEdgePrediction(
              homeTeamName, awayTeamName, homeOdds, awayOdds, league, homeRecord, awayRecord
            );
            break;
        }

        const predictionText = prediction.recommended === "home" 
          ? `${homeTeamName} Win`
          : `${awayTeamName} Win`;

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
    }

    console.log(`Saving ${predictionsToInsert.length} new predictions across ${algorithmsToGenerate.length} algorithms`);

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
          skipped: (allGames.length * algorithmsToGenerate.length) - predictionsToInsert.length,
          leagues: targetLeagues,
          algorithms: algorithmsToGenerate.map(id => ALGORITHM_NAMES[id]),
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
