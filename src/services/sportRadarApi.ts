
import { API_CONFIGS, DEFAULT_HEADERS, LEAGUE_MAPPINGS, getCurrentSeasonType } from "@/config/apiConfig";
import { League, Match } from "@/types/sports";
import { mapSportRadarToMatch } from "./sportRadarMappers";

// Helper to replace date and season placeholders in URL
const formatEndpoint = (endpoint: string, date: Date, league: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Get current season type for NFL/NBA/NHL
  const seasonType = getCurrentSeasonType(league);
  
  // Calculate NFL week (approximate)
  const getNFLWeek = (): number => {
    const seasonStart = new Date(year, 8, 5); // First Thursday of September (approx)
    const diffTime = date.getTime() - seasonStart.getTime();
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(18, diffWeeks + 1));
  };
  
  return endpoint
    .replace('{{year}}', year.toString())
    .replace('{{month}}', month)
    .replace('{{day}}', day)
    .replace('{{season_type}}', seasonType)
    .replace('{{week}}', getNFLWeek().toString());
};

export const fetchSportRadarSchedule = async (league: League, date: Date = new Date()): Promise<Match[]> => {
  try {
    const { BASE_URL, API_KEY, ENDPOINTS } = API_CONFIGS.SPORTRADAR;
    
    // Skip if no API key configured
    if (!API_KEY) {
      console.debug(`SportRadar API key not configured, skipping ${league}`);
      return [];
    }
    
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
    
    const formattedEndpoint = formatEndpoint(endpoint, date, league);
    
    // Check for unresolved placeholders
    if (formattedEndpoint.includes('{{')) {
      console.warn(`Unresolved placeholders in endpoint for ${league}: ${formattedEndpoint}`);
      return [];
    }
    
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
  const { API_KEY } = API_CONFIGS.SPORTRADAR;
  
  // Skip entirely if no API key
  if (!API_KEY) {
    console.debug('SportRadar API key not configured, skipping all leagues');
    return [];
  }
  
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
