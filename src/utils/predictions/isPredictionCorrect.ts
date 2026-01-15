/**
 * Utility function to determine prediction correctness
 * Extracted from FinishedMatchInfo for reusability
 */

interface MatchWithPrediction {
  prediction?: {
    recommended?: 'home' | 'away' | 'draw';
  };
  score?: {
    home: number;
    away: number;
  };
}

export function isPredictionCorrect(match: MatchWithPrediction): boolean | null {
  if (!match.prediction || !match.score) return null;
  const { recommended } = match.prediction;
  if (recommended === "home" && match.score.home > match.score.away) return true;
  if (recommended === "away" && match.score.away > match.score.home) return true;
  if (recommended === "draw" && match.score.home === match.score.away) return true;
  return false;
}

export default isPredictionCorrect;
