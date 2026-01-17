// Sharp Money API - Records and grades sharp money predictions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== Zod Validation Schemas ====================

const SharpPredictionSchema = z.object({
  matchId: z.string().min(1, "matchId is required").max(100),
  matchTitle: z.string().min(1, "matchTitle is required").max(200),
  league: z.string().min(1, "league is required").max(50),
  homeTeam: z.string().min(1, "homeTeam is required").max(100),
  awayTeam: z.string().min(1, "awayTeam is required").max(100),
  signalType: z.enum(["STEAM_MOVE", "REVERSE_LINE", "SHARP_ACTION", "LINE_FREEZE"]),
  signalStrength: z.enum(["weak", "moderate", "strong"]),
  sharpSide: z.string().min(1, "sharpSide is required").max(100),
  marketType: z.enum(["moneyline", "spread", "total"]),
  confidence: z.number().min(0).max(100),
  openingLine: z.number().optional(),
  detectionLine: z.number().optional(),
  publicPct: z.number().min(0).max(100).optional(),
  sharpPct: z.number().min(0).max(100).optional(),
  gameStartTime: z.string().datetime().optional(),
});

const GradeRequestSchema = z.object({
  matchId: z.string().min(1, "matchId is required"),
  homeScore: z.number().int().min(0).max(999),
  awayScore: z.number().int().min(0).max(999),
  closingLine: z.number().optional(),
});

const PredictionsArraySchema = z.object({
  predictions: z.array(SharpPredictionSchema).min(1, "At least one prediction required"),
});

type SharpPrediction = z.infer<typeof SharpPredictionSchema>;

