
import { Match } from "@/types/sports";
import { calculateMomentumFactors } from "../momentumFactors";
import { calculateOddsMovementImpact } from "../oddsMovementFactors";
import { calculateValueFactor } from "../valueFactors";
import { calculateWeatherImpact } from "../weatherFactors";
import { calculateInjuryImpact } from "../injuryFactors";
import { calculateArbitrageImpact, hasArbitrageOpportunity } from "../arbitrageFactors";
import { generateSmartScoreRecommendation } from "../recommendations/smartScoreRecommendation";
import { applyPredictionValidation } from "../validation/predictionValidator";

const WEIGHT_FACTORS = {
  MOMENTUM: 0.20,
  VALUE: 0.20,
  ODDS_MOVEMENT: 0.20,
  WEATHER: 0.15,
  INJURIES: 0.15,
  ARBITRAGE: 0.10
};

export function calculateSmartScore(match: Match) {
  const { momentumScore, momentumFactors } = calculateMomentumFactors(match);
  const { valueScore, valueFactors } = calculateValueFactor(match);
  
  // Remove the configuration object and rely on the function's internal implementation
  const { adjustedValueScore: oddsMovementScore, oddsFactors: oddsMovementFactors } = calculateOddsMovementImpact(match);
  
  const { weatherImpact, weatherFactors } = calculateWeatherImpact(match);
  const { injuriesScore, injuryFactors } = calculateInjuryImpact(match);
  const { arbitrageScore, arbitrageFactors } = calculateArbitrageImpact(match);
  
  const overallScore = (
    momentumScore * WEIGHT_FACTORS.MOMENTUM +
    valueScore * WEIGHT_FACTORS.VALUE +
    oddsMovementScore * WEIGHT_FACTORS.ODDS_MOVEMENT +
    weatherImpact * WEIGHT_FACTORS.WEATHER +
    injuriesScore * WEIGHT_FACTORS.INJURIES +
    arbitrageScore * WEIGHT_FACTORS.ARBITRAGE
  );
  
  const recommendation = generateSmartScoreRecommendation(
    match, 
    overallScore,
    {
      momentum: momentumScore,
      value: valueScore,
      oddsMovement: oddsMovementScore,
      weather: weatherImpact,
      injuries: injuriesScore,
      arbitrage: arbitrageScore
    }
  );
  
  const hasArbitrage = hasArbitrageOpportunity(match);
  
  return {
    overall: Math.round(overallScore),
    components: {
      momentum: momentumScore,
      value: valueScore,
      oddsMovement: oddsMovementScore,
      weather: weatherImpact,
      injuries: injuriesScore,
      arbitrage: arbitrageScore
    },
    factors: {
      momentum: momentumFactors,
      value: valueFactors,
      oddsMovement: oddsMovementFactors,
      weather: weatherFactors,
      injuries: injuryFactors,
      arbitrage: arbitrageFactors
    },
    recommendation,
    hasArbitrageOpportunity: hasArbitrage
  };
}

export function applySmartScores(matches: Match[]): Match[] {
  const scoredMatches = matches.map(match => ({
    ...match,
    smartScore: calculateSmartScore(match)
  }));
  
  return applyPredictionValidation(scoredMatches);
}
