import { SportLeague, SportradarStanding } from '@/types/sportradar';
import { ESPN_STANDINGS_ENDPOINTS } from './espnConstants';
import { mapESPNStandingsToSportradar } from './espnStandingsMappers';
import { fetchWithTimeout } from '@/utils/network/fetchWithTimeout';

// Cache for standings data
const standingsCache: Map<SportLeague, { data: SportradarStanding[]; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Using shared fetchWithTimeout utility from @/utils/network/fetchWithTimeout

// Fetch standings for a specific league from ESPN
export const fetchESPNStandings = async (league: SportLeague): Promise<SportradarStanding[]> => {
  // Check cache first
  const cached = standingsCache.get(league);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[ESPN Standings] Using cached data for ${league} (${cached.data.length} teams)`);
    return cached.data;
  }

  const endpoint = ESPN_STANDINGS_ENDPOINTS[league];
  if (!endpoint) {
    console.warn(`[ESPN Standings] No endpoint configured for ${league}`);
    return [];
  }

  try {
    console.log(`[ESPN Standings] Fetching ${league} standings from: ${endpoint}`);
    const response = await fetchWithTimeout(endpoint);

    if (!response.ok) {
      console.error(`[ESPN Standings] API error for ${league}: ${response.status} ${response.statusText}`);
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Log response structure for debugging
    console.log(`[ESPN Standings] Response for ${league}:`, {
      hasChildren: !!data.children,
      childrenCount: data.children?.length || 0,
      hasStandings: !!data.standings,
      standingsEntries: data.standings?.entries?.length || 0,
    });

    const standings = mapESPNStandingsToSportradar(data, league);

    if (standings.length === 0) {
      console.warn(`[ESPN Standings] No standings data mapped for ${league}`);
      // Return cached data if available
      if (cached) {
        console.log(`[ESPN Standings] Using stale cache for ${league}`);
        return cached.data;
      }
    } else {
      // Cache the results
      standingsCache.set(league, { data: standings, timestamp: Date.now() });
      console.log(`[ESPN Standings] Cached ${standings.length} teams for ${league}`);
    }

    return standings;
  } catch (error) {
    console.error(`[ESPN Standings] Error fetching ${league}:`, error);
    
    // Return cached data if available, even if stale
    if (cached) {
      console.log(`[ESPN Standings] Using stale cache for ${league} due to error`);
      return cached.data;
    }
    
    return [];
  }
};

// Fetch all league standings
export const fetchAllESPNStandings = async (): Promise<Record<SportLeague, SportradarStanding[]>> => {
  const leagues: SportLeague[] = ['NBA', 'NFL', 'MLB', 'NHL', 'SOCCER'];
  
  const results = await Promise.allSettled(
    leagues.map(league => fetchESPNStandings(league))
  );

  return leagues.reduce((acc, league, index) => {
    const result = results[index];
    acc[league] = result.status === 'fulfilled' ? result.value : [];
    if (result.status === 'rejected') {
      console.error(`[ESPN Standings] Failed to fetch ${league}:`, result.reason);
    }
    return acc;
  }, {} as Record<SportLeague, SportradarStanding[]>);
};

// Clear cache (useful for force refresh)
export const clearESPNStandingsCache = () => {
  standingsCache.clear();
  console.log('[ESPN Standings] Cache cleared');
};
