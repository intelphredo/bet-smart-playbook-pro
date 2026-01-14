// src/hooks/useLiveGames.ts

import { useGames } from "./useGames";

// Live status indicators - matches ESPN API states and internal status
const LIVE_STATUSES = [
  "live", 
  "in_progress", 
  "in", 
  "1st", "2nd", "3rd", "4th", 
  "1st half", "2nd half",
  "halftime",
  "ot", "ot1", "ot2", "ot3",
  "overtime"
];

export const useLiveGames = () => {
  const { games, isLoading, isError, refetch } = useGames();

  const liveGames = games.filter((g) => {
    const status = g.status?.toLowerCase() || "";
    return LIVE_STATUSES.some(liveStatus => 
      status === liveStatus || status.includes(liveStatus)
    );
  });

  return {
    liveGames,
    isLoading,
    isError,
    refetch,
  };
};
