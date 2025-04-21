
import { Match, League } from "@/types/sports";
import { getScoreboardEndpoint, getScheduleEndpoint, ESPNResponse, ESPNEvent } from "./espnApiConfig";
import { mapESPNEventToMatch } from "./espnUtils";

// Fetch events for a specific league
export const fetchESPNEvents = async (league: League): Promise<Match[]> => {
  try {
    const endpoint = getScoreboardEndpoint(league);
    console.log(`Fetching data from ESPN API: ${endpoint}`);
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Failed to fetch ESPN data: ${response.status}`);
    }

    const data: ESPNResponse = await response.json();
    console.log("ESPN API Response:", data);

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
    return results.flat();
  } catch (error) {
    console.error("Error fetching all ESPN data:", error);
    return [];
  }
};

// Fetch full season schedules for a league
export const fetchLeagueSchedule = async (league: League): Promise<Match[]> => {
  try {
    const endpoint = getScheduleEndpoint(league);
    console.log(`Fetching schedule data from ESPN API: ${endpoint}`);
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Failed to fetch ESPN schedule: ${response.status}`);
    }

    const data = await response.json();

    if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
      // Fallback: Fetch the scoreboard events instead.
      console.warn(`No valid schedule events for ${league}, falling back to scoreboard API`);
      return fetchESPNEvents(league);
    }

    try {
      // Try mapping normal schedule events to Match list (may need tweak based on format)
      return data.events.map((event: ESPNEvent) => mapESPNEventToMatch(event, league));
    } catch (err) {
      console.error(`Error mapping schedule events for ${league}:`, err);
      return fetchESPNEvents(league);
    }
  } catch (error) {
    console.error(`Error fetching ${league} schedule:`, error);
    return fetchESPNEvents(league); // fallback to scoreboard
  }
};

// Fetch all league schedules
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

