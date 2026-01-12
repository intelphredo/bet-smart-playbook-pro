
import { API_CONFIGS, DEFAULT_HEADERS, LEAGUE_MAPPINGS } from "@/config/apiConfig";
import { League, Match } from "@/types/sports";
import { mapSportRadarToMatch } from "./sportRadarMappers";

// Helper to replace date placeholders in URL
const formatEndpoint = (endpoint: string, date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return endpoint
    .replace('{{year}}', year.toString())
    .replace('{{month}}', month)
    .replace('{{day}}', day);
};

export const fetchSportRadarSchedule = async (league: League, date: Date = new Date()): Promise<Match[]> => {
  try {
    const { BASE_URL, API_KEY, ENDPOINTS } = API_CONFIGS.SPORTRADAR;
    const leagueEndpoints = ENDPOINTS[league as keyof typeof ENDPOINTS];
    
    if (!leagueEndpoints || typeof leagueEndpoints !== 'object') {
      console.warn(`No endpoints defined for league: ${league}`);
      return [];
    }
    
    // Get the SCHEDULE or DAILY_SCHEDULE endpoint
    const endpoint = 'SCHEDULE' in leagueEndpoints ? leagueEndpoints.SCHEDULE : null;
    
    if (!endpoint || typeof endpoint !== 'string') {
      console.warn(`No schedule endpoint defined for league: ${league}`);
      return [];
    }
    
    const formattedEndpoint = formatEndpoint(endpoint, date);
    const url = `${BASE_URL}${formattedEndpoint}?api_key=${API_KEY}`;
    
    console.log(`Fetching SportRadar data for ${league} on ${date.toISOString().split('T')[0]}`);
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS
    });
    
    if (!response.ok) {
      throw new Error(`SportRadar API Error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`SportRadar data received for ${league}:`, data);
    
    // Map the response to our Match type
    return mapSportRadarToMatch(data, league);
  } catch (error) {
    console.error(`Error fetching SportRadar data for ${league}:`, error);
    return [];
  }
};

export const fetchAllSportRadarSchedules = async (date: Date = new Date()): Promise<Match[]> => {
  const leagues: League[] = ["NFL", "NBA", "MLB", "NHL", "SOCCER"];
  const promises = leagues.map(league => fetchSportRadarSchedule(league, date));
  
  try {
    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error("Error fetching all SportRadar schedules:", error);
    return [];
  }
};
