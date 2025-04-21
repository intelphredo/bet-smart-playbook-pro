import { Match, Team, League } from "@/types/sports";

// ESPN API endpoints
const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports";

// Define interfaces for the ESPN API response
interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    type: {
      state: string;
      description: string;
    };
    period: number;
    displayClock: string;
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      id: string;
      homeAway: string;
      team: {
        id: string;
        name: string;
        abbreviation: string;
        displayName: string;
        logo: string;
      };
      score: string;
      records?: Array<{
        type: string;
        summary: string;
      }>;
    }>;
    odds?: Array<{
      provider: {
        id: string;
        name: string;
      };
      details: string;
      overUnder: number;
    }>;
  }>;
}

interface ESPNResponse {
  events: ESPNEvent[];
}

const SPORTSBOOK_LOGOS = {
  fanduel: "https://upload.wikimedia.org/wikipedia/en/3/3d/FanDuel_logo.svg",
  draftkings: "https://upload.wikimedia.org/wikipedia/en/f/fd/DraftKings_logo.svg",
  betmgm: "https://upload.wikimedia.org/wikipedia/commons/2/2f/BetMGM_logo.svg",
};

// Map ESPN data to our app's data model
const mapESPNEventToMatch = (event: ESPNEvent, league: League): Match => {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === "home");
  const awayCompetitor = competition.competitors.find(c => c.homeAway === "away");
  
  if (!homeCompetitor || !awayCompetitor) {
    throw new Error("Missing competitor data");
  }
  
  // Get team records
  const homeRecord = homeCompetitor.records?.find(r => r.type === "total")?.summary || "";
  const awayRecord = awayCompetitor.records?.find(r => r.type === "total")?.summary || "";
  
  // Create team objects
  const homeTeam: Team = {
    id: homeCompetitor.team.id,
    name: homeCompetitor.team.name,
    shortName: homeCompetitor.team.abbreviation,
    logo: homeCompetitor.team.logo,
    record: homeRecord,
  };
  
  const awayTeam: Team = {
    id: awayCompetitor.team.id,
    name: awayCompetitor.team.name,
    shortName: awayCompetitor.team.abbreviation,
    logo: awayCompetitor.team.logo,
    record: awayRecord,
  };
  
  // Determine status
  const status = event.status.type.state === "in" ? "live" : 
                 event.status.type.state === "post" ? "finished" : "scheduled";
  
  // Generate realistic looking odds variations for different sportsbooks
  const baseHomeOdds = competition.odds?.[0] ? 1.8 : 1.9;
  const baseAwayOdds = competition.odds?.[0] ? 2.2 : 1.9;
  const baseDrawOdds = league === "SOCCER" ? 3.0 : undefined;

  // Create simulated live odds from different sportsbooks
  const liveOdds = [
    {
      sportsbook: {
        id: "fanduel",
        name: "FanDuel",
        logo: SPORTSBOOK_LOGOS.fanduel,
        isAvailable: true
      },
      homeWin: baseHomeOdds + (Math.random() * 0.2 - 0.1),
      awayWin: baseAwayOdds + (Math.random() * 0.2 - 0.1),
      draw: baseDrawOdds ? baseDrawOdds + (Math.random() * 0.3 - 0.15) : undefined,
      updatedAt: new Date().toISOString()
    },
    {
      sportsbook: {
        id: "draftkings",
        name: "DraftKings",
        logo: SPORTSBOOK_LOGOS.draftkings,
        isAvailable: true
      },
      homeWin: baseHomeOdds + (Math.random() * 0.2 - 0.1),
      awayWin: baseAwayOdds + (Math.random() * 0.2 - 0.1),
      draw: baseDrawOdds ? baseDrawOdds + (Math.random() * 0.3 - 0.15) : undefined,
      updatedAt: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
    },
    {
      sportsbook: {
        id: "betmgm",
        name: "BetMGM",
        logo: SPORTSBOOK_LOGOS.betmgm,
        isAvailable: true
      },
      homeWin: baseHomeOdds + (Math.random() * 0.2 - 0.1),
      awayWin: baseAwayOdds + (Math.random() * 0.2 - 0.1),
      draw: baseDrawOdds ? baseDrawOdds + (Math.random() * 0.3 - 0.15) : undefined,
      updatedAt: new Date(Date.now() - 180000).toISOString() // 3 minutes ago
    }
  ];

  // Create basic odds
  const odds = {
    homeWin: baseHomeOdds,
    awayWin: baseAwayOdds,
    ...(league === "SOCCER" && { draw: baseDrawOdds })
  };
  
  // Create score object if the match is live or finished
  const score = status !== "scheduled" ? {
    home: parseInt(homeCompetitor.score, 10),
    away: parseInt(awayCompetitor.score, 10),
    period: `Period ${event.status.period} - ${event.status.displayClock}`,
  } : undefined;
  
  // Create a basic prediction (since we don't have actual prediction data from ESPN)
  const homeTeamFavored = odds.homeWin <= odds.awayWin;
  const confidence = homeTeamFavored ? 65 : 55;
  
  return {
    id: event.id,
    league,
    homeTeam,
    awayTeam,
    startTime: event.date,
    odds,
    liveOdds,
    prediction: {
      recommended: homeTeamFavored ? "home" : "away",
      confidence,
      projectedScore: {
        home: score ? score.home + (Math.random() > 0.5 ? 1 : 0) : Math.floor(Math.random() * 5) + 1,
        away: score ? score.away + (Math.random() > 0.5 ? 1 : 0) : Math.floor(Math.random() * 5),
      },
    },
    status,
    score,
  };
};

