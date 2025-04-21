
import { algorithmPerformanceData } from "@/data/algorithmPerformanceData";
import { Match } from "@/types/sports";

// Helper: for a list of matches, get the one with the highest confidence for the selected league
export const getTopTeamPicks = (matches: Match[]): Match[] => {
  // We'll return top confident (highest `prediction.confidence`) match for each league in algorithmPerformanceData
  const picks: Match[] = [];
  for (const leagueObj of algorithmPerformanceData) {
    const league = leagueObj.name.toUpperCase();
    // filter matches where league matches
    const leagueMatches = matches.filter(m => m.league.toUpperCase() === league && m.prediction && typeof m.prediction.confidence === "number");
    if (leagueMatches.length > 0) {
      // sort by confidence, descending
      leagueMatches.sort((a, b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0));
      picks.push(leagueMatches[0]);
    }
  }
  return picks;
};
