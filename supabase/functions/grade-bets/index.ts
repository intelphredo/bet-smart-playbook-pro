import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Structured logging
const log = {
  info: (msg: string, data?: Record<string, unknown>) => 
    console.log(JSON.stringify({ level: "info", msg, ...data, ts: new Date().toISOString() })),
  error: (msg: string, error?: unknown, data?: Record<string, unknown>) => 
    console.error(JSON.stringify({ 
      level: "error", msg, 
      error: error instanceof Error ? error.message : String(error),
      ...data, ts: new Date().toISOString() 
    })),
};

interface PendingBet {
  id: string;
  user_id: string;
  match_id: string;
  match_title: string;
  bet_type: string;
  selection: string;
  odds_at_placement: number;
  stake: number;
  league?: string;
  graded_at?: string | null;
}

interface ESPNGame {
  id: string;
  status: {
    type: {
      completed: boolean;
      state: string;
    };
  };
  competitions: Array<{
    competitors: Array<{
      homeAway: string;
      winner?: boolean;
      score: string;
      team: {
        displayName: string;
        abbreviation: string;
      };
    }>;
  }>;
}

const ESPN_SPORT_MAP: Record<string, { sport: string; league: string }> = {
  NFL: { sport: "football", league: "nfl" },
  NBA: { sport: "basketball", league: "nba" },
  MLB: { sport: "baseball", league: "mlb" },
  NHL: { sport: "hockey", league: "nhl" },
  NCAAF: { sport: "football", league: "college-football" },
  NCAAB: { sport: "basketball", league: "mens-college-basketball" },
};

async function fetchESPNGame(matchId: string, league: string): Promise<ESPNGame | null> {
  const sportConfig = ESPN_SPORT_MAP[league] || ESPN_SPORT_MAP.NFL;
  
  try {
    // Try to fetch the specific game
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sportConfig.sport}/${sportConfig.league}/summary?event=${matchId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`ESPN API returned ${response.status} for match ${matchId}`);
      return null;
    }
    
    const data = await response.json();
    return data.header?.competitions?.[0] ? {
      id: matchId,
      status: data.header.competitions[0].status,
      competitions: [data.header.competitions[0]]
    } : null;
  } catch (error) {
    console.error(`Error fetching ESPN game ${matchId}:`, error);
    return null;
  }
}

function determineMoneylineOutcome(
  bet: PendingBet,
  game: ESPNGame
): { status: "won" | "lost" | "push"; resultProfit: number } | null {
  const competition = game.competitions[0];
  if (!competition?.competitors) return null;

  const homeTeam = competition.competitors.find(c => c.homeAway === "home");
  const awayTeam = competition.competitors.find(c => c.homeAway === "away");
  
  if (!homeTeam || !awayTeam) return null;

  const homeScore = parseInt(homeTeam.score, 10);
  const awayScore = parseInt(awayTeam.score, 10);
  
  // Determine which team the bet was on
  const selectionLower = bet.selection.toLowerCase();
  const isHomeBet = selectionLower.includes(homeTeam.team.displayName.toLowerCase()) ||
                    selectionLower.includes(homeTeam.team.abbreviation.toLowerCase()) ||
                    selectionLower.includes("home");
  
  const betTeamWon = isHomeBet ? homeScore > awayScore : awayScore > homeScore;
  const isTie = homeScore === awayScore;

  if (isTie) {
    return { status: "push", resultProfit: 0 };
  }

  if (betTeamWon) {
    // Calculate profit based on American odds
    const odds = bet.odds_at_placement;
    const profit = odds > 0 
      ? bet.stake * (odds / 100)
      : bet.stake * (100 / Math.abs(odds));
    return { status: "won", resultProfit: Math.round(profit * 100) / 100 };
  }

  return { status: "lost", resultProfit: -bet.stake };
}