// Helper for validation error responses
function validationError(errors: z.ZodError): Response {
  const messages = errors.errors.map(e => `${e.path.join('.')}: ${e.message}`);
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: "Validation failed", 
      details: messages 
    }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Apply rate limiting based on request type
    const rateLimitConfig = req.method === "GET" 
      ? { ...RATE_LIMITS.PUBLIC_READ, endpoint: "sharp-money-api-read" }
      : { ...RATE_LIMITS.WRITE, endpoint: "sharp-money-api-write" };
    
    const rateLimitResult = await checkRateLimit(req, rateLimitConfig);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require service role authentication for write operations (POST/PATCH)
    // Use proper Bearer token comparison instead of .includes()
    if (req.method === "POST" || req.method === "PATCH") {
      const authHeader = req.headers.get("authorization");
      
      // Extract Bearer token and compare securely
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Authorization header required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Extract the token from "Bearer <token>" format
      const token = authHeader.replace(/^Bearer\s+/i, '');
      
      // Constant-time comparison to prevent timing attacks
      const serviceKeyBytes = new TextEncoder().encode(supabaseServiceKey);
      const tokenBytes = new TextEncoder().encode(token);
      
      // Check length first, then use timing-safe comparison
      if (tokenBytes.length !== serviceKeyBytes.length) {
        return new Response(
          JSON.stringify({ error: "Service role authentication required for write operations" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Timing-safe comparison
      let isEqual = true;
      for (let i = 0; i < serviceKeyBytes.length; i++) {
        if (tokenBytes[i] !== serviceKeyBytes[i]) {
          isEqual = false;
        }
      }
      
      if (!isEqual) {
        return new Response(
          JSON.stringify({ error: "Service role authentication required for write operations" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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

      if (action === "roi") {
        // Calculate ROI for each signal type
        const { data: predictions, error } = await supabase
          .from("sharp_money_predictions")
          .select("*")
          .neq("game_result", "pending");

        if (error) throw error;

        const roiBySignal = calculateROI(predictions || []);

        return new Response(JSON.stringify({ roi: roiBySignal }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // POST - Record new prediction with Zod validation
    if (req.method === "POST") {
      const body = await req.json();
      
      // Validate the entire request body
      const parseResult = PredictionsArraySchema.safeParse(body);
      if (!parseResult.success) {
        return validationError(parseResult.error);
      }
      
      const { predictions } = parseResult.data;

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

    // PATCH - Grade predictions with Zod validation
    if (req.method === "PATCH") {
      const body = await req.json();
      
      // Validate the grade request
      const parseResult = GradeRequestSchema.safeParse(body);
      if (!parseResult.success) {
        return validationError(parseResult.error);
      }
      
      const { matchId, homeScore, awayScore, closingLine } = parseResult.data;

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

// Calculate ROI for each signal type
// Assumes flat $100 bet per play at -110 odds (standard juice)
function calculateROI(predictions: any[]) {
  const STAKE = 100; // $100 per bet
  const WIN_RETURN = 190.91; // $100 stake + $90.91 profit at -110
  
  const byType: Record<string, {
    signalType: string;
    totalBets: number;
    wins: number;
    losses: number;
    pushes: number;
    totalStaked: number;
    totalReturn: number;
    profit: number;
    roi: number;
    avgOdds: number;
    bestStreak: number;
    worstStreak: number;
    currentStreak: number;
    byLeague: Record<string, { wins: number; losses: number; profit: number }>;
    byMarket: Record<string, { wins: number; losses: number; profit: number }>;
    monthlyData: Record<string, { wins: number; losses: number; profit: number }>;
  }> = {};

  // Sort by detected_at for streak calculation
  const sorted = [...predictions].sort((a, b) => 
    new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime()
  );

  for (const pred of sorted) {
    const type = pred.signal_type;
    
    if (!byType[type]) {
      byType[type] = {
        signalType: type,
        totalBets: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        totalStaked: 0,
        totalReturn: 0,
        profit: 0,
        roi: 0,
        avgOdds: -110,
        bestStreak: 0,
        worstStreak: 0,
        currentStreak: 0,
        byLeague: {},
        byMarket: {},
        monthlyData: {},
      };
    }

    const entry = byType[type];
    entry.totalBets++;

    // Handle league breakdown
    if (!entry.byLeague[pred.league]) {
      entry.byLeague[pred.league] = { wins: 0, losses: 0, profit: 0 };
    }

    // Handle market breakdown
    if (!entry.byMarket[pred.market_type]) {
      entry.byMarket[pred.market_type] = { wins: 0, losses: 0, profit: 0 };
    }

    // Handle monthly breakdown
    const month = new Date(pred.detected_at).toISOString().slice(0, 7);
    if (!entry.monthlyData[month]) {
      entry.monthlyData[month] = { wins: 0, losses: 0, profit: 0 };
    }

    if (pred.game_result === "won") {
      entry.wins++;
      entry.totalStaked += STAKE;
      entry.totalReturn += WIN_RETURN;
      entry.byLeague[pred.league].wins++;
      entry.byLeague[pred.league].profit += (WIN_RETURN - STAKE);
      entry.byMarket[pred.market_type].wins++;
      entry.byMarket[pred.market_type].profit += (WIN_RETURN - STAKE);
      entry.monthlyData[month].wins++;
      entry.monthlyData[month].profit += (WIN_RETURN - STAKE);
      
      // Update streak
      if (entry.currentStreak >= 0) {
        entry.currentStreak++;
        entry.bestStreak = Math.max(entry.bestStreak, entry.currentStreak);
      } else {
        entry.currentStreak = 1;
      }
    } else if (pred.game_result === "lost") {
      entry.losses++;
      entry.totalStaked += STAKE;
      entry.totalReturn += 0;
      entry.byLeague[pred.league].losses++;
      entry.byLeague[pred.league].profit -= STAKE;
      entry.byMarket[pred.market_type].losses++;
      entry.byMarket[pred.market_type].profit -= STAKE;
      entry.monthlyData[month].losses++;
      entry.monthlyData[month].profit -= STAKE;
      
      // Update streak
      if (entry.currentStreak <= 0) {
        entry.currentStreak--;
        entry.worstStreak = Math.min(entry.worstStreak, entry.currentStreak);
      } else {
        entry.currentStreak = -1;
      }
    } else if (pred.game_result === "push") {
      entry.pushes++;
      entry.totalReturn += STAKE; // Return stake on push
    }
  }

  // Calculate final ROI for each
  return Object.values(byType).map((entry) => {
    entry.profit = entry.totalReturn - entry.totalStaked;
    entry.roi = entry.totalStaked > 0 
      ? Math.round((entry.profit / entry.totalStaked) * 1000) / 10 
      : 0;
    return entry;
  }).sort((a, b) => b.roi - a.roi);
}
