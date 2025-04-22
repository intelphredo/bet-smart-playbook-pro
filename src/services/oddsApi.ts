
import { API_CONFIGS, DEFAULT_HEADERS, LEAGUE_MAPPINGS } from "@/config/apiConfig";
import { League, Match } from "@/types/sports";
import { mapOddsApiToMatch } from "./oddsApiMappers";

export const fetchOddsApiData = async (league: League): Promise<Match[]> => {
  try {
    const { BASE_URL, API_KEY, ENDPOINTS } = API_CONFIGS.ODDS_API;
    const sportKey = LEAGUE_MAPPINGS[league].ODDS_API;
    
    if (!sportKey) {
      throw new Error(`No sport key defined for league: ${league}`);
    }
    
    const oddsUrl = `${BASE_URL}${ENDPOINTS.ODDS.replace('{{sport}}', sportKey)}?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals`;
    const scoresUrl = `${BASE_URL}${ENDPOINTS.SCORES.replace('{{sport}}', sportKey)}?apiKey=${API_KEY}&daysFrom=1`;
    
    console.log(`Fetching OddsAPI data for ${league}`);
    
    // Fetch both odds and scores in parallel
    const [oddsResponse, scoresResponse] = await Promise.all([
      fetch(oddsUrl, { headers: DEFAULT_HEADERS }),
      fetch(scoresUrl, { headers: DEFAULT_HEADERS })
    ]);
    
    if (!oddsResponse.ok) {
      throw new Error(`OddsAPI Error (odds): ${oddsResponse.status} - ${oddsResponse.statusText}`);
    }
    
    if (!scoresResponse.ok) {
      throw new Error(`OddsAPI Error (scores): ${scoresResponse.status} - ${scoresResponse.statusText}`);
    }
    
    const oddsData = await oddsResponse.json();
    const scoresData = await scoresResponse.json();
    
    console.log(`OddsAPI data received for ${league} - odds events: ${oddsData.length}, scores events: ${scoresData.length}`);
    
    // Map to our Match type and merge odds with scores
    return mapOddsApiToMatch(oddsData, scoresData, league);
  } catch (error) {
    console.error(`Error fetching OddsAPI data for ${league}:`, error);
    return [];
  }
};

export const fetchAllOddsApiData = async (): Promise<Match[]> => {
  const leagues: League[] = ["NFL", "NBA", "MLB", "NHL", "SOCCER"];
  const promises = leagues.map(fetchOddsApiData);
  
  try {
    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error("Error fetching all OddsAPI data:", error);
    return [];
  }
};
