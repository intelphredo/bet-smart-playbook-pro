// src/hooks/useOddsApi.ts

import { useQuery } from "@tanstack/react-query";
import { getOddsApiGames } from "@/services/data-providers/odds-api";
import { League, Match } from "@/types/sports";

export const useOdds = () => {
  const query = useQuery({
    queryKey: ["odds"],
    queryFn: async () => {
      const odds = await getOddsApiGames().catch(() => []);
      return odds;
    },
    staleTime: 5000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  return {
    odds: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

// Alias for backwards compatibility
export const useOddsApi = (league: League | "ALL" = "ALL") => {
  const query = useQuery<Match[]>({
    queryKey: ["oddsApi", league],
    queryFn: async () => {
      // Mock implementation - return empty array for now
      return [];
    },
    staleTime: 5000,
    refetchInterval: 5000,
  });

  return {
    matches: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
