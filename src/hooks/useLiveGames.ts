// src/hooks/useLiveGames.ts

import { useGames } from "./useGames";

export const useLiveGames = () => {
  const { games, isLoading, isError, refetch } = useGames();

  const liveGames = games.filter((g) =>
    ["in_progress", "live", "1st", "2nd", "3rd", "4th"].includes(
      g.status.toLowerCase()
    )
  );

  return {
    liveGames,
    isLoading,
    isError,
    refetch,
  };
};
