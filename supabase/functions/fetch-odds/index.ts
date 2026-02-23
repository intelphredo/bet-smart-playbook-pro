import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { fetchWithRetry } from "../_shared/fetch-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";

const SPORT_KEYS: Record<string, string> = {
  NFL: "americanfootball_nfl",
  NCAAF: "americanfootball_ncaaf",
  CFL: "americanfootball_cfl",
  XFL: "americanfootball_xfl",
  NBA: "basketball_nba",
  NCAAB: "basketball_ncaab",
  WNBA: "basketball_wnba",
  MLB: "baseball_mlb",
  NHL: "icehockey_nhl",
  SOCCER: "soccer_epl",
  EPL: "soccer_epl",
  LA_LIGA: "soccer_spain_la_liga",
  SERIE_A: "soccer_italy_serie_a",
  BUNDESLIGA: "soccer_germany_bundesliga",
  LIGUE_1: "soccer_france_ligue_one",
  MLS: "soccer_usa_mls",
  CHAMPIONS_LEAGUE: "soccer_uefa_champs_league",
  UFC: "mma_mixed_martial_arts",
  ATP: "tennis_atp_aus_open",
  WTA: "tennis_wta_aus_open",
  PGA: "golf_pga_championship",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rateLimitResult = await checkRateLimit(req, {
      ...RATE_LIMITS.PUBLIC_READ,
      endpoint: "fetch-odds",
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders);
    }

    const apiKey = Deno.env.get("ODDS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Odds API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const league = url.searchParams.get("league") || "ALL";
    const markets = url.searchParams.get("markets") || "h2h,spreads,totals";
    const regions = url.searchParams.get("regions") || "us";
    const bookmakers = url.searchParams.get("bookmakers") || "fanduel,draftkings,betmgm,caesars,pointsbetus,betrivers,williamhill_us,unibet_us";

    console.log(`Fetching odds for league: ${league}`);

    const sportsToFetch = league === "ALL" 
      ? Object.entries(SPORT_KEYS)
      : [[league, SPORT_KEYS[league]]].filter(([_, key]) => key);

    if (sportsToFetch.length === 0) {
      return new Response(
        JSON.stringify({ error: `Unknown league: ${league}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = await Promise.allSettled(
      sportsToFetch.map(async ([leagueName, sportKey]) => {
        const oddsUrl = `${ODDS_API_BASE_URL}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=${regions}&markets=${markets}&bookmakers=${bookmakers}&oddsFormat=american`;
        
        console.log(`Fetching: ${leagueName} (${sportKey})`);
        
        const response = await fetchWithRetry(oddsUrl, { timeout: 15000 });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching ${leagueName}: ${response.status} - ${errorText}`);
          throw new Error(`${leagueName}: ${response.status}`);
        }

        const data = await response.json();
        const remainingRequests = response.headers.get("x-requests-remaining");
        const usedRequests = response.headers.get("x-requests-used");
        
        console.log(`${leagueName}: ${data.length} events, API usage: ${usedRequests} used, ${remainingRequests} remaining`);

        return {
          league: leagueName,
          events: data,
          apiUsage: { remaining: remainingRequests, used: usedRequests },
        };
      })
    );

    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map(r => r.value);

    const failedResults = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map(r => r.reason.message);

    const allEvents = successfulResults.flatMap(r => 
      r.events.map((event: any) => ({ ...event, league: r.league }))
    );

    const apiUsage = successfulResults[0]?.apiUsage || { remaining: "unknown", used: "unknown" };

    console.log(`Total events fetched: ${allEvents.length}`);

    return new Response(JSON.stringify({
      success: true,
      events: allEvents,
      totalEvents: allEvents.length,
      apiUsage,
      errors: failedResults.length > 0 ? failedResults : undefined,
      fetchedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in fetch-odds function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
