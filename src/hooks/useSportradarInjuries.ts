// src/hooks/useInjuries.ts

import { useQuery } from "@tanstack/react-query";
import { getSportradarGames } from "@/services/data-providers/sportradar";

export const useInjuries = () => {
  const query = useQuery({
    queryKey: ["injuries"],
    queryFn: async () => {
      const games = await getSportradarGames().catch(() => []);
      return games.map((g) => ({
        id: g.id,
        injuries: g.injuries ?? [],
      }));
    },
    staleTime: 15000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  return {
    injuries: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
