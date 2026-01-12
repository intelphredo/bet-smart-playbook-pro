
import { PlayerTrendAnalysis } from "@/types/playerAnalytics";

/**
 * Get top league picks
 * 
 * Note: This function previously used mock player prop data to generate picks.
 * Without a real player props API integration, this returns an empty array.
 * 
 * To enable real picks, integrate with a player props data provider.
 */
export function getTopLeaguePicks(): PlayerTrendAnalysis[] {
  // Return empty array - no mock data should be used for real predictions
  // This prevents incorrect/fake player prop picks from appearing in the UI
  return [];
}
