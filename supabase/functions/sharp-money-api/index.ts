// Sharp Money API - Records and grades sharp money predictions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SharpPrediction {
  matchId: string;
  matchTitle: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  signalType: string;
  signalStrength: string;
  sharpSide: string;
  marketType: string;
  confidence: number;
  openingLine?: number;
  detectionLine?: number;
  publicPct?: number;
  sharpPct?: number;
  gameStartTime?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "stats";

    // GET - Fetch stats or leaderboard
    if (req.method === "GET") {
      if (action === "stats") {
        // Get overall stats
        const { data: stats, error } = await supabase
          .from("sharp_money_stats")
          .select("*")
          .order("total_predictions", { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ stats }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "leaderboard") {
        // Get signal type leaderboard
        const { data, error } = await supabase
          .from("sharp_money_stats")
          .select("*")
          .order("win_rate", { ascending: false });

        if (error) throw error;

        // Aggregate by signal type
        const leaderboard = aggregateBySignalType(data || []);

        return new Response(JSON.stringify({ leaderboard }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "recent") {
        // Get recent predictions
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const { data, error } = await supabase
          .from("sharp_money_predictions")
          .select("*")
          .order("detected_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        return new Response(JSON.stringify({ predictions: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "by-league") {
        const league = url.searchParams.get("league");
        const { data, error } = await supabase
          .from("sharp_money_stats")
          .select("*")
          .eq("league", league)
          .order("win_rate", { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ stats: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // POST - Record new prediction
    if (req.method === "POST") {
      const body = await req.json();
      const { predictions } = body as { predictions: SharpPrediction[] };

      if (!predictions || !Array.isArray(predictions)) {
        throw new Error("predictions array is required");
      }

      const records = predictions.map((p) => ({
        match_id: p.matchId,
        match_title: p.matchTitle,
        league: p.league,
        home_team: p.homeTeam,
        away_team: p.awayTeam,
        signal_type: p.signalType,
        signal_strength: p.signalStrength,
        sharp_side: p.sharpSide,
        market_type: p.marketType,
        confidence: p.confidence,
        opening_line: p.openingLine,
        detection_line: p.detectionLine,
        public_pct_at_detection: p.publicPct,
        sharp_pct_at_detection: p.sharpPct,
        game_start_time: p.gameStartTime,
        game_result: "pending",
      }));

      const { data, error } = await supabase
        .from("sharp_money_predictions")
        .upsert(records, { onConflict: "match_id,signal_type,sharp_side" })
        .select();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, count: data?.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH - Grade predictions
    if (req.method === "PATCH") {
      const body = await req.json();
      const { matchId, homeScore, awayScore, closingLine } = body;

      if (!matchId) {
        throw new Error("matchId is required");
      }

      // Fetch predictions for this match
      const { data: predictions, error: fetchError } = await supabase
        .from("sharp_money_predictions")
        .select("*")
        .eq("match_id", matchId)
        .eq("game_result", "pending");

      if (fetchError) throw fetchError;

      if (!predictions || predictions.length === 0) {
        return new Response(JSON.stringify({ message: "No pending predictions found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Grade each prediction
      const updates = predictions.map((pred) => {
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

        // Check if beat closing line
        const beatClosing = closingLine !== undefined && pred.detection_line !== undefined
          ? Math.abs(closingLine - pred.detection_line) > 0.5
          : null;

        return {
          id: pred.id,
          game_result: result,
          actual_score_home: homeScore,
          actual_score_away: awayScore,
          closing_line: closingLine,
          beat_closing_line: beatClosing,
          result_verified_at: new Date().toISOString(),
        };
      });

      // Update all predictions
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("sharp_money_predictions")
          .update(update)
          .eq("id", update.id);

        if (updateError) {
          console.error("Error updating prediction:", updateError);
        }
      }

      return new Response(JSON.stringify({ success: true, graded: updates.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sharp Money API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper to aggregate stats by signal type
function aggregateBySignalType(stats: any[]) {
  const byType: Record<string, any> = {};

  for (const stat of stats) {
    if (!byType[stat.signal_type]) {
      byType[stat.signal_type] = {
        signalType: stat.signal_type,
        totalPredictions: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        pending: 0,
        avgConfidence: 0,
        beatClosingCount: 0,
        leagues: new Set(),
      };
    }

    const entry = byType[stat.signal_type];
    entry.totalPredictions += stat.total_predictions;
    entry.wins += stat.wins;
    entry.losses += stat.losses;
    entry.pushes += stat.pushes;
    entry.pending += stat.pending;
    entry.avgConfidence += stat.avg_confidence * stat.total_predictions;
    entry.beatClosingCount += stat.beat_closing_count;
    entry.leagues.add(stat.league);
  }

  // Calculate win rates and finalize
  return Object.values(byType).map((entry: any) => ({
    signalType: entry.signalType,
    totalPredictions: entry.totalPredictions,
    wins: entry.wins,
    losses: entry.losses,
    pushes: entry.pushes,
    pending: entry.pending,
    winRate: entry.wins + entry.losses > 0
      ? Math.round((entry.wins / (entry.wins + entry.losses)) * 1000) / 10
      : 0,
    avgConfidence: entry.totalPredictions > 0
      ? Math.round(entry.avgConfidence / entry.totalPredictions * 10) / 10
      : 0,
    clvRate: entry.totalPredictions > 0
      ? Math.round((entry.beatClosingCount / entry.totalPredictions) * 1000) / 10
      : 0,
    leagueCount: entry.leagues.size,
  })).sort((a, b) => b.winRate - a.winRate);
}
