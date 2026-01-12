
export const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports";
export const ESPN_API_V2_BASE = "https://site.api.espn.com/apis/v2/sports";

// ESPN Standings Endpoints (using v2 API for full standings data)
export const ESPN_STANDINGS_ENDPOINTS: Record<string, string> = {
  NBA: `${ESPN_API_V2_BASE}/basketball/nba/standings`,
  NFL: `${ESPN_API_V2_BASE}/football/nfl/standings`,
  MLB: `${ESPN_API_V2_BASE}/baseball/mlb/standings`,
  NHL: `${ESPN_API_V2_BASE}/hockey/nhl/standings`,
  SOCCER: `${ESPN_API_V2_BASE}/soccer/eng.1/standings`,
};

// ESPN Scoreboard Endpoints (for live/upcoming games)
export const ESPN_SCOREBOARD_ENDPOINTS: Record<string, string> = {
  NBA: `${ESPN_API_BASE}/basketball/nba/scoreboard`,
  NFL: `${ESPN_API_BASE}/football/nfl/scoreboard`,
  MLB: `${ESPN_API_BASE}/baseball/mlb/scoreboard`,
  NHL: `${ESPN_API_BASE}/hockey/nhl/scoreboard`,
  NCAAF: `${ESPN_API_BASE}/football/college-football/scoreboard`,
  NCAAB: `${ESPN_API_BASE}/basketball/mens-college-basketball/scoreboard`,
  SOCCER: `${ESPN_API_BASE}/soccer/eng.1/scoreboard`,
};

export const SPORTSBOOK_LOGOS = {
  draftkings: "https://upload.wikimedia.org/wikipedia/en/f/fd/DraftKings_logo.svg",
  betmgm: "https://upload.wikimedia.org/wikipedia/commons/2/2f/BetMGM_logo.svg",
};
