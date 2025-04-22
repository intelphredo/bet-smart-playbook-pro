
import { playerProps } from "@/data/playerPropData";
import { PlayerTrendAnalysis } from "@/types";
import { getMostConfidentPicks } from "@/utils/playerAnalysisAlgorithm";
import { algorithmPerformanceData } from "@/data/algorithmPerformanceData";

/**
 * For each league in the Algorithm Performance chart,
 * select the single most confident available pick
 * in that league (using the existing algorithm).
 */
export function getTopLeaguePicks(): PlayerTrendAnalysis[] {
  const leagueShortMap: Record<string, string> = {
    NBA: "NBA",
    NFL: "NFL",
    MLB: "MLB",
    NHL: "NHL",
    Soccer: "SOCCER"
  };
  // Find most confident pick per league
  const picks: PlayerTrendAnalysis[] = [];
  for (const leagueObj of algorithmPerformanceData) {
    // Map 'Soccer' from chart to 'SOCCER' used in data
    const leagueKey = leagueShortMap[leagueObj.name] || leagueObj.name;
    // Filter playerProps by this league
    const leaguePicks = getMostConfidentPicks(
      playerProps.filter(prop => {
        // Check if the property exists and matches case-insensitive
        if (prop.league) {
          return prop.league.toUpperCase() === leagueKey;
        }
        // For props without a league property, check if team name contains the league name
        // This is a fallback if league property is missing
        return prop.team && prop.team.toUpperCase().includes(leagueKey);
      }),
      60 // Use a threshold by default, could be adapted
    );
    if (leaguePicks.length > 0) {
      // Push only the top pick for this league
      picks.push(leaguePicks[0]);
    }
  }
  return picks;
}
