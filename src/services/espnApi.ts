
import { Match, League } from "@/types/sports";
import { ESPN_API_BASE } from "./espnConstants";
import { mapESPNEventToMatch, ESPNResponse } from "./espnMappers";

// Data source tracking
export interface ESPNDataStatus {
  source: "live" | "mock";
  lastUpdated: Date;
  gamesLoaded: number;
  errors: string[];
}

let dataStatus: ESPNDataStatus = {
  source: "mock",
  lastUpdated: new Date(),
  gamesLoaded: 0,
  errors: []
};

export const getESPNDataStatus = (): ESPNDataStatus => dataStatus;

// Enhanced fetch with timeout functionality
const fetchWithTimeout = async (url: string, timeout = 8000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Fetch events for a specific league - focused on working scoreboard API only
export const fetchESPNEvents = async (league: League): Promise<Match[]> => {
  const endpoint = getScoreboardEndpoint(league);
  
  if (!endpoint) {
    console.warn(`Unsupported league: ${league}`);
    return generateMockEventsForLeague(league);
  }

  try {
    const response = await fetchWithTimeout(endpoint);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data: ESPNResponse = await response.json();
    const events = data.events || [];

    if (events.length === 0) {
      // No games today - this is normal, not an error
      console.info(`No ${league} games scheduled today`);
      return [];
    }

    // Successfully got real data
    const matches = events.map(event => mapESPNEventToMatch(event, league));
    
    // Update status
    dataStatus.source = "live";
    dataStatus.lastUpdated = new Date();
    dataStatus.gamesLoaded += matches.length;
    
    return matches;
  } catch (error) {
    // Silent fail - just return empty or mock data
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    if (!dataStatus.errors.includes(errorMsg)) {
      dataStatus.errors.push(errorMsg);
    }
    
    // Return mock data as fallback
    dataStatus.source = "mock";
    return generateMockEventsForLeague(league);
  }
};

// Get the correct scoreboard endpoint for a league
const getScoreboardEndpoint = (league: League): string | null => {
  const endpoints: Record<League, string> = {
    NBA: `${ESPN_API_BASE}/basketball/nba/scoreboard`,
    NFL: `${ESPN_API_BASE}/football/nfl/scoreboard`,
    MLB: `${ESPN_API_BASE}/baseball/mlb/scoreboard`,
    NHL: `${ESPN_API_BASE}/hockey/nhl/scoreboard`,
    SOCCER: `${ESPN_API_BASE}/soccer/eng.1/scoreboard`,
    NCAAF: `${ESPN_API_BASE}/football/college-football/scoreboard`,
    NCAAB: `${ESPN_API_BASE}/basketball/mens-college-basketball/scoreboard`,
  };
  return endpoints[league] || null;
};

// Generate mock events for testing when API fails or no games
const generateMockEventsForLeague = (league: League): Match[] => {
  const now = new Date();
  const today = new Date(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const mockTeams: Record<League, { id: string; name: string; shortName: string; logo: string }[]> = {
    NBA: [
      { id: "1", name: "Los Angeles Lakers", shortName: "LAL", logo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png" },
      { id: "2", name: "Boston Celtics", shortName: "BOS", logo: "https://a.espncdn.com/i/teamlogos/nba/500/bos.png" },
      { id: "3", name: "Golden State Warriors", shortName: "GSW", logo: "https://a.espncdn.com/i/teamlogos/nba/500/gsw.png" },
      { id: "4", name: "Brooklyn Nets", shortName: "BKN", logo: "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png" }
    ],
    NFL: [
      { id: "1", name: "Kansas City Chiefs", shortName: "KC", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png" },
      { id: "2", name: "San Francisco 49ers", shortName: "SF", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png" },
      { id: "3", name: "Buffalo Bills", shortName: "BUF", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png" },
      { id: "4", name: "Dallas Cowboys", shortName: "DAL", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png" }
    ],
    MLB: [
      { id: "1", name: "New York Yankees", shortName: "NYY", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png" },
      { id: "2", name: "Los Angeles Dodgers", shortName: "LAD", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png" },
      { id: "3", name: "Boston Red Sox", shortName: "BOS", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/bos.png" },
      { id: "4", name: "Chicago Cubs", shortName: "CHC", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/chc.png" }
    ],
    NHL: [
      { id: "1", name: "Toronto Maple Leafs", shortName: "TOR", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/tor.png" },
      { id: "2", name: "Boston Bruins", shortName: "BOS", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/bos.png" },
      { id: "3", name: "Colorado Avalanche", shortName: "COL", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/col.png" },
      { id: "4", name: "Tampa Bay Lightning", shortName: "TB", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/tb.png" }
    ],
    SOCCER: [
      { id: "1", name: "Manchester United", shortName: "MUN", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/360.png" },
      { id: "2", name: "Liverpool", shortName: "LIV", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/364.png" },
      { id: "3", name: "Arsenal", shortName: "ARS", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/359.png" },
      { id: "4", name: "Manchester City", shortName: "MCI", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/382.png" }
    ],
    NCAAF: [
      { id: "1", name: "Alabama Crimson Tide", shortName: "ALA", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png" },
      { id: "2", name: "Ohio State Buckeyes", shortName: "OSU", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/194.png" },
      { id: "3", name: "Georgia Bulldogs", shortName: "UGA", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/61.png" },
      { id: "4", name: "Michigan Wolverines", shortName: "MICH", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/130.png" }
    ],
    NCAAB: [
      { id: "1", name: "Duke Blue Devils", shortName: "DUKE", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png" },
      { id: "2", name: "Kentucky Wildcats", shortName: "UK", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/96.png" },
      { id: "3", name: "Kansas Jayhawks", shortName: "KU", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png" },
      { id: "4", name: "North Carolina Tar Heels", shortName: "UNC", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/153.png" }
    ],
  };
  
  const teams = mockTeams[league];
  if (!teams) return [];
  
  return [
    createMockMatch(`mock-${league}-1`, league, teams[0], teams[1], today, "scheduled"),
    createMockMatch(`mock-${league}-2`, league, teams[2], teams[3], tomorrow, "scheduled"),
  ];
};

const createMockMatch = (
  id: string,
  league: League,
  homeTeam: { id: string; name: string; shortName: string; logo: string },
  awayTeam: { id: string; name: string; shortName: string; logo: string },
  date: Date,
  status: "scheduled" | "live" | "finished"
): Match => {
  const matchDate = new Date(date);
  matchDate.setHours(19, 30, 0, 0);
  
  return {
    id,
    league,
    homeTeam: {
      id: homeTeam.id,
      name: homeTeam.name,
      shortName: homeTeam.shortName,
      logo: homeTeam.logo,
      record: "0-0"
    },
    awayTeam: {
      id: awayTeam.id,
      name: awayTeam.name,
      shortName: awayTeam.shortName,
      logo: awayTeam.logo,
      record: "0-0"
    },
    startTime: matchDate.toISOString(),
    status,
    odds: {
      homeWin: 1.8 + Math.random() * 0.4,
      awayWin: 1.9 + Math.random() * 0.4,
      ...(league === "SOCCER" && { draw: 3.0 + Math.random() * 0.5 })
    },
    prediction: {
      recommended: Math.random() > 0.5 ? "home" : "away",
      confidence: Math.floor(Math.random() * 25) + 55,
      projectedScore: {
        home: Math.floor(Math.random() * 4) + 1,
        away: Math.floor(Math.random() * 4)
      }
    },
    liveOdds: [],
    isMockData: true // Flag to indicate this is mock data
  };
};

// Fetch events for all supported leagues
export const fetchAllESPNEvents = async (): Promise<Match[]> => {
  // Reset status for new fetch
  dataStatus = {
    source: "mock",
    lastUpdated: new Date(),
    gamesLoaded: 0,
    errors: []
  };

  const leagues: League[] = ["NBA", "NFL", "MLB", "NHL", "SOCCER", "NCAAF", "NCAAB"];
  
  try {
    const results = await Promise.all(leagues.map(fetchESPNEvents));
    const allMatches = results.flat();
    
    // Check if we got any real data
    const hasRealData = allMatches.some(m => !m.isMockData);
    dataStatus.source = hasRealData ? "live" : "mock";
    dataStatus.gamesLoaded = allMatches.length;
    
    return allMatches;
  } catch (error) {
    console.error("Error fetching all ESPN data:", error);
    return [];
  }
};

// Simplified schedule fetching - just use scoreboard
export const fetchLeagueSchedule = async (league: League): Promise<Match[]> => {
  return fetchESPNEvents(league);
};

// Fetch all schedules
export const fetchAllSchedules = async (): Promise<Match[]> => {
  return fetchAllESPNEvents();
};