function determineSpreadOutcome(
  bet: PendingBet,
  game: ESPNGame
): { status: "won" | "lost" | "push"; resultProfit: number } | null {
  const competition = game.competitions[0];
  if (!competition?.competitors) return null;

  const homeTeam = competition.competitors.find(c => c.homeAway === "home");
  const awayTeam = competition.competitors.find(c => c.homeAway === "away");
  
  if (!homeTeam || !awayTeam) return null;

  const homeScore = parseInt(homeTeam.score, 10);
  const awayScore = parseInt(awayTeam.score, 10);
  const pointDiff = homeScore - awayScore;

  // Extract spread from selection (e.g., "Chiefs -3.5" or "Home -3.5")
  const spreadMatch = bet.selection.match(/([+-]?\d+\.?\d*)/);
  if (!spreadMatch) return null;
  
  const spread = parseFloat(spreadMatch[1]);
  const selectionLower = bet.selection.toLowerCase();
  const isHomeBet = selectionLower.includes(homeTeam.team.displayName.toLowerCase()) ||
                    selectionLower.includes(homeTeam.team.abbreviation.toLowerCase()) ||
                    selectionLower.includes("home");

  // Calculate if spread was covered
  const adjustedDiff = isHomeBet ? pointDiff + spread : -pointDiff + spread;

  if (adjustedDiff === 0) {
    return { status: "push", resultProfit: 0 };
  }

  if (adjustedDiff > 0) {
    const odds = bet.odds_at_placement;
    const profit = odds > 0 
      ? bet.stake * (odds / 100)
      : bet.stake * (100 / Math.abs(odds));
    return { status: "won", resultProfit: Math.round(profit * 100) / 100 };
  }

  return { status: "lost", resultProfit: -bet.stake };
}

function determineTotalOutcome(
  bet: PendingBet,
  game: ESPNGame
): { status: "won" | "lost" | "push"; resultProfit: number } | null {
  const competition = game.competitions[0];
  if (!competition?.competitors) return null;

  const homeTeam = competition.competitors.find(c => c.homeAway === "home");
  const awayTeam = competition.competitors.find(c => c.homeAway === "away");
  
  if (!homeTeam || !awayTeam) return null;

  const totalScore = parseInt(homeTeam.score, 10) + parseInt(awayTeam.score, 10);

  // Extract total line from selection (e.g., "Over 45.5" or "Under 220")
  const totalMatch = bet.selection.match(/(\d+\.?\d*)/);
  if (!totalMatch) return null;
  
  const totalLine = parseFloat(totalMatch[1]);
  const isOver = bet.selection.toLowerCase().includes("over");

  const diff = totalScore - totalLine;

  if (diff === 0) {
    return { status: "push", resultProfit: 0 };
  }

  const betWon = isOver ? diff > 0 : diff < 0;

  if (betWon) {
    const odds = bet.odds_at_placement;
    const profit = odds > 0 
      ? bet.stake * (odds / 100)
      : bet.stake * (100 / Math.abs(odds));
    return { status: "won", resultProfit: Math.round(profit * 100) / 100 };
  }

  return { status: "lost", resultProfit: -bet.stake };
}

