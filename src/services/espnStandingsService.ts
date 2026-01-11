import { SportLeague, SportradarStanding } from '@/types/sportradar';
import { ESPN_STANDINGS_ENDPOINTS } from './espnConstants';
import { mapESPNStandingsToSportradar } from './espnStandingsMappers';

// Cache for standings data
const standingsCache: Map<SportLeague, { data: SportradarStanding[]; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch with timeout
const fetchWithTimeout = async (url: string, timeout = 10000): Promise<Response> => {
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

// Fetch standings for a specific league from ESPN
export const fetchESPNStandings = async (league: SportLeague): Promise<SportradarStanding[]> => {
  // Check cache first
  const cached = standingsCache.get(league);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[ESPN Standings] Using cached data for ${league}`);
    return cached.data;
  }

  const endpoint = ESPN_STANDINGS_ENDPOINTS[league];
  if (!endpoint) {
    console.warn(`[ESPN Standings] No endpoint for ${league}`);
    return [];
  }

  try {
    console.log(`[ESPN Standings] Fetching ${league} standings from ESPN`);
    const response = await fetchWithTimeout(endpoint);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    const standings = mapESPNStandingsToSportradar(data, league);

    // Cache the results
    standingsCache.set(league, { data: standings, timestamp: Date.now() });

    console.log(`[ESPN Standings] Got ${standings.length} teams for ${league}`);
    return standings;
  } catch (error) {
    console.error(`[ESPN Standings] Error fetching ${league}:`, error);
    // Return cached data if available, even if stale
    if (cached) {
      console.log(`[ESPN Standings] Using stale cache for ${league}`);
      return cached.data;
    }
    return [];
  }
};

// Fetch all league standings
export const fetchAllESPNStandings = async (): Promise<Record<SportLeague, SportradarStanding[]>> => {
  const leagues: SportLeague[] = ['NBA', 'NFL', 'MLB', 'NHL', 'SOCCER'];
  
  const results = await Promise.all(
    leagues.map(league => fetchESPNStandings(league))
  );

  return leagues.reduce((acc, league, index) => {
    acc[league] = results[index];
    return acc;
  }, {} as Record<SportLeague, SportradarStanding[]>);
};

// Clear cache (useful for force refresh)
export const clearESPNStandingsCache = () => {
  standingsCache.clear();
};
