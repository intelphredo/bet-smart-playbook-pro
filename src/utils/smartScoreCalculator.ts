
import { Match } from "@/types/sports";
import { calculateMomentumImpact } from "./smartScore/momentumFactors";
import { calculateOddsMovementImpact } from "./smartScore/oddsMovementFactors";
import { calculateValueImpact } from "./smartScore/valueFactors";
import { calculateWeatherImpact } from "./smartScore/weatherFactors";
import { calculateInjuryImpact } from "./smartScore/injuryFactors";
import { calculateArbitrageImpact, hasArbitrageOpportunity } from "./smartScore/arbitrageFactors";
import { generateSmartScoreRecommendation } from "./smartScoreRecommendation";

// Add arbitrage to our weight factors
const WEIGHT_FACTORS = {
  MOMENTUM: 0.20,
  VALUE: 0.20,
  ODDS_MOVEMENT: 0.20,
  WEATHER: 0.15,
  INJURIES: 0.15,
  ARBITRAGE: 0.10
};

export function calculateSmartScore(match: Match) {
  // Calculate component impacts
  const { momentumScore, momentumFactors } = calculateMomentumImpact(match);
  const { valueScore, valueFactors } = calculateValueImpact(match);
  const { adjustedValueScore: oddsMovementScore, oddsFactors: oddsMovementFactors } = calculateOddsMovementImpact(match);
  const { weatherImpact, weatherFactors } = calculateWeatherImpact(match);
  const { injuriesScore, injuryFactors } = calculateInjuryImpact(match);
  const { arbitrageScore, arbitrageFactors } = calculateArbitrageImpact(match);
  
  // Calculate weighted score
  const overallScore = (
    momentumScore * WEIGHT_FACTORS.MOMENTUM +
    valueScore * WEIGHT_FACTORS.VALUE +
    oddsMovementScore * WEIGHT_FACTORS.ODDS_MOVEMENT +
    weatherImpact * WEIGHT_FACTORS.WEATHER +
    injuriesScore * WEIGHT_FACTORS.INJURIES +
    arbitrageScore * WEIGHT_FACTORS.ARBITRAGE
  );
  
  // Generate recommendation
  const recommendation = generateSmartScoreRecommendation(match, overallScore, {
    momentumScore,
    valueScore,
    oddsMovementScore,
    weatherImpact,
    injuriesScore,
    arbitrageScore
  });
  
  // Highlight arbitrage opportunity if available
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

// Update the applySmartScores function to enhance matches with smart scores
export function applySmartScores(matches: Match[]): Match[] {
  return matches.map(match => ({
    ...match,
    smartScore: calculateSmartScore(match),
  }));
}
