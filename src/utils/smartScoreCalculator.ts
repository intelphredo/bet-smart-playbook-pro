
import { Match, SmartScore } from "@/types/sports";
import { 
  calculateValueFactor, 
  calculateMomentumFactors, 
  calculateOddsMovementFactors,
  calculateInjuryImpact,
  calculateWeatherImpact
} from "./smartScoreFactors";
import { getRecommendation } from "./smartScoreRecommendation";

/**
 * Calculate SmartScore for a given match
 * 
 * This is a sophisticated algorithm that evaluates betting opportunities.
 * Relies on modular factor calculators.
 */
export function calculateSmartScore(match: Match): SmartScore {
  // Value and momentum calculations
  const { valueScore: initialValue, valueFactors } = calculateValueFactor(match);
  let valueScore = initialValue;
  let factors = [...valueFactors];

  const { momentumScore, momentumFactors } = calculateMomentumFactors(match);
  factors = [...factors, ...momentumFactors];

  // Odds movement
  const { adjustedValueScore, oddsFactors } = calculateOddsMovementFactors(match, valueScore);
  valueScore = adjustedValueScore;
  factors = [...factors, ...oddsFactors];

  // Injury and weather impacts
  const { injuriesScore, injuryFactors } = calculateInjuryImpact(match);
  const { weatherImpact, weatherFactors } = calculateWeatherImpact(match);
  
  factors = [...factors, ...injuryFactors, ...weatherFactors];

  // Calculate weights based on league
  let valueWeight = 0.35;
  let momentumWeight = 0.35;
  let injuriesWeight = 0.15;
  let weatherWeight = 0.15;
  
  // MLB-specific weight adjustments
  if (match.league === 'MLB') {
    // For baseball, value (odds analysis) is more important, momentum less so
    valueWeight = 0.45;
    momentumWeight = 0.25;
    injuriesWeight = 0.15; // injuries to starting pitchers are important
    weatherWeight = 0.15;  // weather can impact baseball significantly
  }

  // Compute overall - weighted average with league-specific adjustments
  const overall = Math.round(
    (valueScore * valueWeight) + 
    (momentumScore * momentumWeight) + 
    (injuriesScore * injuriesWeight) + 
    (weatherImpact * weatherWeight)
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