// Fetch events for a specific league
export const fetchESPNEvents = async (league: League): Promise<Match[]> => {
  try {
    let endpoint = "";
    
    // Map our league types to ESPN API endpoints
    switch (league) {
      case "NBA":
        endpoint = `${ESPN_API_BASE}/basketball/nba/scoreboard`;
        break;
      case "NFL":
        endpoint = `${ESPN_API_BASE}/football/nfl/scoreboard`;
        break;
      case "MLB":
        endpoint = `${ESPN_API_BASE}/baseball/mlb/scoreboard`;
        break;
      case "NHL":
        endpoint = `${ESPN_API_BASE}/hockey/nhl/scoreboard`;
        break;
      case "SOCCER":
        endpoint = `${ESPN_API_BASE}/soccer/eng.1/scoreboard`; // Premier League as default
        break;
      default:
        throw new Error(`Unsupported league: ${league}`);
    }
    
    console.log(`Fetching data from ESPN API: ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ESPN data: ${response.status}`);
    }
    
    const data: ESPNResponse = await response.json();
    console.log("ESPN API Response:", data);
    
    // Map ESPN events to our Match type
    return data.events.map(event => mapESPNEventToMatch(event, league));
  } catch (error) {
    console.error("Error fetching ESPN data:", error);
    return [];
  }
};

// Fetch events for all supported leagues
export const fetchAllESPNEvents = async (): Promise<Match[]> => {
  const leagues: League[] = ["NBA", "NFL", "MLB", "NHL", "SOCCER"];
  const promises = leagues.map(fetchESPNEvents);
  
  try {
    const results = await Promise.all(promises);
    // Flatten the array of arrays into a single array
    return results.flat();
  } catch (error) {
    console.error("Error fetching all ESPN data:", error);
    return [];
  }
};

// New function to fetch full season schedules
export const fetchLeagueSchedule = async (league: League): Promise<Match[]> => {
  try {
    let endpoint = "";

    // Map our league types to ESPN schedule endpoints
    switch (league) {
      case "NBA":
        endpoint = `${ESPN_API_BASE}/basketball/nba/schedule`;
        break;
      case "NFL":
        endpoint = `${ESPN_API_BASE}/football/nfl/schedule`;
        break;
      case "MLB":
        endpoint = `${ESPN_API_BASE}/baseball/mlb/schedule`;
        break;
      case "NHL":
        endpoint = `${ESPN_API_BASE}/hockey/nhl/schedule`;
        break;
      case "SOCCER":
        endpoint = `${ESPN_API_BASE}/soccer/eng.1/schedule`;
        break;
      default:
        throw new Error(`Unsupported league: ${league}`);
    }

    console.log(`Fetching schedule data from ESPN API: ${endpoint}`);
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Failed to fetch ESPN schedule: ${response.status}`);
    }

    // ESPN responds with varying schema for /schedule endpoints, and sometimes fails for some sports.
    // Try to parse; if it doesn't have .events, fallback to scoreboard API

    const data = await response.json();

    if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
      // Fallback: Fetch the scoreboard events instead.
      console.warn(`No valid schedule events for ${league}, falling back to scoreboard API`);
      return fetchESPNEvents(league);
    }

    // Defensive: ESPN sometimes gives empty or non-standard responses.
    try {
      // Try mapping normal schedule events to Match list (may need tweak based on format)
      return data.events.map((event: any) => mapESPNEventToMatch(event, league));
    } catch (err) {
      console.error(`Error mapping schedule events for ${league}:`, err);
      return fetchESPNEvents(league);
    }
  } catch (error) {
    console.error(`Error fetching ${league} schedule:`, error);
    return fetchESPNEvents(league); // fallback to scoreboard
  }
};

// Fetch all schedules for all leagues
export const fetchAllSchedules = async (): Promise<Match[]> => {
  const leagues: League[] = ["NBA", "NFL", "MLB", "NHL", "SOCCER"];
  const promises = leagues.map(fetchLeagueSchedule);
  
  try {
    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error("Error fetching all schedules:", error);
    return [];
  }
};
