/**
 * Sportradar API Service
 * Securely fetches data via edge function to protect API key
 */

import { SportLeague } from "@/types/sportradar";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type SportradarDataType = 
  | "INJURIES" 
  | "STANDINGS" 
  | "LEADERS" 
  | "TEAM_PROFILE" 
  | "PLAYER_PROFILE";

interface SportradarResponse<T> {
  success: boolean;
  league: string;
  dataType: string;
  data: T;
  fetchedAt: string;
  error?: string;
}

/**
 * Fetch data from Sportradar via secure edge function
 */
export async function fetchSportradarData<T>(
  league: SportLeague,
  dataType: SportradarDataType,
  options?: {
    teamId?: string;
    playerId?: string;
  }
): Promise<SportradarResponse<T>> {
  try {
    const url = new URL(`${SUPABASE_URL}/functions/v1/fetch-sportradar`);
    url.searchParams.set("league", league);
    url.searchParams.set("type", dataType);
    
    if (options?.teamId) {
      url.searchParams.set("team_id", options.teamId);
    }
    if (options?.playerId) {
      url.searchParams.set("player_id", options.playerId);
    }

    console.log(`[Sportradar] Fetching ${league} ${dataType}`);

    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch data");
    }

    console.log(`[Sportradar] ${league} ${dataType} fetched successfully`);
    return result;

  } catch (error) {
    console.error(`[Sportradar] Error fetching ${league} ${dataType}:`, error);
    throw error;
  }
}

/**
 * Fetch injuries for a league
 */
export async function fetchInjuries(league: SportLeague) {
  return fetchSportradarData(league, "INJURIES");
}

/**
 * Fetch standings for a league
 */
export async function fetchStandings(league: SportLeague) {
  return fetchSportradarData(league, "STANDINGS");
}

/**
 * Fetch league leaders
 */
export async function fetchLeaders(league: SportLeague) {
  return fetchSportradarData(league, "LEADERS");
}

/**
 * Fetch team profile
 */
export async function fetchTeamProfile(league: SportLeague, teamId: string) {
  return fetchSportradarData(league, "TEAM_PROFILE", { teamId });
}

/**
 * Fetch player profile
 */
export async function fetchPlayerProfile(league: SportLeague, playerId: string) {
  return fetchSportradarData(league, "PLAYER_PROFILE", { playerId });
}

/**
 * Fetch injuries for all leagues
 */
export async function fetchAllInjuries(): Promise<Record<SportLeague, any>> {
  const leagues: SportLeague[] = ["NBA", "NFL", "MLB", "NHL", "SOCCER"];
  
  const results = await Promise.allSettled(
    leagues.map(league => fetchInjuries(league))
  );

  const injuries: Record<string, any> = {};
  
  results.forEach((result, index) => {
    const league = leagues[index];
    if (result.status === "fulfilled") {
      injuries[league] = result.value.data;
    } else {
      console.warn(`Failed to fetch ${league} injuries:`, result.reason);
      injuries[league] = [];
    }
  });

  return injuries as Record<SportLeague, any>;
}

/**
 * Check if Sportradar API is configured
 */
export async function checkSportradarStatus(): Promise<{
  configured: boolean;
  message: string;
}> {
  try {
    // Try a lightweight request
    await fetchSportradarData("NBA", "INJURIES");
    return { configured: true, message: "Sportradar API is configured and working" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("not configured")) {
      return { configured: false, message: "Sportradar API key not configured" };
    }
    return { configured: false, message };
  }
}
