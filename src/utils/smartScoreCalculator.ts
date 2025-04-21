
import { Match, SmartScore } from "@/types/sports";
import { 
  calculateValueFactor, 
  calculateMomentumFactors, 
  calculateOddsMovementFactors 
} from "./smartScoreFactors";
import { getRecommendation } from "./smartScoreRecommendation";

/**
 * Calculate SmartScore for a given match
 * 
 * This is a sophisticated algorithm that evaluates betting opportunities.
 * Relies on modular factor calculators.
 */
export function calculateSmartScore(match: Match): SmartScore {
  let injuriesScore = 75; // Default - not accounting for detailed injury data
  let weatherImpact = 80; // Default - not accounting for detailed weather data

  // Value and momentum
  const { valueScore: initialValue, valueFactors } = calculateValueFactor(match);
  let valueScore = initialValue;
  let factors = [...valueFactors];

  const { momentumScore, momentumFactors } = calculateMomentumFactors(match);
  factors = [...factors, ...momentumFactors];

  // Odds movement
  const { adjustedValueScore, oddsFactors } = calculateOddsMovementFactors(match, valueScore);
  valueScore = adjustedValueScore;
  factors = [...factors, ...oddsFactors];

  // Compute overall - weighted average
  const overall = Math.round(
    (valueScore * 0.35) + 
    (momentumScore * 0.35) + 
    (injuriesScore * 0.15) + 
    (weatherImpact * 0.15)
  );

  // Recommendation
  const recommendation = getRecommendation(overall, match);

  return {
    overall: Math.min(100, Math.max(0, overall)),
    value: Math.min(100, Math.max(0, valueScore)),
    momentum: Math.min(100, Math.max(0, momentumScore)),
    injuries: Math.min(100, Math.max(0, injuriesScore)),
    weatherImpact: Math.min(100, Math.max(0, weatherImpact)),
    factors,
    recommendation
  };
}

/**
 * Apply smart scores to a list of matches
 */
export function applySmartScores(matches: Match[]): Match[] {
  return matches.map(match => ({
    ...match,
    smartScore: calculateSmartScore(match)
  }));
}
