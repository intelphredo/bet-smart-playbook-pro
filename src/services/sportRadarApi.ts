import { supabase } from "@/integrations/supabase/client";
import { League, Match } from "@/types/sports";
import { mapSportRadarToMatch } from "./sportRadarMappers";

type SportradarDataType = 
  | "SCHEDULE" 
  | "INJURIES" 
  | "STANDINGS" 
  | "LEADERS" 
  | "TEAM_PROFILE" 
  | "PLAYER_PROFILE";

interface SportradarResponse {
  success: boolean;
  league: string;
  dataType: string;
  data: any;
  fetchedAt: string;
  error?: string;
}

/**
 * Fetch data from SportRadar via the secure edge function
 * All API key handling happens server-side
 */
async function fetchFromEdgeFunction(
  league: League,
  dataType: SportradarDataType,
  options?: { teamId?: string; playerId?: string }
): Promise<SportradarResponse | null> {
  try {
    const params = new URLSearchParams({
      league,
      type: dataType,
    });

    if (options?.teamId) params.set("team_id", options.teamId);
    if (options?.playerId) params.set("player_id", options.playerId);

    const { data, error } = await supabase.functions.invoke<SportradarResponse>(
      "fetch-sportradar",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: null,
      }
    );

    // Since supabase.functions.invoke doesn't support query params directly,
    // we need to use fetch directly
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-sportradar?${params}`;
    
    const response = await fetch(functionUrl, {
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`SportRadar edge function error for ${league}/${dataType}:`, errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling SportRadar edge function for ${league}/${dataType}:`, error);
    return null;
  }
}

/**
 * Fetch schedule for a specific league
 * Note: The edge function currently supports INJURIES, STANDINGS, LEADERS, TEAM_PROFILE, PLAYER_PROFILE
 * SCHEDULE endpoint support can be added to the edge function if needed
 */
export const fetchSportRadarSchedule = async (
  league: League,
  date: Date = new Date()
): Promise<Match[]> => {
  try {
    // For now, return empty as edge function doesn't have SCHEDULE endpoint
    // The schedule data comes from ESPN which is more reliable for live scores
    console.debug(`SportRadar schedule for ${league}: Using ESPN instead for live data`);
    return [];
  } catch (error) {
    console.error(`Error fetching SportRadar schedule for ${league}:`, error);
    return [];
  }
};

/**
 * Fetch all schedules - defers to ESPN for live game data
 */
export const fetchAllSportRadarSchedules = async (
  date: Date = new Date()
): Promise<Match[]> => {
  console.debug("SportRadar schedules: Deferring to ESPN for live game data");
  return [];
};

/**
 * Fetch injuries for a league via edge function
 */
export const fetchSportRadarInjuries = async (league: League): Promise<any> => {
  const response = await fetchFromEdgeFunction(league, "INJURIES");
  return response?.data || null;
};

/**
 * Fetch standings for a league via edge function
 */
export const fetchSportRadarStandings = async (league: League): Promise<any> => {
  const response = await fetchFromEdgeFunction(league, "STANDINGS");
  return response?.data || null;
};

/**
 * Fetch league leaders via edge function
 */
export const fetchSportRadarLeaders = async (league: League): Promise<any> => {
  const response = await fetchFromEdgeFunction(league, "LEADERS");
  return response?.data || null;
};

/**
 * Fetch team profile via edge function
 */
export const fetchSportRadarTeamProfile = async (
  league: League,
  teamId: string
): Promise<any> => {
  const response = await fetchFromEdgeFunction(league, "TEAM_PROFILE", { teamId });
  return response?.data || null;
};

/**
 * Fetch player profile via edge function
 */
export const fetchSportRadarPlayerProfile = async (
  league: League,
  playerId: string
): Promise<any> => {
  const response = await fetchFromEdgeFunction(league, "PLAYER_PROFILE", { playerId });
  return response?.data || null;
};

/**
 * Fetch injuries for all leagues
 */
export const fetchAllSportRadarInjuries = async (): Promise<Record<League, any>> => {
  const leagues: League[] = ["NFL", "NBA", "MLB", "NHL", "SOCCER"];
  const results = await Promise.allSettled(
    leagues.map(async (league) => ({
      league,
      data: await fetchSportRadarInjuries(league),
    }))
  );

  const injuries: Record<string, any> = {};
  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.data) {
      injuries[result.value.league] = result.value.data;
    }
  });

  return injuries as Record<League, any>;
};
