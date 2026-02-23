import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { fetchWithRetry } from "../_shared/fetch-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPORTRADAR_BASE_URL = "https://api.sportradar.com";

// Endpoint templates for different sports and data types
const ENDPOINTS = {
  // NBA v8
  NBA: {
    INJURIES: "/nba/trial/v8/en/league/injuries.json",
    STANDINGS: "/nba/trial/v8/en/seasons/{{year}}/{{season_type}}/standings.json",
    LEADERS: "/nba/trial/v8/en/seasons/{{year}}/{{season_type}}/leaders.json",
    TEAM_PROFILE: "/nba/trial/v8/en/teams/{{team_id}}/profile.json",
    PLAYER_PROFILE: "/nba/trial/v8/en/players/{{player_id}}/profile.json",
  },
  // NFL v8
  NFL: {
    INJURIES: "/nfl/official/trial/v8/en/league/injuries.json",
    STANDINGS: "/nfl/official/trial/v8/en/seasons/{{year}}/{{season_type}}/standings/season.json",
    LEADERS: "/nfl/official/trial/v8/en/seasons/{{year}}/{{season_type}}/leaders.json",
    TEAM_PROFILE: "/nfl/official/trial/v8/en/teams/{{team_id}}/profile.json",
    PLAYER_PROFILE: "/nfl/official/trial/v8/en/players/{{player_id}}/profile.json",
  },
  // MLB v7
  MLB: {
    INJURIES: "/mlb/trial/v7/en/league/injuries.json",
    STANDINGS: "/mlb/trial/v7/en/seasons/{{year}}/standings.json",
    LEADERS: "/mlb/trial/v7/en/seasons/{{year}}/leaders/hitting.json",
    TEAM_PROFILE: "/mlb/trial/v7/en/teams/{{team_id}}/profile.json",
    PLAYER_PROFILE: "/mlb/trial/v7/en/players/{{player_id}}/profile.json",
  },
  // NHL v8
  NHL: {
    INJURIES: "/nhl/trial/v8/en/league/injuries.json",
    STANDINGS: "/nhl/trial/v8/en/seasons/{{year}}/{{season_type}}/standings.json",
    LEADERS: "/nhl/trial/v8/en/seasons/{{year}}/{{season_type}}/leaders.json",
    TEAM_PROFILE: "/nhl/trial/v8/en/teams/{{team_id}}/profile.json",
    PLAYER_PROFILE: "/nhl/trial/v8/en/players/{{player_id}}/profile.json",
  },
  // Soccer v4
  SOCCER: {
    INJURIES: "/soccer/trial/v4/en/competitions/sr:competition:17/injuries.json",
    STANDINGS: "/soccer/trial/v4/en/competitions/sr:competition:17/standings.json",
    LEADERS: "/soccer/trial/v4/en/competitions/sr:competition:17/leaders.json",
    TEAM_PROFILE: "/soccer/trial/v4/en/teams/{{team_id}}/profile.json",
    PLAYER_PROFILE: "/soccer/trial/v4/en/players/{{player_id}}/profile.json",
  },
};

// Get current season year based on league
function getCurrentSeasonYear(league: string): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (league === "NBA" || league === "NHL") {
    return month >= 9 ? year : year - 1;
  }
  if (league === "NFL") {
    return month >= 8 ? year : year - 1;
  }
  return year;
}

// Get current season type
function getCurrentSeasonType(league: string): string {
  const now = new Date();
  const month = now.getMonth();

  switch (league) {
    case "NBA":
    case "NHL":
      if (month >= 9 && month <= 10) return "PRE";
      if (month >= 4 && month <= 5) return "PST";
      return "REG";
    case "NFL":
      if (month === 7 || month === 8) return "PRE";
      if (month >= 1 && month <= 2) return "PST";
      return "REG";
    default:
      return "REG";
  }
}

// Build URL with parameters replaced
function buildUrl(endpoint: string, params: Record<string, string>): string {
  let url = endpoint;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`{{${key}}}`, value);
  }
  return url;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const rateLimitResult = await checkRateLimit(req, {
    ...RATE_LIMITS.PUBLIC_READ,
    endpoint: "fetch-sportradar",
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    const apiKey = Deno.env.get("SPORTRADAR_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Sportradar API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const league = url.searchParams.get("league") || "NBA";
    const dataType = url.searchParams.get("type") || "INJURIES";
    const teamId = url.searchParams.get("team_id");
    const playerId = url.searchParams.get("player_id");

    console.log(`Sportradar request: ${league} - ${dataType}`);

    // Validate league
    const leagueEndpoints = ENDPOINTS[league as keyof typeof ENDPOINTS];
    if (!leagueEndpoints) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown league: ${league}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the endpoint template
    const endpointTemplate = leagueEndpoints[dataType as keyof typeof leagueEndpoints];
    if (!endpointTemplate) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown data type: ${dataType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build parameters
    const params: Record<string, string> = {
      year: getCurrentSeasonYear(league).toString(),
      season_type: getCurrentSeasonType(league),
    };

    if (teamId) params.team_id = teamId;
    if (playerId) params.player_id = playerId;

    // Build the full URL
    const endpoint = buildUrl(endpointTemplate, params);
    const fullUrl = `${SPORTRADAR_BASE_URL}${endpoint}?api_key=${apiKey}`;

    console.log(`Fetching: ${SPORTRADAR_BASE_URL}${endpoint}`);

    const response = await fetchWithRetry(
      fullUrl,
      { timeout: 15000, headers: { "Accept": "application/json" } },
      { maxRetries: 1 }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Sportradar error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Sportradar API error: ${response.status}`,
          details: errorText.substring(0, 200)
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    console.log(`Sportradar ${league} ${dataType}: Success`);

    return new Response(
      JSON.stringify({
        success: true,
        league,
        dataType,
        data,
        fetchedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in fetch-sportradar function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
