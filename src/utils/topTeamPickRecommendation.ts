
import { Match, League } from "@/types/sports";

// Define the leagues we support for team picks
const SUPPORTED_LEAGUES: League[] = ["NBA", "NFL", "MLB", "NHL", "SOCCER"];

/**
 * Get top team picks by finding the highest confidence match for each league
 * 
 * Note: This function now uses real match data passed in instead of mock data.
 */
export const getTopTeamPicks = (matches: Match[]): Match[] => {
  const picks: Match[] = [];
  
  for (const league of SUPPORTED_LEAGUES) {
    // Filter matches for this league that have a prediction with confidence
    const leagueMatches = matches.filter(
      m => m.league.toUpperCase() === league.toUpperCase() && 
           m.prediction && 
           typeof m.prediction.confidence === "number"
    );
    
    if (leagueMatches.length > 0) {
      // Sort by confidence, descending
      leagueMatches.sort((a, b) => 
        (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0)
      );
      picks.push(leagueMatches[0]);
    }
  }
  
  return picks;
};
