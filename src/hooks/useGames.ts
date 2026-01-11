// src/hooks/useGames.ts

import { useQuery } from "@tanstack/react-query";
import { mergeGames } from "@/services/data-providers/merge";
import { getESPNGames } from "@/services/data-providers/espn";
import { getSportradarGames } from "@/services/data-providers/sportradar";
import { getOddsApiGames } from "@/services/data-providers/odds-api";
import { getMockGames } from "@/services/data-providers/mock";
import { toast } from "@/components/ui/use-toast";

export interface UnifiedGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  odds?: any;
  injuries?: any;
  league?: string;
  source: string;
  lastUpdated: string;
}

export const useGames = () => {
  const query = useQuery<UnifiedGame[]>({
    queryKey: ["games"],
    queryFn: async () => {
      // Fetch all providers in parallel
      const [espnGames, sportradarGames, oddsApiGames, mockGames] =
        await Promise.all([
          getESPNGames().catch(() => []),
          getSportradarGames().catch(() => []),
          getOddsApiGames().catch(() => []),
          getMockGames().catch(() => []),
        ]);

      // Merge into unified objects
      const merged = mergeGames({
        espnGames,
        sportradarGames,
        oddsApiGames,
        mockGames,
      });

      return merged;
    },

    // Refresh frequently for live data
    staleTime: 5000, // 5 seconds
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Warn if mock data is being used
  if (query.data?.some((g) => g.source === "Mock")) {
    toast({
      title: "Mock Data Active",
      description: "Live data unavailable — showing mock results.",
      variant: "destructive",
    });
  }

  return {
    games: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
