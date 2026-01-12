// src/hooks/useSportradarInjuries.ts

import { useQuery } from "@tanstack/react-query";
import { getSportradarGames } from "@/services/data-providers/sportradar";
import { SportLeague, SportradarInjury } from "@/types/sportradar";

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

// Calculate injury impact score (0-100)
export function calculateInjuryImpact(injuries: SportradarInjury[]): number {
  if (!injuries || injuries.length === 0) return 0;

  let score = 0;
  for (const injury of injuries) {
    switch (injury.status) {
      case "out":
      case "out-for-season":
      case "injured-reserve":
        score += 20;
        break;
      case "doubtful":
        score += 15;
        break;
      case "questionable":
        score += 10;
        break;
      case "day-to-day":
        score += 5;
        break;
      case "probable":
        score += 2;
        break;
    }
  }

  return Math.min(score, 100);
}

// Hook to fetch injuries for a specific league
export const useSportradarInjuries = (league: SportLeague) => {
  return useQuery<SportradarInjury[]>({
    queryKey: ["sportradar-injuries", league],
    queryFn: async () => {
      // Mock implementation - return empty array for now
      // In production, this would call the actual Sportradar API
      return [];
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
};
