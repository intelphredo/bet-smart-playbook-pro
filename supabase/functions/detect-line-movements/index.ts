import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OddsRecord {
  id: string;
  match_id: string;
  match_title: string;
  league: string;
  sportsbook_id: string;
  sportsbook_name: string;
  home_odds: number | null;
  away_odds: number | null;
  spread_home: number | null;
  spread_home_odds: number | null;
  spread_away_odds: number | null;
  total_line: number | null;
  over_odds: number | null;
  under_odds: number | null;
  recorded_at: string;
}

interface UserPreferences {
  favorites?: {
    teams?: string[];
    leagues?: string[];
    matches?: string[];
  };
  notifications?: {
    line_movements?: boolean;
  };
}

// Threshold for significant line movement (in American odds points)
const MONEYLINE_MOVEMENT_THRESHOLD = 15; // e.g., -110 to -125
const SPREAD_MOVEMENT_THRESHOLD = 0.5;   // e.g., -3.5 to -4.0
const TOTAL_MOVEMENT_THRESHOLD = 1.0;    // e.g., 45.5 to 46.5

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting line movement detection...");

    // Get the most recent odds for each match/sportsbook combo
    const { data: latestOdds, error: latestError } = await supabase
      .from("odds_history")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(500);

    if (latestError) throw latestError;

    if (!latestOdds || latestOdds.length === 0) {
      console.log("No odds history found");
      return new Response(
        JSON.stringify({ success: true, message: "No odds to analyze", movements: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group odds by match_id + sportsbook_id and get the two most recent
    const groupedOdds: Record<string, OddsRecord[]> = {};
    for (const odd of latestOdds as OddsRecord[]) {
      const key = `${odd.match_id}:${odd.sportsbook_id}`;
      if (!groupedOdds[key]) groupedOdds[key] = [];
      if (groupedOdds[key].length < 2) {
        groupedOdds[key].push(odd);
      }
    }

    const movements: any[] = [];
    const alertsToCreate: any[] = [];

    // Detect significant movements
    for (const [key, odds] of Object.entries(groupedOdds)) {
      if (odds.length < 2) continue;

      const [current, previous] = odds;
      const matchId = current.match_id;
      
      let hasSignificantMovement = false;
      let movementDetails: any = {
        match_id: matchId,
        match_title: current.match_title,
        league: current.league,
        sportsbook_id: current.sportsbook_id,
        previous_odds: {},
        current_odds: {},
        movements: []
      };

      // Check moneyline movement
      if (current.home_odds && previous.home_odds) {
        const homeMovement = Math.abs(current.home_odds - previous.home_odds);
        if (homeMovement >= MONEYLINE_MOVEMENT_THRESHOLD) {
          hasSignificantMovement = true;
          movementDetails.movements.push({
            type: 'moneyline_home',
            from: previous.home_odds,
            to: current.home_odds,
            change: current.home_odds - previous.home_odds
          });
        }
      }

      if (current.away_odds && previous.away_odds) {
        const awayMovement = Math.abs(current.away_odds - previous.away_odds);
        if (awayMovement >= MONEYLINE_MOVEMENT_THRESHOLD) {
          hasSignificantMovement = true;
          movementDetails.movements.push({
            type: 'moneyline_away',
            from: previous.away_odds,
            to: current.away_odds,
            change: current.away_odds - previous.away_odds
          });
        }
      }

      // Check spread movement
      if (current.spread_home !== null && previous.spread_home !== null) {
        const spreadMovement = Math.abs(current.spread_home - previous.spread_home);
        if (spreadMovement >= SPREAD_MOVEMENT_THRESHOLD) {
          hasSignificantMovement = true;
          movementDetails.movements.push({
            type: 'spread',
            from: previous.spread_home,
            to: current.spread_home,
            change: current.spread_home - previous.spread_home
          });
        }
      }

      // Check total movement
      if (current.total_line !== null && previous.total_line !== null) {
        const totalMovement = Math.abs(current.total_line - previous.total_line);
        if (totalMovement >= TOTAL_MOVEMENT_THRESHOLD) {
          hasSignificantMovement = true;
          movementDetails.movements.push({
            type: 'total',
            from: previous.total_line,
            to: current.total_line,
            change: current.total_line - previous.total_line
          });
        }
      }

      if (hasSignificantMovement) {
        movementDetails.previous_odds = {
          home: previous.home_odds,
          away: previous.away_odds,
          spread_home: previous.spread_home,
          total: previous.total_line
        };
        movementDetails.current_odds = {
          home: current.home_odds,
          away: current.away_odds,
          spread_home: current.spread_home,
          total: current.total_line
        };

        // Determine movement direction
        const direction = movementDetails.movements.some((m: any) => m.change < 0) 
          ? 'steam' 
          : 'reverse';

        movements.push(movementDetails);

        // Store the movement
        await supabase.from("line_movement_tracking").insert({
          match_id: matchId,
          match_title: current.match_title,
          league: current.league,
          sportsbook_id: current.sportsbook_id,
          market_type: movementDetails.movements[0]?.type || 'moneyline',
          previous_odds: movementDetails.previous_odds,
          current_odds: movementDetails.current_odds,
          movement_percentage: movementDetails.movements[0]?.change || 0,
          movement_direction: direction,
          alerts_sent: false
        });
      }
    }

    console.log(`Detected ${movements.length} significant line movements`);

    // Now find users who should be notified
    if (movements.length > 0) {
      // Get all users who have line movement notifications enabled
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, preferences, full_name");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else if (profiles) {
        for (const profile of profiles) {
          const prefs = profile.preferences as UserPreferences | null;
          
          // Skip if notifications disabled
          if (prefs?.notifications?.line_movements === false) continue;

          const favoriteTeams = prefs?.favorites?.teams || [];
          const favoriteLeagues = prefs?.favorites?.leagues || [];
          const favoriteMatches = prefs?.favorites?.matches || [];

          // Check each movement for relevance to this user
          for (const movement of movements) {
            const matchTitle = movement.match_title || '';
            const league = movement.league || '';
            const matchId = movement.match_id;

            // Check if user is interested in this match
            const isRelevant = 
              favoriteMatches.includes(matchId) ||
              favoriteLeagues.includes(league) ||
              favoriteTeams.some((team: string) => 
                matchTitle.toLowerCase().includes(team.toLowerCase())
              );

            if (isRelevant || (favoriteTeams.length === 0 && favoriteLeagues.length === 0)) {
              // Only send if truly relevant OR user has no preferences set (send all)
              if (isRelevant) {
                const movementDesc = movement.movements.map((m: any) => {
                  if (m.type === 'spread') {
                    return `Spread: ${m.from > 0 ? '+' : ''}${m.from} → ${m.to > 0 ? '+' : ''}${m.to}`;
                  } else if (m.type === 'total') {
                    return `Total: ${m.from} → ${m.to}`;
                  } else {
                    return `${m.type.includes('home') ? 'Home' : 'Away'}: ${m.from > 0 ? '+' : ''}${m.from} → ${m.to > 0 ? '+' : ''}${m.to}`;
                  }
                }).join(', ');

                alertsToCreate.push({
                  user_id: profile.id,
                  type: 'line_movement',
                  title: `📊 Sharp Line Movement`,
                  message: `${matchTitle}: ${movementDesc}`,
                  match_id: matchId,
                  metadata: {
                    league,
                    movements: movement.movements,
                    sportsbook_id: movement.sportsbook_id
                  }
                });
              }
            }
          }
        }

        // Batch insert alerts
        if (alertsToCreate.length > 0) {
          const { error: alertError } = await supabase
            .from("user_alerts")
            .insert(alertsToCreate);

          if (alertError) {
            console.error("Error creating alerts:", alertError);
          } else {
            console.log(`Created ${alertsToCreate.length} line movement alerts`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        movements_detected: movements.length,
        alerts_created: alertsToCreate.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in detect-line-movements:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
