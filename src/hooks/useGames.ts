// src/hooks/useGames.ts

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
  const hasShownMockToast = useRef(false);

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
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Show mock data warning in useEffect to prevent infinite loops
  useEffect(() => {
    if (query.data?.some((g) => g.source === "Mock") && !hasShownMockToast.current) {
      hasShownMockToast.current = true;
      toast({
        title: "Mock Data Active",
        description: "Live data unavailable — showing mock results.",
        variant: "destructive",
      });
    }
  }, [query.data]);

  return {
    games: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
