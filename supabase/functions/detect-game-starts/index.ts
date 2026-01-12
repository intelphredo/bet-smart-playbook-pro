import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ESPN_ENDPOINTS = [
  { url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard", league: "NBA" },
  { url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard", league: "NFL" },
  { url: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard", league: "MLB" },
  { url: "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard", league: "NHL" },
];

interface GameStatus {
  id: string;
  league: string;
  status: "scheduled" | "live" | "finished";
  homeTeam: string;
  awayTeam: string;
  startTime: string;
}

async function fetchGameStatuses(): Promise<GameStatus[]> {
  const games: GameStatus[] = [];

  const fetches = ESPN_ENDPOINTS.map(async ({ url, league }) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;

      const json = await res.json();
      const events = json.events || [];

      for (const ev of events) {
        const state = ev.status?.type?.state;
        const completed = ev.status?.type?.completed;

        let status: "scheduled" | "live" | "finished" = "scheduled";
        if (state === "in") status = "live";
        if (state === "post" || completed) status = "finished";

        const competitors = ev.competitions?.[0]?.competitors || [];
        const homeTeam = competitors.find((c: any) => c.homeAway === "home")?.team?.displayName || "Home";
        const awayTeam = competitors.find((c: any) => c.homeAway === "away")?.team?.displayName || "Away";

        games.push({
          id: ev.id,
          league,
          status,
          homeTeam,
          awayTeam,
          startTime: ev.date,
        });
      }
    } catch (err) {
      console.error(`ESPN fetch failed for ${league}:`, err);
    }
  });

  await Promise.all(fetches);
  return games;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    console.log("Detecting game starts...");

    // Fetch current game statuses from ESPN
    const games = await fetchGameStatuses();
    const liveGames = games.filter(g => g.status === "live");
    const finishedGames = games.filter(g => g.status === "finished");

    console.log(`Found ${liveGames.length} live games and ${finishedGames.length} finished games`);

    // Check for pending bets on games that just started
    if (liveGames.length > 0) {
      const liveMatchIds = liveGames.map(g => g.id);
      
      // Update pending bets with game_started_at
      const { data: updatedBets, error: updateError } = await supabase
        .from("user_bets")
        .update({ game_started_at: new Date().toISOString() })
        .in("match_id", liveMatchIds)
        .eq("status", "pending")
        .is("game_started_at", null)
        .select("id, match_id");

      if (updateError) {
        console.error("Error updating bets:", updateError);
      } else if (updatedBets && updatedBets.length > 0) {
        console.log(`Marked ${updatedBets.length} bets as game started`);

        // Create alerts for users whose games just started
        const alerts = updatedBets.map(bet => {
          const game = liveGames.find(g => g.id === bet.match_id);
          return {
            user_id: bet.user_id,
            type: "game_started",
            title: "Game Started! 🏀",
            message: game 
              ? `${game.awayTeam} @ ${game.homeTeam} has started!`
              : "A game you bet on has started!",
            match_id: bet.match_id,
            bet_id: bet.id,
          };
        });

        // Note: We'd need user_id from the bets query to create alerts
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          live_games: liveGames.length,
          finished_games: finishedGames.length,
          total_games: games.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in detect-game-starts:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
