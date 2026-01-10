import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log(`Fetching odds for league: ${league}`);

    // Determine which sports to fetch
    const sportsToFetch = league === "ALL" 
      ? Object.entries(SPORT_KEYS)
      : [[league, SPORT_KEYS[league]]].filter(([_, key]) => key);

    if (sportsToFetch.length === 0) {
      return new Response(
        JSON.stringify({ error: `Unknown league: ${league}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch odds for all requested sports in parallel
    const results = await Promise.allSettled(
      sportsToFetch.map(async ([leagueName, sportKey]) => {
        const oddsUrl = `${ODDS_API_BASE_URL}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=american`;
        
        console.log(`Fetching: ${leagueName} (${sportKey})`);
        
        const response = await fetch(oddsUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching ${leagueName}: ${response.status} - ${errorText}`);
          throw new Error(`${leagueName}: ${response.status}`);
        }

        const data = await response.json();
        
        // Get remaining requests from headers
        const remainingRequests = response.headers.get("x-requests-remaining");
        const usedRequests = response.headers.get("x-requests-used");
        
        console.log(`${leagueName}: ${data.length} events, API usage: ${usedRequests} used, ${remainingRequests} remaining`);

        return {
          league: leagueName,
          events: data,
          apiUsage: {
            remaining: remainingRequests,
            used: usedRequests,
          },
        };
      })
    );

    // Process results
    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map(r => r.value);

    const failedResults = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map(r => r.reason.message);

    // Combine all events
    const allEvents = successfulResults.flatMap(r => 
      r.events.map((event: any) => ({
        ...event,
        league: r.league,
      }))
    );

    // Get API usage from first successful result
    const apiUsage = successfulResults[0]?.apiUsage || { remaining: "unknown", used: "unknown" };

    const responseData = {
      success: true,
      events: allEvents,
      totalEvents: allEvents.length,
      apiUsage,
      errors: failedResults.length > 0 ? failedResults : undefined,
      fetchedAt: new Date().toISOString(),
    };

    console.log(`Total events fetched: ${allEvents.length}`);

    return new Response(JSON.stringify(responseData), {
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
