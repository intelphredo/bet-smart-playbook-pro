
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
  
  // Create basic odds (mock data as ESPN doesn't provide full odds)
  const odds = competition.odds?.[0] ? {
    homeWin: 1.8,  // Default odds since ESPN API doesn't provide full odds
    awayWin: 2.2,
    ...(league === "SOCCER" && { draw: 3.0 })
  } : {
    homeWin: 1.9,
    awayWin: 1.9,
    ...(league === "SOCCER" && { draw: 3.2 })
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
