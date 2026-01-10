import { supabase } from "@/integrations/supabase/client";
import { League, Match } from "@/types/sports";
import { mapOddsApiToMatch } from "./oddsApiMappers";

/**
 * Fetches odds data for a specific league via the secure edge function.
 * All API calls go through the backend to protect the API key.
 */
export const fetchOddsApiData = async (league: League): Promise<Match[]> => {
  try {
    console.log(`Fetching OddsAPI data for ${league} via edge function`);
    
    const { data, error } = await supabase.functions.invoke('fetch-odds', {
      body: null,
      headers: {},
    });

    // Add league as query param by invoking with custom URL
    const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-odds`);
    url.searchParams.set("league", league);
    
    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch odds data");
    }

    console.log(`OddsAPI data received for ${league} - ${result.events?.length || 0} events`);
    
    // Filter events to the requested league and map to Match type
    const leagueEvents = result.events?.filter((e: any) => e.league === league) || [];
    
    // Map raw events to our Match type using existing mapper
    return mapOddsApiToMatch(leagueEvents, [], league);
  } catch (error) {
    console.error(`Error fetching OddsAPI data for ${league}:`, error);
    return [];
  }
};

/**
 * Fetches odds data for all leagues via the secure edge function.
 */
export const fetchAllOddsApiData = async (): Promise<Match[]> => {
  try {
    console.log("Fetching all OddsAPI data via edge function");
    
    const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-odds`);
    url.searchParams.set("league", "ALL");
    
    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch odds data");
    }

    console.log(`OddsAPI data received - ${result.totalEvents} total events`);
    
    // Map raw events to our Match type
    return mapOddsApiToMatch(result.events || [], [], "NFL");
  } catch (error) {
    console.error("Error fetching all OddsAPI data:", error);
    return [];
  }
};
