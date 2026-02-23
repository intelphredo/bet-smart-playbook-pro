import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { fetchWithRetry } from "../_shared/fetch-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";

const SPORT_KEYS: Record<string, string> = {
  NFL: "americanfootball_nfl",
  NBA: "basketball_nba",
  MLB: "baseball_mlb",
  NHL: "icehockey_nhl",
  SOCCER: "soccer_epl",
  NCAAF: "americanfootball_ncaaf",
  NCAAB: "basketball_ncaab",
};

interface OddsRecord {
  match_id: string;
  match_title: string;
  league: string;
  sportsbook_id: string;
  sportsbook_name: string;
  market_type: string;
  home_odds?: number;
  away_odds?: number;
  draw_odds?: number;
  spread_home?: number;
  spread_away?: number;
  spread_home_odds?: number;
  spread_away_odds?: number;
  total_line?: number;
  over_odds?: number;
  under_odds?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const rateLimitResult = await checkRateLimit(req, {
    ...RATE_LIMITS.SCHEDULED,
    endpoint: "record-odds",
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKey = Deno.env.get("ODDS_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Odds API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const leagues = url.searchParams.get("leagues")?.split(",") || Object.keys(SPORT_KEYS);
    const markets = "h2h,spreads,totals";
    const regions = "us";
    const bookmakers = "fanduel,draftkings,betmgm,caesars,pointsbetus,betrivers,williamhill_us,unibet_us";

    console.log(`Recording odds for leagues: ${leagues.join(", ")}`);

    const oddsRecords: OddsRecord[] = [];
    let totalEvents = 0;

    for (const league of leagues) {
      const sportKey = SPORT_KEYS[league];
      if (!sportKey) {
        console.log(`Unknown league: ${league}, skipping`);
        continue;
      }

      try {
        const oddsUrl = `${ODDS_API_BASE_URL}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=${regions}&markets=${markets}&bookmakers=${bookmakers}&oddsFormat=decimal`;
        
        console.log(`Fetching ${league}...`);
        const response = await fetchWithRetry(oddsUrl, { timeout: 15000 }, { maxRetries: 1 });

        if (!response.ok) {
          console.error(`Error fetching ${league}: ${response.status}`);
          continue;
        }

        const events = await response.json();
        totalEvents += events.length;

        for (const event of events) {
          const matchId = event.id;
          const matchTitle = `${event.home_team} vs ${event.away_team}`;

          for (const bookmaker of event.bookmakers || []) {
            const sportsbookId = bookmaker.key;
            const sportsbookName = bookmaker.title;

            const h2hMarket = bookmaker.markets?.find((m: any) => m.key === "h2h");
            const spreadsMarket = bookmaker.markets?.find((m: any) => m.key === "spreads");
            const totalsMarket = bookmaker.markets?.find((m: any) => m.key === "totals");

            if (h2hMarket) {
              const homeOutcome = h2hMarket.outcomes?.find((o: any) => o.name === event.home_team);
              const awayOutcome = h2hMarket.outcomes?.find((o: any) => o.name === event.away_team);
              const drawOutcome = h2hMarket.outcomes?.find((o: any) => o.name === "Draw");
              oddsRecords.push({
                match_id: matchId, match_title: matchTitle, league,
                sportsbook_id: sportsbookId, sportsbook_name: sportsbookName,
                market_type: "moneyline",
                home_odds: homeOutcome?.price, away_odds: awayOutcome?.price,
                draw_odds: drawOutcome?.price,
              });
            }

            if (spreadsMarket) {
              const homeSpread = spreadsMarket.outcomes?.find((o: any) => o.name === event.home_team);
              const awaySpread = spreadsMarket.outcomes?.find((o: any) => o.name === event.away_team);
              oddsRecords.push({
                match_id: matchId, match_title: matchTitle, league,
                sportsbook_id: sportsbookId, sportsbook_name: sportsbookName,
                market_type: "spread",
                spread_home: homeSpread?.point, spread_home_odds: homeSpread?.price,
                spread_away: awaySpread?.point, spread_away_odds: awaySpread?.price,
              });
            }

            if (totalsMarket) {
              const overOutcome = totalsMarket.outcomes?.find((o: any) => o.name === "Over");
              const underOutcome = totalsMarket.outcomes?.find((o: any) => o.name === "Under");
              oddsRecords.push({
                match_id: matchId, match_title: matchTitle, league,
                sportsbook_id: sportsbookId, sportsbook_name: sportsbookName,
                market_type: "total",
                total_line: overOutcome?.point || underOutcome?.point,
                over_odds: overOutcome?.price, under_odds: underOutcome?.price,
              });
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing ${league}:`, error);
      }
    }

    console.log(`Collected ${oddsRecords.length} odds records from ${totalEvents} events`);

    if (oddsRecords.length > 0) {
      const batchSize = 500;
      let insertedCount = 0;

      for (let i = 0; i < oddsRecords.length; i += batchSize) {
        const batch = oddsRecords.slice(i, i + batchSize);
        const { error } = await supabase.from("odds_history").insert(batch);
        if (error) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        } else {
          insertedCount += batch.length;
        }
      }

      console.log(`Successfully inserted ${insertedCount} records`);

      const { error: cleanupError } = await supabase.rpc("cleanup_old_odds_history");
      if (cleanupError) console.error("Error cleaning up old records:", cleanupError);

      return new Response(
        JSON.stringify({
          success: true, recordsInserted: insertedCount, totalEvents,
          leagues: leagues.filter(l => SPORT_KEYS[l]),
          recordedAt: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true, recordsInserted: 0,
        message: "No odds data available",
        recordedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in record-odds function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
