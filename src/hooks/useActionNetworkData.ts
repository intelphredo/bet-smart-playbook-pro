import { useEffect, useState } from "react";
import { Match, League } from "@/types";
import { mapActionNetworkGameToMatch, ActionNetworkResponse } from "@/services/actionNetworkMappers";

interface UseActionNetworkDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
}

export function useActionNetworkData({
  league = "ALL",
  refreshInterval = 60000,
  includeSchedule = true,
}: UseActionNetworkDataOptions = {}) {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function fetchActionNetworkSchedule(): Promise<ActionNetworkResponse> {
    // In real deployment, replace with their API endpoint & API keys (if required)
    // For demo, we mock results or fetch a test endpoint
    const resp = await fetch("/api/actionnetwork/schedule.json"); // <-- Substitute with real endpoint
    if (!resp.ok) throw new Error("Action Network API error");
    return await resp.json();
  }

  const refetch = async () => {
    if (!includeSchedule) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchActionNetworkSchedule();
      let matches = data.games.map(mapActionNetworkGameToMatch);
      // Filter by league if needed
      if (league !== "ALL") {
        matches = matches.filter(m => m.league === league);
      }
      setAllMatches(matches);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    if (refreshInterval) {
      const id = setInterval(refetch, refreshInterval);
      return () => clearInterval(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league, includeSchedule, refreshInterval]);

  // Action Network doesn't provide standings etc in this demo
  return {
    allMatches,
    upcomingMatches: allMatches.filter(m => m.status === "scheduled"),
    liveMatches: allMatches.filter(m => m.status === "live"),
    finishedMatches: allMatches.filter(m => m.status === "finished"),
    isLoading,
    error,
    refetch,
    divisionsStandings: [],
    isLoadingStandings: false,
    standingsError: null,
    fetchLiveGameData: undefined,
  };
}
