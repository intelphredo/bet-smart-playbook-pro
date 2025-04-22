
import { useMemo } from "react";
import { Match, League } from "@/types";

export function useLeagueData(
  matches: Match[],
  league: League | "ALL"
) {
  return useMemo(() => {
    if (league === "ALL") {
      return matches;
    }
    return matches.filter(match => match.league === league);
  }, [matches, league]);
}
