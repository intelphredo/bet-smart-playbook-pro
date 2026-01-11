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

    if (!pendingBets || pendingBets.length === 0) {
      log.info("No pending bets found");
      return new Response(
        JSON.stringify({ success: true, data: { message: "No pending bets to grade", graded: 0 } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log.info(`Found ${pendingBets.length} pending bets to check`);

    let gradedCount = 0;
    const alertsToCreate: any[] = [];

    for (const bet of pendingBets as PendingBet[]) {
      // Fetch game data from ESPN
      const game = await fetchESPNGame(bet.match_id, bet.league || "NFL");
      
      if (!game) {
        console.log(`Could not fetch game data for ${bet.match_id}`);
        continue;
      }

      // Check if game is completed
      if (!game.status?.type?.completed) {
        console.log(`Game ${bet.match_id} not yet completed`);
        continue;
      }

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

      gradedCount++;
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
    log.info(`Bet grading completed`, { gradedCount, alertsCreated: alertsToCreate.length, durationMs: duration });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          graded: gradedCount,
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
