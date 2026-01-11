import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingBet {
  id: string;
  user_id: string;
  match_id: string;
  game_started_at: string | null;
}

interface ESPNEvent {
  id: string;
  status: {
    type: {
      state: string; // "pre", "in", "post"
      completed: boolean;
    };
  };
}

// ESPN API endpoints by sport
const ESPN_ENDPOINTS: Record<string, string> = {
  NBA: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  NFL: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  MLB: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
  NHL: "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
  NCAAF: "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard",
  NCAAB: "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard",
};

async function fetchGameStatuses(): Promise<Map<string, string>> {
  const gameStatuses = new Map<string, string>();
  
  // Fetch from all ESPN endpoints in parallel
  const fetchPromises = Object.entries(ESPN_ENDPOINTS).map(async ([sport, url]) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const data = await response.json();
      const events = data.events || [];
      
      return events.map((event: ESPNEvent) => ({
        id: event.id,
        state: event.status?.type?.state || "pre",
        completed: event.status?.type?.completed || false,
      }));
    } catch (error) {
      console.error(`Failed to fetch ${sport}:`, error);
      return [];
    }
  });
  
  const results = await Promise.all(fetchPromises);
  
  for (const sportEvents of results) {
    for (const event of sportEvents) {
      // Map ESPN states to our status
      let status = "scheduled";
      if (event.state === "in") status = "live";
      else if (event.state === "post" || event.completed) status = "finished";
      
      gameStatuses.set(event.id, status);
    }
  }
  
  return gameStatuses;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Detecting game starts...");

    // Get pending bets that haven't had game_started_at set
    const { data: pendingBets, error: betsError } = await supabase
      .from("user_bets")
      .select("id, user_id, match_id, game_started_at")
      .eq("status", "pending")
      .is("game_started_at", null);

    if (betsError) {
      throw new Error(`Failed to fetch pending bets: ${betsError.message}`);
    }

    if (!pendingBets || pendingBets.length === 0) {
      console.log("No pending bets without game_started_at");
      return new Response(
        JSON.stringify({ success: true, message: "No games to check", gamesStarted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique match IDs
    const matchIds = [...new Set(pendingBets.map((bet: PendingBet) => bet.match_id))];
    console.log(`Checking ${matchIds.length} unique matches`);

    // Fetch current game statuses from ESPN
    const gameStatuses = await fetchGameStatuses();
    console.log(`Fetched statuses for ${gameStatuses.size} games`);

    const gamesStarted: string[] = [];
    const alertsCreated: string[] = [];
    const clvTriggered: string[] = [];

    // Check each match
    for (const matchId of matchIds) {
      const status = gameStatuses.get(matchId);
      
      if (status === "live" || status === "finished") {
        console.log(`Game ${matchId} has started (status: ${status})`);
        gamesStarted.push(matchId);

        // Get all bets for this match
        const matchBets = pendingBets.filter((bet: PendingBet) => bet.match_id === matchId);

        // Update game_started_at for these bets
        const { error: updateError } = await supabase
          .from("user_bets")
          .update({ game_started_at: new Date().toISOString() })
          .eq("match_id", matchId)
          .is("game_started_at", null);

        if (updateError) {
          console.error(`Failed to update game_started_at for ${matchId}:`, updateError);
          continue;
        }

        // Trigger CLV capture for this match
        try {
          const clvResponse = await fetch(`${supabaseUrl}/functions/v1/capture-closing-odds`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ match_id: matchId }),
          });

          if (clvResponse.ok) {
            clvTriggered.push(matchId);
            console.log(`CLV captured for match ${matchId}`);
          }
        } catch (clvError) {
          console.error(`Failed to trigger CLV for ${matchId}:`, clvError);
        }

        // Create alerts for each user with a bet on this match
        const userIds = [...new Set(matchBets.map((bet: PendingBet) => bet.user_id))];
        
        for (const userId of userIds) {
          const userBetCount = matchBets.filter((b: PendingBet) => b.user_id === userId).length;
          
          const { error: alertError } = await supabase
            .from("user_alerts")
            .insert({
              user_id: userId,
              type: "game_start",
              title: "Game Started! 🏈",
              message: `Your ${userBetCount > 1 ? `${userBetCount} bets are` : "bet is"} now live. CLV has been calculated.`,
              metadata: { match_id: matchId, bet_count: userBetCount },
            });

          if (!alertError) {
            alertsCreated.push(userId);
          }
        }

        // Trigger push notifications
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              match_id: matchId,
              type: "game_start",
              title: "Game Started! 🏈",
              body: "Your bet is now live. CLV has been captured.",
            }),
          });
        } catch (pushError) {
          console.error(`Failed to send push for ${matchId}:`, pushError);
        }
      }
    }

    // Log job result
    await supabase.from("scheduled_job_logs").insert({
      job_name: "detect-game-starts",
      status: "success",
      records_processed: gamesStarted.length,
      metadata: {
        matches_checked: matchIds.length,
        games_started: gamesStarted,
        alerts_created: alertsCreated.length,
        clv_triggered: clvTriggered,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        matchesChecked: matchIds.length,
        gamesStarted: gamesStarted.length,
        alertsCreated: alertsCreated.length,
        clvTriggered: clvTriggered.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Detect game starts error:", error);
    
    await supabase.from("scheduled_job_logs").insert({
      job_name: "detect-game-starts",
      status: "failed",
      error_message: error.message,
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
