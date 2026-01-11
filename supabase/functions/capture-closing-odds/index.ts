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
  bet_type: string;
  selection: string;
  odds_at_placement: number;
  closing_odds: number | null;
}

interface OddsRecord {
  home_odds: number | null;
  away_odds: number | null;
  spread_home_odds: number | null;
  spread_away_odds: number | null;
  over_odds: number | null;
  under_odds: number | null;
  recorded_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting CLV capture process...");

    // Get all pending bets without closing odds
    const { data: pendingBets, error: betsError } = await supabase
      .from("user_bets")
      .select("id, user_id, match_id, bet_type, selection, odds_at_placement, closing_odds")
      .eq("status", "pending")
      .is("closing_odds", null);

    if (betsError) {
      console.error("Error fetching pending bets:", betsError);
      throw betsError;
    }

    if (!pendingBets || pendingBets.length === 0) {
      console.log("No pending bets without closing odds found");
      return new Response(
        JSON.stringify({ success: true, message: "No bets to update", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingBets.length} pending bets without closing odds`);

    const updates: { id: string; closing_odds: number; clv_percentage: number; user_id: string }[] = [];

    // Process each bet
    for (const bet of pendingBets as PendingBet[]) {
      // Get the most recent odds for this match
      const { data: oddsHistory, error: oddsError } = await supabase
        .from("odds_history")
        .select("home_odds, away_odds, spread_home_odds, spread_away_odds, over_odds, under_odds, recorded_at")
        .eq("match_id", bet.match_id)
        .order("recorded_at", { ascending: false })
        .limit(1);

      if (oddsError || !oddsHistory || oddsHistory.length === 0) {
        console.log(`No odds found for match ${bet.match_id}`);
        continue;
      }

      const latestOdds = oddsHistory[0] as OddsRecord;
      let closingOdds: number | null = null;

      // Determine closing odds based on bet type and selection
      if (bet.bet_type === "moneyline") {
        // Parse selection to determine home/away
        const isHome = bet.selection.toLowerCase().includes("home") || 
                       bet.selection.split(" vs ")[0]?.trim() === bet.selection.split("@")[1]?.trim();
        closingOdds = isHome ? latestOdds.home_odds : latestOdds.away_odds;
      } else if (bet.bet_type === "spread") {
        const isHome = bet.selection.toLowerCase().includes("home") || bet.selection.includes("-");
        closingOdds = isHome ? latestOdds.spread_home_odds : latestOdds.spread_away_odds;
      } else if (bet.bet_type === "total") {
        const isOver = bet.selection.toLowerCase().includes("over");
        closingOdds = isOver ? latestOdds.over_odds : latestOdds.under_odds;
      }

      if (closingOdds !== null) {
        // Calculate CLV percentage
        // Positive CLV means you got better odds than closing
        const clvPercentage = ((bet.odds_at_placement - closingOdds) / Math.abs(closingOdds)) * 100;
        
        updates.push({
          id: bet.id,
          closing_odds: closingOdds,
          clv_percentage: Math.round(clvPercentage * 100) / 100,
          user_id: bet.user_id
        });

        console.log(`Bet ${bet.id}: Placement odds ${bet.odds_at_placement}, Closing odds ${closingOdds}, CLV ${clvPercentage.toFixed(2)}%`);
      }
    }

    // Batch update all bets
    let updatedCount = 0;
    const alertsToCreate: any[] = [];

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("user_bets")
        .update({
          closing_odds: update.closing_odds,
          clv_percentage: update.clv_percentage,
          updated_at: new Date().toISOString()
        })
        .eq("id", update.id);

      if (!updateError) {
        updatedCount++;
        
        // Create alert for significant CLV
        if (Math.abs(update.clv_percentage) >= 2) {
          const isPositive = update.clv_percentage > 0;
          alertsToCreate.push({
            user_id: update.user_id,
            type: "clv_update",
            title: isPositive ? "Positive CLV Captured! 📈" : "CLV Update",
            message: `Your bet closed with ${update.clv_percentage > 0 ? "+" : ""}${update.clv_percentage.toFixed(1)}% CLV. ${isPositive ? "You beat the closing line!" : ""}`,
            bet_id: update.id,
            metadata: { clv_percentage: update.clv_percentage, closing_odds: update.closing_odds }
          });
        }
      } else {
        console.error(`Error updating bet ${update.id}:`, updateError);
      }
    }

    // Create alerts
    if (alertsToCreate.length > 0) {
      const { error: alertError } = await supabase
        .from("user_alerts")
        .insert(alertsToCreate);
      
      if (alertError) {
        console.error("Error creating alerts:", alertError);
      } else {
        console.log(`Created ${alertsToCreate.length} CLV alerts`);
      }
    }

    console.log(`Successfully updated ${updatedCount} bets with closing odds`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updatedCount,
        alerts_created: alertsToCreate.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in capture-closing-odds:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
