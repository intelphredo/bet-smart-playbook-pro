
import { League } from "@/types/sports";

// ESPN API endpoints
export const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports";

// Define interfaces for the ESPN API response
export interface ESPNEvent {
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

export interface ESPNResponse {
  events: ESPNEvent[];
}

// Map our league types to ESPN API scoreboard endpoints
export function getScoreboardEndpoint(league: League): string {
  switch (league) {
    case "NBA":
      return `${ESPN_API_BASE}/basketball/nba/scoreboard`;
    case "NFL":
      return `${ESPN_API_BASE}/football/nfl/scoreboard`;
    case "MLB":
      return `${ESPN_API_BASE}/baseball/mlb/scoreboard`;
    case "NHL":
      return `${ESPN_API_BASE}/hockey/nhl/scoreboard`;
    case "SOCCER":
      return `${ESPN_API_BASE}/soccer/eng.1/scoreboard`;
    default:
      throw new Error(`Unsupported league: ${league}`);
  }
}

// Map our league types to ESPN API schedule endpoints
export function getScheduleEndpoint(league: League): string {
  switch (league) {
    case "NBA":
      return `${ESPN_API_BASE}/basketball/nba/schedule`;
    case "NFL":
      return `${ESPN_API_BASE}/football/nfl/schedule`;
    case "MLB":
      return `${ESPN_API_BASE}/baseball/mlb/schedule`;
    case "NHL":
      return `${ESPN_API_BASE}/hockey/nhl/schedule`;
    case "SOCCER":
      return `${ESPN_API_BASE}/soccer/eng.1/schedule`;
    default:
      throw new Error(`Unsupported league: ${league}`);
  }
}

