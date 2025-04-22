import { groupBy } from "lodash";
import { analyzeResults } from "./advancedPredictionAlgorithm";
import { Match } from "@/types";

/**
 * Get top team pick per league
 */
export function getTopTeamPicks(matches: Match[]) {
  const byLeague = groupBy(matches, m => m.league);
  const topPicks: Match[] = [];
  for (const league in byLeague) {
    const matchesInLeague = byLeague[league];
    if (!matchesInLeague || matchesInLeague.length === 0) {
      continue;
    }
    // Sort by confidence, then smart score
    const sorted = matchesInLeague.sort((a, b) => {
      const confidenceA = a.prediction?.confidence || 0;
      const confidenceB = b.prediction?.confidence || 0;
      const smartScoreA = a.smartScore?.overall || 0;
      const smartScoreB = b.smartScore?.overall || 0;
      if (confidenceA !== confidenceB) {
        return confidenceB - confidenceA; // Higher confidence first
      } else {
        return smartScoreB - smartScoreA; // Higher smartScore first
      }
    });
    topPicks.push(sorted[0]);
  }
  return topPicks;
}
