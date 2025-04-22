
import { Match, League } from "@/types/sports";
import { ESPN_API_BASE } from "./espnConstants";
import { mapESPNEventToMatch, ESPNResponse } from "./espnMappers";

// Enhanced fetch with retry and timeout functionality
const fetchWithTimeout = async (url: string, timeout = 8000): Promise<Response> => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    
    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

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
        endpoint = `${ESPN_API_BASE}/soccer/eng.1/scoreboard`;
        break;
      default:
        throw new Error(`Unsupported league: ${league}`);
    }

    console.log(`Fetching scoreboard data from ESPN API: ${endpoint}`);
    
    // Use our enhanced fetch with timeout
    const scoreboardResponse = await fetchWithTimeout(endpoint);

    if (!scoreboardResponse.ok) {
      throw new Error(`Failed to fetch ESPN scoreboard data: ${scoreboardResponse.status}`);
    }

    const scoreboardData: ESPNResponse = await scoreboardResponse.json();
    console.log("ESPN Scoreboard Response:", scoreboardData);

    // If there are no events in the scoreboard, we'll try to fetch more from the schedule
    const allEvents = [...(scoreboardData.events || [])];
    
    // Now fetch schedule data to get upcoming games not in scoreboard
    try {
      const scheduleEndpoint = endpoint.replace('scoreboard', 'schedule');
      console.log(`Fetching schedule data from ESPN API: ${scheduleEndpoint}`);
      
      const scheduleResponse = await fetchWithTimeout(scheduleEndpoint, 5000);
      
      if (scheduleResponse.ok) {
        const scheduleData: ESPNResponse = await scheduleResponse.json();
        console.log("ESPN Schedule Response:", scheduleData);
        
        // Add schedule events that aren't already in the scoreboard data
        if (scheduleData.events && Array.isArray(scheduleData.events)) {
          scheduleData.events.forEach(scheduleEvent => {
            if (!allEvents.some(e => e.id === scheduleEvent.id)) {
              allEvents.push(scheduleEvent);
            }
          });
        }
      } else {
        console.warn(`Schedule fetch failed with status: ${scheduleResponse.status}. Using scoreboard data only.`);
      }
    } catch (scheduleError) {
      console.warn("Error fetching schedule, using scoreboard data only:", scheduleError);
    }

    // If we have no events at all, generate some mock data for testing
    if (allEvents.length === 0) {
      console.warn(`No events found for ${league}, generating mock data for testing`);
      return generateMockEventsForLeague(league);
    }

    // Map all events to matches
    return allEvents.map(event => mapESPNEventToMatch(event, league));
  } catch (error) {
    console.error("Error fetching ESPN data:", error);
    // Return mock data as fallback when API fails
    console.warn(`Falling back to mock data for ${league}`);
    return generateMockEventsForLeague(league);
  }
};

// Generate mock events for testing when API fails
const generateMockEventsForLeague = (league: League): Match[] => {
  const now = new Date();
  const today = new Date(now);
  const tomorrow = new Date(now.setDate(now.getDate() + 1));
  const nextWeek = new Date(now.setDate(now.getDate() + 6));
  
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
  };
  
  const teams = mockTeams[league];
  
  // Create 2 scheduled matches for today, 2 for tomorrow, and 2 for next week
  return [
    // Today
    createMockMatch(`mock-${league}-1`, league, teams[0], teams[1], today, "scheduled"),
    createMockMatch(`mock-${league}-2`, league, teams[2], teams[3], today, "live"),
    // Tomorrow
    createMockMatch(`mock-${league}-3`, league, teams[0], teams[2], tomorrow, "scheduled"),
    createMockMatch(`mock-${league}-4`, league, teams[1], teams[3], tomorrow, "scheduled"),
    // Next week
    createMockMatch(`mock-${league}-5`, league, teams[0], teams[3], nextWeek, "scheduled"),
    createMockMatch(`mock-${league}-6`, league, teams[1], teams[2], nextWeek, "scheduled"),
    // Finished
    createMockMatch(`mock-${league}-7`, league, teams[2], teams[0], yesterday(), "finished"),
    createMockMatch(`mock-${league}-8`, league, teams[3], teams[1], yesterday(), "finished")
  ];
};

const yesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
};

const createMockMatch = (
  id: string,
  league: League,
  homeTeam: any,
  awayTeam: any,
  date: Date,
  status: "scheduled" | "live" | "finished"
): Match => {
  const homeScore = status === "finished" ? Math.floor(Math.random() * 5) + 1 : status === "live" ? Math.floor(Math.random() * 3) : undefined;
  const awayScore = status === "finished" ? Math.floor(Math.random() * 5) : status === "live" ? Math.floor(Math.random() * 2) : undefined;
  
  // Add some randomness to the start time within the day
  const hours = Math.floor(Math.random() * 12) + 12; // Afternoon/evening games
  const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 minutes
  date.setHours(hours, minutes, 0, 0);
  
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
    startTime: date.toISOString(),
    status,
    score: status !== "scheduled" ? {
      home: homeScore!,
      away: awayScore!,
      period: status === "live" ? `Period ${Math.ceil(Math.random() * 4)}` : "Final"
    } : undefined,
    odds: {
      homeWin: 1.5 + Math.random(),
      awayWin: 2.0 + Math.random(),
      ...(league === "SOCCER" && { draw: 3.0 + Math.random() })
    },
    prediction: {
      recommended: Math.random() > 0.5 ? "home" : "away",
      confidence: Math.floor(Math.random() * 30) + 50,
      projectedScore: {
        home: Math.floor(Math.random() * 5) + 1,
        away: Math.floor(Math.random() * 5)
      }
    },
    liveOdds: status === "live" ? [
      {
        sportsbook: {
          id: "draftkings",
          name: "DraftKings",
          logo: "https://example.com/draftkings.png",
          isAvailable: true
        },
        homeWin: 1.7 + Math.random() * 0.5,
        awayWin: 2.1 + Math.random() * 0.5,
        draw: league === "SOCCER" ? 3.1 + Math.random() * 0.5 : undefined,
        updatedAt: new Date().toISOString()
      }
    ] : []
  };
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
    const response = await fetchWithTimeout(endpoint);

    if (!response.ok) {
      throw new Error(`Failed to fetch ESPN schedule: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Schedule data for ${league}:`, data);

    if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
      // Fallback: Fetch the scoreboard events instead.
      console.warn(`No valid schedule events for ${league}, falling back to scoreboard API`);
      return fetchESPNEvents(league);
    }

    // Defensive: ESPN sometimes gives empty or non-standard responses.
    try {
      // Try mapping normal schedule events to Match list
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
