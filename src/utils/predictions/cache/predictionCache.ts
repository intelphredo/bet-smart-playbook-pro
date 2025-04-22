
import { Match } from "@/types/sports";

/**
 * In-memory prediction cache (does NOT persist between reloads)
 * Used to lock predictions and prevent fluctuations on re-calculation
 */
const predictionCache: Map<string, Match> = new Map();

/**
 * Get a cached prediction for a match ID
 */
export function getCachedPrediction(matchId: string): Match | undefined {
  return predictionCache.get(matchId);
}

/**
 * Cache a prediction for a match ID
 */
export function cachePrediction(match: Match): Match {
  predictionCache.set(match.id, match);
  return match;
}

/**
 * Check if a prediction exists in the cache
 */
export function hasCachedPrediction(matchId: string): boolean {
  return predictionCache.has(matchId);
}

/**
 * Clear the entire prediction cache
 */
export function clearPredictionCache(): void {
  predictionCache.clear();
}
