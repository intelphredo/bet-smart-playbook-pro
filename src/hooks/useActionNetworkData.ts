
import { useEffect, useState } from "react";
import { Match, League } from "@/types/sports";

interface UseActionNetworkDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
}

/**
 * Action Network integration hook
 * 
 * NOTE: Action Network requires a paid API subscription.
 * This hook is disabled by default and returns empty data.
 * Enable it by setting VITE_ACTION_NETWORK_API_KEY in your environment.
 */
export function useActionNetworkData({
  league = "ALL",
  refreshInterval = 60000,
  includeSchedule = true,
}: UseActionNetworkDataOptions = {}) {
  // Action Network integration is disabled - requires paid API access
  // The app uses ESPN and Odds API as primary data sources instead
  
  return {
    allMatches: [] as Match[],
    upcomingMatches: [] as Match[],
    liveMatches: [] as Match[],
    finishedMatches: [] as Match[],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
    divisionsStandings: [],
    isLoadingStandings: false,
    standingsError: null,
    fetchLiveGameData: undefined,
    isEnabled: false,
  };
}
