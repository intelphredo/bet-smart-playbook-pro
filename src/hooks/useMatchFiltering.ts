
import { useMemo } from "react";
import { Match } from "@/types/sports";

export function useMatchFiltering(allMatches: Match[]) {
  return useMemo(() => {
    const upcomingMatches = allMatches.filter(m => m.status === "scheduled" || m.status === "pre");
    const liveMatches = allMatches.filter(m => m.status === "live");
    const finishedMatches = allMatches.filter(m => m.status === "finished");

    return {
      upcomingMatches,
      liveMatches,
      finishedMatches,
      allMatches
    };
  }, [allMatches]);
}
