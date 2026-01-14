// src/hooks/useLiveGames.ts

import { useGames } from "./useGames";
import { isMatchLive } from "@/utils/matchStatus";

export const useLiveGames = () => {
  const { games, isLoading, isError, refetch } = useGames();

  const liveGames = games.filter((g) => isMatchLive(g.status));

  return {
    liveGames,
    isLoading,
    isError,
    refetch,
  };
};
