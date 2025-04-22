
import { Match, SmartScore } from "@/types/sports";

export function getRecommendation(overall: number, match: Match): SmartScore['recommendation'] {
  // Initialize with default values that match the expected types
  let recommendation: SmartScore['recommendation'] = {
    betOn: 'none',
    confidence: 'low',
    reasoning: 'There is no clear edge in this matchup.'
  };

  if (overall >= 70 && match.prediction) {
    if (match.prediction.recommended === 'home') {
      recommendation = {
        betOn: 'home',
        confidence: overall >= 80 ? 'high' : 'medium',
        reasoning: `Strong statistical edge for ${match.homeTeam.name} with a SmartScore of ${overall}.`
      };
    } else if (match.prediction.recommended === 'away') {
      recommendation = {
        betOn: 'away',
        confidence: overall >= 80 ? 'high' : 'medium',
        reasoning: `Strong statistical edge for ${match.awayTeam.name} with a SmartScore of ${overall}.`
      };
    } else if (match.prediction.recommended === 'draw') {
      recommendation = {
        betOn: 'draw',
        confidence: overall >= 80 ? 'high' : 'medium',
        reasoning: `Statistical indicators suggest a draw is likely with a SmartScore of ${overall}.`
      };
    }
  }
  return recommendation;
}

// Add the missing function that smartScoreCalculator.ts expects
export function generateSmartScoreRecommendation(
  match: Match, 
  overall: number, 
  components: Record<string, number>
): SmartScore['recommendation'] {
  return getRecommendation(overall, match);
}
