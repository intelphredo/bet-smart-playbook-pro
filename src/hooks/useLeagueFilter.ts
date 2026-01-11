// src/hooks/useLeagueFilter.ts

import { useState, useMemo } from "react";
import { UnifiedGame } from "./useGames";

export const useLeagueFilter = (games: UnifiedGame[]) => {
  const [league, setLeague] = useState<string>("all");

  const filteredGames = useMemo(() => {
    if (league === "all") return games;
    return games.filter((g) => g.league?.toLowerCase() === league.toLowerCase());
  }, [games, league]);

  return {
    league,
    setLeague,
    filteredGames,
  };
};
