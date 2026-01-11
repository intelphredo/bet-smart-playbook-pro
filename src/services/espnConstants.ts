
export const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports";

// ESPN Standings Endpoints (free, no API key required)
export const ESPN_STANDINGS_ENDPOINTS = {
  NBA: `${ESPN_API_BASE}/basketball/nba/standings`,
  NFL: `${ESPN_API_BASE}/football/nfl/standings`,
  MLB: `${ESPN_API_BASE}/baseball/mlb/standings`,
  NHL: `${ESPN_API_BASE}/hockey/nhl/standings`,
  SOCCER: `${ESPN_API_BASE}/soccer/eng.1/standings`,
};

export const SPORTSBOOK_LOGOS = {
  draftkings: "https://upload.wikimedia.org/wikipedia/en/f/fd/DraftKings_logo.svg",
  betmgm: "https://upload.wikimedia.org/wikipedia/commons/2/2f/BetMGM_logo.svg",
};
