import { Match, League } from "@/types";
import { ESPN_API_BASE } from "./espnConstants";
import { mapESPNEventToMatch, ESPNResponse } from "./espnMappers";

// Fetch events for a specific league
export const fetchESPNEvents = async (league: League): Promise<Match[]> => {
  try {
    let endpoint = "";
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
