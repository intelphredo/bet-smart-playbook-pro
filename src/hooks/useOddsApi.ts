// src/hooks/useOdds.ts

import { useQuery } from "@tanstack/react-query";
import { getOddsApiGames } from "@/services/data-providers/odds-api";

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