// Grade sharp money predictions based on game results
async function gradeSharpPredictions(
  supabase: any,
  game: ESPNGame,
  matchId: string
): Promise<number> {
  const competition = game.competitions[0];
  if (!competition?.competitors) return 0;

  const homeTeam = competition.competitors.find(c => c.homeAway === "home");
  const awayTeam = competition.competitors.find(c => c.homeAway === "away");
  
  if (!homeTeam || !awayTeam) return 0;

  const homeScore = parseInt(homeTeam.score, 10);
  const awayScore = parseInt(awayTeam.score, 10);

  // Fetch pending sharp money predictions for this match
  const { data: predictions, error } = await supabase
    .from("sharp_money_predictions")
    .select("*")
    .eq("match_id", matchId)
    .eq("game_result", "pending");

  if (error || !predictions || predictions.length === 0) {
    return 0;
  }

  let gradedCount = 0;

  for (const pred of predictions) {
    let result = "pending";
    const scoreDiff = homeScore - awayScore;

    if (pred.market_type === "spread") {
      // Spread betting: sharp_side wins if their team covers
      if (pred.sharp_side === "home") {
        const adjustedDiff = scoreDiff + (pred.detection_line || 0);
        result = adjustedDiff > 0 ? "won" : adjustedDiff < 0 ? "lost" : "push";
      } else {
        const adjustedDiff = -scoreDiff + (pred.detection_line || 0);
        result = adjustedDiff > 0 ? "won" : adjustedDiff < 0 ? "lost" : "push";
      }
    } else if (pred.market_type === "moneyline") {
      if (pred.sharp_side === "home") {
        result = scoreDiff > 0 ? "won" : scoreDiff < 0 ? "lost" : "push";
      } else {
        result = scoreDiff < 0 ? "won" : scoreDiff > 0 ? "lost" : "push";
      }
    } else if (pred.market_type === "total") {
      const totalScore = homeScore + awayScore;
      const line = pred.detection_line || 0;
      if (pred.sharp_side === "over") {
        result = totalScore > line ? "won" : totalScore < line ? "lost" : "push";
      } else {
        result = totalScore < line ? "won" : totalScore > line ? "lost" : "push";
      }
    }

    if (result !== "pending") {
      const { error: updateError } = await supabase
        .from("sharp_money_predictions")
        .update({
          game_result: result,
          actual_score_home: homeScore,
          actual_score_away: awayScore,
          result_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pred.id)
        .eq("game_result", "pending"); // Idempotency check

      if (!updateError) {
        gradedCount++;
        log.info(`Graded sharp prediction ${pred.id}`, {
          signalType: pred.signal_type,
          result,
          matchId: pred.match_id,
        });
      }
    }
  }

  return gradedCount;
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
      log.error("Missing environment variables");
      return new Response(
        JSON.stringify({ success: false, error: { code: "CONFIG_ERROR", message: "Missing configuration" } }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    log.info("Starting bet grading process");

    // Get all pending bets that haven't been graded yet
    const { data: pendingBets, error: betsError } = await supabase
      .from("user_bets")
      .select("id, user_id, match_id, match_title, bet_type, selection, odds_at_placement, stake, league, graded_at")
      .eq("status", "pending")
      .is("graded_at", null)
      .limit(100); // Process in batches for reliability

    if (betsError) {
      log.error("Error fetching pending bets", betsError);
      throw betsError;
    }

    // Also get pending sharp money predictions
    const { data: pendingSharpPredictions, error: sharpError } = await supabase
      .from("sharp_money_predictions")
      .select("match_id, league")
      .eq("game_result", "pending")
      .limit(100);

    if (sharpError) {
      log.error("Error fetching pending sharp predictions", sharpError);
    }

    // Combine unique match IDs from both bets and sharp predictions
    const matchIdsToCheck = new Set<string>();
    const matchLeagues = new Map<string, string>();

    pendingBets?.forEach((bet: PendingBet) => {
      matchIdsToCheck.add(bet.match_id);
      matchLeagues.set(bet.match_id, bet.league || "NFL");
    });

    pendingSharpPredictions?.forEach((pred: { match_id: string; league: string }) => {
      matchIdsToCheck.add(pred.match_id);
      if (!matchLeagues.has(pred.match_id)) {
        matchLeagues.set(pred.match_id, pred.league || "NFL");
      }
    });

    if (matchIdsToCheck.size === 0) {
      log.info("No pending bets or sharp predictions found");
      return new Response(
        JSON.stringify({ success: true, data: { message: "No pending items to grade", graded: 0 } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log.info(`Checking ${matchIdsToCheck.size} matches for completed games`);

    let gradedBetsCount = 0;
    let gradedSharpCount = 0;
    const alertsToCreate: any[] = [];
    const completedGames = new Map<string, ESPNGame>();

    // Fetch all games and check completion status
    for (const matchId of matchIdsToCheck) {
      const league = matchLeagues.get(matchId) || "NFL";
      const game = await fetchESPNGame(matchId, league);
      
      if (!game) {
        console.log(`Could not fetch game data for ${matchId}`);
        continue;
      }

      if (!game.status?.type?.completed) {
        console.log(`Game ${matchId} not yet completed`);
        continue;
      }

      completedGames.set(matchId, game);

      // Grade sharp money predictions for this completed game
      const sharpGraded = await gradeSharpPredictions(supabase, game, matchId);
      gradedSharpCount += sharpGraded;
    }

    // Now grade user bets
    for (const bet of (pendingBets || []) as PendingBet[]) {
      const game = completedGames.get(bet.match_id);
      if (!game) continue;

      let outcome: { status: "won" | "lost" | "push"; resultProfit: number } | null = null;

      switch (bet.bet_type) {
        case "moneyline":
          outcome = determineMoneylineOutcome(bet, game);
          break;
        case "spread":
          outcome = determineSpreadOutcome(bet, game);
          break;
        case "total":
          outcome = determineTotalOutcome(bet, game);
          break;
      }

      if (!outcome) {
        console.log(`Could not determine outcome for bet ${bet.id}`);
        continue;
      }

      // Update the bet with idempotency check
      const { error: updateError } = await supabase
        .from("user_bets")
        .update({
          status: outcome.status,
          result_profit: outcome.resultProfit,
          settled_at: new Date().toISOString(),
          graded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", bet.id)
        .is("graded_at", null); // Idempotency: only update if not already graded

      if (updateError) {
        console.error(`Error updating bet ${bet.id}:`, updateError);
        continue;
      }

      gradedBetsCount++;
      log.info(`Graded bet ${bet.id}`, { 
        status: outcome.status, 
        profit: outcome.resultProfit,
        matchId: bet.match_id 
      });

      // Create alert for bet result
      const emoji = outcome.status === "won" ? "🎉" : outcome.status === "lost" ? "😔" : "↔️";
      const profitText = outcome.resultProfit > 0 
        ? `+$${outcome.resultProfit.toFixed(2)}` 
        : outcome.resultProfit < 0 
          ? `-$${Math.abs(outcome.resultProfit).toFixed(2)}`
          : "$0.00";

      alertsToCreate.push({
        user_id: bet.user_id,
        type: "bet_result",
        title: `Bet ${outcome.status.charAt(0).toUpperCase() + outcome.status.slice(1)}! ${emoji}`,
        message: `${bet.match_title}: Your ${bet.bet_type} bet on "${bet.selection}" ${outcome.status}. ${profitText}`,
        match_id: bet.match_id,
        bet_id: bet.id,
        metadata: { 
          status: outcome.status, 
          profit: outcome.resultProfit,
          bet_type: bet.bet_type,
          selection: bet.selection
        }
      });
    }

    // Create alerts in batch
    if (alertsToCreate.length > 0) {
      const { error: alertError } = await supabase
        .from("user_alerts")
        .insert(alertsToCreate);
      
      if (alertError) {
        log.error("Error creating alerts", alertError);
      } else {
        log.info(`Created ${alertsToCreate.length} bet result alerts`);
      }
    }

    const duration = Date.now() - startTime;
    log.info(`Bet grading completed`, { 
      gradedBetsCount, 
      gradedSharpCount,
      alertsCreated: alertsToCreate.length, 
      durationMs: duration 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          betsGraded: gradedBetsCount,
          sharpPredictionsGraded: gradedSharpCount,
          alerts_created: alertsToCreate.length,
          duration_ms: duration
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    log.error("Error in grade-bets", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { 
          code: "GRADING_ERROR", 
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString()
        } 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
